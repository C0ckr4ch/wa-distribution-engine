require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { dbHelper } = require('./database/db');
const waha = require('./channels/waha');
const orderHandler = require('./modules/order/orderHandler');
const complaintHandler = require('./modules/complaint/complaintHandler');
const accurateClient = require('./modules/erp/accurateClient');
const receiptOcr = require('./modules/vision/receiptOcr');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

/**
 * WEBHOOK UTAMA: Menerima Chat Masuk dari WhatsApp via WAHA
 */
app.post('/webhook/whatsapp', async (req, res) => {
  res.status(200).json({ status: 'ACK' });

  const event = req.body;
  if (!event || event.event !== 'message') return;

  const payload = event.payload;
  if (!payload) return;

  // Abaikan jika pesan ini berasal dari pengiriman bot sendiri (mencegah loop)
  const msgId = payload.id || payload.key?.id;
  if (msgId && waha.sentMessageIds.has(msgId)) {
    waha.sentMessageIds.delete(msgId);
    return;
  }

  const fromClean = (payload.from || '').replace(/@.*$/, '');
  const toClean = (payload.to || '').replace(/@.*$/, '');
  const isSelfChat = payload.fromMe && fromClean && toClean && fromClean === toClean;

  // Jika pesan dikirim oleh user ke orang lain, abaikan
  if (payload.fromMe && !isSelfChat) {
    return;
  }

  const customerPhone = fromClean;
  const bodyText = (payload.body || '').trim();
  const chatId = payload.from;
  const hasMedia = payload.hasMedia || false;
  let imageBase64 = null;

  // Jika pesan berupa media/gambar
  if (hasMedia && payload.media) {
    if (payload.media.data) {
      imageBase64 = payload.media.data;
    } else if (payload.media.url) {
      try {
        const axios = require('axios');
        const imgRes = await axios.get(payload.media.url, {
          headers: { 'x-api-key': process.env.WAHA_API_KEY || 'waha_secret_key_123' },
          responseType: 'arraybuffer',
          timeout: 10000
        });
        imageBase64 = Buffer.from(imgRes.data).toString('base64');
      } catch (err) {
        console.error('Failed to download media from WAHA:', err.message);
      }
    }
  }

  console.log(`[DISTRIBUSI INCOMING] Dari: ${customerPhone} (${chatId}) | Pesan: "${bodyText || (hasMedia ? '[Gambar]' : '')}"`);

  try {
    // 1. Ambil session aktif
    const session = await dbHelper.get('SELECT * FROM sessions WHERE customer_phone = ?', [customerPhone]);
    const currentStep = session?.step || 'IDLE';

    // 2. Jika user kirim gambar (bukti transfer atau foto barang)
    if (hasMedia || imageBase64) {
      if (currentStep.startsWith('COMPLAINT')) {
        await complaintHandler.handleIncoming({ customerPhone, chatId, messageText: bodyText, hasImage: true, imageBase64, session });
      } else {
        // Verifikasi struk bukti transfer dengan OCR
        await orderHandler.handleIncoming({ customerPhone, chatId, messageText: bodyText, hasImage: true, imageBase64, session });
      }
      return;
    }

    // 3. Reset command
    if (bodyText.toLowerCase() === '#reset') {
      await dbHelper.run('DELETE FROM sessions WHERE customer_phone = ?', [customerPhone]);
      await waha.sendText(chatId, '🔄 Sesi berhasil di-reset.');
      return;
    }

    // 4. Jika user sedang dalam proses aktif
    if (currentStep.startsWith('ORDER')) {
      await orderHandler.handleIncoming({ customerPhone, chatId, messageText: bodyText, hasImage: false, session });
      return;
    }

    if (currentStep.startsWith('COMPLAINT')) {
      await complaintHandler.handleIncoming({ customerPhone, chatId, messageText: bodyText, hasImage: false, session });
      return;
    }

    // 5. Menu triggers
    const lower = bodyText.toLowerCase();
    if (lower === '1' || lower === 'order' || lower === 'pesan' || lower === 'beli') {
      await orderHandler.handleIncoming({ customerPhone, chatId, messageText: bodyText, hasImage: false, session });
      return;
    }

    if (lower === '2' || lower === 'komplain' || lower === 'keluhan' || lower === '#komplain') {
      await complaintHandler.handleIncoming({ customerPhone, chatId, messageText: bodyText, hasImage: false, session });
      return;
    }

    // 6. Menu Default Layanan Distribusi
    const company = process.env.COMPANY_NAME || 'PT Sumber Segar Abadi';
    const menuMsg = 
`👋 *Halo! Selamat Datang di Layanan Distribusi ${company}*

Silakan pilih menu layanan yang Anda perlukan:

1️⃣ *Pesan Air Galon* (Ketik: *1*)
2️⃣ *Layanan Pengaduan/Komplain* (Ketik: *2*)
3️⃣ *Verifikasi Pembayaran* (Kirim langsung foto/screenshot bukti transfer)

_Ketik angka pilihan Anda atau kirimkan struk pembayaran._`;

    await waha.sendText(chatId, menuMsg);

  } catch (err) {
    console.error('[DISTRIBUSI ROUTER ERROR]:', err);
  }
});

/**
 * ADMIN & DASHBOARD REST APIs
 */
app.get('/api/status', async (req, res) => {
  const wahaHealth = await waha.checkHealth();
  const wahaSession = await waha.getSessionStatus();
  const accurateStatus = await accurateClient.checkConnection();

  res.json({
    server: 'ONLINE',
    port: PORT,
    waha: { health: wahaHealth, session: wahaSession },
    accurate: accurateStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/qr', async (req, res) => {
  const qrBase64 = await waha.getQrCode();
  res.json({ qr: qrBase64 });
});

app.post('/api/start-waha', async (req, res) => {
  const result = await waha.startSession();
  res.json(result);
});

app.post('/api/logout-waha', async (req, res) => {
  const result = await waha.logout();
  res.json(result);
});

app.get('/api/orders', async (req, res) => {
  const orders = await dbHelper.all('SELECT * FROM orders ORDER BY id DESC LIMIT 50');
  res.json(orders);
});

app.get('/api/complaints', async (req, res) => {
  const complaints = await dbHelper.all('SELECT * FROM complaints ORDER BY id DESC LIMIT 50');
  res.json(complaints);
});

app.get('/api/receipts', async (req, res) => {
  const receipts = await dbHelper.all('SELECT * FROM payment_receipts ORDER BY id DESC LIMIT 50');
  res.json(receipts);
});

// Test Vision OCR via web upload
app.post('/api/test-ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    const result = await receiptOcr.parseReceipt(imageBase64);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 WA DISTRIBUTION ENGINE (KLIEN) BERJALAN DI PORT ${PORT}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`💬 Webhook URL: http://localhost:${PORT}/webhook/whatsapp`);
  console.log(`🏢 Accurate Online Integration: ${process.env.ACCURATE_ENABLED === 'true' ? 'ACTIVE' : 'STANDBY / NONAKTIF'}`);
  console.log(`=======================================================`);
});