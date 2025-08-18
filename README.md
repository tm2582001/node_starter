# Node Fork - Multi-Tenant Express.js Application

A Node.js application built with Express.js, TypeScript, and Drizzle ORM, featuring multi-tenant architecture, metrics collection, and comprehensive logging capabilities.

## 📁 Project Structure

```
node-fork/
├── src/                           # Main application source code
│   ├── db/                        # Database connection and schemas
│   │   ├── index.ts              # Database pool creation
│   │   └── schemas/              # Drizzle ORM schemas
│   ├── middlewares/              # Express middlewares
│   │   ├── morgan.middleware.ts  # HTTP request logging
│   │   └── request-id.middleware.ts # Request ID tracking
│   ├── routes/                   # API routes
│   │   ├── metrics.route.ts      # Prometheus metrics endpoint
│   │   └── v1/                   # Version 1 API routes
│   │       └── index.ts
│   ├── types/                    # TypeScript type definitions
│   │   └── express.d.ts          # Extended Express types
│   ├── utils/                    # Utility functions
│   │   ├── directory-name.util.ts
│   │   ├── metrics/              # Metrics utilities
│   │   └── request-contex.util.ts
│   ├── configurations.ts         # Configuration management
│   ├── index.ts                  # Application entry point
│   ├── logger.ts                 # Winston logger setup
│   └── server.ts                 # Express server setup
├── configurations/               # YAML configuration files
│   ├── base.yaml                # Base configuration
│   ├── local.yaml               # Local development config
│   └── production.yaml          # Production configuration
├── scripts/                     # Docker and monitoring scripts
│   ├── docker-compose.yml       # Additional compose file
│   └── monitoring/              # Monitoring setup
│       ├── prometheus.yml       # Prometheus configuration
│       └── for-test-not-used/   # Test monitoring configs
├── drizzle/                     # Database migration files
├── dist/                        # Compiled JavaScript output
├── logs/                        # Application log files
├── test/                        # Test files
├── docker-compose.yml           # Main Docker Compose file
├── Dockerfile                   # Docker image definition
├── drizzle.config.ts           # Drizzle ORM configuration
├── package.json                # Node.js dependencies
└── tsconfig.json               # TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- MySQL 8.0+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd node-fork

# Install dependencies
npm install

# Copy environment file
cp .env.example .env  # Create if not exists

# Build the application
npm run build
```

## 🐳 Running with Docker Compose

### Basic Setup

```bash
# Build and start the application
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop the application
docker-compose down
```

### With Database (Uncomment in docker-compose.yml)

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      APP_PORT: 8080
      APP_TENANT: your_database_name
      APP_DATABASE__HOST: db
      APP_DATABASE__USERNAME: root
      APP_DATABASE__PASSWORD: secret
    depends_on:
      - db
    ports:
      - "8080:8080"

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: your_database_name
    ports:
      - "33061:3306"
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:
```

## ⚙️ Configuration

### Configuration Files

The application uses a hierarchical configuration system with YAML files:

1. **base.yaml** - Default configuration
2. **{environment}.yaml** - Environment-specific overrides
3. **Environment variables** - Runtime overrides

### Configuration Structure

```yaml
# configurations/base.yaml
port: 8080
tenant: ""

# configurations/local.yaml or production.yaml
logs:
  terminal: true
  dailyRotateFile: false
  loki: false
  lokiUrl: 'http://localhost:3100'
  lokiAppName: "node-fork"
  lokiEndpointToken: "your-token-here"

database:
  host: "localhost"
  username: "root"
  password: "password"
  connectionLimit: 10
```

### Environment Variables

Use the `APP_` prefix with double underscores (`__`) for nested properties:

```bash
# Basic configuration
APP_PORT=8080
APP_TENANT=my_tenant_db

# Database configuration
APP_DATABASE__HOST=localhost
APP_DATABASE__USERNAME=root
APP_DATABASE__PASSWORD=secret
APP_DATABASE__CONNECTIONLIMIT=20

