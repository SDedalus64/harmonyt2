# HarmonyTi Backend Configuration Requirements

## Overview

This document outlines the backend infrastructure and API requirements needed to support the HarmonyTi mobile application for production deployment.

## 1. Authentication & User Management

### 1.1 Registration Endpoint

- **Endpoint**: `POST /api/auth/register`
- **Payload**:
  ```json
  {
    "email": "string",
    "password": "string",
    "name": "string",
    "companyName": "string",
    "receiveUpdates": boolean
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "companyName": "string"
    },
    "token": "string",
    "refreshToken": "string"
  }
  ```
- **Requirements**:
  - Password hashing (bcrypt or similar)
  - Email validation and uniqueness check
  - JWT token generation
  - Automatic HubSpot contact creation (see section 2)

### 1.2 Login Endpoint

- **Endpoint**: `POST /api/auth/login`
- **Payload**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: Same as registration

### 1.3 Token Management

- **Refresh Token**: `POST /api/auth/refresh`
- **Verify Token**: `GET /api/auth/verify`
- **Logout**: `POST /api/auth/logout`
- Token expiration: 24 hours (configurable)
- Refresh token expiration: 30 days

### 1.4 Password Reset

- **Request Reset**: `POST /api/auth/forgot-password`
- **Reset Password**: `POST /api/auth/reset-password`

## 2. HubSpot Integration

### 2.1 Contact Creation

- **Trigger**: On successful registration
- **HubSpot Properties to Map**:
  ```
  - email → Email
  - name → First Name + Last Name
  - companyName → Company
  - receiveUpdates → Marketing Email Opt-in
  - registrationDate → Custom property
  - appVersion → Custom property
  - platform → Custom property (iOS/Android)
  ```

### 2.2 Activity Tracking

- **Events to Track**:
  - User registration
  - Login frequency
  - Tariff lookups performed
  - History items saved
  - Report downloads
  - Guide access

### 2.3 Marketing Preferences

- **Endpoint**: `PUT /api/user/preferences`
- Sync preference changes with HubSpot contact properties
- Handle unsubscribe requests

## 3. Session Report & Guides CTA

### 3.1 Session Report Generation

- **Endpoint**: `POST /api/reports/session`
- **Payload**:
  ```json
  {
    "userId": "string",
    "sessionData": {
      "lookups": [
        {
          "htsCode": "string",
          "country": "string",
          "date": "timestamp",
          "results": {}
        }
      ],
      "duration": "number",
      "savedItems": "number"
    }
  }
  ```
- **Response**:
  ```json
  {
    "reportUrl": "string",
    "expiresAt": "timestamp"
  }
  ```

### 3.2 Commodity-Specific Guides

- **Endpoint**: `GET /api/guides/commodity/{htsCode}`
- **Response**:
  ```json
  {
    "guides": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "commodityGroup": "string",
        "url": "string",
        "thumbnailUrl": "string"
      }
    ]
  }
  ```

### 3.3 Email Report Delivery

- **Endpoint**: `POST /api/reports/email`
- **Features**:
  - Generate PDF report of session activity
  - Include relevant commodity guides
  - Send via email with HubSpot tracking
  - Store in user's report history

## 4. Core API Endpoints

### 4.1 Tariff Data

- **Search**: `GET /api/tariffs/search?hts={code}&country={code}`
- **Details**: `GET /api/tariffs/{htsCode}`
- **Updates**: WebSocket or SSE for real-time tariff changes

### 4.2 User History

- **Save**: `POST /api/history`
- **List**: `GET /api/history?limit=50&offset=0`
- **Delete**: `DELETE /api/history/{id}`
- **Sync**: `POST /api/history/sync` (for offline support)

### 4.3 User Profile

- **Get**: `GET /api/user/profile`
- **Update**: `PUT /api/user/profile`
- **Delete**: `DELETE /api/user/account` (GDPR compliance)

## 5. Future Feature Stubs

### 5.1 Notifications

- **Endpoint**: `POST /api/notifications/subscribe`
- **Types**:
  - Tariff changes for saved items
  - New guides available
  - System announcements
  - Marketing messages (if opted in)

### 5.2 Analytics Dashboard

- **Endpoint**: `GET /api/analytics/user`
- **Metrics**:
  - Most searched commodities
  - Frequently used countries
  - Cost savings calculations
  - Usage trends

### 5.3 Team/Enterprise Features

- **Team Management**: `GET/POST/PUT /api/teams`
- **Shared History**: `GET /api/teams/{teamId}/history`
- **Role-Based Access**: Admin, Member, Viewer
- **Usage Reports**: `GET /api/teams/{teamId}/reports`

### 5.4 AI-Powered Features

- **Classification Assistant**: `POST /api/ai/classify`
- **Duty Calculator**: `POST /api/ai/calculate-duty`
- **Compliance Checker**: `POST /api/ai/compliance-check`

### 5.5 Integration APIs

- **Webhook Management**: `GET/POST/DELETE /api/webhooks`
- **API Keys**: `GET/POST/DELETE /api/keys`
- **Third-party Integrations**:
  - ERP systems
  - Customs brokers
  - Shipping platforms

## 6. Infrastructure Requirements

### 6.1 Security

- HTTPS/TLS 1.3 minimum
- API rate limiting (100 requests/minute per user)
- DDoS protection
- Input validation and sanitization
- SQL injection prevention
- CORS configuration for mobile apps

### 6.2 Performance

