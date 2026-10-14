const { dbHelper } = require('../../database/db');
const waha = require('../../channels/waha');

class ComplaintHandler {
  async handleIncoming({ customerPhone, chatId, messageText, hasImage, imageBase64, session }) {
    const targetChat = chatId || customerPhone;
    let currentStep = session?.step || 'IDLE';
    let sessionData = session?.data ? JSON.parse(session.data) : {};

    switch (currentStep) {
      case 'COMPLAINT_WAIT_TEXT': {
        const complaintText = messageText.trim();
        sessionData.complaintText = complaintText;
        await this._updateSession(customerPhone, 'COMPLAINT_WAIT_PHOTO', sessionData);

        await waha.sendText(
          targetChat,
          `📝 *Keluhan tercatat:* "${complaintText}"\n\n📸 *Apakah ada foto barang/galon yang bermasalah?*\nSilakan kirimkan fotonya sekarang, atau ketik *Lewati* jika tidak ada foto.`
        );
        return;
      }

      case 'COMPLAINT_WAIT_PHOTO': {
        const ticketNo = `TCK-${Date.now().toString().slice(-6)}`;
        const complaintText = sessionData.complaintText || messageText;
        const imageUrl = hasImage ? 'photo_attached' : null;

        // Simpan tiket komplain ke database
        await dbHelper.run(
          `INSERT INTO complaints (ticket_no, customer_phone, complaint_text, image_url, status)
           VALUES (?, ?, ?, ?, 'OPEN')`,
          [ticketNo, customerPhone, complaintText, imageUrl]
        );

        // Reset session
        await this._updateSession(customerPhone, 'IDLE', {});

        // Notifikasi ke Customer
        const customerMsg = 
`✅ *TIKET KOMPLAIN BERHASIL DIBUAT*
━━━━━━━━━━━━━━━━━━━━
🎫 *No. Tiket:* \`${ticketNo}\`
👤 *Pengirim:* ${customerPhone}
📋 *Detail:* ${complaintText}
${hasImage ? '📸 *Lampiran:* Foto barang berhasil disimpan.\n' : ''}
━━━━━━━━━━━━━━━━━━━━
Tim operasional & armada gudang kami akan segera menindaklanjuti penggantian galon/kendala Anda pada rute berikutnya. Mohon simpan nomor tiket ini. Terima kasih!`;

        await waha.sendText(targetChat, customerMsg);

        // Notifikasi ke Admin (jika nomor admin diset)
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
        if (adminPhone) {
          const alertAdmin = `🚨 *PEMBERITAHUAN KOMPLAIN BARU* (${ticketNo})\nDari: ${customerPhone}\nKendala: ${complaintText}`;
          await waha.sendText(adminPhone, alertAdmin);
        }
        return;
      }

      default: {
        await this._updateSession(customerPhone, 'COMPLAINT_WAIT_TEXT', {});
        await waha.sendText(
          targetChat,
          `🛠️ *LAYANAN KOMPLAIN & KENDALA PELANGGAN*\n━━━━━━━━━━━━━━━━━━━━\nMohon ceritakan kendala yang Anda alami:\n(Contoh: *Galon bocor 2 buah pada pesanan kemarin* atau *Air terasa berbau*)`
        );
      }
    }
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

module.exports = new ComplaintHandler();
