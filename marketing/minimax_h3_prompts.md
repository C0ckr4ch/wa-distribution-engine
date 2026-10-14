# 🎬 MiniMax H3 Prompting Guide: WA Distribution Engine Video Ad
## Framework: First Frame to Last Frame (FFLF / FL2VA)

Panduan ini disusun mengikuti standar sintaks resmi **MiniMax H3 / Hailuo AI** untuk mode **First Frame & Last Frame**. 
Video dibagi menjadi **3 Bagian (@ 5.00 detik)** untuk menghasilkan video iklan 15 detik yang mulus tanpa distorsi geometri (*warp glitch*).

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

## 🎞️ CLIP 1: The Order Intake (0.00s – 5.00s)
* **Start Frame (0.00s):** `frame1_start.png` (Pesan order masuk)
* **End Frame (5.00s):** `frame2_end.png` (Invoice otomatis terbuat)

### 📋 Prompt MiniMax H3 (Copy & Paste):
```text
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 1) aligns with the 5.00-second mark of the target video.

integrated_multimodal_description: [0.00-5.00] The camera holds a steady, smooth macro shot floating at an isometric angle facing the smartphone screen. At 0.00s, the customer's incoming order chat bubble pulsates gently. Between 1.00s and 3.50s, an automated system typing indicator appears and seamlessly expands into a crisp dark-mode digital invoice card detailing "ORD-883921", quantity 20 units, and bank BCA transfer instructions. By 5.00s, the screen settles perfectly into the state shown in Picture 2 with soft studio rim reflections gliding over the smartphone glass bezel.
overall_soundscape: A subtle digital message notification pop at 0.50s, followed by rapid soft electronic data processing ticks between 1.50s and 3.00s, concluding with a gentle digital chime as the invoice generates.
non_diegetic_music: Minimalist ambient electronic synth pad with a low rhythmic electronic pulse.
```

---

## 🎞️ CLIP 2: Computer Vision OCR & Anti-Fraud Scan (0.00s – 5.00s)
* **Start Frame (0.00s):** `frame3_start.png` (Struk diunggah, laser mulai menyala di atas)
* **End Frame (5.00s):** `frame4_end.png` (Laser selesai menyapu, data terekstrak, badge LUNAS)

### 📋 Prompt MiniMax H3 (Copy & Paste):
```text
How the reference pictures align with the target video — Picture 1 (from Shot 2) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 2) aligns with the 5.00-second mark of the target video.

integrated_multimodal_description: [0.00-5.00] The camera executes a slow, dramatic micro-push into the bank transfer receipt displayed on the smartphone screen. At 0.00s, the luminous emerald green laser scan line begins at the top edge. Between 1.00s and 3.50s, the green laser line sweeps smoothly downward across the receipt, leaving behind glowing holographic bounding boxes that detect and isolate the Bank name, Amount (Rp 300.000), and Reference ID. Between 4.00s and 5.00s, a radiant green verification badge reading "VERIFIED - LUNAS" bursts forward with subtle floating neon embers, matching the exact state in Picture 2.
overall_soundscape: An initial high-tech laser hum starting at 0.50s, a continuous smooth sweeping whoosh as the scanner traverses the document, and a decisive, resonant confirmation chime at 4.20s as the verification badge locks in.
non_diegetic_music: Deepening futuristic electronic synth bass with escalating tension resolving into a crisp harmonic chord.
```

---

## 🎞️ CLIP 3: Real-Time Dashboard Sync & Hero Lockup (0.00s – 5.00s)
* **Start Frame (0.00s):** `frame5_start.png` (Kamera mulai mundur, dashboard web update LUNAS)
* **End Frame (5.00s):** `frame6_end.png` (Hero master shot dengan kartu fitur floating)

### 📋 Prompt MiniMax H3 (Copy & Paste):
```text
How the reference pictures align with the target video — Picture 1 (from Shot 3) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 3) aligns with the 5.00-second mark of the target video.

integrated_multimodal_description: [0.00-5.00] The camera performs a smooth, elegant jib crane pull-back and slight rotation. At 0.00s, the focus is on the laptop dashboard as the order status row lights up in green "LUNAS". Between 1.50s and 4.00s, the camera pulls wider to reveal the complete workstation, while semi-transparent frosted glassmorphism feature cards ('3-Sec Offline OCR', 'Anti-Fraud Shield', 'Accurate ERP Sync', 'Zero Monthly SaaS Fees') glide gracefully into orbiting positions around the hardware. By 5.00s, the camera locks into the wide, symmetrical commercial hero master shot shown in Picture 2 with volumetric cyan light rays shimmering across the grid floor.
overall_soundscape: Soft mechanical keyboard click and dashboard sync beep at 0.80s, followed by a smooth aerodynamic whoosh as the floating glass cards slide into position, ending in clean studio silence.
non_diegetic_music: Uplifting, sophisticated ambient corporate tech synth that swells into a confident, polished closing crescendo.
```

---

## 🛠️ Langkah Menjalankan di MiniMax / Hailuo:
1. Buka dashboard MiniMax / Hailuo AI.
2. Pilih mode **Image-to-Video (First Frame & Last Frame)**.
3. Untuk setiap Clip (1, 2, 3):
   - Masukkan **Picture 1** (Start Frame).
   - Masukkan **Picture 2** (End Frame).
   - Salin teks prompt di atas persis ke kolom prompt MiniMax.
   - Set durasi **5.00 seconds**.
4. Generate video untuk masing-masing klip, lalu gabungkan ketiga klip video hasil render di CapCut/Premiere/DaVinci.
