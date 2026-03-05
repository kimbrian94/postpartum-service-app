# Logging Configuration Guide

## Overview

The Postpartum Service API now implements comprehensive, industry-standard logging using Python's built-in `logging` module.

## Features

- **Structured Logging**: Consistent format with timestamps, module names, log levels, and contextual information
- **Multiple Handlers**: 
  - Console output for development
  - Rotating file handler for general logs (10MB max, 5 backups)
  - Separate error log file for errors only
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Request/Response Tracking**: Automatic logging of all HTTP requests with timing
- **Error Tracking**: Detailed exception logging with stack traces

## Log Files Location

All logs are stored in `apps/api/logs/`:
- `app.log` - General application logs (INFO and above)
- `error.log` - Error logs only (ERROR and above)

## Configuration

### Environment Variable

Set the `LOG_LEVEL` environment variable to control verbosity:

```bash
# In .env file or environment
LOG_LEVEL=DEBUG    # Most verbose (development)
LOG_LEVEL=INFO     # Normal operation (default)
LOG_LEVEL=WARNING  # Only warnings and errors
LOG_LEVEL=ERROR    # Only errors
```

### Default Behavior

- **Console**: Outputs all logs at configured level
- **app.log**: Always logs INFO and above
- **error.log**: Always logs ERROR and above

## Log Format

```
2026-03-02 10:30:45 | app.routes.auth | INFO     | login:45 | Login successful for user: admin@example.com (ID: 1)
[Timestamp]         | [Module]        | [Level]  | [Function:Line] | [Message]
```

## What Gets Logged

### Application Lifecycle
- ✅ Application startup/shutdown
- ✅ Database connections
- ✅ Route initialization

### HTTP Requests
- ✅ All incoming requests (method, path)
- ✅ Response status codes
- ✅ Request processing time
- ✅ Request failures with stack traces

### Authentication
- ✅ Login attempts (success/failure)
- ✅ User registration
- ✅ Token refresh operations
- ✅ Authentication failures

### Client Management
- ✅ Client creation/updates/deletions
- ✅ Client queries (with filter info)
- ✅ Validation errors
- ✅ Database operation failures

### Intake Forms
- ✅ Form submissions
- ✅ Validation errors
- ✅ Processing errors
- ✅ Successful client creation

## Usage in Code

```python
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Log levels
logger.debug("Detailed debug information")
logger.info("General informational message")
logger.warning("Warning message")
logger.error("Error occurred")
logger.critical("Critical failure")

# Log with exception info
try:
    risky_operation()
except Exception as e:
    logger.error(f"Operation failed: {str(e)}", exc_info=True)
```

## Log Rotation

Files automatically rotate when they reach 10MB, keeping 5 backup copies:
- `app.log` (current)
- `app.log.1` (most recent backup)
- `app.log.2`
- ...
- `app.log.5` (oldest backup)

## Best Practices

1. **Use appropriate log levels**:
   - DEBUG: Detailed diagnostic info
   - INFO: Confirm things are working as expected
   - WARNING: Something unexpected happened
   - ERROR: Software has not been able to perform function
   - CRITICAL: Program may be unable to continue

2. **Include context**: Log user IDs, client IDs, relevant identifiers

3. **Avoid logging sensitive data**: Never log passwords, tokens, or personal data

4. **Use structured messages**: Include consistent formatting for easier parsing

## Monitoring in Production

1. Monitor `error.log` for application issues
2. Set up log aggregation (e.g., ELK Stack, Splunk)
3. Configure alerts for ERROR and CRITICAL level logs
4. Regularly review INFO logs for unusual patterns

## Example Log Output

```
2026-03-02 10:30:42 | app.main | INFO     | startup_event:65 | Application starting up
2026-03-02 10:30:45 | app.main | INFO     | log_requests:28 | Incoming request: POST /api/auth/login
2026-03-02 10:30:45 | app.routes.auth | INFO     | login:45 | Login attempt for email: admin@example.com
2026-03-02 10:30:45 | app.routes.auth | INFO     | login:61 | Login successful for user: admin@example.com (ID: 1)
2026-03-02 10:30:45 | app.main | INFO     | log_requests:33 | Request completed: POST /api/auth/login | Status: 200 | Duration: 0.124s
2026-03-02 10:30:48 | app.main | INFO     | log_requests:28 | Incoming request: GET /api/clients
2026-03-02 10:30:48 | app.routes.clients | INFO     | get_clients:47 | Retrieved 25 clients | Filters: status=None, search=None | User: admin@example.com
2026-03-02 10:30:48 | app.main | INFO     | log_requests:33 | Request completed: GET /api/clients | Status: 200 | Duration: 0.056s
```
