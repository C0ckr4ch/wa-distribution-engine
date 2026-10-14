# 🎬 MiniMax H3 Prompting Guide: WA Distribution Engine Video Ad
## Framework: First Frame to Last Frame (FFLF / FL2VA) — Realistic Office Setting

Panduan ini disusun mengikuti standar sintaks resmi **MiniMax H3 / Hailuo AI** untuk mode **First Frame & Last Frame (FFLF)**.
Video dibagi menjadi **3 Klip (@ 5.00 detik)** untuk menghasilkan video iklan 15 detik yang mulus tanpa distorsi geometri (*warp glitch*), berlatar **ruangan kantor modern profesional yang nyata (tanpa elemen sci-fi / neon grid)**.

---

## 📌 Aturan Utama MiniMax H3 FFLF
1. **No Cross-Fade:** MiniMax tidak sekadar melakukan dissolve, melainkan menghitung fisika pergerakan objek dan kamera di antara dua gambar referensi.
2. **Sintaks Wajib di Baris Pertama:** Harus menyertakan kalimat alignment:
   `How the reference pictures align with the target video — Picture 1 (from Shot X) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot X) aligns with the S.SS-second mark of the target video.`
3. **Format Durasi:** Harus ditulis dengan 2 desimal (contoh: `5.00`).
4. **Struktur Tiga Bagian:**
   - `integrated_multimodal_description` (Pergerakan kamera & aksi transisi)
   - `overall_soundscape` (Efek suara / SFX bawaan H3)
   - `non_diegetic_music` (Gaya musik latar)

---

## 🎞️ KLIP 1: The Order Intake (0.00s – 5.00s)
* **Start Frame (0.00s):** `marketing/realistic/frame1_start.jpg` (HP di stand meja kayu, WhatsApp masuk: "Pesan 20 Galon ke Toko Berkah")
* **End Frame (5.00s):** `marketing/realistic/frame2_end.jpg` (HP di posisi identik, invoice otomatis terkirim `#ORD-883921`)

### 📋 Prompt MiniMax H3 (Copy & Paste):
```text
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 1) aligns with the 5.00-second mark of the target video.

integrated_multimodal_description: [0.00-5.00] The camera maintains a rock-steady, elegant commercial macro shot focused on the modern smartphone held upright on a minimalist black metal stand on the warm wooden office desk. Soft morning window daylight and an "OFFICE BLEND" coffee cup blur gently in the background. At 0.00s, the customer's incoming message "Pesan 20 Galon ke Toko Berkah" sits in the dark WhatsApp chat. Between 1.00s and 3.20s, a subtle automated typing bubble appears and smoothly transforms into the dark green official invoice card showing "INVOICE #ORD-883921", 20 Galon @ Rp 15.000, Total Rp 300.000, and BCA payment details with blue double checkmarks. The desk, coffee mug, and office background remain completely stationary and jitter-free throughout the shot. By 5.00s, the screen settles perfectly into the state shown in Picture 2.
overall_soundscape: A crisp, authentic WhatsApp message notification tone at 0.40s, followed by gentle haptic vibration hum at 1.80s, and a subtle affirmative send click at 3.20s against a quiet natural office room tone.
non_diegetic_music: Clean, sophisticated modern acoustic-electronic corporate groove with warm rhodes piano chords and a confident, subtle bass pulse.
```

---

## 🎞️ KLIP 2: Computer Vision OCR & Anti-Fraud Scan (0.00s – 5.00s)
* **Start Frame (0.00s):** `marketing/realistic/frame3_start.jpg` (Close-up HP di meja, struk m-BCA dengan laser bar hijau mulai menyapu)
* **End Frame (5.00s):** `marketing/realistic/frame4_end.jpg` (Tangan memegang HP, bounding box hijau verifikasi BCA & Rp 300.000, pesan konfirmasi LUNAS)

