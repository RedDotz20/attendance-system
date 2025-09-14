#include <Adafruit_Fingerprint.h>
#include <HardwareSerial.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// --- Constants ---
const int WIFI_TIMEOUT = 180;
const int HTTP_TIMEOUT = 10000;
const int HTTP_CONNECT_TIMEOUT = 5000;
const String DEFAULT_AP_NAME = "ESP32_Access_Point";
const unsigned long FINGERPRINT_READ_DELAY = 2000; // 2 second delay

// --- Fingerprint Sensor Setup ---
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// =========================
// Fingerprint Attendance System
// Main firmware for ESP32
// =========================
// This program manages fingerprint registration and attendance using an ESP32,
// a fingerprint sensor, LCD display, and WiFi connection to a backend server.
// It supports two modes: registration and attendance.
// Serial commands allow switching modes and entering user details.

// --- LCD Setup ---
LiquidCrystal_I2C lcd(0x27, 16, 2); // I2C address 0x27, 16 chars, 2 lines

// --- Backend URLs ---
String baseUrl = "http://192.168.100.4:3000";
String registerEndpoint = "/fingerprint/register";
String attendanceEndpoint = "/fingerprint/attendance";
String checkEndpoint = "/fingerprint/check/";

// --- API Key ---
const char* apiKey = "2776f6c9816044c16543a6111545e0f2ec03eac6877f3930bf4e01e65fabcb9f";

// --- Mode Control ---
bool registerMode = false;
String nameInput = "";
String departmentInput = "";
uint16_t pendingFingerprintID = 0;
bool awaitingRegistrationDetails = false;

// --- Timing Control ---
unsigned long lastFingerprintRead = 0;

WiFiManager wm;

// --- LCD FUNCTIONS ---
void lcdShowStartup() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Fingerprint Sys");
  lcd.setCursor(0, 1);
  lcd.print("Booting...");
}

void lcdShowWiFiConnecting() {
  lcd.clear();
  // Show startup message on LCD
  lcd.setCursor(0, 0);
  lcd.print("CONNECTING WiFi");
  lcd.setCursor(0, 1);
  lcd.print("-Please Wait-");
}

void lcdShowWiFiConnected() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected!");
}

void lcdShowMode() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Mode:");
  lcd.setCursor(6, 0);
  // lcd.print(mode); // Show WiFi connected message
  if (registerMode) {
    lcd.print("Register");
  } else {
    lcd.print("Attendance");
  }
}

void lcdShowScanPrompt() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Place Finger..."); // Show current mode (Register/Attendance)
}

void lcdShowFingerprint(uint16_t id) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("FP ID: ");
  lcd.print(id);
  lcd.setCursor(0, 1);
  lcd.print("Verifying...");
}

void lcdShowAttendanceSuccess() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Attendance");
  lcd.setCursor(0, 1);
  lcd.print("Marked!");
}

void lcdShowRegistrationSuccess() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Registration");
  lcd.setCursor(0, 1);
  lcd.print("Complete!");
}

void lcdShowError(String msg) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Error!"); // Show error message
  lcd.setCursor(0, 1);
  lcd.print(msg);
}

// Forward declarations
void handleSerialCommand(String cmd);
bool checkFingerprintRegistered(uint16_t fingerprintID);
void registerFingerprint(uint16_t fingerprintID, String name, String department);
void markAttendance(uint16_t fingerprintID);
void checkWiFiConnection();
void setupHTTPClient(HTTPClient &http, String url);
void indicateError();
void clearRegistrationData();
uint16_t enrollNewFingerprint();
uint16_t verifyFingerprint();
void printMenu();
void lcdShowAttendanceSuccess();
void lcdShowRegistrationSuccess();

