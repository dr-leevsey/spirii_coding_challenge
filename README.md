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

## Documentation

📖 **[API Usage Examples](docs/API_EXAMPLES.md)** - Comprehensive API documentation with real examples

🧪 **[Testing Strategy](docs/TESTING_STRATEGY.md)** - Complete testing approach and quality assurance

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

5. **Test the API:**
   ```bash
   # Check system health
   curl http://localhost:3000/health
   
   # Get user aggregates (example)
   curl http://localhost:3000/users/074092/aggregates
   
   # See complete examples in docs/API_EXAMPLES.md
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

> 📖 **For complete API documentation with examples, see [API_EXAMPLES.md](docs/API_EXAMPLES.md)**

### Core Endpoints

#### 1. Get User Aggregated Data

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

#### 2. Get List of Requested Payouts

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

#### 3. Health Check & Monitoring

```http
GET /health              # System health overview
GET /health/database     # Database connectivity check
GET /health/sync        # Synchronization status
GET /health/metrics     # System performance metrics
```

#### 4. Synchronization Management

```http
POST /sync/transactions  # Trigger manual sync
GET /sync/status        # Get sync history and status
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

> 🧪 **For detailed testing strategy and examples, see [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)**

### Quick Test Commands

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Quality Assurance Features

- **Unit Tests**: Comprehensive testing with Jest and NestJS utilities
- **Health Monitoring**: Real-time system status endpoints
- **Input Validation**: Global validation with class-validator
- **Error Handling**: Graceful error scenarios and recovery
- **Performance Testing**: Load testing examples and monitoring

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

## Project Structure

```
spirii_coding_challenge/
├── docs/                           # Documentation
│   ├── API_EXAMPLES.md            # Complete API usage examples
│   └── TESTING_STRATEGY.md        # Testing approach and quality assurance
├── src/
│   ├── aggregation/               # User data aggregation module
│   ├── entities/                  # Database entities (TypeORM)
│   ├── health/                    # Health check and monitoring
│   ├── sync/                      # Transaction synchronization
│   └── transaction-api/           # Mock Transaction API
├── docker-compose.yml             # Development environment
├── init.sql                       # Database schema initialization
└── config.example.env             # Environment variables template
```

## Additional Resources

- 📖 **[Complete API Documentation](docs/API_EXAMPLES.md)** - Real examples with curl commands
- 🧪 **[Testing Strategy](docs/TESTING_STRATEGY.md)** - Comprehensive testing approach
- 🐳 **[Docker Setup](docker-compose.yml)** - Multi-container development environment
- 🗄️ **[Database Schema](init.sql)** - PostgreSQL table definitions and indexes

---

**Challenge**: Spirii Backend Developer Recruiting Challenge  
**Framework**: NestJS + TypeORM + PostgreSQL + Redis  
**MVP Focus**: Data aggregation with high performance and reliability
