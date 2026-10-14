const { execSync } = require('child_process');

function parseReceiptText(text) {
  let bankName = 'OTHER';
  if (/BCA/i.test(text)) bankName = 'BCA';
  else if (/MANDIRI|LIVIN/i.test(text)) bankName = 'MANDIRI';
  else if (/BRI|BRIMO/i.test(text)) bankName = 'BRI';
  else if (/BNI/i.test(text)) bankName = 'BNI';
  else if (/QRIS/i.test(text)) bankName = 'QRIS';

  let amount = 0;
  // Match IDR 460,000.00 or Rp 460.000 or similar
  const amtMatch = text.match(/(?:IDR|Rp\.?|Jumlah|Transfer Amount[^\d]*)\s*([0-9]{1,3}(?:[,.][0-9]{3})*(?:\.[0-9]{2})?)/i);
  if (amtMatch) {
    let rawAmt = amtMatch[1];
    rawAmt = rawAmt.replace(/[,.]00$/, '');
    amount = parseInt(rawAmt.replace(/[^0-9]/g, '')) || 0;
  }

  // Ref ID
  let refId = '';
  const refMatch = text.match(/(?:Reference No\.?|No\.? Referensi|ID Transaksi|Ref)\s*[:.]?\s*([A-Za-z0-9\s]+?)(?:\n\s*\n|$)/i);
  if (refMatch) {
    refId = refMatch[1].replace(/\s+/g, '');
  }

  // Beneficiary / Recipient
  let recipientName = '';
  const benMatch = text.match(/(?:Beneficiary Name|Nama Penerima|Penerima)\s*([^\n]+(?:\n[A-Z\s]+)?)/i);
  if (benMatch) {
    recipientName = benMatch[1].replace(/\n/g, ' ').trim();
  }

  return {
    isValidReceipt: amount > 0,
    bankName,
    senderName: 'Customer',
    recipientName,
    amount,
    refId: refId || `TRX-${Date.now()}`,
    transDate: new Date().toISOString()
  };
}

const imgPath = '/mnt/c/Users/Coro/.gemini/antigravity/brain/2c363eb1-73fb-45be-ad8f-6a9a36ce7ae9/.user_uploaded/media_1791895750328_44d135be.png';
const text = execSync(`tesseract "${imgPath}" stdout 2>/dev/null`).toString();
console.log('Result:', parseReceiptText(text));
