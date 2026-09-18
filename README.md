# 🏫 SCEM - Smart Classroom Environment Monitor

Proyek IoT berbasis **ESP32**, **MQTT Cloud Broker**, dan **Flask Dashboard** untuk memantau suhu serta kelembapan ruang kelas secara *real-time*, lengkap dengan sistem peringatan otomatis via **WhatsApp** dan alarm **Buzzer**.

---

## 📁 Struktur Proyek

```text
SCEM_Project/
│
├── 📁 esp32/
│   └── esp32_dht22_mqtt.ino     # Program C++ ESP32 (Arduino IDE)
│
├── 📁 static/
│   ├── style.css                # Desain visual Dashboard
│   └── script.js                # Logika grafik Chart.js & Fetch API
│
├── 📁 templates/
│   └── index.html               # Halaman Tampilan Web Dashboard
│
├── 📁 data/
│   └── data_suhu_kelas.csv      # File database riwayat data sensor
│
├── app.py                       # Server utama Flask & MQTT Client
├── requirements.txt             # Daftar dependensi library Python
└── README.md                    # Dokumentasi teknis proyek