#include <Adafruit_Fingerprint.h>
#include <HardwareSerial.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// --- Constants ---
const int WIFI_TIMEOUT = 180;
const int HTTP_TIMEOUT = 10000;
const int HTTP_CONNECT_TIMEOUT = 5000;
const String DEFAULT_AP_NAME = "ESP32_Access_Point";
const unsigned long FINGERPRINT_READ_DELAY = 2000; // 2 second delay between fingerprint reads

// --- Fingerprint Sensor Setup ---
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// --- Status LED Pins (optional - uncomment if you have LEDs) ---
// #define LED_SUCCESS 2
// #define LED_ERROR 4
// #define BUZZER_PIN 18

// --- Backend URLs ---
String baseUrl = "http://192.168.100.4:3000";
String registerEndpoint = "/fingerprint/register";
String attendanceEndpoint = "/fingerprint/attendance";
String checkEndpoint = "/fingerprint/check/";

// --- Mode Control ---
bool registerMode = false;
String nameInput = "";
String departmentInput = "";
uint16_t pendingFingerprintID = 0;
bool awaitingRegistrationDetails = false;

// --- Timing Control ---
unsigned long lastFingerprintRead = 0;

WiFiManager wm;

// Forward declarations
void handleSerialCommand(String cmd);
bool checkFingerprintRegistered(uint16_t fingerprintID);
void registerFingerprint(uint16_t fingerprintID, String name, String department);
void markAttendance(uint16_t fingerprintID);
void checkWiFiConnection();
void setupHTTPClient(HTTPClient &http, String url);
void indicateSuccess();
void indicateError();
void clearRegistrationData();
uint16_t enrollNewFingerprint();
uint16_t verifyFingerprint();
void printMenu();

void setup() {
  WiFi.mode(WIFI_STA);
  Serial.begin(115200);
  delay(1000);

  // Initialize status LEDs (uncomment if using LEDs)
  // pinMode(LED_SUCCESS, OUTPUT);
  // pinMode(LED_ERROR, OUTPUT);
  // pinMode(BUZZER_PIN, OUTPUT);

  // wm.resetSettings(); // Uncomment to reset WiFi settings

  // Add custom parameter for backend server configuration
  WiFiManagerParameter custom_server("server", "Backend Server", "192.168.100.4:3000", 40);
  wm.addParameter(&custom_server);

  // Initialize fingerprint sensor
  mySerial.begin(57600, SERIAL_8N1, 16, 17); // RX=16, TX=17
  finger.begin(57600);

  if (!finger.verifyPassword()) {
    Serial.println("❌ Fingerprint sensor not found. Check wiring/baud.");
    while (true) { delay(1); }
  }

  Serial.print("✅ Fingerprint sensor detected. Capacity: ");
  Serial.println(finger.capacity);

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
  Serial.println("\n=== FINGERPRINT ATTENDANCE SYSTEM ===");
  printMenu();
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

  // Fingerprint reading debouncing
  if (millis() - lastFingerprintRead < FINGERPRINT_READ_DELAY) {
    return;
  }

  // Check for fingerprint
  uint16_t fingerprintID = verifyFingerprint();

  if (fingerprintID != 0) {
    lastFingerprintRead = millis(); // Update last read time

    Serial.print("👆 Fingerprint detected - ID: ");
    Serial.println(fingerprintID);

    if (registerMode) {
      if (nameInput == "" || departmentInput == "") {
        Serial.println("⚠️  Please enter name and department first:");
        Serial.println("   name John Doe");
        Serial.println("   dept IT");
        indicateError();
      } else {
        registerFingerprint(fingerprintID, nameInput, departmentInput);
      }
    } else {
      if (checkFingerprintRegistered(fingerprintID)) {
        markAttendance(fingerprintID);
      } else {
        Serial.println("⚠️  Fingerprint not registered. Enter name & department to register:");
        Serial.println("   name <your name>");
        Serial.println("   dept <your department>");
        pendingFingerprintID = fingerprintID;
        awaitingRegistrationDetails = true;
        indicateError();
      }
    }
  }

  delay(50); // Small delay for stability
}

void printMenu() {
  Serial.println("\n=== COMMANDS ===");
  Serial.println("mode register    - Switch to registration mode");
  Serial.println("mode attendance  - Switch to attendance mode");
  Serial.println("enroll          - Enroll new fingerprint");
  Serial.println("name <full name> - Set name for registration");
  Serial.println("dept <department>- Set department for registration");
  Serial.println("clear           - Clear registration data");
  Serial.println("menu            - Show this menu");
  Serial.println("================\n");
}