### 📋 Prompt MiniMax H3 (Copy & Paste):
```text
How the reference pictures align with the target video — Picture 1 (from Shot 2) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 2) aligns with the 5.00-second mark of the target video.

integrated_multimodal_description: [0.00-5.00] At 0.00s, the camera begins in a tight macro focus on the smartphone resting on the wooden desk, where a photo of an Indonesian BCA m-Banking transfer receipt has just arrived in WhatsApp with a soft green scan bar at the top edge. Between 0.80s and 2.50s, an office professional's hand enters the frame and naturally picks up the phone while the clean green digital scanner sweeps smoothly down the receipt. Between 2.80s and 4.20s, precise green bounding boxes lock onto the extracted data fields (Bank BCA, Rp 300.000, Ref number), immediately followed by an automated WhatsApp confirmation message appearing: "Pembayaran Terverifikasi & Lunas. Pesanan masuk jadwal kirim armada hari ini!". By 5.00s, the shot stabilizes smoothly into the crisp hand-held view shown in Picture 2.
overall_soundscape: Soft desk touch and subtle fabric rustle as the phone is lifted at 0.90s, a gentle optical scan sweep frequency between 1.20s and 2.60s, and a resonant, satisfying verification chime at 3.80s as the lunas message sends.
non_diegetic_music: Modern energetic tech rhythm with brisk percussive clicks and a confident synth progression establishing seamless automation.
```

---

## 🎞️ KLIP 3: Real-Time Dashboard Sync & Delivery Fleet (0.00s – 5.00s)
* **Start Frame (0.00s):** `marketing/realistic/frame5_start.jpg` (Laptop MacBook Pro di meja, baris Toko Berkah menyala hijau "LUNAS")
* **End Frame (5.00s):** `marketing/realistic/frame6_end.jpg` (Wide hero executive workstation dengan Enterprise Dashboard & lower-third branding)

### 📋 Prompt MiniMax H3 (Copy & Paste):
```text
How the reference pictures align with the target video — Picture 1 (from Shot 3) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 3) aligns with the 5.00-second mark of the target video.

integrated_multimodal_description: [0.00-5.00] At 0.00s, the camera frames a medium close-up of the sleek open laptop on the wooden desk, where the web dashboard table highlights the new order row for "Toko Berkah" glowing with a fresh green status pill "LUNAS". Between 1.20s and 4.20s, the camera executes a fluid, cinematic backward dolly slide across the executive wooden desk, revealing the warm contemporary office workspace with potted houseplants, soft daylight, and modern architecture. On the laptop screen, the full Enterprise Dashboard seamlessly comes into view with live delivery route maps and analytics charts. By 5.00s, the camera locks into the wide, prestigious hero workstation shot shown in Picture 2 with clean corporate lower-third typography: "WA Distribution Engine • Otomasi WhatsApp & Verifikasi Struk Anti-Fraud".
overall_soundscape: Subtle trackpad click at 0.50s, a clean database synchronization chime at 1.10s, followed by calm, airy office atmosphere with distant daytime ambient warmth.
non_diegetic_music: Uplifting, prestigious corporate tech soundtrack with acoustic piano and inspiring orchestral-electronic swells culminating in a polished, trustworthy finish.
```

---

## 🛠️ Langkah Menjalankan di MiniMax / Hailuo AI:
1. Buka dashboard **MiniMax / Hailuo AI** (mode Video Generation).
2. Pilih mode **Image-to-Video (First Frame & Last Frame / FFLF)**.
3. Untuk setiap klip:
   - **Klip 1:** Upload `marketing/realistic/frame1_start.jpg` sebagai Picture 1, dan `marketing/realistic/frame2_end.jpg` sebagai Picture 2. Masukkan prompt Klip 1.
   - **Klip 2:** Upload `marketing/realistic/frame3_start.jpg` sebagai Picture 1, dan `marketing/realistic/frame4_end.jpg` sebagai Picture 2. Masukkan prompt Klip 2.
   - **Klip 3:** Upload `marketing/realistic/frame5_start.jpg` sebagai Picture 1, dan `marketing/realistic/frame6_end.jpg` sebagai Picture 2. Masukkan prompt Klip 3.
4. Set durasi video **5.00 seconds** untuk masing-masing klip.
5. Unduh 3 file video hasil render MiniMax, lalu gabungkan secara berurutan di CapCut, Premiere Pro, atau DaVinci Resolve menjadi video iklan 15 detik yang utuh dan profesional!

