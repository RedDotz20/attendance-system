#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* serverURL = "http://your-server.com"; // Replace with your server URL
const char* apiKey = "2776f6c9816044c16543a6111545e0f2ec03eac6877f3930bf4e01e65fabcb9f"; // Replace with your API key

// RFID Configuration
#define SS_PIN 21
#define RST_PIN 22
MFRC522 mfrc522(SS_PIN, RST_PIN);

// LED and Buzzer pins
#define LED_GREEN 2
#define LED_RED 4
#define BUZZER 5

// Forward declarations
String getCardUID();
bool checkAndMarkAttendance(String cardUID);
bool checkAndMarkAttendanceQuery(String cardUID);
bool registerCard(String cardUID, String studentName, String studentId);
bool checkCardRegistration(String cardUID);

void setup() {
  Serial.begin(115200);

  // Initialize pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Initialize SPI bus and MFRC522
  SPI.begin();
  mfrc522.PCD_Init();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  Serial.println("Attendance System Ready");
  Serial.println("Present RFID card to mark attendance...");
}

void loop() {
  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Get card UID
  String cardUID = getCardUID();
  Serial.println("Card detected: " + cardUID);

  // Check if card is registered and mark attendance
  if (checkAndMarkAttendance(cardUID)) {
    // Success - green LED and short beep
    digitalWrite(LED_GREEN, HIGH);
    tone(BUZZER, 1000, 200);
    delay(1000);
    digitalWrite(LED_GREEN, LOW);
    Serial.println("Attendance marked successfully!");
  } else {
    // Failure - red LED and long beep
    digitalWrite(LED_RED, HIGH);
    tone(BUZZER, 500, 1000);
    delay(2000);
    digitalWrite(LED_RED, LOW);
    Serial.println("Failed to mark attendance or card not registered!");
  }

  // Halt PICC and stop encryption
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  delay(2000); // Prevent multiple readings
}

String getCardUID() {
  String content = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    content += String(mfrc522.uid.uidByte[i], HEX);
  }
  content.toUpperCase();
  return content;
}

bool checkAndMarkAttendance(String cardUID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }

  HTTPClient http;

  // Method 1: Using header-based API key authentication (recommended)
  String url = String(serverURL) + "/rfid/attendance";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey); // Add API key to header

  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["uid"] = cardUID;
  doc["deviceId"] = "ESP32_001"; // Unique device identifier
  doc["timestamp"] = millis(); // You might want to use real timestamp

  String payload;
  serializeJson(doc, payload);

  Serial.println("Sending request to: " + url);
  Serial.println("Payload: " + payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);

    http.end();

    // Check if request was successful (200 OK)
    return (httpResponseCode == 200);
  } else {
    Serial.println("Error in HTTP request: " + String(httpResponseCode));
    http.end();
    return false;
  }
}

// Alternative method using query parameter (fallback for compatibility)
bool checkAndMarkAttendanceQuery(String cardUID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }

  HTTPClient http;

  // Method 2: Using query parameter API key authentication
  String url = String(serverURL) + "/rfid/attendance?api_key=" + String(apiKey);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["uid"] = cardUID;
  doc["deviceId"] = "ESP32_001";
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response Code: " + String(httpResponseCode));
    Serial.println("Response: " + response);

    http.end();
    return (httpResponseCode == 200);
  } else {
    Serial.println("Error in HTTP request: " + String(httpResponseCode));
    http.end();
    return false;
  }
}

// Function to register a new RFID card (call this when in registration mode)
bool registerCard(String cardUID, String studentName, String studentId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }

  HTTPClient http;
  String url = String(serverURL) + "/rfid/register";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);

  DynamicJsonDocument doc(1024);
  doc["uid"] = cardUID;
  doc["studentName"] = studentName;
  doc["studentId"] = studentId;
  doc["deviceId"] = "ESP32_001";

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Registration Response: " + response);
    http.end();
    return (httpResponseCode == 200);
  } else {
    Serial.println("Registration Error: " + String(httpResponseCode));
    http.end();
    return false;
  }
}

// Function to check if a card is already registered
bool checkCardRegistration(String cardUID) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  String url = String(serverURL) + "/rfid/check/" + cardUID;

  http.begin(url);
  http.addHeader("X-API-Key", apiKey);

  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Check Card Response: " + response);
    http.end();
    return (httpResponseCode == 200);
  } else {
    http.end();
    return false;
  }
}
