<div align="center">
<img src="asssets/safeenv-high-resolution-logo-removebg-preview.png" alt="SafeEnv logo" width=250>

**SafeEnv** is a web-based solution for securely storing and retrieving environment variables. The frontend is built with **Go** ,**React**, and **Tailwind CSS**

</div>

## Features

- Secure and easy-to-use web interface to manage environment variables.
- Real-time syncing with the backend to ensure up-to-date data.
- Seamless authentication and authorization for accessing and modifying environment variables.
- Responsive design with Tailwind CSS for a modern user experience.

## Installation

To set up the SafeEnv frontend locally, follow these steps:

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16.0 or higher)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/) for package management

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/safeenv-frontend.git
   ```

# SafeEnv API Documentation

## Overview

SafeEnv is a secure API service for storing, retrieving, and sharing environment variables using encryption.

## Base URL

```
http://localhost:8080
```

## Endpoints

### 1. Welcome Route

#### **GET /**

**Description:** Returns a welcome message.

**Response:**

```json
{
  "message": "Welcome to SafeEnv API"
}
```

---

### 2. Store an Environment Variable

#### **POST /api/v1/store**

**Description:** Stores an encrypted environment variable in MongoDB.

**Request Body:**

```json
{
  "key": "API_KEY",
  "value": "secure123"
}
```

**Response:**

```json
{
  "message": "Stored successfully"
}
```

---

### 3. Retrieve an Environment Variable

#### **GET /api/v1/retrieve/:key**

**Description:** Retrieves and decrypts a stored environment variable.

**Response (Success):**

```json
{
  "key": "database_password",
  "value": "secure123"
}
```

**Response (Error - Key Not Found):**

```json
{
  "error": "Not found"
}
```

---

### 4. Generate a Shareable Link

#### **POST /api/v1/share**

**Description:** Generates a shareable link for retrieving an environment variable.

**Request Body:**

```json
{
  "key": "database_password"
}
```

**Response:**

```json
{
  "message": "Shareable link generated",
  "link": "http://localhost:8080/api/v1/retrieve/ZGF0YWJhc2VfcGFzc3dvcmQ="
}
```

---

### 5. Retrieve a Shared Environment Variable

#### **GET /api/v1/share/retrieve/:key**

**Description:** Retrieves an environment variable using a Base64-encoded key from a shared link.

**Response (Success):**

```json
{
  "key": "database_password",
  "value": "secure123"
}
```

**Response (Error - Invalid Key):**

```json
{
  "error": "Invalid key"
}
```

**Response (Error - Key Not Found):**

```json
{
  "error": "Key not found"
}
```

---

## Encryption Details

- AES encryption is used to secure environment variables.
- A 32-byte encryption key is required (stored in `.env` as `SAFEENV_SECRET_KEY`).
- Base64 encoding is used for shareable keys.

## Running the API

Ensure you have Go and MongoDB installed, then run:

```sh
go run main.go
```

## Environment Variables

- `SAFEENV_SECRET_KEY`: A 32-byte key for encryption.
- `MONGO_URI`: MongoDB connection string (default: `mongodb://localhost:27017`).

## Future Enhancements

- JWT authentication for access control.
- Audit logs for tracking variable access.
- Expiry feature for shared links.

## License

MIT License.