void setup() {
  WiFi.mode(WIFI_STA);
  Serial.begin(115200);
  delay(1000);

  // LCD init
  lcd.init();
  lcd.backlight();
  lcdShowStartup();

  // Initialize fingerprint sensor
  // =========================
  // Arduino setup function
  // =========================
  mySerial.begin(57600, SERIAL_8N1, 16, 17); // RX=16, TX=17
  finger.begin(57600);

  if (!finger.verifyPassword()) {
    Serial.println("❌ Fingerprint sensor not found.");
    lcdShowError("Sensor not found");
    while (true) { delay(1); }
  }

  Serial.print("✅ Fingerprint sensor detected. Capacity: ");
  Serial.println(finger.capacity);

  // Connect WiFi
  lcdShowWiFiConnecting();
  wm.setConfigPortalTimeout(WIFI_TIMEOUT);
  if (!wm.autoConnect(DEFAULT_AP_NAME.c_str())) {
    Serial.println("Failed to connect WiFi.");
    lcdShowError("WiFi Failed");
    delay(2000);
    ESP.restart();
  }

  lcdShowWiFiConnected();

  Serial.println("Connected to WiFi!");
  Serial.println("Backend URL: " + baseUrl);
  Serial.println("\n=== FINGERPRINT ATTENDANCE SYSTEM ===");

  // Show initial mode on LCD
  delay(2000);
  lcdShowMode();

  printMenu();
}

void loop() {
  // Handle Serial Commands
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    handleSerialCommand(input);
  }

  // WiFi connection check
  checkWiFiConnection();

  // =========================
  // Controller main loop
  // =========================

  // Fingerprint debounce
  if (millis() - lastFingerprintRead < FINGERPRINT_READ_DELAY) {
    return;
  }

  // Check fingerprint
  uint16_t fingerprintID = verifyFingerprint();

  if (fingerprintID != 0) {
    lastFingerprintRead = millis();
    Serial.print("👆 Fingerprint ID: ");
    Serial.println(fingerprintID);

    // Show fingerprint ID and "Verifying..." message
    lcdShowFingerprint(fingerprintID);
    delay(1500); // Show verifying message for 1.5 seconds

    if (registerMode) {
      if (nameInput == "" || departmentInput == "") {
        Serial.println("⚠️  Enter name and department.");
        lcdShowError("Need Name/Dept");
        indicateError();
        delay(2000);
        lcdShowMode(); // Return to mode display
      } else {
        registerFingerprint(fingerprintID, nameInput, departmentInput);
      }
    } else {
      if (checkFingerprintRegistered(fingerprintID)) {
        markAttendance(fingerprintID);
      } else {
        Serial.println("⚠️  Fingerprint not registered.");
        lcdShowError("Not Registered");
        pendingFingerprintID = fingerprintID;
        awaitingRegistrationDetails = true;
        indicateError();
        delay(2000);
        lcdShowMode(); // Return to mode display
      }
    }
  }

  delay(50);
}

// ---------------- LCD INTEGRATED LOGIC ----------------
// (Your existing functions remain the same except now they call lcdShowX)

void printMenu() {
  Serial.println("\n=== COMMANDS ===");
  Serial.println("mode register    - Switch to registration mode");
  Serial.println("mode attendance  - Switch to attendance mode");
  Serial.println("enroll           - Enroll new fingerprint");
  Serial.println("name <full name> - Set name");
  Serial.println("dept <dept>      - Set department");
  Serial.println("apikey <key>     - Set API key");
  Serial.println("clear            - Clear registration data");
  Serial.println("menu             - Show this menu");
  Serial.println("================\n");
}

