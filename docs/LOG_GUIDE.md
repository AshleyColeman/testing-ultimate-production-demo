# 📊 Log Files Guide

## Overview

This system generates **three different log files** to provide comprehensive tracking of test execution, errors, and infrastructure operations.

## Log Files

### 1. **`logs/combined.log`** - JSON Format (Machine-Readable)

**Purpose**: Structured logging for parsing and analysis

**Format**: JSON with Winston format

**Content**:

- All infrastructure operations
- Container creation and teardown
- Schema operations
- Test execution flow
- Timestamps with metadata

**When to use**:

- Parsing logs programmatically
- Integrating with log aggregation tools
- Automated analysis
- Performance metrics extraction

**Example**:

```json
{
  "level": "info",
  "message": "Container 1 (auth) ready",
  "service": "TestInfrastructure",
  "timestamp": "2025-10-28T10:39:15.123Z"
}
```

---

### 2. **`logs/demo.log`** - Human-Readable Format

**Purpose**: Easy-to-read log for humans

**Format**: Timestamped text with color indicators

**Content**:

- Infrastructure initialization
- Container status updates
- Schema creation progress
- Test execution milestones
- Cleanup operations

**When to use**:

- Debugging issues manually
- Understanding execution flow
- Reviewing what happened
- Sharing logs with team

**Example**:

```
2025-10-28 12:39:15 ℹ️ 🏗️ Initializing shared test infrastructure...
2025-10-28 12:39:15 ℹ️ 📦 Creating container infrastructure...
2025-10-28 12:39:25 ℹ️ ✅ Container 1 (auth) ready
2025-10-28 12:39:25 ℹ️ ✅ Container 2 (payment) ready
2025-10-28 12:39:26 ℹ️ 🗄️ Creating schema infrastructure...
2025-10-28 12:39:26 ℹ️ ✅ Infrastructure ready: 5 containers, 20 schemas
```

---

### 3. **`logs/error.log`** - Error Report (Human-Readable)

**Purpose**: Detailed failure tracking and debugging

**Format**: Structured text with sections and borders

**Content**:

- Test failure report header
- Individual failure details (one section per failed file)
- Error messages
- Full stack traces
- Summary with metrics
- List of all failed files

**When to use**:

- Investigating test failures
- Debugging broken tests
- Understanding what went wrong
- Creating bug reports

**Structure**:

```
╔════════════════════════════════════════════════════════════════
║  TEST FAILURE REPORT
║  Generated: 2025-10-28T10:39:17.849Z
╚════════════════════════════════════════════════════════════════

[Individual failure sections...]

╔════════════════════════════════════════════════════════════════
║  SUMMARY
╚════════════════════════════════════════════════════════════════

[Metrics and failed files list...]
```

---

## Log Metrics Explained

### Console Output During Test Run

When tests run, you see:

```
📊 Execution Summary:
   • Test Files Loaded: 53
   • Test Files Passed: 52
   • Test Files Failed: 1
   • Total Tests Executed: 520
   • Tests Passed: 520
   • Tests Failed to Load: 10
   • Execution Time: 1.26s
```

### What Each Metric Means

| Metric                   | Meaning                                  | Example |
| ------------------------ | ---------------------------------------- | ------- |
| **Test Files Loaded**    | Total `.test.ts` files found             | 53      |
| **Test Files Passed**    | Files that loaded successfully           | 52      |
| **Test Files Failed**    | Files that failed to import              | 1       |
| **Total Tests Executed** | Actual tests that ran                    | 520     |
| **Tests Passed**         | Tests that completed successfully        | 520     |
| **Tests Failed to Load** | Tests from failed files (never executed) | 10      |
| **Total Expected**       | Files × 10 tests per file                | 530     |

### The Math

```
✅ Test Files Passed: 52 × 10 tests = 520 tests executed
❌ Test Files Failed: 1 × 10 tests = 10 tests couldn't run
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total:           53 files         530 tests total
```

**Important**: When a file fails to import, its tests never execute. That's why we distinguish between:

- **Tests Executed** (actually ran)
- **Tests Failed to Load** (never ran due to import failure)

---

## Error Log Details

### Header Section

```
╔════════════════════════════════════════════════════════════════
║  TEST FAILURE REPORT
║  Generated: 2025-10-28T10:39:17.849Z
╚════════════════════════════════════════════════════════════════
```

Shows when the report was generated (UTC timezone).

### Individual Failure Section

```
════════════════════════════════════════════════════════════════
❌ FAILURE: broken-test-demo
⏰ Time: 2025-10-28T10:39:17.849Z
📝 Error: INTENTIONAL FAILURE: This test file is designed to fail...
📚 Stack Trace:
Error: INTENTIONAL FAILURE: This test file is designed to fail...
    at C:\Users\Ashley\...\broken-test-demo.test.ts:14:7
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at VitestExecutor.runModule (...)
    [full stack trace continues...]
════════════════════════════════════════════════════════════════
```

