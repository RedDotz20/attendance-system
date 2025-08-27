#include <SPI.h>
#include <MFRC522.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// --- Constants ---
const int WIFI_TIMEOUT = 180;
const int HTTP_TIMEOUT = 10000;
const int HTTP_CONNECT_TIMEOUT = 5000;
const String DEFAULT_AP_NAME = "ESP32_Access_Point";
const unsigned long CARD_READ_DELAY = 2000; // 2 second delay between card reads

// --- RFID Pins ---
#define SS_PIN 5
#define RST_PIN 0

// --- Status LED Pins (optional - uncomment if you have LEDs) ---
// #define LED_SUCCESS 2
// #define LED_ERROR 4
// #define BUZZER_PIN 18

MFRC522 rfid(SS_PIN, RST_PIN);
byte nuidPICC[4];

// --- Backend URLs ---
String baseUrl = "http://192.168.100.4:3000";
String registerEndpoint = "/rfid/register";
String attendanceEndpoint = "/rfid/attendance";
String checkEndpoint = "/rfid/check/";

// --- Mode Control ---
bool registerMode = false;
String nameInput = "";
String departmentInput = "";
String pendingUID = "";
bool awaitingRegistrationDetails = false;

// --- Timing Control ---
unsigned long lastCardRead = 0;

WiFiManager wm;

// Forward declarations
void handleSerialCommand(String cmd);
bool checkCardRegistered(String uid);
void registerCard(String uid, String name, String department);
void markAttendance(String uid);
void checkWiFiConnection();
void setupHTTPClient(HTTPClient &http, String url);
void indicateSuccess();
void indicateError();
void clearRegistrationData();

void setup() {
  WiFi.mode(WIFI_STA);
  Serial.begin(115200);

  // Initialize status LEDs (uncomment if using LEDs)
  // pinMode(LED_SUCCESS, OUTPUT);
  // pinMode(LED_ERROR, OUTPUT);
  // pinMode(BUZZER_PIN, OUTPUT);

  // wm.resetSettings(); // Uncomment to reset WiFi settings

  // Add custom parameter for backend server configuration
  WiFiManagerParameter custom_server("server", "Backend Server", "192.168.100.4:3000", 40);
  wm.addParameter(&custom_server);

  // Start SPI & RFID
  SPI.begin();
  rfid.PCD_Init();

  // Connect to WiFi using WiFi Manager
  wm.setConfigPortalTimeout(WIFI_TIMEOUT);
  if (!wm.autoConnect(DEFAULT_AP_NAME.c_str())) {
    Serial.println("Failed to connect to WiFi. Resetting...");
    delay(1000);
    ESP.restart();
  }

  // Update base URL from custom parameter
  String serverParam = custom_server.getValue();
  if (serverParam.length() > 0) {
    baseUrl = "http://" + serverParam;
  }

  Serial.println("Connected to WiFi!");
  Serial.println("Backend URL: " + baseUrl);
  Serial.println("\n=== COMMANDS ===");
  Serial.println("mode register    - Switch to registration mode");
  Serial.println("mode attendance  - Switch to attendance mode");
  Serial.println("name <full name> - Set name for registration");
  Serial.println("dept <department>- Set department for registration");
  Serial.println("clear           - Clear registration data");
  Serial.println("================\n");
}

void loop() {
  // Handle Serial Commands
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    handleSerialCommand(input);
  }

  // Check WiFi connection periodically
  checkWiFiConnection();

  // Card reading debouncing
  if (millis() - lastCardRead < CARD_READ_DELAY) {
    return;
  }

  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Check if it's a new card
  if (rfid.uid.uidByte[0] != nuidPICC[0] ||
      rfid.uid.uidByte[1] != nuidPICC[1] ||
      rfid.uid.uidByte[2] != nuidPICC[2] ||
      rfid.uid.uidByte[3] != nuidPICC[3]) {

    lastCardRead = millis(); // Update last read time

    // Store UID
    for (byte i = 0; i < 4; i++) {
      nuidPICC[i] = rfid.uid.uidByte[i];
    }

    // Convert UID to HEX string
    String uidString = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      uidString += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      uidString += String(rfid.uid.uidByte[i], HEX);
    }
    uidString.toUpperCase();

    Serial.print("📱 Card UID: ");
    Serial.println(uidString);

    if (registerMode) {
      if (nameInput == "" || departmentInput == "") {
        Serial.println("⚠️  Please enter name and department first:");
        Serial.println("   name John Doe");
        Serial.println("   dept IT");
        indicateError();
      } else {
        registerCard(uidString, nameInput, departmentInput);
      }
    } else {
      if (checkCardRegistered(uidString)) {
        markAttendance(uidString);
      } else {
        Serial.println("⚠️  Card not registered. Enter name & department to register:");
        Serial.println("   name <your name>");
        Serial.println("   dept <your department>");
        pendingUID = uidString;
        awaitingRegistrationDetails = true;
        indicateError();
      }
    }

  } else {
    Serial.println("🔄 Same card detected again (ignored)");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void handleSerialCommand(String cmd) {
  if (cmd.equalsIgnoreCase("mode register")) {
    registerMode = true;
    Serial.println("✅ Switched to REGISTER mode.");
  } else if (cmd.equalsIgnoreCase("mode attendance")) {
    registerMode = false;
    Serial.println("✅ Switched to ATTENDANCE mode.");
  } else if (cmd.startsWith("name ")) {
    nameInput = cmd.substring(5);
    nameInput.trim();
    Serial.printf("👤 Name set to: %s\n", nameInput.c_str());
    if (awaitingRegistrationDetails && departmentInput != "") {
      registerCard(pendingUID, nameInput, departmentInput);
      awaitingRegistrationDetails = false;
      pendingUID = "";
    }
  } else if (cmd.startsWith("dept ")) {
    departmentInput = cmd.substring(5);
    departmentInput.trim();
    Serial.printf("🏢 Department set to: %s\n", departmentInput.c_str());
    if (awaitingRegistrationDetails && nameInput != "") {
      registerCard(pendingUID, nameInput, departmentInput);
      awaitingRegistrationDetails = false;
      pendingUID = "";
    }
  } else if (cmd.equalsIgnoreCase("clear")) {
    clearRegistrationData();
    Serial.println("🧹 Registration data cleared.");
  } else {
    Serial.println("❌ Unknown command. Type 'help' for available commands.");
  }
}

void checkWiFiConnection() {
  static unsigned long lastCheck = 0;
  const unsigned long CHECK_INTERVAL = 30000; // Check every 30 seconds

  if (millis() - lastCheck < CHECK_INTERVAL) {
    return;
  }

  lastCheck = millis();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("📡 WiFi disconnected. Attempting to reconnect...");
    WiFi.begin();
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ WiFi reconnected!");
    } else {
      Serial.println("\n❌ Failed to reconnect. Starting config portal...");
      wm.startConfigPortal(DEFAULT_AP_NAME.c_str());
    }
  }
}

