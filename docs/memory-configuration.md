# Node.js Memory Configuration Guide

## 📊 Understanding Node.js Memory Usage

Node.js doesn't have a "1GB default memory limit" - it uses **dynamic heap sizing** that grows based on your application's needs. However, you can configure memory limits for performance optimization and to prevent out-of-memory errors.

### Memory Components

```
Total Node.js Memory Usage
├── Heap Memory (V8)           # JavaScript objects, closures, etc.
│   ├── heapUsed              # Currently allocated objects
│   └── heapTotal             # Total heap size
├── RSS (Resident Set Size)    # Total memory in RAM
├── External Memory           # C++ objects, buffers
└── Stack Memory              # Function call stack
```

## 🔧 Configuring Memory Limits

### Command Line Options

**Set maximum heap size:**
```bash
# 4GB heap limit
node --max-old-space-size=4096 dist/index.js

# 8GB heap limit  
node --max-old-space-size=8192 dist/index.js

# 16GB heap limit
node --max-old-space-size=16384 dist/index.js
```

**Other useful memory flags:**
```bash
# Expose garbage collection metrics
node --expose-gc --max-old-space-size=4096 dist/index.js

# Optimize for memory over performance
node --optimize-for-size --max-old-space-size=4096 dist/index.js

# Enable heap profiling
node --inspect --max-old-space-size=4096 dist/index.js
```

### Package.json Configuration

```json
{
  "scripts": {
    "start": "node --max-old-space-size=8192 dist/index.js",
    "start:high-memory": "node --max-old-space-size=16384 dist/index.js",
    "dev": "tsx watch --max-old-space-size=4096 src/index.ts",
    "dev:memory-debug": "tsx watch --expose-gc --max-old-space-size=4096 src/index.ts"
  }
}
```

## 🐳 Docker Memory Configuration

### Dockerfile
```dockerfile
# Production image with memory configuration
FROM node:22-bookworm-slim

# Set memory limit via CMD
CMD ["node", "--max-old-space-size=4096", "dist/index.js"]

# Or via environment variable approach
ENV NODE_OPTIONS="--max-old-space-size=4096"
CMD ["node", "dist/index.js"]
```

### Docker Compose
```yaml
services:
  app:
    image: your-app
    command: ["node", "--max-old-space-size=4096", "dist/index.js"]
    deploy:
      resources:
        limits:
          memory: 5G    # Container limit should be higher than Node heap
          cpus: '4.0'
        reservations:
          memory: 2G
    environment:
      # Alternative: Use NODE_OPTIONS environment variable
      - NODE_OPTIONS=--max-old-space-size=4096
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        image: your-app
        env:
        - name: NODE_OPTIONS
          value: "--max-old-space-size=6144"  # 6GB
        resources:
          limits:
            memory: "7Gi"     # Container limit higher than Node heap
            cpu: "2000m"
          requests:
            memory: "4Gi"
            cpu: "1000m"
```

## ⚙️ Memory Sizing Guidelines

### Sizing Formula

```typescript
// General formula for memory allocation
const systemRAM = 16; // GB
const reservedForOS = 2; // GB  
const otherProcesses = 2; // GB (DB, monitoring, etc.)
const availableForNode = systemRAM - reservedForOS - otherProcesses;

// For clustering
const workersCount = 4;
const memoryPerWorker = Math.floor(availableForNode / workersCount);
// Result: (16 - 2 - 2) / 4 = 3GB per worker
```

### Recommended Settings by System Size

#### Small Server (4GB RAM)
```bash
# Single process
node --max-old-space-size=2048 dist/index.js  # 2GB

# With clustering (2 workers)
node --max-old-space-size=1024 dist/index.js  # 1GB per worker
```

#### Medium Server (16GB RAM)
```bash
# Single process
node --max-old-space-size=8192 dist/index.js  # 8GB

# With clustering (4 workers)  
node --max-old-space-size=3072 dist/index.js  # 3GB per worker
```

