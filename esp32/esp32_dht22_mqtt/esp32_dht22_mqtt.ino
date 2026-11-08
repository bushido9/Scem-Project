#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* ssid = "-";
const char* password = "-";

// Public MQTT Broker (Bebas IP Lokal)
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "scem/ruang_kelas/data";

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define BUZZER 19

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  Serial.println("\nMenghubungkan ke Wi-Fi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Terhubung!");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Mencoba koneksi ke MQTT Broker...");
    String clientId = "ESP32_SCEM_" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("Terhubung ke HiveMQ!");
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" Coba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);
  
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (!isnan(humidity) && !isnan(temperature)) {
    // Logika Alarm Buzzer
    if (temperature > 29.0) {
      digitalWrite(BUZZER, HIGH);
      delay(300);
      digitalWrite(BUZZER, LOW);
    } else {
      digitalWrite(BUZZER, LOW);
    }

    // Mengirim data format JSON via MQTT
    String payload = "{\"suhu\":" + String(temperature, 1) + ",\"kelembapan\":" + String(humidity, 1) + "}";
    client.publish(mqtt_topic, payload.c_str());
    Serial.println("Data MQTT Terkirim: " + payload);
  } else {
    Serial.println("Gagal membaca sensor DHT22!");
  }

  delay(10000); // Kirim data setiap 10 detik
}