void setupHTTPClient(HTTPClient &http, String url) {
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT);
  http.setConnectTimeout(HTTP_CONNECT_TIMEOUT);
}

bool checkCardRegistered(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    indicateError();
    return false;
  }

  HTTPClient http;
  setupHTTPClient(http, baseUrl + checkEndpoint + uid);

  int httpResponseCode = http.GET();
  bool isRegistered = false;

  if (httpResponseCode == 200) {
    String payload = http.getString();
    // More robust JSON parsing
    isRegistered = (payload.indexOf("\"registered\":true") != -1) ||
                   (payload.indexOf("true") != -1);

    if (isRegistered) {
      Serial.println("✅ Card is registered");
    } else {
      Serial.println("❌ Card not found in database");
    }
  } else if (httpResponseCode == 404) {
    Serial.println("❌ Card not found in database");
  } else {
    Serial.printf("❌ HTTP Error: %d\n", httpResponseCode);
    if (httpResponseCode > 0) {
      Serial.println("Response: " + http.getString());
    }
    indicateError();
  }

  http.end();
  return isRegistered;
}

void registerCard(String uid, String name, String department) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    indicateError();
    return;
  }

  HTTPClient http;
  setupHTTPClient(http, baseUrl + registerEndpoint);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"uid\":\"" + uid + "\",\"name\":\"" + name + "\",\"department\":\"" + department + "\"}";
  Serial.println("📤 Registering card...");

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.printf("✅ Registration successful! (HTTP %d)\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Server response: " + response);
    }
    indicateSuccess();
    clearRegistrationData(); // Clear data after successful registration
  } else if (httpResponseCode > 0) {
    Serial.printf("⚠️  Registration response: HTTP %d\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Server response: " + response);
    }
    // Don't clear data on error in case user wants to retry
  } else {
    Serial.printf("❌ Network error: %s\n", http.errorToString(httpResponseCode).c_str());
    indicateError();
  }

  http.end();
}

void markAttendance(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    indicateError();
    return;
  }

  HTTPClient http;
  setupHTTPClient(http, baseUrl + attendanceEndpoint);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"uid\":\"" + uid + "\"}";
  Serial.println("📝 Marking attendance...");

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.printf("✅ Attendance marked! (HTTP %d)\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Server response: " + response);
    }
    indicateSuccess();
  } else if (httpResponseCode > 0) {
    Serial.printf("⚠️  Attendance response: HTTP %d\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Server response: " + response);
    }
  } else {
    Serial.printf("❌ Network error: %s\n", http.errorToString(httpResponseCode).c_str());
    indicateError();
  }

  http.end();
}

void clearRegistrationData() {
  nameInput = "";
  departmentInput = "";
  pendingUID = "";
  awaitingRegistrationDetails = false;
}

void indicateSuccess() {
  // Uncomment if using LEDs/buzzer
  // digitalWrite(LED_SUCCESS, HIGH);
  // digitalWrite(BUZZER_PIN, HIGH);
  // delay(200);
  // digitalWrite(LED_SUCCESS, LOW);
  // digitalWrite(BUZZER_PIN, LOW);

  Serial.println("🎉 Success!");
}

void indicateError() {
  // Uncomment if using LEDs
  // for(int i = 0; i < 3; i++) {
  //   digitalWrite(LED_ERROR, HIGH);
  //   delay(100);
  //   digitalWrite(LED_ERROR, LOW);
  //   delay(100);
  // }

  Serial.println("⚠️  Error occurred!");
}