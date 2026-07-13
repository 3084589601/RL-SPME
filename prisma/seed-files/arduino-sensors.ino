#include <DHT.h>
#define DHT_PIN 2
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);
void setup() { Serial.begin(9600); dht.begin(); }
void loop() {
  float h = dht.readHumidity(), t = dht.readTemperature();
  Serial.print("T:"); Serial.print(t); Serial.print(" H:"); Serial.println(h);
  delay(2000);
}