- Response time: <200ms for searches
- CDN for static assets and guides
- Database indexing on HTS codes
- Caching layer (Redis) for frequent queries
- Load balancing for high availability

### 6.3 Monitoring & Logging

- Application performance monitoring (APM)
- Error tracking (Sentry or similar)
- API usage analytics
- User behavior tracking
- Security audit logs

### 6.4 Compliance

- GDPR data handling
- CCPA compliance
- Data retention policies
- Right to deletion
- Data export capabilities

## 7. Development & Testing

### 7.1 Environments

- Development: `api-dev.harmonytariff.com`
- Staging: `api-staging.harmonytariff.com`
- Production: `api.harmonytariff.com`

### 7.2 API Documentation

- OpenAPI/Swagger specification
- Interactive API explorer
- Code examples for mobile integration
- Webhook payload examples

### 7.3 Testing Requirements

- Unit tests for all endpoints
- Integration tests with HubSpot
- Load testing for concurrent users
- Security penetration testing

## 8. Data Management

### 8.1 Backup Strategy

- Daily automated backups
- Point-in-time recovery
- Geographic redundancy
- Backup testing procedures

### 8.2 Data Migration

- Import existing user data
- Tariff data updates
- Historical lookup preservation

## 9. Support & Maintenance

### 9.1 Error Handling

- Standardized error response format
- User-friendly error messages
- Error code documentation
- Fallback mechanisms

### 9.2 Versioning

- API versioning strategy (v1, v2, etc.)
- Deprecation notices
- Backward compatibility
- Migration guides

## 10. Analytics & Reporting

### 10.1 Business Intelligence

- User acquisition metrics
- Feature usage statistics
- Revenue tracking (for premium features)
- Conversion funnel analysis

### 10.2 Custom Reports

- Admin dashboard
- Usage reports for enterprise clients
- HubSpot integration metrics
- API performance metrics

## 11. Tariff Data Management (CRITICAL)

### 11.1 Current Process (Manual - Needs Automation)

The app uses segmented JSON files for efficient tariff searches. Currently, updating tariff data is a **manual multi-step process** that must be automated:

**Current Manual Steps:**

1. Update CSV file: `scripts/tariff_database_2025.csv`
2. Run Python script: `python3 scripts/preprocess_tariff_data.py [input.csv] src/data/tariff_processed.json`
3. Run segmentation: `node scripts/segment-tariff-data.js`
4. Verify segments: `node scripts/verify-segments.js`
5. Deploy updated files

**Temporary Solution:** Created `scripts/update-tariff-data.sh` to automate these steps locally.

### 11.2 Required Backend Implementation

- **Endpoint**: `POST /api/admin/tariff-data/update`
- **Authentication**: Admin-only access
- **Process**:
  ```
  1. Upload new CSV file
  2. Validate CSV format
  3. Process CSV → JSON (Python preprocessing)
  4. Generate segmented files
  5. Validate all segments
  6. Deploy to CDN
  7. Notify mobile apps of update
  ```

### 11.3 Automated Update Pipeline

- **Scheduled Updates**: Weekly checks for USITC data changes
- **Data Source Integration**: Direct API connection to USITC database
- **Change Detection**: Only process if source data has changed
- **Rollback Capability**: Keep last 3 versions for quick rollback

### 11.4 Mobile App Integration

- **Endpoint**: `GET /api/tariffs/version`
- **Response**:
  ```json
  {
    "current_version": "2025.06.03",
    "last_updated": "2025-06-03T00:00:00Z",
    "update_available": true,
    "update_url": "https://cdn.harmonytariff.com/data/v2025.06.03/"
  }
  ```
- **Update Process**:
  1. Check version on app launch
  2. Download updated segments in background
  3. Switch to new data after verification
  4. Clean up old data

### 11.5 AI Integration for Tariff Updates

- **Classification Changes**: AI to detect and notify about HTS reclassifications
- **Rate Change Alerts**: Automatic detection of duty rate changes
- **Impact Analysis**: AI to analyze how changes affect saved user lookups
- **Natural Language Updates**: Generate human-readable summaries of changes

### 11.6 Data Structure

**Main File**: `tariff_processed.json` (49MB)

- Contains all tariff entries with rates, descriptions, and special provisions

**Segmented Files**: `tariff-segments/`

- Single-digit segments: `tariff-0x.json` through `tariff-9x.json`
- Two-digit segments for large chapters: `tariff-84.json`, `tariff-85.json`, etc.
- Index file: `segment-index.json`

### 11.7 Critical Implementation Notes

⚠️ **WARNING**: The segmented files MUST be regenerated whenever tariff data is updated. Failure to do so will result in:

- Search returning outdated results
- Inconsistency between lookup and search
- User confusion and potential compliance issues

**Priority**: This should be implemented in Phase 1 as it's critical for app functionality and legal compliance.

## Implementation Priority

1. **Phase 1 (MVP)**: Authentication, Registration, HubSpot integration, Basic tariff API, **Tariff data automation**
2. **Phase 2**: Session reports, Guides, History sync
3. **Phase 3**: Team features, Analytics dashboard
4. **Phase 4**: AI features, Advanced integrations

## Notes for Development Team

- All timestamps should be in ISO 8601 format
- Use consistent error codes across all endpoints
- Implement request ID tracking for debugging
- Consider implementing GraphQL for flexible data queries
- Plan for offline-first mobile experience with sync capabilities
