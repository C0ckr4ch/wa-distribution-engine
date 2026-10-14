const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { dbHelper } = require('../../database/db');

class ReceiptOcrService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.provider = process.env.VISION_PROVIDER || 'tesseract';
  }

  /**
   * Parse gambar bukti transfer m-banking / QRIS
   * Menerima base64 data string atau image buffer/URL
   */
  async parseReceipt(imageBase64OrUrl) {
    if (this.geminiApiKey) {
      return await this._parseWithGemini(imageBase64OrUrl);
    } else {
      return await this._parseWithTesseract(imageBase64OrUrl);
    }
  }

  /**
   * Ekstraksi cerdas menggunakan Google Gemini Multimodal Vision API (jika ada API key)
   */
  async _parseWithGemini(imageBase64) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const prompt = `
Analisa gambar ini. Ini adalah bukti transfer m-banking atau struk pembayaran bank Indonesia (seperti BCA Mobile, Livin Mandiri, BRImo, BNI, QRIS, Dana, dll).
Ekstrak informasi penting dan kembalikan HANYA format JSON valid tanpa format markdown (tanpa backtick):
{
  "isValidReceipt": true/false,
  "bankName": "BCA/MANDIRI/BRI/BNI/QRIS/DANA/SEABANK/OTHER",
  "senderName": "Nama Pengirim",
  "recipientName": "Nama Penerima",
  "amount": 150000,
  "refId": "Nomor Referensi atau ID Transaksi Unik",
  "transDate": "YYYY-MM-DD HH:mm:ss",
  "confidenceScore": 0.95
}
Jika bukan bukti transfer, kembalikan: {"isValidReceipt": false, "reason": "Bukan gambar struk"}
`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: cleanBase64
                  }
                }
              ]
            }
          ]
        },
        { timeout: 10000 }
      );

      const rawText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const jsonClean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonClean);
      return parsed;
    } catch (err) {
      console.error('[VISION ERROR] Gemini Vision failed, falling back to local Tesseract OCR:', err.message);
      return await this._parseWithTesseract(imageBase64);
    }
  }

  /**
   * Ekstraksi Nyata 100% Lokal menggunakan Tesseract OCR Engine di WSL
   */
  async _parseWithTesseract(imageBase64OrUrl) {
    let imgPath = '';
    let isTemp = false;

    try {
      if (typeof imageBase64OrUrl === 'string' && fs.existsSync(imageBase64OrUrl)) {
        imgPath = imageBase64OrUrl;
      } else {
        const cleanBase64 = imageBase64OrUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const tempPath = path.join('/tmp', `receipt_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
        fs.writeFileSync(tempPath, buffer);
        imgPath = tempPath;
        isTemp = true;
      }

      // Jalankan tesseract di WSL
      const text = execSync(`tesseract "${imgPath}" stdout 2>/dev/null`, { timeout: 10000 }).toString();

      if (isTemp && fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (e) {}
      }

      return this._parseReceiptText(text);
    } catch (err) {
      if (isTemp && fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (e) {}
      }
      console.error('[OCR ERROR] Tesseract OCR failed:', err.message);
      return {
        isValidReceipt: false,
        reason: 'Gagal memproses gambar struk dengan OCR: ' + err.message
      };
    }
  }

  /**
   * Parsing teks hasil OCR ke data finansial terstruktur
   */
  _parseReceiptText(text) {
    let bankName = 'OTHER';
    if (/BCA/i.test(text)) bankName = 'BCA';
    else if (/MANDIRI|LIVIN/i.test(text)) bankName = 'MANDIRI';
    else if (/BRI|BRIMO/i.test(text)) bankName = 'BRI';
    else if (/BNI/i.test(text)) bankName = 'BNI';
    else if (/QRIS/i.test(text)) bankName = 'QRIS';
    else if (/DANA/i.test(text)) bankName = 'DANA';
    else if (/SEABANK/i.test(text)) bankName = 'SEABANK';

    let amount = 0;
    // Cari nominal IDR 460,000.00 atau Rp 460.000 atau sejenisnya
    const amtMatch = text.match(/(?:IDR|Rp\.?|Jumlah|Transfer Amount[^\d]*)\s*([0-9]{1,3}(?:[,.][0-9]{3})*(?:\.[0-9]{2})?)/i);
    if (amtMatch) {
      let rawAmt = amtMatch[1];
      rawAmt = rawAmt.replace(/[,.]00$/, '');
      amount = parseInt(rawAmt.replace(/[^0-9]/g, '')) || 0;
    }

    // Nomor Referensi
    let refId = '';
    const refMatch = text.match(/(?:Reference No\.?|No\.?\s*Referensi|ID Transaksi|Ref)\s*[:.]?\s*([A-Za-z0-9\s]+?)(?:\n\s*\n|$)/i);
    if (refMatch) {
      refId = refMatch[1].replace(/\s+/g, '');
    }

    // Penerima
    let recipientName = '';
    const benMatch = text.match(/(?:Beneficiary Name|Nama Penerima|Penerima)\s*([^\n]+)/i);
    if (benMatch) {
      recipientName = benMatch[1].replace(/\n/g, ' ').trim();
    }

    // Pengirim
    let senderName = '';
    const senderMatch = text.match(/(?:Sender Name|Nama Pengirim|Pengirim|Dari)\s*([^\n]+)/i);
    if (senderMatch) {
      senderName = senderMatch[1].replace(/\n/g, ' ').trim();
    }

    return {
      isValidReceipt: amount > 0,
      bankName,
      senderName: senderName || 'Customer',
      recipientName: recipientName || process.env.BANK_ACCOUNT_HOLDER || 'PT SUMBER SEGAR ABADI',
      amount,
      refId: refId || `TRX-${Date.now()}`,
      transDate: new Date().toISOString()
    };
  }

  /**
   * Anti-Fraud Validator:
   * 1. Cek apakah nomor referensi sudah pernah dipakai sebelumnya
   * 2. Cek apakah nominal sesuai dengan total tagihan order
   */
  async validatePayment({ orderNo, expectedAmount, parsedReceipt }) {
    if (!parsedReceipt.isValidReceipt) {
      return {
        valid: false,
        reason: 'Gambar tidak terdeteksi sebagai bukti transfer bank yang valid atau nominal tidak terbaca.'
      };
    }

    const { refId, amount, bankName, senderName } = parsedReceipt;

    // 1. Check duplicate refId (Anti-Fraud / Anti Reuse)
    const existing = await dbHelper.get('SELECT * FROM payment_receipts WHERE ref_id = ?', [refId]);
    if (existing) {
      return {
        valid: false,
        isFraud: true,
        reason: `FRAUD ALERT: Nomor referensi transfer (${refId}) sudah pernah digunakan sebelumnya pada tanggal ${existing.created_at}! Struk tidak boleh dipakai ulang.`
      };
    }

    // 2. Check nominal matching
    if (expectedAmount && amount < expectedAmount) {
      return {
        valid: false,
        isPartial: true,
        reason: `Nominal transfer (Rp ${amount.toLocaleString('id-ID')}) kurang dari total pesanan (Rp ${expectedAmount.toLocaleString('id-ID')}).`
      };
    }

    // 3. Simpan struk valid ke database
    await dbHelper.run(
      `INSERT INTO payment_receipts (ref_id, order_no, bank_name, sender_name, amount, is_verified) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [refId, orderNo, bankName, senderName, amount]
    );

    return {
      valid: true,
      refId,
      amount,
      bankName,
      senderName
    };
  }
}

module.exports = new ReceiptOcrService();