// Print available serial commands for user
void handleSerialCommand(String cmd) {
  if (cmd.equalsIgnoreCase("mode register")) {
    registerMode = true;
    Serial.println("✅ Switched to REGISTER mode.");
    lcdShowMode();
    // lcdShowMode("Register");
  } else if (cmd.equalsIgnoreCase("mode attendance")) {
    registerMode = false;
    Serial.println("✅ Switched to ATTENDANCE mode.");
    lcdShowMode();
    // lcdShowMode("Attendance");
  } else if (cmd.equalsIgnoreCase("enroll")) {
    Serial.println("📝 Starting fingerprint enrollment...");
    uint16_t newID = enrollNewFingerprint();
    // Handle serial commands from user
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
  } else if (cmd.startsWith("apikey ")) {
    String newApiKey = cmd.substring(7);
    newApiKey.trim();
    if (newApiKey.length() > 0) {
      // Update the API key (note: this is temporary and will reset on restart)
      apiKey = newApiKey.c_str();
      Serial.printf("🔑 API key updated to: %s\n", newApiKey.c_str());
      Serial.println("⚠️  Note: API key will reset to default on restart");
    } else {
      Serial.println("❌ Please provide an API key: apikey <your_key>");
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
    // =========================
    // Enroll a new fingerprint
    // Guides user through placing finger twice and stores model
    // Returns new fingerprint ID or 0 on error
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

  // =========================
  // Try to verify a fingerprint
  // Returns fingerprint ID if found, 0 otherwise

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
    // =========================
    // Check WiFi connection and reconnect if needed
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
  // Setup HTTP client with timeouts

  HTTPClient http;
  setupHTTPClient(http, baseUrl + checkEndpoint + String(fingerprintID));
  http.addHeader("X-API-Key", apiKey);  // Add API key header

  int httpResponseCode = http.GET();
  // =========================
  // Check if fingerprint is registered in backend
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
  http.addHeader("X-API-Key", apiKey);  // Add API key header

  // =========================
  // Register fingerprint in backend
  String jsonPayload = "{\"fingerprintId\":\"" + String(fingerprintID) + "\",\"name\":\"" + name + "\",\"department\":\"" + department + "\"}";
  Serial.println("📤 Registering fingerprint...");

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.printf("✅ Registration successful! (HTTP %d)\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Server response: " + response);
    }

    // Show registration success message
    lcdShowRegistrationSuccess();
    delay(2000);
    lcdShowMode(); // Return to mode display

    clearRegistrationData(); // Clear data after successful registration
  } else if (httpResponseCode > 0) {
    Serial.printf("⚠️  Registration response: HTTP %d\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Server response: " + response);
    }

    lcdShowError("Reg Failed");
    delay(2000);
    lcdShowMode(); // Return to mode display

    // Don't clear data on error in case user wants to retry
  } else {
    Serial.printf("❌ Network error: %s\n", http.errorToString(httpResponseCode).c_str());
    lcdShowError("Network Error");
    delay(2000);
    lcdShowMode(); // Return to mode display
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
  http.addHeader("X-API-Key", apiKey);  // Add API key header

  // =========================
  // Mark attendance in backend
  String jsonPayload = "{\"fingerprintId\":\"" + String(fingerprintID) + "\"}";
  Serial.println("📝 Marking attendance...");

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.printf("✅ Attendance marked! (HTTP %d)\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Server response: " + response);
    }

    // Show attendance success message
    lcdShowAttendanceSuccess();
    delay(2000);
    lcdShowMode(); // Return to mode display

  } else if (httpResponseCode > 0) {
    Serial.printf("⚠️  Attendance response: HTTP %d\n", httpResponseCode);
    String response = http.getString();
    if (response.length() > 0) {
      Serial.println("Server response: " + response);
    }

    lcdShowError("Att Failed");
    delay(2000);
    lcdShowMode(); // Return to mode display

  } else {
    Serial.printf("❌ Network error: %s\n", http.errorToString(httpResponseCode).c_str());
    lcdShowError("Network Error");
    delay(2000);
    lcdShowMode(); // Return to mode display
  }

  http.end();
}

void clearRegistrationData() {
  nameInput = "";
  departmentInput = "";
  pendingFingerprintID = 0;
  awaitingRegistrationDetails = false;
}

void indicateError() {
  // Indicate error (can be extended for buzzer/LED)

  // Uncomment if using LEDs
  // for(int i = 0; i < 3; i++) {
  //   digitalWrite(LED_ERROR, HIGH);
  //   delay(100);
  //   digitalWrite(LED_ERROR, LOW);
  //   delay(100);
  // }

  Serial.println("⚠️  Error occurred!");
}

// Indicate error (can be extended for buzzer/LED)
