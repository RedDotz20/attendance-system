# Firmware (ESP32)

Location: `firmware/`

Purpose

Firmware runs on an ESP32-based device and integrates with an RFID reader library (MFRC522). It reads tag UIDs and reports them to the server.

Build & flash

The project uses PlatformIO. You can build and upload using the PlatformIO VS Code extension or CLI (ensure you have the correct board selected in `platformio.ini`).

Key files

- `platformio.ini` — build configuration
- `src/main.cpp` — firmware entrypoint
- `lib/` — third-party libraries (MFRC522, LiquidCrystal_I2C, WiFiManager)

Behavior

1. Connect to WiFi (WiFiManager provides captive portal and configuration support).
2. Initialize MFRC522 RFID reader.
3. On tag read, format an event and POST to the server's RFID API endpoint.

Security

- Devices should be provisioned with a device-specific secret or use an API key to authenticate to the server.
