# Spirii Transaction Aggregation Microservice

MVP microservice for transaction data aggregation, developed for the Spirii Backend Developer Coding Challenge.

## Description

The microservice collects transactions from the Transaction API and provides aggregated data through its own API endpoints:

1. **User aggregated data**: balance, earned, spent, payout, paid out
2. **List of requested payouts**: user ID, payout amount (with aggregation for individual users)

## Architecture Features

- **NestJS** - main framework
- **PostgreSQL** - aggregated data storage
- **Redis** - caching for high performance
- **TypeORM** - ORM for database operations
- **Docker Compose** - containerization for dev environment

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running with Docker

1. **Clone the repository and navigate to the directory:**
   ```bash
   cd spirii_coding_challenge
   ```

2. **Create .env file from example:**
   ```bash
   cp config.example.env .env
   ```

3. **Start all services with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

   This will start:
   - PostgreSQL (port 5432)
   - Redis (port 6379) 
   - NestJS API (port 3000)

4. **API will be available at:**
   ```
   http://localhost:3000
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start only database and Redis:**
   ```bash
   docker-compose up postgres redis
   ```

3. **Run application in dev mode:**
   ```bash
   npm run start:dev
   ```

## API Endpoints

### 1. Get User Aggregated Data

```http
GET /users/{userId}/aggregates
```

**Response:**
```json
{
  "userId": "074092",
  "balance": 18.8,
  "earned": 100.2,
  "spent": 51.4,
  "payout": 30.0,
  "paidOut": 0.0,
  "lastUpdated": "2023-03-16T12:33:11.000Z"
}
```

### 2. Get List of Requested Payouts

```http
GET /payouts/requests
```

**Response:**
```json
{
  "requests": [
    {
      "userId": "074092",
      "totalAmount": 45.5
    },
    {
      "userId": "074093", 
      "totalAmount": 100.0
    }
  ]
}
```

## Architecture Decisions

### Performance
- **Pre-computed aggregates**: Data is aggregated in the background and stored in `user_aggregates` table
- **Redis caching**: Frequently accessed data is cached to reduce database load
- **Indexing**: Optimized indexes for fast queries by `user_id`, `created_at`, `type`

### Data Synchronization
- **Periodic tasks**: Synchronization every minute (configurable via `SYNC_INTERVAL_MINUTES`)
- **Batch processing**: Processing up to 1000 transactions at a time
- **Rate limiting**: Compliance with Transaction API limits (5 requests per minute)
- **Incremental updates**: Fetching only new transactions since last synchronization

### Error Resilience
- **Graceful error handling**: Error logging without stopping synchronization
- **Transaction safety**: Using database transactions for data consistency
- **Monitoring**: `sync_status` table for tracking synchronization state

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Environment Variables

See `config.example.env` for a complete list of available settings.

## Database Structure

- **transactions** - storage of original transactions
- **user_aggregates** - pre-computed user aggregates
- **payout_requests** - tracking of payout requests
- **sync_status** - synchronization monitoring

## Limitations and Assumptions

1. **Mock Transaction API**: Current implementation uses a mock API
2. **Simple authentication**: Not implemented in MVP version
3. **Minimal validation**: Basic input data validation
4. **Single instance**: Not optimized for horizontal scaling