#### Large Server (64GB RAM)
```bash
# Single process
node --max-old-space-size=32768 dist/index.js  # 32GB

# With clustering (8 workers)
node --max-old-space-size=6144 dist/index.js   # 6GB per worker
```

### Application-Specific Guidelines

#### Express API Server
```bash
# Typical API with database queries
node --max-old-space-size=2048 dist/index.js   # 2GB usually sufficient
```

#### Data Processing Application
```bash
# Large JSON processing, file uploads
node --max-old-space-size=8192 dist/index.js   # 8GB for heavy data work
```

#### Real-time Applications
```bash
# WebSocket servers, caching layers
node --max-old-space-size=4096 dist/index.js   # 4GB for connection state
```

## 📊 Memory Monitoring

### Built-in Memory Monitoring

Add this to your application for runtime monitoring:

```typescript
// src/utils/memory-monitor.util.ts
import logger from '../logger.js';

export const logMemoryUsage = () => {
  const usage = process.memoryUsage();
  const formatMB = (bytes: number) => Math.round(bytes / 1024 / 1024);
  
  logger.info('Memory Usage', {
    rss: `${formatMB(usage.rss)} MB`,           // Total memory in RAM
    heapTotal: `${formatMB(usage.heapTotal)} MB`, // Total heap allocated
    heapUsed: `${formatMB(usage.heapUsed)} MB`,   // Heap currently used
    external: `${formatMB(usage.external)} MB`,   // C++ objects memory
    uptime: `${Math.round(process.uptime())} seconds`
  });
};

// Monitor every 30 seconds in development
if (process.env.NODE_ENV !== 'production') {
  setInterval(logMemoryUsage, 30000);
}

// Monitor every 5 minutes in production
if (process.env.NODE_ENV === 'production') {
  setInterval(logMemoryUsage, 300000);
}
```

### Prometheus Memory Metrics

```typescript
// src/utils/metrics/memory-metrics.util.ts
import client from 'prom-client';

const memoryGauge = new client.Gauge({
  name: 'nodejs_memory_usage_bytes',
  help: 'Node.js memory usage by type',
  labelNames: ['worker_id', 'type'], // 'rss', 'heapTotal', 'heapUsed', 'external'
});

const memoryGCGauge = new client.Gauge({
  name: 'nodejs_gc_duration_seconds',
  help: 'Time spent in garbage collection',
  labelNames: ['worker_id', 'gc_type'],
});

export const updateMemoryMetrics = () => {
  const workerId = process.pid.toString();
  const usage = process.memoryUsage();
  
  memoryGauge.set({ worker_id: workerId, type: 'rss' }, usage.rss);
  memoryGauge.set({ worker_id: workerId, type: 'heapTotal' }, usage.heapTotal);
  memoryGauge.set({ worker_id: workerId, type: 'heapUsed' }, usage.heapUsed);
  memoryGauge.set({ worker_id: workerId, type: 'external' }, usage.external);
};

// Update metrics every minute
setInterval(updateMemoryMetrics, 60000);
```

### Memory Leak Detection

```typescript
// src/utils/memory-leak-detector.util.ts
import logger from '../logger.js';

let lastHeapUsed = 0;
let growthCount = 0;

export const detectMemoryLeaks = () => {
  const usage = process.memoryUsage();
  const currentHeap = usage.heapUsed;
  const growthMB = Math.round((currentHeap - lastHeapUsed) / 1024 / 1024);
  
  if (growthMB > 10) { // More than 10MB growth
    growthCount++;
    logger.warn('Memory growth detected', {
      growthMB,
      currentHeapMB: Math.round(currentHeap / 1024 / 1024),
      consecutiveGrowths: growthCount
    });
    
    if (growthCount > 5) {
      logger.error('Potential memory leak detected', {
        consecutiveGrowths: growthCount,
        totalHeapMB: Math.round(currentHeap / 1024 / 1024)
      });
    }
  } else {
    growthCount = 0; // Reset counter on stable/decreasing memory
  }
  
  lastHeapUsed = currentHeap;
};

// Check for memory leaks every 2 minutes
setInterval(detectMemoryLeaks, 120000);
```

