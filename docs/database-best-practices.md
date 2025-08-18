# Database Best Practices Guide

## 📊 Connection Pool Management with Node.js Clustering

### Understanding Connection Pools in Clustered Applications

When using Node.js clustering, each worker process creates its own database connection pool. This is the **correct and recommended approach** for the following reasons:

#### Why Each Worker Needs Its Own Pool

```
Master Process (no DB connections)
├── Worker 1 → Connection Pool (up to 10 connections)
├── Worker 2 → Connection Pool (up to 10 connections)
├── Worker 3 → Connection Pool (up to 10 connections)
└── Worker 4 → Connection Pool (up to 10 connections)
```

**Benefits:**
- **Process Isolation**: Workers can't share connection objects across process boundaries
- **Fault Tolerance**: If one worker crashes, others maintain their connections
- **No Shared State**: Each worker manages its own database transactions
- **Better Performance**: No inter-process communication overhead

### Connection Pool Sizing Best Practices

#### 1. Calculate Total Connections

```typescript
// Example: 4 workers × 10 connections per pool = 40 total connections
const totalConnections = numWorkers × connectionLimit;
```

#### 2. Database Server Limits

Most MySQL configurations default to:
- `max_connections = 151` (MySQL default)
- Reserve ~20% for admin connections
- Usable connections ≈ 120

#### 3. Recommended Pool Sizing

```yaml
# For 4 workers - Aggressive sizing
database:
  connectionLimit: 10  # 4 × 10 = 40 connections

# For 4 workers - Conservative sizing  
database:
  connectionLimit: 5   # 4 × 5 = 20 connections

# For production with auto-scaling
database:
  connectionLimit: 3   # Allows more worker scaling
```

#### 4. Dynamic Pool Sizing

```typescript
// Scale pool size based on worker count
const connectionLimit = Math.max(2, Math.floor(maxConnections / numWorkers));
```

### Configuration Examples

#### Single Server Deployment
```yaml
# configurations/production.yaml
workers: -1  # Use all CPU cores
database:
  host: "db.production.com"
  connectionLimit: 5  # Conservative for clustering
```

#### Docker Container Deployment
```yaml
# docker-compose.yml
services:
  app:
    environment:
      APP_WORKERS: 2          # 2 workers per container
    deploy:
      replicas: 3             # 3 containers
      resources:
        limits:
          cpus: '2.0'
          memory: 1G

# Total: 3 containers × 2 workers × connectionLimit = 6 × connectionLimit
database:
  connectionLimit: 3  # 6 × 3 = 18 total connections
```

#### Kubernetes Deployment
```yaml
# k8s-deployment.yaml
spec:
  replicas: 5
  containers:
    env:
      - name: APP_WORKERS
        value: "1"  # 1 worker per pod for isolation
      - name: APP_DATABASE__CONNECTIONLIMIT  
        value: "8"  # 5 pods × 1 worker × 8 = 40 connections
```

### Monitoring Connection Usage

#### 1. Database-Level Monitoring

```sql
-- Check current connections
SHOW PROCESSLIST;

-- Check connection limits
SHOW VARIABLES LIKE 'max_connections';

-- Monitor connection usage over time
SELECT * FROM information_schema.PROCESSLIST WHERE COMMAND != 'Sleep';
```

#### 2. Application-Level Monitoring

```typescript
// Add connection pool monitoring
import client from 'prom-client';

const dbConnectionsGauge = new client.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  labelNames: ['worker_id', 'status'], // 'active', 'idle', 'total'
});

// Update metrics periodically
setInterval(() => {
  const workerId = process.pid.toString();
  const pool = db.pool; // Access your connection pool
  
  dbConnectionsGauge.set(
    { worker_id: workerId, status: 'active' }, 
    pool.activeConnections || 0
  );
  dbConnectionsGauge.set(
    { worker_id: workerId, status: 'idle' }, 
    pool.idleConnections || 0
  );
}, 30000);
```

### Common Anti-Patterns to Avoid

#### ❌ Shared Connection Pool
```typescript
// DON'T: Try to share pools between workers
// This won't work - processes can't share objects
```

#### ❌ Over-sized Pools
```typescript
// DON'T: Too many connections per worker
database: {
  connectionLimit: 50  // 4 workers × 50 = 200 connections!
}
```

#### ❌ Single Connection per Worker
```typescript
// DON'T: One connection per worker
database: {
  connectionLimit: 1  // No connection pooling benefits
}
```

### Performance Optimization Tips

#### 1. Connection Reuse
```typescript
// Ensure proper connection lifecycle
try {
  const result = await db.query('SELECT * FROM users');
  // Connection automatically returned to pool
  return result;
} catch (error) {
  // Connection properly cleaned up on error
  throw error;
}
```

#### 2. Query Optimization
```typescript
// Use prepared statements
const getUserById = db.prepare('SELECT * FROM users WHERE id = ?');

// Batch operations when possible
const users = await db.transaction(async (tx) => {
  const user1 = await tx.insert(users).values(userData1);
  const user2 = await tx.insert(users).values(userData2);
  return [user1, user2];
});
```

#### 3. Connection Pool Configuration
```typescript
// Optimize pool settings
const pool = mysql.createPool({
  connectionLimit: 10,
  acquireTimeout: 60000,    // Max time to get connection
  timeout: 60000,           // Query timeout
  reconnect: true,          // Auto-reconnect on disconnect
  idleTimeout: 300000,      // Close idle connections after 5min
});
```

### Scaling Strategies

#### Vertical Scaling (Single Server)
```yaml
workers: -1  # Use all cores
database:
  connectionLimit: 8  # Higher per-worker limit
```

#### Horizontal Scaling (Multiple Servers)
```yaml
workers: 4   # Fixed worker count
database:
  connectionLimit: 3  # Lower per-worker limit
# Deploy across multiple servers/containers
```

#### Auto-Scaling (Cloud/K8s)
```yaml
workers: 1   # One worker per pod
database:
  connectionLimit: 10  # Higher per-worker, fewer pods
# Let orchestrator handle pod scaling
```

### Troubleshooting Connection Issues

#### 1. Too Many Connections Error
```sql
-- Check current connection count
SELECT COUNT(*) FROM information_schema.PROCESSLIST;

-- Increase MySQL max_connections
SET GLOBAL max_connections = 300;
```

#### 2. Connection Pool Exhaustion
```typescript
// Add connection pool monitoring
db.pool.on('connection', (connection) => {
  console.log('New connection established');
});

db.pool.on('error', (err) => {
  console.error('Database connection error:', err);
});
```

#### 3. Slow Queries Blocking Pool
```sql
-- Find long-running queries
SELECT * FROM information_schema.PROCESSLIST 
WHERE TIME > 30 
ORDER BY TIME DESC;
```

### Conclusion

**Key Takeaways:**
- ✅ Each worker should have its own connection pool
- ✅ Size pools based on total worker count and DB limits  
- ✅ Monitor connection usage in production
- ✅ Use conservative sizing for auto-scaling scenarios
- ✅ Consider your deployment architecture when sizing pools

**Formula for Success:**
```
Total DB Connections = Instances × Workers × ConnectionLimit
Keep this under 80% of your database's max_connections
```