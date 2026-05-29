# Notification Service

## Service Name & Overview

The Notification Service delivers in-app notifications stored in MongoDB and pushed in real time via Socket.IO. It consumes multiple Kafka topics for friendship, interaction, user sync, OTP, and post-created events, and optionally sends email via Nodemailer.

**Tech Stack**

- **Language:** TypeScript
- **Framework:** Express 4
- **ODM:** Mongoose (MongoDB)
- **Key libraries:** Socket.IO, KafkaJS, Nodemailer, Axios, jsonwebtoken

## Architecture & Dependencies

### Internal Dependencies

| Dependency | Purpose |
|---|---|
| **MongoDB** | Notification persistence |
| **Kafka** | Consumes events from user, post, and friends services |

### Event Contracts

See [`../KAFKA_TOPICS.txt`](../KAFKA_TOPICS.txt) for the platform topic list.

| Direction | Topic | Consumer group | Events handled |
|---|---|---|---|
| **Produces** | — | — | None |
| **Consumes** | `friendship.events` | `notification-service-friendship-events` | `friend_request.sent` |
| **Consumes** | `interaction.events` | `notification-service-interaction-events` | `post.liked`, `post.commented` (ignores unlike/uncomment) |
| **Consumes** | `user.events` | `notification-service-user-events` | Upserts user in MongoDB |
| **Consumes** | `otp` | `notification-service-otp` | `{ type, email, otp }` |
| **Consumes** | `notification.post.created` | `notification-service-post-notifs` | `type === "post_created"` |

### External APIs

| Target | Env variable | Purpose |
|---|---|---|
| **friends-service** (via gateway) | `FRIEND_ID_FETCH_URL` | Fetches friend IDs to notify on new posts |

## Environment Variables

```bash
# --- Server ---
PORT=2006

# --- Auth / JWT ---
ACCESS_TOKEN_SECRET=your-access-token-secret

# --- Database (MongoDB) ---
DATABASE_URL=mongodb://localhost:27017/your-db-name

# --- Kafka (local — plaintext Docker) ---
KAFKA_MODE=local
KAFKA_BROKERS=localhost:9092

# --- Kafka (Aiven — uncomment and set KAFKA_MODE=aiven) ---
# KAFKA_MODE=aiven
# KAFKA_BROKERS=your-service.a.aivencloud.com:12345
# KAFKA_SASL_USERNAME=your-aiven-username
# KAFKA_SASL_PASSWORD=your-aiven-password
# KAFKA_SASL_MECHANISM=scram-sha-256
# KAFKA_SSL_CA_PATH=./ca.pem
# KAFKA_SSL_CA=

# --- Inter-service ---
FRIEND_ID_FETCH_URL=http://localhost:2000/api/v1/friend/friends/

# --- Email (Gmail via Nodemailer) ---
GOOGLE_APP_PASSWORD=your-google-app-password
MY_EMAIL=your-email@example.com
```

> **Cross-service note:** `ACCESS_TOKEN_SECRET` must match the value configured in user-service.

> **Port note:** `.env.example` uses port **2006**. The Dockerfile exposes **2005** — use 2006 for local development to match the api-gateway configuration.

## Getting Started

### Prerequisites

- **Node.js** 18+ (Dockerfile uses Node 23)
- **MongoDB** 6+ running locally
- **Kafka** from parent docker-compose
- **api-gateway** and **friends-service** running (for `FRIEND_ID_FETCH_URL` calls)
- **Gmail app password** (optional, for OTP email delivery)

### Local Infrastructure

```bash
# From the parent repo root (d:\main PROJECTS\leaf\)
docker compose up -d kafka
```

Start MongoDB locally (default: `mongodb://localhost:27017`).

### Install & Run

```bash
cd notification-service
cp .env.example .env
npm install
npm run dev
```

Verify: service listens on `http://localhost:2006`

**Docker (optional):**

```bash
docker build -t notification-service .
docker run -p 2006:2006 --env-file .env notification-service
```

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/app.ts` | Development with hot reload |
| `start` | `node dist/app.js` | Production start (requires `build`) |
| `build` | `tsc` | Compile TypeScript to `dist/` |

## API / Event Interface

Gateway prefix: `/api/v1/notification` (WebSocket proxy enabled)

### REST Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Yes | Get all notifications |
| `PATCH` | `/:notificationId/read` | Yes | Mark single notification as read |
| `PUT` | `/` | Yes | Mark all notifications as read |
| `DELETE` | `/` | Yes | Soft delete all notifications |
| `GET` | `/count` | Yes | Get unread notification count |

All REST routes require a Bearer JWT in the `Authorization` header.

### WebSocket (Socket.IO)

Socket.IO runs on the same HTTP server and is proxied through the API gateway with WebSocket upgrade support.

| Direction | Event | Payload | Description |
|---|---|---|---|
| Client → Server | `authenticate` | JWT token string | Authenticates user; joins room by `aud` claim |
| Server → Client | `room_joined` | `{ roomId }` | Confirms successful room join |
| Client → Server | `disconnect` | — | Leaves all rooms on disconnect |

Real-time notifications are pushed to the user's room when Kafka events are processed (friend requests, likes, comments, new posts from friends).

### Event-Driven Behavior

Background Kafka consumers create in-app notifications and emit Socket.IO events. No HTTP endpoints are exposed for event ingestion — all notification triggers arrive via Kafka.
