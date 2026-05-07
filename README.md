# Payment Processing System

## Overview

This project is a production-inspired payment processing backend system built using Node.js, TypeScript, PostgreSQL, Redis, BullMQ, and Prisma.

The system simulates real-world payment gateway behavior including:

* Payment lifecycle management
* Asynchronous processing
* Retry mechanisms
* Idempotency
* Distributed locking
* Optimistic concurrency control
* Webhook reconciliation
* Event-driven architecture
* Race condition handling
* Transactional consistency
* Comprehensive testing

This assignment was designed to demonstrate backend engineering fundamentals and real-world distributed systems thinking.

---

# Tech Stack

| Technology | Purpose                               |
| ---------- | ------------------------------------- |
| Node.js    | Backend runtime                       |
| TypeScript | Type safety and maintainability       |
| Express.js | REST API framework                    |
| PostgreSQL | Primary database                      |
| Prisma ORM | Database access layer                 |
| Redis      | Distributed caching and locking       |
| BullMQ     | Queue processing and retries          |
| Jest       | Testing framework                     |
| Supertest  | API integration testing               |
| Zod        | Validation and environment validation |
| Pino       | Structured logging                    |
| Docker     | Containerized infrastructure          |

---

# Features

## Payment Lifecycle

Supports the following states:

```text
PENDING
PROCESSING
SUCCESS
FAILED
```

Lifecycle transitions are enforced using a payment state machine.

---

## Asynchronous Payment Processing

Payments are processed asynchronously using BullMQ workers.

Benefits:

* Non-blocking API requests
* Retry support
* Better scalability
* Improved fault tolerance

---

## Retry Logic

Supports:

* Configurable retry attempts
* Exponential backoff
* Failure recovery
* Temporary gateway failure handling

---

## Idempotency

The system prevents duplicate payments using:

* Idempotency keys
* Database unique constraints
* Race-condition recovery

This ensures:

* Safe retries
* No duplicate payment creation
* Concurrent request protection

---

## Distributed Locking

Redis-based distributed locks prevent:

* Parallel payment processing
* Worker duplication
* Concurrent execution corruption

---

## Optimistic Concurrency Control

The system uses version-based optimistic locking.

Each payment has:

```text
version
```

Updates are only applied if the version matches.

Benefits:

* Prevents stale updates
* Protects against race conditions
* Safe concurrent webhook processing

---

## Webhook Processing

Supports:

* Duplicate webhook handling
* Early callbacks
* Conflicting callbacks
* Eventual consistency
* Webhook deduplication

---

## Transactional Consistency

Critical payment updates are wrapped in database transactions.

This guarantees:

* Atomic state updates
* Consistent payment events
* Recovery from partial failures

---

## Observability

Implemented:

* Structured logging
* Correlation IDs
* Health checks
* Queue logging
* Failure tracing

---

# System Architecture

## High-Level Flow

```text
Client
  |
  v
Payment API
  |
  v
PostgreSQL
  |
  v
BullMQ Queue
  |
  v
Payment Worker
  |
  v
Fake Payment Gateway
  |
  v
Webhook Callback
  |
  v
Payment Reconciliation
```

---

# Detailed Architecture

## 1. Payment Creation

Client sends:

```http
POST /payments
```

The system:

1. Validates request
2. Checks idempotency key
3. Creates payment record
4. Adds processing job to BullMQ
5. Returns payment response

---

## 2. Queue Processing

BullMQ worker:

1. Acquires Redis lock
2. Validates state transition
3. Updates payment to PROCESSING
4. Calls fake gateway
5. Handles success/failure
6. Releases lock

---

## 3. Retry Processing

Temporary failures:

* Trigger retries
* Use exponential backoff
* Avoid duplicate processing

Permanent failures:

* Mark payment FAILED
* Stop retry attempts

---

## 4. Webhook Reconciliation

Webhook endpoint:

```http
POST /webhooks/payment
```

Handles:

* Duplicate callbacks
* Early callbacks
* Conflicting states
* Stale updates

---

# Folder Structure

```text
src
│
├── config
├── constants
├── controllers
├── gateway
├── locks
├── middleware
├── queues
├── repositories
├── routes
├── services
├── tests
├── types
├── utils
├── validators
├── workers
│
├── app.ts
└── server.ts
```

---

# Database Design

## Payment Table

Stores:

* payment state
* retry metadata
* gateway references
* concurrency version
* timestamps

## PaymentEvent Table

Stores:

* payment lifecycle transitions
* audit trail
* failure reasons

## WebhookEvent Table

Stores:

* webhook deduplication records
* raw webhook payloads

---

# Concurrency Strategy

The system protects against:

| Problem             | Solution                |
| ------------------- | ----------------------- |
| Duplicate requests  | Idempotency keys        |
| Parallel workers    | Redis distributed locks |
| Stale updates       | Optimistic locking      |
| Duplicate callbacks | Webhook deduplication   |
| Partial updates     | Database transactions   |

---

# State Machine

Allowed transitions:

```text
PENDING -> PROCESSING
PENDING -> SUCCESS
PENDING -> FAILED

PROCESSING -> SUCCESS
PROCESSING -> FAILED

FAILED -> PROCESSING
FAILED -> SUCCESS
```

Invalid transitions are rejected.

---

# Fake Gateway Simulation

The fake gateway simulates:

* Success
* Failure
* Delays
* Timeouts
* Randomized responses

This helps test:

* Retry logic
* Eventual consistency
* Failure recovery

---

# Testing Strategy

The project includes:

## Unit Tests

Covers:

* services
* validators
* locks
* state machine
* optimistic locking

## Integration Tests

Covers:

* API routes
* queue behavior
* webhook processing
* concurrency scenarios

## End-to-End Tests

Covers:

* full payment lifecycle
* webhook reconciliation
* race conditions

---

# Edge Cases Handled

| Edge Case                  | Supported |
| -------------------------- | --------- |
| Duplicate payment requests | Yes       |
| Concurrent API calls       | Yes       |
| Parallel workers           | Yes       |
| Duplicate webhooks         | Yes       |
| Early success callbacks    | Yes       |
| Conflicting callbacks      | Yes       |
| Temporary gateway failures | Yes       |
| Retry exhaustion           | Yes       |
| Stale updates              | Yes       |
| Worker restarts            | Yes       |
| Queue persistence          | Yes       |

---

# Health Endpoint

```http
GET /health
```

Checks:

* PostgreSQL connection
* Redis connection
* application uptime

---

# Environment Variables

Example:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payment_system
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

# Running the Project

## Install Dependencies

```bash
npm install
```

---

## Start PostgreSQL & Redis

```bash
docker compose up -d
```

---

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Push Database Schema

```bash
npx prisma db push
```

---

## Start Development Server

```bash
npm run dev
```

---

# Running Tests

## Run All Tests

```bash
npm test
```

---

# API Documentation

## Create Payment

```http
POST /payments
```

Headers:

```http
Idempotency-Key: unique-key
```

Request:

```json
{
  "amount": 1000,
  "currency": "INR"
}
```

---

## Get Payment

```http
GET /payments/:id
```

---

## Webhook Callback

```http
POST /webhooks/payment
```

Request:

```json
{
  "gatewayEventId": "event-123",
  "paymentId": "payment-id",
  "status": "SUCCESS"
}
```

---

# Design Decisions

## Why BullMQ?

Chosen because:

* Redis-backed persistence
* Retry support
* Delayed jobs
* Worker scalability
* Production-ready queue system

---

## Why Optimistic Locking?

Chosen because:

* Prevents stale writes
* Handles distributed races
* Lightweight concurrency strategy
* Common fintech practice

---

## Why Distributed Locks?

Used to:

* Prevent parallel processing
* Avoid duplicate charging
* Ensure single worker execution

---

# Scalability Considerations

This system can be scaled by:

* Running multiple workers
* Horizontal API scaling
* Redis clustering
* PostgreSQL replication
* Queue partitioning

---

# Reliability Considerations

Implemented:

* Retry logic
* Exponential backoff
* Queue persistence
* Transaction safety
* State validation
* Webhook deduplication

---

# Future Improvements

Possible production enhancements:

* Circuit breaker
* Rate limiting
* Metrics dashboard
* Prometheus monitoring
* OpenTelemetry tracing
* Kafka event streaming
* Dead letter queues
* Multi-provider gateway support

---

# Assignment Goals Achieved

| Requirement                | Status |
| -------------------------- | ------ |
| Payment lifecycle          | ✅      |
| Retry logic                | ✅      |
| Idempotency                | ✅      |
| Concurrency handling       | ✅      |
| Webhook processing         | ✅      |
| Data consistency           | ✅      |
| Logging & observability    | ✅      |
| Unit testing               | ✅      |
| Integration testing        | ✅      |
| E2E testing                | ✅      |
| Real-world edge cases      | ✅      |
| Scalability awareness      | ✅      |
| Reliability considerations | ✅      |

---

# Conclusion

This project demonstrates a production-inspired backend payment processing architecture with:

* distributed systems concepts
* concurrency protection
* asynchronous processing
* transactional consistency
* webhook reconciliation
* fault tolerance
* comprehensive testing

The implementation focuses on correctness, reliability, maintainability, and real-world backend engineering practices.
