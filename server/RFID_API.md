# RFID Attendance System API

## Overview

This API provides endpoints for RFID card registration and attendance tracking, designed to work with ESP32 RFID readers.

## Database Models

### RfidCard Model

```typescript
{
  uid: string,           // RFID card unique identifier (uppercase)
  name: string,          // Cardholder's name
  department: string,    // Department/organization
  isActive: boolean,     // Card status (default: true)
  createdAt: Date,       // Registration timestamp
  updatedAt: Date        // Last update timestamp
}
```

### Attendance Model

```typescript
{
  uid: string,           // RFID card unique identifier
  name: string,          // Cardholder's name (copied from card)
  department: string,    // Department (copied from card)
  timestamp: Date,       // Attendance timestamp
  createdAt: Date,       // Record creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

## API Endpoints

### 1. Register RFID Card

**Endpoint:** `POST /rfid/register`

**Description:** Register a new RFID card with user information. Used by ESP32 when in registration mode.

**Request Body:**

```json
{
	"uid": "A1B2C3D4",
	"name": "John Doe",
	"department": "IT"
}
```

**Success Response (201):**

```json
{
	"success": true,
	"message": "RFID card registered successfully",
	"data": {
		"uid": "A1B2C3D4",
		"name": "John Doe",
		"department": "IT",
		"isActive": true,
		"createdAt": "2025-08-30T10:30:00.000Z"
	}
}
```

**Error Response (409) - Card already exists:**

```json
{
	"success": false,
	"message": "RFID card is already registered",
	"data": {
		"uid": "A1B2C3D4",
		"name": "John Doe",
		"department": "IT"
	}
}
```

### 2. Mark Attendance

**Endpoint:** `POST /rfid/attendance`

**Description:** Mark attendance for a registered RFID card. Used by ESP32 when in attendance mode.

**Request Body:**

```json
{
	"uid": "A1B2C3D4"
}
```

**Success Response (201):**

```json
{
	"success": true,
	"message": "Attendance marked successfully",
	"data": {
		"uid": "A1B2C3D4",
		"name": "John Doe",
		"department": "IT",
		"timestamp": "2025-08-30T10:30:00.000Z"
	}
}
```

**Error Response (404) - Card not found:**

```json
{
	"success": false,
	"message": "RFID card not found or inactive"
}
```

### 3. Check RFID Card

**Endpoint:** `GET /rfid/check/{uid}`

**Description:** Check if an RFID card is registered and active. Used by ESP32 to validate cards before marking attendance.

**Success Response (200):**

```json
{
	"success": true,
	"message": "RFID card found",
	"registered": true,
	"data": {
		"uid": "A1B2C3D4",
		"name": "John Doe",
		"department": "IT",
		"isActive": true,
		"createdAt": "2025-08-30T10:30:00.000Z"
	}
}
```

**Error Response (404) - Card not found:**

```json
{
	"success": false,
	"message": "RFID card not found",
	"registered": false
}
```

### 4. Get All RFID Cards (Admin)

**Endpoint:** `GET /rfid/cards`

**Description:** Retrieve all registered RFID cards with pagination and filtering.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `department`: Filter by department
- `search`: Search by name or UID

**Success Response (200):**

```json
{
  "success": true,
  "message": "RFID cards retrieved successfully",
  "data": {
    "cards": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 5. Get Attendance History (Admin)

**Endpoint:** `GET /rfid/attendance`

**Description:** Retrieve attendance records with pagination and filtering.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `department`: Filter by department
- `uid`: Filter by specific UID
- `startDate`: Filter from date (ISO format)
- `endDate`: Filter to date (ISO format)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Attendance history retrieved successfully",
  "data": {
    "attendance": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## ESP32 Integration

### Registration Mode

When ESP32 is in registration mode:

1. Read RFID card UID
2. Prompt user for name and department via Serial
3. Send POST request to `/rfid/register`

### Attendance Mode

When ESP32 is in attendance mode:

1. Read RFID card UID
2. Check if card is registered via GET `/rfid/check/{uid}`
3. If registered, mark attendance via POST `/rfid/attendance`
4. If not registered, prompt for registration

## Testing

Run the test script to verify all endpoints:

```bash
./test-rfid-api.sh
```

Make sure your server is running on `http://localhost:3000` before running the test.

## Database Indexes

The following indexes are created for optimal performance:

- `RfidCard.uid` (unique)
- `RfidCard.department`
- `Attendance.uid`
- `Attendance.timestamp` (descending)
- `Attendance.department`
