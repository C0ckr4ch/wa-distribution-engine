const { dbHelper } = require('../../database/db');
const waha = require('../../channels/waha');
const receiptOcr = require('../vision/receiptOcr');
const accurateClient = require('../erp/accurateClient');

class OrderHandler {
  async handleIncoming({ customerPhone, chatId, messageText, hasImage, imageBase64, session }) {
    const targetChat = chatId || customerPhone;
    const unitPrice = parseInt(process.env.PRODUCT_PRICE || 15000);
    const company = process.env.COMPANY_NAME || 'PT Sumber Segar Abadi';
    const bank = process.env.BANK_NAME || 'BCA';
    const bankNo = process.env.BANK_ACCOUNT_NO || '1234567890';
    const bankHolder = process.env.BANK_ACCOUNT_HOLDER || 'PT SUMBER SEGAR ABADI';

    let currentStep = session?.step || 'IDLE';
    let sessionData = session?.data ? JSON.parse(session.data) : {};

    // Skenario 1: Pelanggan mengirim gambar saat sedang menunggu bukti transfer
    if (hasImage && (currentStep === 'WAITING_PAYMENT' || !currentStep || currentStep === 'IDLE')) {
      return await this._processPaymentReceipt({ customerPhone, targetChat, imageBase64, sessionData });
    }

    // Skenario 2: Alur Pemesanan Teks
    switch (currentStep) {
      case 'ORDER_WAIT_QTY': {
        const qty = parseInt(messageText.replace(/\D/g, ''));
        if (!qty || qty <= 0) {
          await waha.sendText(targetChat, '⚠️ Mohon masukkan jumlah galon berupa angka yang benar.\n\nContoh: *20* atau *50*');
          return;
        }

        const total = qty * unitPrice;
        sessionData.qty = qty;
        sessionData.total = total;

        await this._updateSession(customerPhone, 'ORDER_WAIT_ADDRESS', sessionData);
        await waha.sendText(
          targetChat,
          `📦 *Pesanan:* ${qty} Galon\n💵 *Total:* Rp ${total.toLocaleString('id-ID')}\n\nMohon tuliskan *Nama Toko* dan *Alamat/Patokan Pengiriman*: (Contoh: *Toko Berkah, Jl. MT Haryono No. 15*)`
        );
        return;
      }

      case 'ORDER_WAIT_ADDRESS': {
        const address = messageText.trim();
        const orderNo = `ORD-${Date.now().toString().slice(-6)}`;
        const qty = sessionData.qty;
        const total = sessionData.total;

        // 1. Simpan ke database lokal
        await dbHelper.run(
          `INSERT INTO orders (order_no, customer_phone, customer_name, address, quantity, unit_price, total_amount, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
          [orderNo, customerPhone, address, address, qty, unitPrice, total]
        );

        // 2. Buat Sales Order di Accurate Online (jika aktif)
        const accurateResult = await accurateClient.createSalesOrder({
          customerName: address,
          customerPhone,
          items: [{ itemCode: process.env.ACCURATE_ITEM_CODE || 'GALON-19L', price: unitPrice, qty }],
          totalAmount: total,
          notes: `WhatsApp Order ${orderNo}`
        });

        if (accurateResult.accurateSoNo) {
          await dbHelper.run('UPDATE orders SET accurate_so_no = ? WHERE order_no = ?', [accurateResult.accurateSoNo, orderNo]);
        }

        sessionData.orderNo = orderNo;
        sessionData.expectedAmount = total;
        await this._updateSession(customerPhone, 'WAITING_PAYMENT', sessionData);

        // Kirim instruksi pembayaran
        const responseText = 
`✅ *PESANAN BERHASIL DIBUAT!*
━━━━━━━━━━━━━━━━━━━━
📄 *No. Order:* ${orderNo}
🏢 *Tujuan:* ${address}
📦 *Jumlah:* ${qty} Galon
💰 *Total Tagihan:* *Rp ${total.toLocaleString('id-ID')}*
${accurateResult.accurateSoNo ? `🔗 *Accurate SO No:* ${accurateResult.accurateSoNo}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
Silakan transfer pembayaran ke:
🏦 *Bank:* ${bank}
💳 *No. Rekening:* \`${bankNo}\`
👤 *A/N:* ${bankHolder}

📸 *Langkah Terakhir:*
Kirimkan *foto screenshot bukti transfer* langsung ke chat ini. Sistem AI kami akan memverifikasi pembayaran Anda secara otomatis.`;

        await waha.sendText(targetChat, responseText);
        return;
      }

      default: {
        // Mulai alur order
        await this._updateSession(customerPhone, 'ORDER_WAIT_QTY', {});
        await waha.sendText(
          targetChat,
          `📦 *PEMESANAN AIR GALON*\n\nHarga: *Rp ${unitPrice.toLocaleString('id-ID')} / galon*\n\nBerapa galon yang ingin Anda pesan hari ini?\n(Ketik jumlahnya, contoh: *25*)`
        );
      }
    }
  }

  /**
   * Proses Verifikasi Bukti Pembayaran via Computer Vision OCR
   */
  async _processPaymentReceipt({ customerPhone, targetChat, imageBase64, sessionData }) {
    await waha.sendText(targetChat, '🔍 *Memverifikasi bukti transfer Anda dengan Computer Vision OCR... Mohon tunggu 3 detik...*');

    // 1. Parse dengan Vision OCR
    const parsed = await receiptOcr.parseReceipt(imageBase64);

    // 2. Ambil data order pending
    let order = null;
    if (sessionData?.orderNo) {
      order = await dbHelper.get('SELECT * FROM orders WHERE order_no = ?', [sessionData.orderNo]);
    } else {
      // Ambil order pending terakhir nomor ini
      order = await dbHelper.get('SELECT * FROM orders WHERE customer_phone = ? AND payment_status = "PENDING" ORDER BY id DESC LIMIT 1', [customerPhone]);
    }

    const expectedAmount = order ? order.total_amount : parsed.amount;
    const orderNo = order ? order.order_no : `ORD-DIRECT-${Date.now().toString().slice(-4)}`;

    // 3. Validasi & Anti-Fraud
    const validation = await receiptOcr.validatePayment({
      orderNo,
      expectedAmount,
      parsedReceipt: parsed
    });

    if (!validation.valid) {
      if (validation.isFraud) {
        await waha.sendText(
          targetChat,
          `🚨 *PERINGATAN KEAMANAN (ANTI-FRAUD ALERT)*\n━━━━━━━━━━━━━━━━━━━━\n${validation.reason}\n\nTransaksi ini telah dicatat dan dilaporkan ke tim manajemen.`
        );
      } else {
        await waha.sendText(
          targetChat,
          `❌ *VERIFIKASI GAGAL*\n━━━━━━━━━━━━━━━━━━━━\nAlasan: ${validation.reason}\n\nMohon pastikan Anda mengunggah screenshot bukti transfer asli yang sesuai.`
        );
      }
      return;
    }

    // 4. Update status order menjadi LUNAS
    if (order) {
      await dbHelper.run(
        'UPDATE orders SET payment_status = "LUNAS", payment_ref = ? WHERE id = ?',
        [validation.refId, order.id]
      );
    }

    // 5. Catat Pelunasan di Accurate Online (jika aktif)
    const receiptAccurate = await accurateClient.createSalesReceipt({
      invoiceNo: order?.accurate_so_no || orderNo,
      amount: validation.amount,
      refId: validation.refId,
      memo: `Pelunasan WhatsApp - ${customerPhone}`
    });

    // 6. Reset session
    await this._updateSession(customerPhone, 'IDLE', {});

    // 7. Kirim konfirmasi sukses ke customer
    const successMsg = 
`🎉 *PEMBAYARAN TERVERIFIKASI & LUNAS!*
━━━━━━━━━━━━━━━━━━━━
📄 *No. Order:* ${orderNo}
🏦 *Bank:* ${validation.bankName}
👤 *Pengirim:* ${validation.senderName}
💵 *Nominal:* *Rp ${validation.amount.toLocaleString('id-ID')}*
🔢 *No. Referensi:* \`${validation.refId}\`
${receiptAccurate.accurateReceiptNo ? `🔗 *Accurate Pelunasan:* ${receiptAccurate.accurateReceiptNo}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
✅ Pesanan Anda sudah masuk jadwal pengiriman armada hari ini. Terima kasih telah berbelanja di *${process.env.COMPANY_NAME || 'PT Sumber Segar Abadi'}*!`;

    await waha.sendText(targetChat, successMsg);
  }

  async _updateSession(phone, step, data = {}) {
    await dbHelper.run(
      `INSERT INTO sessions (customer_phone, step, data, updated_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(customer_phone) DO UPDATE SET step = ?, data = ?, updated_at = CURRENT_TIMESTAMP`,
      [phone, step, JSON.stringify(data), step, JSON.stringify(data)]
    );
  }
}

module.exports = new OrderHandler();
