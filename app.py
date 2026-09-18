import csv
import datetime
import json
import os
import smtplib
import threading
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Flask, jsonify, render_template, request
import paho.mqtt.client as mqtt
import requests

app = Flask(__name__)

# Config MQTT & WhatsApp
MQTT_BROKER = 'broker.hivemq.com'
MQTT_PORT = 1883
MQTT_TOPIC = 'scem/ruang_kelas/data'

FONNTE_TOKEN = '-'
TARGET_WA = '-'

# Config Gmail untuk FAQ (Ganti dengan Email & App Password Gmail Anda)
ADMIN_GMAIL = '-'
GMAIL_APP_PASSWORD = '-'  # 16 Digit App Password dari Google Account

LAST_ALERT_TIME = 0
COOLDOWN_SECONDS = 1800
CSV_FILE = os.path.join('data', 'data_suhu_kelas.csv')

# Status Log WhatsApp Global
last_wa_status = {
    'status': 'Belum Terkirim',
    'timestamp': '-',
    'detail': 'Suhu masih di batas normal (<= 29.0°C).',
}


def send_whatsapp_alert(suhu, kelembapan):
  global LAST_ALERT_TIME, last_wa_status
  current_time = time.time()
  now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

  if current_time - LAST_ALERT_TIME >= COOLDOWN_SECONDS:
    message = (
        f'⚠️ *PERINGATAN SUHU KELAS (SCEM)* ⚠️\n\n'
        f'Suhu kelas saat ini mencapai *{suhu}°C* dengan kelembapan'
        f' *{kelembapan}%*.\n\n'
        f'💡 *Tindakan:* Mohon nyalakan kipas angin atau buka jendela!'
    )
    try:
      resp = requests.post(
          'https://api.fonnte.com/send',
          headers={'Authorization': FONNTE_TOKEN},
          data={'target': TARGET_WA, 'message': message},
          timeout=5,
      )
      res_json = resp.json()

      if res_json.get('status'):
        last_wa_status = {
            'status': 'Berhasil Terkirim',
            'timestamp': now_str,
            'detail': f'Peringatan terkirim ke {TARGET_WA}',
        }
        LAST_ALERT_TIME = current_time
      else:
        last_wa_status = {
            'status': 'Gagal Terkirim',
            'timestamp': now_str,
            'detail': str(res_json.get('reason', 'Gagal API Fonnte')),
        }
    except Exception as e:
      last_wa_status = {
          'status': 'Error Koneksi',
          'timestamp': now_str,
          'detail': str(e),
      }
      print('[WA Error]', e)


def save_to_csv(timestamp, suhu, kelembapan):
  os.makedirs('data', exist_ok=True)
  try:
    with open(CSV_FILE, mode='a', newline='') as file:
      writer = csv.writer(file)
      if file.tell() == 0:
        writer.writerow(['Timestamp', 'Suhu', 'Kelembapan'])
      writer.writerow([timestamp, suhu, kelembapan])
  except Exception as e:
    print('[CSV Error]', e)


def on_connect(client, userdata, flags, rc, properties=None):
  if rc == 0:
    print(f'[MQTT] Terhubung ke Broker ({MQTT_BROKER})')
    client.subscribe(MQTT_TOPIC)


def on_message(client, userdata, msg):
  try:
    data = json.loads(msg.payload.decode('utf-8'))
    suhu = float(data['suhu'])
    kelembapan = float(data['kelembapan'])
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    save_to_csv(now, suhu, kelembapan)

    if suhu > 29.0:
      send_whatsapp_alert(suhu, kelembapan)
  except Exception as e:
    print('[MQTT Parse Error]', e)


def start_mqtt():
  client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
  client.on_connect = on_connect
  client.on_message = on_message
  client.connect(MQTT_BROKER, MQTT_PORT, 60)
  client.loop_forever()


@app.route('/')
def home():
  return render_template('index.html')


@app.route('/api/data')
def get_data():
  data_list = []
  if os.path.exists(CSV_FILE):
    try:
      with open(CSV_FILE, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
          data_list.append({
              'timestamp': row['Timestamp'],
              'suhu': float(row['Suhu']),
              'kelembapan': float(row['Kelembapan']),
          })
    except Exception:
      pass

  return jsonify({'sensor_data': data_list, 'wa_status': last_wa_status})


@app.route('/api/send-email', methods=['POST'])
def send_email_faq():
  try:
    req_data = request.json
    nama = req_data.get('nama', 'Anonim')
    email_pengirim = req_data.get('email', '-')
    pertanyaan = req_data.get('pertanyaan', '')

    msg = MIMEMultipart()
    msg['From'] = ADMIN_GMAIL
    msg['To'] = ADMIN_GMAIL
    msg['Subject'] = f'[SCEM FAQ] Pertanyaan dari {nama}'

    body = (
        f'Pesan baru dari form FAQ Dashboard SCEM:\n\n'
        f'Nama: {nama}\n'
        f'Email Pengirim: {email_pengirim}\n'
        f'Pertanyaan:\n{pertanyaan}\n'
    )
    msg.attach(MIMEText(body, 'plain'))

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(ADMIN_GMAIL, GMAIL_APP_PASSWORD)
    server.sendmail(ADMIN_GMAIL, ADMIN_GMAIL, msg.as_string())
    server.quit()

    return jsonify(
        {'success': True, 'message': 'Pertanyaan berhasil dikirim ke Gmail!'}
    )
  except Exception as e:
    return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
  threading.Thread(target=start_mqtt, daemon=True).start()
  print('Server Dashboard Flask Berjalan di http://127.0.0.1:5000')
  app.run(host='0.0.0.0', port=5000, debug=False)