## 🚨 Warning Signs & Troubleshooting

### Common Memory Issues

#### Out of Memory (OOM) Errors
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**
1. Increase `--max-old-space-size`
2. Optimize memory usage in code
3. Implement streaming for large data processing

#### Memory Leaks
**Symptoms:**
- Continuously growing heap usage
- Slow performance over time
- Eventually hits memory limit

**Debug with:**
```bash
# Enable heap profiling
node --inspect --max-old-space-size=4096 dist/index.js

# Generate heap snapshots
node --heap-prof --max-old-space-size=4096 dist/index.js
```

#### Excessive Garbage Collection
**Symptoms:**
- High CPU usage
- Request latency spikes
- Frequent GC pauses

**Debug with:**
```bash
# Log GC activity
node --trace-gc --max-old-space-size=4096 dist/index.js

# Optimize GC settings
node --optimize-for-size --max-old-space-size=4096 dist/index.js
```

### Performance vs Memory Trade-offs

#### High Memory, Low CPU
```bash
# Allocate generous memory, optimize for performance  
node --max-old-space-size=8192 dist/index.js
```

#### Low Memory, Higher CPU
```bash
# Smaller heap, more frequent GC
node --optimize-for-size --max-old-space-size=1024 dist/index.js
```

## 🏗️ Integration with Your Application

### Configuration Schema Update

Add memory configuration to your existing config schema:

```typescript
// src/configurations.ts - Add to existing schema
const configurationSchema = z.object({
  port: z.coerce.number().min(1000),
  tenant: z.string(),
  workers: z.number().default(-1),
  memory: z.object({
    maxHeapSize: z.number().default(2048), // MB
    enableMonitoring: z.boolean().default(false),
    enableLeakDetection: z.boolean().default(true)
  }).optional(),
  database: databaseConfigurationSchema,
  logs: logsConfigurationSchema,
});
```

### Environment Variables
```bash
# Memory configuration via environment
APP_MEMORY__MAXHEAPSIZE=4096
APP_MEMORY__ENABLEMONITORING=true
APP_MEMORY__ENABLELEAKDETECTION=true
```

### Docker Compose Integration
```yaml
services:
  app:
    image: your-app
    environment:
      - APP_WORKERS=4
      - APP_MEMORY__MAXHEAPSIZE=3072    # 3GB per worker
      - NODE_OPTIONS=--max-old-space-size=3072
    deploy:
      resources:
        limits:
          memory: 14G    # 4 workers × 3GB + 2GB overhead
          cpus: '4.0'
```

## 📋 Memory Configuration Checklist

### Development Environment
- [ ] Set reasonable heap size (1-2GB)
- [ ] Enable memory monitoring
- [ ] Use heap profiling for optimization
- [ ] Test with realistic data volumes

### Production Environment  
- [ ] Calculate total memory needs (workers × heap size)
- [ ] Set container limits higher than Node heap
- [ ] Enable production memory monitoring
- [ ] Set up alerts for memory usage
- [ ] Plan for memory growth over time

### Monitoring & Alerts
- [ ] Track heap usage trends
- [ ] Monitor GC performance
- [ ] Set up memory leak detection
- [ ] Alert on approaching memory limits
- [ ] Log memory metrics to observability platform

## 🎯 Best Practices Summary

1. **Size appropriately**: Don't allocate all system RAM to Node.js
2. **Account for clustering**: Multiply by number of workers
3. **Monitor actively**: Track memory usage in production
4. **Plan for growth**: Allow headroom for traffic increases  
5. **Profile regularly**: Use heap profiling to optimize
6. **Set container limits**: Always higher than Node.js heap
7. **Handle OOM gracefully**: Implement proper error handling
8. **Test memory limits**: Verify behavior under memory pressure

**Formula to remember:**
```
Container Memory = (Workers × Node Heap Size) + Overhead (25-50%)
```