void handleSerialCommand(String cmd) {
  if (cmd.equalsIgnoreCase("mode register")) {
    registerMode = true;
    Serial.println("✅ Switched to REGISTER mode.");
  } else if (cmd.equalsIgnoreCase("mode attendance")) {
    registerMode = false;
    Serial.println("✅ Switched to ATTENDANCE mode.");
  } else if (cmd.equalsIgnoreCase("enroll")) {
    Serial.println("📝 Starting fingerprint enrollment...");
    uint16_t newID = enrollNewFingerprint();
    if (newID > 0) {
      Serial.printf("✅ Fingerprint enrolled with ID: %d\n", newID);
      Serial.println("Please set name and department to complete registration:");
      Serial.println("   name <your name>");
      Serial.println("   dept <your department>");
      pendingFingerprintID = newID;
      awaitingRegistrationDetails = true;
    }
  } else if (cmd.startsWith("name ")) {
    nameInput = cmd.substring(5);
    nameInput.trim();
    Serial.printf("👤 Name set to: %s\n", nameInput.c_str());
    if (awaitingRegistrationDetails && departmentInput != "" && pendingFingerprintID > 0) {
      registerFingerprint(pendingFingerprintID, nameInput, departmentInput);
      awaitingRegistrationDetails = false;
      pendingFingerprintID = 0;
    }
  } else if (cmd.startsWith("dept ")) {
    departmentInput = cmd.substring(5);
    departmentInput.trim();
    Serial.printf("🏢 Department set to: %s\n", departmentInput.c_str());
    if (awaitingRegistrationDetails && nameInput != "" && pendingFingerprintID > 0) {
      registerFingerprint(pendingFingerprintID, nameInput, departmentInput);
      awaitingRegistrationDetails = false;
      pendingFingerprintID = 0;
    }
  } else if (cmd.equalsIgnoreCase("clear")) {
    clearRegistrationData();
    Serial.println("🧹 Registration data cleared.");
  } else if (cmd.equalsIgnoreCase("menu")) {
    printMenu();
  } else {
    Serial.println("❌ Unknown command. Type 'menu' for available commands.");
  }
}

uint16_t enrollNewFingerprint() {
  // Find next available ID
  uint16_t id = 1;
  for (uint16_t i = 1; i <= finger.capacity; i++) {
    if (finger.loadModel(i) != FINGERPRINT_OK) {
      id = i;
      break;
    }
  }

  if (id > finger.capacity) {
    Serial.println("❌ Sensor memory full!");
    return 0;
  }

  Serial.printf("Enrolling fingerprint at ID #%d\n", id);

  int p = -1;
  Serial.println("Place finger...");
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    delay(100);
  }

  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    Serial.println("❌ Failed at 1st image");
    return 0;
  }
  Serial.println("First image taken, remove finger");

  delay(2000);
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    delay(100);
  }

  Serial.println("Place the same finger again...");
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    delay(100);
  }

  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    Serial.println("❌ Failed at 2nd image");
    return 0;
  }

  if (finger.createModel() != FINGERPRINT_OK) {
    Serial.println("❌ Fingerprints did not match");
    return 0;
  }

  if (finger.storeModel(id) == FINGERPRINT_OK) {
    Serial.printf("✅ Fingerprint enrolled successfully at ID #%d\n", id);
    return id;
  } else {
    Serial.println("❌ Error storing fingerprint");
    return 0;
  }
}

uint16_t verifyFingerprint() {
  int p = finger.getImage();

  if (p != FINGERPRINT_OK) {
    return 0; // No finger detected
  }

  if (finger.image2Tz() != FINGERPRINT_OK) {
    return 0; // Image conversion failed
  }

  p = finger.fingerFastSearch();

  if (p == FINGERPRINT_OK) {
    return finger.fingerID;
  }

  return 0; // No match found
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

bool checkFingerprintRegistered(uint16_t fingerprintID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    indicateError();
    return false;
  }

  HTTPClient http;
  setupHTTPClient(http, baseUrl + checkEndpoint + String(fingerprintID));

  int httpResponseCode = http.GET();
  bool isRegistered = false;

  if (httpResponseCode == 200) {
    String payload = http.getString();
    // More robust JSON parsing
    isRegistered = (payload.indexOf("\"registered\":true") != -1) ||
                   (payload.indexOf("true") != -1);

    if (isRegistered) {
      Serial.println("✅ Fingerprint is registered");
    } else {
      Serial.println("❌ Fingerprint not found in database");
    }
  } else if (httpResponseCode == 404) {
    Serial.println("❌ Fingerprint not found in database");
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

void registerFingerprint(uint16_t fingerprintID, String name, String department) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    indicateError();
    return;
  }

  HTTPClient http;
  setupHTTPClient(http, baseUrl + registerEndpoint);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"fingerprintId\":\"" + String(fingerprintID) + "\",\"name\":\"" + name + "\",\"department\":\"" + department + "\"}";
  Serial.println("📤 Registering fingerprint...");

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

void markAttendance(uint16_t fingerprintID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    indicateError();
    return;
  }

  HTTPClient http;
  setupHTTPClient(http, baseUrl + attendanceEndpoint);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"fingerprintId\":\"" + String(fingerprintID) + "\"}";
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
  pendingFingerprintID = 0;
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
