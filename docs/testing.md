# Testing Guide

This project uses Node.js built-in test runner with TypeScript support via `tsx`.

## Running Tests

### Run All Tests
```bash
npm test
```

This command runs all test files recursively in the project using the pattern `**/*.test.ts`.

### Run Specific Test File
```bash
npm test ./tests/routes/health.test.ts
```

### Run Tests with Specific Pattern
```bash
# Run all route tests
npm test ./tests/routes/

# Run tests matching a pattern
npm test "./tests/**/*health*"
```

## Test Runner Options

### Watch Mode
```bash
npm test -- --watch
```
Automatically re-runs tests when files change.

### Parallel Execution
```bash
npm test -- --concurrency=4
```
Run tests in parallel with specified concurrency.

### Skip Tests
```bash
npm test -- --skip-pattern="**/slow.test.ts"
```

### Test Filtering
```bash
# Run only tests matching a pattern
npm test -- --grep="Health endpoint"

# Skip tests matching a pattern  
npm test -- --grep="slow" --invert
```

### Verbose Output
```bash
npm test -- --reporter=verbose
```

### Test Coverage
```bash
# Run tests with coverage
npm test -- --coverage

# Generate coverage report
npm test -- --coverage --coverage-reporter=html
```

## Test Structure

Tests are located in the `tests/` directory and follow this structure:
```
tests/
├── routes/
│   └── health.test.ts
└── utils/
    └── (future test files)
```

## Writing Tests

### Basic Test Structure
```typescript
import { test } from 'node:test';
import assert from 'node:assert';

test('should do something', async () => {
  // Arrange
  const expected = true;
  
  // Act  
  const actual = true;
  
  // Assert
  assert.strictEqual(actual, expected);
});
```

### Test Hooks
```typescript
import { test, before, after, beforeEach, afterEach } from 'node:test';

before(async () => {
  // Setup before all tests
});

after(async () => {
  // Cleanup after all tests
});

beforeEach(async () => {
  // Setup before each test
});

afterEach(async () => {
  // Cleanup after each test
});
```

### Skipping Tests
```typescript
import { test } from 'node:test';

// Skip a test
test.skip('this test is skipped', () => {
  // This won't run
});

// Skip conditionally
test('conditional test', { skip: process.env.NODE_ENV === 'production' }, () => {
  // Only runs in non-production
});
```

### Test Timeouts
```typescript
import { test } from 'node:test';

test('slow test', { timeout: 5000 }, async () => {
  // Test with 5 second timeout
});
```

## API Testing

For testing Express endpoints, use the pattern from `health.test.ts`:

```typescript
import assert from 'node:assert';
import { test } from 'node:test';
import buildConfig from '../../src/configurations.js';
import createDbPool from '../../src/db/index.js';
import createServer from '../../src/server.js';

test('API endpoint test', async () => {
  const config = buildConfig();
  const db = await createDbPool(config);
  const app = createServer(config, db);

  const server = app.listen(config.port, async () => {
    try {
      const response = await fetch(`http://localhost:${config.port}/your-endpoint`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      // Add your assertions here

      server.close();
    } catch (error) {
      server.close();
      throw error;
    }
  });
});
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Isolation**: Each test should be independent and not rely on other tests
3. **Cleanup**: Always clean up resources (close servers, database connections, etc.)
4. **Assertions**: Use appropriate assertion methods (`strictEqual`, `deepStrictEqual`, etc.)
5. **Error Handling**: Properly handle and test error conditions
6. **Async/Await**: Use async/await for asynchronous operations

## Common Commands Summary

```bash
# Basic commands
npm test                              # Run all tests
npm test ./path/to/test.ts           # Run specific test file
npm test -- --watch                 # Watch mode
npm test -- --coverage              # With coverage
npm test -- --reporter=verbose      # Verbose output

# Filtering
npm test -- --grep="pattern"        # Run tests matching pattern
npm test -- --grep="pattern" --invert # Skip tests matching pattern

# Performance
npm test -- --concurrency=4         # Parallel execution
npm test -- --timeout=5000          # Set timeout
```

## Debugging Tests

### VS Code Debugging
Add this configuration to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/tsx/dist/cli.mjs",
  "args": ["--test", "${file}"],
  "console": "integratedTerminal"
}
```

### Node.js Inspector
```bash
npm test -- --inspect-brk ./tests/your-test.ts
```
Then open `chrome://inspect` in Chrome.