**Each failure includes**:

- ❌ File name
- ⏰ Exact timestamp
- 📝 Error message
- 📚 Complete stack trace

### Summary Section

```
╔════════════════════════════════════════════════════════════════
║  SUMMARY
╚════════════════════════════════════════════════════════════════

Total Test Files: 53
Test Files Passed: 52
Test Files Failed: 1
Tests Executed Successfully: 520
Tests Passed: 520
Tests Failed to Load: 10
Total Expected Tests: 530
Execution Time: 1.26s

Failed Files:
  1. broken-test-demo (10 tests) - INTENTIONAL FAILURE...
```

**Summary provides**:

- Complete metrics
- Execution time
- List of all failed files with test count
- Quick overview of health

---

## Viewing Logs

### Windows (PowerShell)

```powershell
# View human-readable demo log
Get-Content logs/demo.log -Tail 50

# View error log (UTF-8 encoding important!)
Get-Content logs/error.log -Encoding UTF8

# View JSON log
Get-Content logs/combined.log -Tail 20

# Search for errors
Select-String -Path logs/demo.log -Pattern "error|failed|❌"

# Watch log in real-time
Get-Content logs/demo.log -Wait
```

### Linux/Mac (Bash)

```bash
# View human-readable demo log
tail -50 logs/demo.log

# View error log
cat logs/error.log

# View JSON log
tail -20 logs/combined.log

# Search for errors
grep -i "error\|failed" logs/demo.log

# Watch log in real-time
tail -f logs/demo.log
```

---

## Log Locations

All logs are in the `logs/` directory:

```
logs/
├── combined.log      # JSON format (machine-readable)
├── demo.log          # Human format (easy to read)
└── error.log         # Error report (failures only)
```

---

## Log Rotation

**Current behavior**: Logs are **overwritten** on each test run.

**Future enhancement options**:

- Keep last N runs
- Timestamp-based naming (e.g., `error-2025-10-28-10-39.log`)
- Size-based rotation
- Compression of old logs

---

## Integration Examples

### CI/CD Pipeline

```bash
# Run tests
npm run test

# Check if error log has content
if [ -s logs/error.log ]; then
  echo "Tests failed! See error.log"
  cat logs/error.log
  exit 1
fi

# Upload logs as artifacts
cp logs/*.log $ARTIFACTS_DIR/
```

### Monitoring Tools

```javascript
// Parse JSON logs
const fs = require("fs");
const logs = fs
  .readFileSync("logs/combined.log", "utf8")
  .split("\n")
  .filter((line) => line)
  .map((line) => JSON.parse(line));

// Analyze metrics
const errors = logs.filter((log) => log.level === "error");
const duration = logs[logs.length - 1].timestamp - logs[0].timestamp;
```

### Slack Notifications

```bash
# Send error summary to Slack
if [ -f logs/error.log ]; then
  ERROR_COUNT=$(grep -c "FAILURE:" logs/error.log)
  curl -X POST $SLACK_WEBHOOK \
    -d "{\"text\": \"⚠️ $ERROR_COUNT test file(s) failed!\"}"
fi
```

---

## Best Practices

### ✅ DO

- **Check error.log after every test run**
- **Keep logs for debugging sessions**
- **Use UTF-8 encoding when reading**
- **Archive logs for important runs**
- **Share error.log when reporting bugs**

### ❌ DON'T

- **Don't commit logs to git** (in `.gitignore`)
- **Don't ignore error.log warnings**
- **Don't assume no console error = no failures**
- **Don't delete logs before reviewing them**

---

## Troubleshooting

### Log file not created?

```bash
# Ensure logs directory exists
mkdir -p logs

# Check permissions
ls -la logs/
```

### Can't read error.log (encoding issues)?

```powershell
# Use UTF-8 encoding
Get-Content logs/error.log -Encoding UTF8
```

### Logs too large?

```bash
# View last 100 lines only
tail -100 logs/demo.log

# Search for specific patterns
grep "Container" logs/demo.log
```

### Want to keep history?

```bash
# Backup before running
cp logs/error.log logs/error-backup-$(date +%Y%m%d-%H%M%S).log
npm run test
```

---

## Summary

This system provides **three levels of logging**:

1. **combined.log** - Machine-readable JSON for automation
2. **demo.log** - Human-readable flow for debugging
3. **error.log** - Detailed failure reports for investigation

All metrics are **accurate and add up correctly**:

- 52 passing files × 10 = 520 executed tests
- 1 failing file × 10 = 10 tests failed to load
- **Total: 530 tests** ✅

**The logs tell you exactly what happened, when it happened, and why it failed!** 📊
