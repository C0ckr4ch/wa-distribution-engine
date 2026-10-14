# 🚚 WhatsApp Distribution Engine

Sistem otomasi distribusi barang, pemesanan multi-cabang, layanan komplain, verifikasi struk transfer anti-fraud berbasis **Computer Vision OCR offline**, dan integrasi siaga ke **Accurate Online ERP**.

---

## 🌟 Fitur Utama

- **Otomasi Pemesanan WhatsApp:** Alur pemesanan interaktif (pilihan kuantiti, alamat pengiriman, dan kalkulasi total otomatis).
- **Computer Vision OCR Bukti Transfer (Anti-Fraud):**
  - Menggunakan engine **Tesseract OCR lokal (100% offline di server/PC)**.
  - Membaca Bank tujuan, Nama Penerima, Nominal Pembayaran, dan Nomor Referensi secara otomatis.
  - Validasi nominal transfer terhadap total tagihan order.
  - Mencegah penipuan struk palsu dan struk duplikat/bekas pakai.
- **Layanan Pengaduan & Komplain Pelanggan:** Pencatatan tiket komplain otomatis beserta bukti foto barang rusak/bocor.
- **Accurate Online Open API (Siaga/Standby):** Pembuatan otomatis Sales Order (SO) dan Sales Receipt (Penerimaan Penjualan) saat bukti transfer terverifikasi.
- **Self-Hosted & Beli Lepas:** Berjalan di WSL / Docker lokal dengan zero recurring SaaS subscription cost.

---

## 🛠️ Arsitektur Teknologi

- **Backend:** Node.js, Express.js
- **WhatsApp Gateway:** [WAHA (WhatsApp HTTP API)](https://waha.devlikeapro.com/) engine Baileys (NOWEB WebSocket)
- **Computer Vision:** Tesseract OCR (Ubuntu Linux)
- **Database:** SQLite3
- **Containerization:** Docker & WSL2 (Ubuntu 26.04 LTS)

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Prasyarat
- Windows 10/11 dengan **WSL2 (Ubuntu)**
- **Docker** terinstal di Ubuntu WSL
- **Node.js** v20+ & **Tesseract OCR** (`sudo apt install tesseract-ocr`)

### 2. Konfigurasi Lingkungan
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan rekening bank, nama perusahaan, dan harga produk di file `.env`.

### 3. Menjalankan Server
Jalankan file batch:
```cmd
start.bat
```
Atau secara manual di terminal Ubuntu WSL:
```bash
# Nyalakan container WAHA
docker run -d --name waha --net=host -e PORT=3000 -e WAHA_API_KEY=waha_secret_key_123 -e WHATSAPP_DEFAULT_ENGINE=NOWEB devlikeapro/waha

# Install dependensi & jalankan server
npm install
node src/index.js
```

### 4. Dashboard Pemantauan
Buka browser pada alamat:
`http://localhost:5000`

---

## 📄 Lisensi
MIT License - Dibuat untuk solusi otomasi distribusi UMKM Indonesia.