# Logging configuration
APP_LOGS__TERMINAL=true
APP_LOGS__DAILYROTATEFILE=true
APP_LOGS__LOKI=true
APP_LOGS__LOKIURL=http://localhost:3100
APP_LOGS__LOKIAPPNAME=node-fork
APP_LOGS__LOKIENDPOINTTOKEN=your-loki-token

# Direct environment variables (no APP_ prefix)
NODE_ENV=production
PORT=8080
DATABASE_URL=mysql://user:password@localhost:3306/database
```

## 🏢 Multi-Tenant Configuration

### Changing Tenant

The application uses the `tenant` field as the database name for multi-tenancy:

#### Method 1: Configuration File
```yaml
# configurations/production.yaml
tenant: "client_a_database"
```

#### Method 2: Environment Variable
```bash
APP_TENANT=client_b_database
```

#### Method 3: Docker Compose
```yaml
services:
  app:
    environment:
      APP_TENANT: client_c_database
```

### Database Per Tenant

Each tenant gets its own MySQL database:
- Tenant A: `client_a_database`
- Tenant B: `client_b_database` 
- Tenant C: `client_c_database`

## 📊 Metrics & Monitoring

### Prometheus Metrics

Access metrics at: `GET /metrics`

**Authentication Required:**
```bash
curl -H "Authorization: Bearer your-loki-token" http://localhost:8080/metrics
```

### Available Metrics
- Default Node.js metrics (memory, CPU, etc.)
- Custom application metrics
- HTTP request metrics via Morgan middleware

## 📝 Logging

### Log Transporters

1. **Console Logging** - `logs.terminal: true`
2. **Daily Rotate Files** - `logs.dailyRotateFile: true`
3. **Grafana Loki** - `logs.loki: true`

### Log Files Location
```
logs/
├── application-2025-08-16.log
├── application-2025-08-17.log
└── application-2025-08-18.log
```

### Loki Configuration Example
```bash
APP_LOGS__LOKI=true
APP_LOGS__LOKIURL=http://localhost:3100
APP_LOGS__LOKIAPPNAME=node-fork
APP_LOGS__LOKIENDPOINTTOKEN=your-secure-token
```

## 🗄️ Database

### Drizzle ORM Setup

```typescript
// drizzle.config.ts
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Running Migrations

```bash
# Generate migrations
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate

# Push schema directly (development)
npx drizzle-kit push
```

## 🔧 Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Linting
npm run lint

# Run tests
npm test
```

### Development Setup

```bash
# Start in development mode
NODE_ENV=local npm run dev

# With specific tenant
APP_TENANT=dev_database npm run dev

# With custom port
APP_PORT=3000 npm run dev
```

## 🚦 Health Check

The application provides a health check endpoint:

```bash
curl http://localhost:8080/health
# Response: {"ok": true}
```

## 🔐 Security Features

- **Authentication** for metrics endpoint
- **Request ID tracking** for all requests
- **Non-root Docker user** (expressjs:1001)
- **Security headers** (X-Powered-By disabled)
- **Input validation** with Zod schemas

## 📋 API Endpoints

```
GET  /health           # Health check
GET  /metrics          # Prometheus metrics (authenticated)
     /api/v1/*         # Version 1 API routes
```

## 🏗️ Production Deployment

### Environment Variables Checklist

```bash
# Required
NODE_ENV=production
APP_TENANT=production_database
APP_DATABASE__HOST=your-db-host
APP_DATABASE__USERNAME=your-db-user
APP_DATABASE__PASSWORD=your-db-password

# Optional
APP_PORT=8080
APP_DATABASE__CONNECTIONLIMIT=20
APP_LOGS__DAILYROTATEFILE=true
APP_LOGS__LOKI=true
APP_LOGS__LOKIURL=https://your-loki-endpoint
APP_LOGS__LOKIENDPOINTTOKEN=secure-token
```

### Docker Production Build

```dockerfile
# Multi-stage build for production
FROM node:22 AS builder
# ... build stage

FROM node:22-bookworm-slim
# ... production stage with security
USER expressjs  # Non-root user
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details.

---

**Author:** Tushar Mehta