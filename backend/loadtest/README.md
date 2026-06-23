# School ERP Backend - Load & Stress Testing

k6-based load test scripts for the School ERP API.

## Prerequisites

Install [k6](https://k6.io/docs/getting-started/installation/):
```bash
# Windows (Chocolatey)
choco install k6
# macOS
brew install k6
# Linux
sudo apt-get install k6
```

## Available Tests

### Smoke Test (`k6-smoke.js`)
Ramps from 0 to 100 concurrent users over 4.5 minutes.
Validates: health, API index, login flow, authenticated analytics endpoint.

```bash
k6 run loadtest/k6-smoke.js
```

### Custom base URL
```bash
k6 run --env BASE_URL=https://staging.schoolapp.com loadtest/k6-smoke.js
```

## Thresholds

| Metric | Target | Meaning |
|---|---|---|
| `http_req_duration` p(95) | < 500ms | 95% of requests respond in under 500ms |
| `http_req_failed` | < 1% | Less than 1% of requests should fail |
| `errors` | < 5% | Application-level error rate under 5% |

## Reports

The smoke test exports `loadtest/summary.json` with detailed metrics.

## Performance Hardening Applied (Phase 12)

- ✅ `helmet` — security headers
- ✅ `compression` — gzip responses
- ✅ `express-rate-limit` — 1000 req / 15min global, 20 login attempts / 10min
- ✅ Prisma indexes on all FKs and frequently queried columns
- ✅ 2 MB JSON body limit to prevent memory abuse
- ✅ JSON-stringified config for CustomReport to keep payloads small
- ✅ Parallel aggregations in analytics endpoint
