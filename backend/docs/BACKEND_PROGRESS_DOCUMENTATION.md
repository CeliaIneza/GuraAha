# GuraAha Backend Engine — Comprehensive Architecture & Progress Documentation
**Project**: GuraAha (Rwanda Verified Real Estate Marketplace)  
**Version**: 1.0.0 (MVP / V1 Production Prototype)  
**Runtime**: Node.js 22 LTS / Express 5 / TypeScript  
**Database**: PostgreSQL 15+ (Raw SQL Repositories & Migrations)  
**API Specification**: OpenAPI 3.0 via `@asteasolutions/zod-to-openapi` & Swagger UI  
**Email & OTP Provider**: Brevo / SMTP (Nodemailer)  
**Payment Gateway**: InTouchPay (Rwanda MTN Mobile Money & Airtel Money)  

---

## 1. Executive Summary & Vision

### 1.1 The Problem
In Rwanda and wider East Africa, real estate transactions are plagued by land fraud, duplicate sales of parcels, unverified intermediaries ("commissionnaires"), and forged title deeds. Buyers routinely lose savings to ghost properties or informal agents who misrepresent parcel boundaries and ownership.

### 1.2 The GuraAha Solution
GuraAha transforms real estate into a high-trust digital ecosystem through:
1. **Verified Blockers (Commissionnaires)**: Local land scouts vetted with National IDs, assigned specific operating sectors/districts, and registered under strict compliance.
2. **UPI Validation (Unique Parcel Identifier)**: Every property listing requires Rwanda’s national land registry UPI number to prevent phantom listings and duplicate registrations.
3. **Admin Verification & Audit**: Two-phase approval pipeline before any property goes live to the public.
4. **Controlled Contact Unlocks**: Buyers inspect curated property listings for free; to access verified owner or blocker contact details, they pay a nominal fee via Mobile Money (InTouchPay).
5. **Blocker Pro Subscriptions**: Vetted blockers subscribe monthly or weekly to list premium properties and receive buyer leads.
6. **Lotto Rewards**: Unlocking contacts rewards buyers with lottery entries for cash/appliance prizes, driving viral organic engagement.

---

## 2. System Architecture & Design Philosophy

GuraAha uses an **Onion (Layered) Architecture** with strict boundaries and zero circular dependencies:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Requests                        │
│          (React Frontend, Mobile Apps, InTouchPay Webhook)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Routing & Middleware                     │
│  - CORS (Credentials, Origin check)                         │
│  - JWT Authentication (Bearer Header)                       │
│  - RBAC Authorization (requireRole, requireFreshRole)       │
│  - Zod Request Validation (Body, Query, Params)             │
│  - Multer File Upload & Security Checks                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Controller Layer                       │
│  - HTTP Status Codes (200, 201, 400, 401, 403, 404, 500)    │
│  - Input Parsing (Express 5 req.params/query coercion)      │
│  - Structured JSON Response formatting                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                         │
│  - Pure Domain & Business Logic                             │
│  - Cross-module coordination (e.g. Payment -> Unlock -> Lotto)│
│  - Security hashes (Argon2id), OTP generation, Emails       │
│  - Transaction Orchestration & State Machines               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Repository Layer                        │
│  - Isolated SQL Queries via pg.Pool                         │
│  - Parameterized Queries ($1, $2) to prevent SQL Injection  │
│  - Pagination (LIMIT / OFFSET / COUNT(*) OVER())            │
│  - Database Transactions (BEGIN / COMMIT / ROLLBACK)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database Engine                  │
│       17 Migrations, Custom ENUMs, Indexes, Cascades        │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Principles:
- **No SQL Outside Repositories**: Routes, controllers, and services never contain raw queries or SQL strings.
- **Fail Closed**: Any authorization or verification failure immediately halts execution with appropriate RFC-compliant HTTP codes.
- **Single Source of Truth for Schemas**: Zod validators define runtime validation AND automatically generate the OpenAPI 3.0 specification.
- **Event-Driven Asynchronous Payments**: InTouchPay callbacks trigger internal event emitters (`paymentEvents.emit('paymentCompleted', payment)`) to ensure atomic, decoupled fulfillment.

---

## 3. Directory Structure

```
backend/
├── .env.example                     # Environment template (SMTP, DB, JWT, InTouchPay)
├── openapi.json                     # Generated OpenAPI 3.0 static document
├── package.json                     # Dependencies and build scripts
├── tsconfig.json                    # TypeScript compiler configuration
├── database/
│   └── migrations/                  # 17 SQL migration files executed sequentially
│       ├── 001_create_roles.sql
│       ├── 002_create_users.sql
│       ├── 003_create_locations.sql
│       ├── 004_create_blocker_profiles.sql
│       ├── 005_create_listings.sql
│       ├── 006_create_listing_photos.sql
│       ├── 007_create payments.sql
│       ├── 008_create_contact_unlocks.sql
│       ├── 009_create_subscriptions.sql
│       ├── 010_create_lotto_entries.sql
│       ├── 011_create_partners.sql
│       ├── 012_create_settings.sql
│       ├── 013_create_otp_verifications.sql
│       ├── 014_update_blocker_status.sql
│       ├── 015_create_refresh-tokens.sql
│       ├── 016_create_listings_constraints.sql
│       ├── 0017_create_payments_constraints.sql
│       └── 018_create_revoked_tokens.sql
├── docs/
│   └── BACKEND_PROGRESS_DOCUMENTATION.md  # Master documentation (this file)
└── src/
    ├── app.ts                       # Express setup, middleware, Swagger mount, route registry
    ├── server.ts                    # Server listener & graceful shutdown handlers
    ├── migrate.ts                   # Migration runner script
    ├── config/
    │   ├── db.ts                    # PostgreSQL connection pool with SSL & timeouts
    │   ├── env.ts                   # Strict environment variable validation
    │   └── payment-config.ts        # Pricing tables, unlock fees, subscription tiers
    ├── controllers/
    │   ├── admin.controller.ts      # Admin dashboard & management endpoints
    │   ├── auth.controller.ts       # Registration, login, token refresh, OTP verification, logout
    │   ├── blocker.controller.ts    # Blocker applications, status & reviews
    │   ├── contact-unlock.controller.ts # Contact unlocks & revealed numbers
    │   ├── listing.controller.ts    # Property listings, filtering, photos
    │   ├── location.controller.ts   # Rwanda administrative location hierarchy
    │   ├── partner.controller.ts    # Due diligence partners directory & admin CRUD
    │   ├── payment.controller.ts    # InTouchPay webhook & transaction lookups
    │   ├── setting.controller.ts    # Public bootstrap & admin configuration settings
    │   └── subscription.controller.ts # Blocker Pro subscription lifecycle
    ├── middleware/
    │   ├── authenticate.ts          # Bearer token verification, jti revocation check & optional auth
    │   ├── authorize.ts             # Role-based access control & fresh DB role validation
    │   ├── upload.ts                # Multer image upload pipeline (5MB, jpeg/png/webp)
    │   └── validate.ts              # Zod schema request validation middleware
    ├── openapi/
    │   ├── common.schemas.ts        # Shared responses, error schemas, pagination schemas
    │   ├── document.ts              # OpenAPI 3.0 document aggregator
    │   ├── registry.ts              # OpenAPI registry & security schemes
    │   └── paths/                   # Modular route documentation paths
    │       ├── admin.paths.ts
    │       ├── auth.paths.ts
    │       ├── blocker.paths.ts
    │       ├── contact-unlock.paths.ts
    │       ├── listing.paths.ts
    │       ├── location.paths.ts
    │       ├── lotto.paths.ts
    │       ├── partner.paths.ts
    │       ├── payment.paths.ts
    │       ├── setting.paths.ts
    │       └── subscription.paths.ts
    ├── provider/
    │   └── intouchpay.provider.ts   # InTouchPay HTTP API integration & signature logic
    ├── repositories/
    │   ├── admin.repository.ts      # Paginated admin queries (blockers, listings, subscriptions)
    │   ├── blocker.repository.ts    # Blocker profile CRUD & review updates
    │   ├── contact-unlock.repository.ts # Unlock queries & uniqueness enforcement
    │   ├── listing.repository.ts    # Listing queries, geospatial/village filters, approval
    │   ├── listingphoto.repository.ts # Photo URL & sort order management
    │   ├── location.repository.ts   # Hierarchical province/district/sector/cell/village
    │   ├── lotto.repository.ts      # Lotto ticket persistence & system counts
    │   ├── otp.repository.ts        # OTP creation, retrieval, invalidation
    │   ├── partner.repository.ts    # Certified partners directory, search & filters
    │   ├── payment.repository.ts    # Payment record creation, MoMo updates, audit trail
    │   ├── refreshtoken.repository.ts # Refresh token rotation & session revocation
    │   ├── revoked-token.repository.ts # Revoked access token blocklist table queries
    │   └── setting.repository.ts    # System settings key-value store and public config
    │   ├── refreshtoken.repository.ts # Refresh token storage & revocation
    │   ├── subscription.repository.ts # Subscription periods, active checks, cancellations
    │   └── user.repository.ts       # User lookups, password updates, verification flags
    ├── routes/
    │   ├── admin.routes.ts          # /api/v1/admin
    │   ├── auth.routes.ts           # /api/v1/auth
    │   ├── blocker.routes.ts        # /api/v1/blockers
    │   ├── contact-unlock.routes.ts # /api/v1 (spans /listings/:id/contact and /contact-unlocks)
    │   ├── listing.routes.ts        # /api/v1/listings
    │   ├── location.routes.ts       # /api/v1/location
    │   ├── lotto.routes.ts          # /api/v1/lotto
    │   ├── payment.routes.ts        # /api/v1/payments
    │   └── subscription.routes.ts   # /api/v1/subscriptions
    ├── scripts/
    │   ├── generate-openapi.ts      # Emits openapi.json from live Zod schemas
    │   ├── seed-dev.ts              # Development dummy seed data
    │   └── seed-locations.ts        # Seeds Rwanda 5-level location hierarchy
    ├── services/
    │   ├── admin.service.ts         # Admin bootstrap & paginated audits
    │   ├── auth.service.ts          # Credential verification & registration
    │   ├── blocker.service.ts       # Blocker application validation & role transition
    │   ├── contact-unlock.service.ts# Unlock payment flow & lotto emission
    │   ├── email.service.ts         # Nodemailer Brevo / SMTP transporter
    │   ├── listing.service.ts       # Listing business logic & photo management
    │   ├── payment-events.ts        # In-process pub/sub for completed payments
    │   ├── payment.service.ts       # MoMo push request & webhook settlement
    │   ├── subscription.service.ts  # Blocker Pro duration & active checks
    │   ├── token.service.ts         # JWT issuance, refresh rotation & blacklisting
    │   └── verification.service.ts  # 6-digit OTP generation, email dispatch & verification
    └── validators/
        ├── auth.validator.ts        # Register, login, refresh, OTP Zod schemas
        ├── blocker.validator.ts     # Blocker application & rejection Zod schemas
        ├── contact-unlock.validator.ts # Unlock initiation Zod schema
        ├── listing.validator.ts     # Listing creation, rejection & photo Zod schemas
        └── subscription.validator.ts# Subscription initiation Zod schema
```

---

## 4. Database Schema & Data Dictionary

The PostgreSQL database contains 17 migration files creating the core relational schema, enums, indexes, and constraints.

### 4.1 Custom PostgreSQL ENUM Types
| ENUM Name | Allowed Values | Description |
|:---|:---|:---|
| `user_role` | `ADMIN`, `BLOCKER`, `USER` | Global role determining access privileges |
| `location_level` | `PROVINCE`, `DISTRICT`, `SECTOR`, `CELL`, `VILLAGE` | Rwanda administrative hierarchy level |
| `blocker_status` | `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` | Approval state of a blocker applicant |
| `listing_type` | `LAND`, `HOUSE` | Category of real estate asset |
| `listing_status` | `PENDING`, `APPROVED`, `REJECTED` | Review state of property listing |
| `unlock_type` | `OWNER`, `BLOCKER` | Category of contact information unlocked |
| `payment_status` | `PENDING`, `VERIFIED`, `FAILED` | Settlement status of Mobile Money transaction |
| `payment_purpose` | `SUBSCRIPTION`, `UNLOCK` | Intent of the financial transaction |
| `subscription_type` | `BLOCKER_PRO`, `UNLOCK_PASS` | Subscription tier identifier |
| `subscription_period` | `WEEKLY`, `MONTHLY` | Billing frequency |
| `subscription_status` | `ACTIVE`, `EXPIRED`, `CANCELLED` | Current validity of the subscription |
| `otp_purpose` | `ACCOUNT_VERIFICATION`, `PASSWORD_RESET` | Reason for one-time passcode issuance |

### 4.2 Core Tables Summary

#### `users`
- `id` (BIGSERIAL / UUID PK)
- `phone` (VARCHAR(20) UNIQUE NOT NULL)
- `email` (VARCHAR(255) UNIQUE)
- `password_hash` (TEXT, Argon2id hash)
- `role` (user_role, default `USER`)
- `first_name`, `last_name` (VARCHAR(100))
- `is_verified` (BOOLEAN, default FALSE)
- `phone_verified_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `refresh_tokens`
- `id` (BIGSERIAL PK)
- `user_id` (FK -> `users.id` ON DELETE CASCADE)
- `token_hash` (TEXT UNIQUE NOT NULL)
- `expires_at` (TIMESTAMPTZ NOT NULL)
- `created_at` (TIMESTAMPTZ)

#### `otp_verifications`
- `id` (BIGSERIAL PK)
- `user_id` (FK -> `users.id` ON DELETE CASCADE)
- `code` (VARCHAR(10) NOT NULL)
- `purpose` (otp_purpose NOT NULL)
- `destination` (VARCHAR(255) NOT NULL, email or phone)
- `expires_at` (TIMESTAMPTZ NOT NULL, 15m expiration)
- `used_at` (TIMESTAMPTZ, null until successfully redeemed)
- `created_at` (TIMESTAMPTZ DEFAULT now())

#### `locations`
- `id` (BIGSERIAL PK)
- `parent_id` (FK -> `locations.id` ON DELETE RESTRICT, self-referential)
- `level` (location_level NOT NULL)
- `name` (VARCHAR(150) NOT NULL)
- `highlights` (TEXT)
- *Indexes*: `parent_id`, `level`

#### `blocker_profiles`
- `id` (BIGSERIAL PK)
- `user_id` (FK -> `users.id` ON DELETE CASCADE UNIQUE)
- `national_id` (VARCHAR(30) UNIQUE NOT NULL)
- `operating_location_id` (FK -> `locations.id`)
- `unique_code` (VARCHAR(10) UNIQUE NOT NULL, e.g. `BLK002`)
- `status` (blocker_status DEFAULT 'PENDING')
- `agreement_signed_at` (TIMESTAMPTZ)
- `reviewed_by` (FK -> `users.id`)
- `reviewed_at` (TIMESTAMPTZ)
- `rejection_reason` (TEXT)

#### `listings`
- `id` (BIGSERIAL PK)
- `blocker_id` (FK -> `users.id`)
- `location_id` (FK -> `locations.id`)
- `type` (listing_type NOT NULL)
- `price` (NUMERIC(14,2) NOT NULL)
- `size_sqm` (NUMERIC(12,2))
- `upi` (VARCHAR(50), Unique Parcel Identifier)
- `owner_name` (VARCHAR(150))
- `owner_contact` (VARCHAR(20) NOT NULL) — **never revealed pre-unlock**
- `ownership_proof_url` (TEXT) — visible to admin only
- `status` (listing_status DEFAULT 'PENDING')
- `reviewed_by` (FK -> `users.id`)
- `reviewed_at` (TIMESTAMPTZ)
- `rejection_reason` (TEXT)

#### `listing_photos`
- `id` (BIGSERIAL PK)
- `listing_id` (FK -> `listings.id` ON DELETE CASCADE)
- `file_path` / `url` (TEXT NOT NULL)
- `sort_order` / `position` (SMALLINT DEFAULT 0)

#### `payments`
- `id` (BIGSERIAL PK)
- `user_id` (FK -> `users.id`)
- `purpose` (payment_purpose: `SUBSCRIPTION`, `UNLOCK`)
- `momo_reference` / `partner_transaction_id` (VARCHAR(100) UNIQUE NOT NULL)
- `amount` (NUMERIC(10,2) NOT NULL)
- `status` (payment_status: `PENDING`, `VERIFIED`, `FAILED`)
- `raw_response` (JSONB, full provider audit payload)
- `verified_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ DEFAULT now())

#### `contact_unlocks`
- `id` (BIGSERIAL PK)
- `user_id` (FK -> `users.id`)
- `listing_id` (FK -> `listings.id`)
- `unlock_type` (unlock_type: `OWNER`, `BLOCKER`)
- `payment_id` (FK -> `payments.id`)
- `created_at` (TIMESTAMPTZ DEFAULT now())
- **Constraint**: `UNIQUE (user_id, listing_id, unlock_type)` — structurally impossible to double-bill a user for the same contact.

#### `subscriptions`
- `id` (BIGSERIAL PK)
- `user_id` (FK -> `users.id`)
- `type` (subscription_type: `BLOCKER_PRO`)
- `period` (subscription_period: `WEEKLY`, `MONTHLY`)
- `amount` (NUMERIC(10,2) NOT NULL)
- `status` (subscription_status: `ACTIVE`, `EXPIRED`, `CANCELLED`)
- `starts_at` (TIMESTAMPTZ DEFAULT now())
- `ends_at` (TIMESTAMPTZ NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT now())

#### `lotto_entries`
- `id` (BIGSERIAL PK)
- `user_id` (FK -> `users.id`)
- `unlock_id` (FK -> `contact_unlocks.id`)
- `created_at` (TIMESTAMPTZ DEFAULT now())

---

## 5. Security & Authentication Architecture

### 5.1 Dual-Token JWT Lifecycle & Token Invalidation on Logout
- **Access Token**: Short-lived (15 minutes). Carries `userId`, `role`, and a cryptographically unique `jti` (JWT ID UUID). Passed via HTTP Header: `Authorization: Bearer <token>`.
- **Refresh Token**: Long-lived (7 days). Stored hashed in the `refresh_tokens` database table. Rotated on every single `/auth/refresh` invocation.
- **Immediate Revocation on Logout (`POST /auth/logout`)**:
  - GuraAha enforces full immediate revocation across both token tiers.
  - Refresh token is marked `revoked_at = NOW()` in the database.
  - Access token's unique `jti` and expiration timestamp are recorded in the `revoked_tokens` table.
  - The `authenticate` middleware checks incoming JWTs against `revoked_tokens` — instantly rejecting logged-out sessions before expiration.
- **Global Logout (`POST /auth/logout-all`)**:
  - Revokes all active refresh tokens for the user in `refresh_tokens`.
  - Invalidate current access token `jti` in `revoked_tokens`.
  - Terminates all web, mobile, and third-party sessions simultaneously.

### 5.2 Password Security
Passwords are automatically hashed using **Argon2id** (memory cost: 65,536 KiB, time cost: 3 iterations, parallelism: 4 threads). Argon2id is immune to GPU cracking attacks and resistant to side-channel timing analysis.

### 5.3 Role Elevation & Anti-Privilege Escalation (`requireFreshRole`)
JWT tokens are stateless, meaning a user promoted from `USER` to `BLOCKER` or demoted by an admin would ordinarily retain their stale token claim for 15 minutes.
GuraAha solves this with **`requireFreshRole(allowedRoles)`**:
- Critical admin actions (e.g. approving a listing, approving a blocker, auditing records) perform a direct query to PostgreSQL to verify that the caller's role is currently active in the database before proceeding.

### 5.4 Bootstrap Admin Protection
The first administrative user cannot be created via standard public registration.
- Instead, the route `POST /api/v1/admin/setup` requires the `x-admin-setup-secret` header.
- This header is strictly matched against the backend `ADMIN_SETUP_SECRET` environment variable.
- Any request without the secret or with a mismatched secret receives an immediate `403 Forbidden`.

---

## 6. Email & OTP Verification Flow (Brevo / SMTP)

### 6.1 Configuration
GuraAha integrates Brevo (or standard SMTP relay) using `nodemailer`:
- `EMAIL_HOST`: `smtp.gmail.com` or `smtp-relay.brevo.com`
- `EMAIL_PORT`: `587` (TLS) or `465` (SSL)
- `EMAIL_USE_TLS`: `true`
- `EMAIL_HOST_USER`: Authenticated SMTP username
- `EMAIL_HOST_PASSWORD`: Application-specific SMTP password or Brevo API key
- `DEFAULT_FROM_EMAIL`: `GuraAha Support <noreply@guraaha.test>`

### 6.2 Verification Lifecycle
1. **Trigger**: During user registration (`POST /auth/register`), or upon explicit resend request (`POST /auth/verification/send`).
2. **Generation**: `crypto.randomInt(100000, 999999)` generates a cryptographically secure 6-digit OTP code.
3. **Persistence**: Saved in `otp_verifications` with `purpose = 'ACCOUNT_VERIFICATION'` and `expires_at = now() + 15 minutes`. Any previous unredeemed codes for this user are invalidated.
4. **Dispatch**: Transporter formats an HTML email with GuraAha security branding and dispatches via Brevo.
5. **Redemption**: The user submits the code to `POST /auth/verification/verify`.
6. **State Transition**:
   - `otp_verifications.used_at` set to `now()`.
   - `users.is_verified` set to `true`.
   - `users.phone_verified_at` set to `now()`.
   - Updated user object returned in the response.

---

## 7. Core Business Feature Modules

### 7.1 Blocker Onboarding & KYC
1. Any authenticated user (`role = 'USER'`) submits `POST /api/v1/blockers/apply` containing:
   - `nationalId`: Rwandan National ID (16 digits).
   - `operatingLocationId`: Must be a valid village or sector ID.
2. The system generates a human-readable unique code (e.g. `BLK002`).
3. An administrator navigates to the Admin Console and reviews pending applications (`GET /api/v1/admin/blockers?status=PENDING`).
4. Approving (`PATCH /api/v1/blockers/applications/:id/approve`) runs an atomic transaction:
   - Sets `blocker_profiles.status = 'APPROVED'`.
   - Elevates `users.role = 'BLOCKER'`.

### 7.2 Property Listings & Rwandan Location Tree
- **Rwanda Administrative Levels**:
  - `PROVINCE` (e.g., Kigali, Northern, Southern, Eastern, Western)
  - `DISTRICT` (e.g., Gasabo, Kicukiro, Nyarugenge)
  - `SECTOR` (e.g., Remera, Kimironko, Gisozi)
  - `CELL`
  - `VILLAGE`
- **Browsing Locations**: Public clients start at `GET /api/v1/location/provinces` and drill down via `GET /api/v1/location/:id/children` until reaching village level.
- **Listing Creation**:
  - Requires `BLOCKER` role.
  - Requires `locationId` at village level.
  - Enforces `upi` (Unique Parcel Identifier) uniqueness among active properties.
  - Requires property dimensions (`sizeSqm`), price in RWF, and owner contact.
- **Photo Upload**:
  - `POST /api/v1/listings/:id/photos` via `multipart/form-data`.
  - Max 5MB per image.
  - Only JPEG, PNG, and WebP permitted.
  - Validates that the caller owns the listing.

### 7.3 InTouchPay Mobile Money & Webhooks
1. **Initiation**: User requests an unlock or subscription. Backend constructs an InTouchPay API call and creates a `payments` record with `status = 'PENDING'`.
2. **Push Prompt**: Buyer or Blocker receives an MTN Mobile Money or Airtel Money USSD popup on their phone asking for PIN authorization.
3. **Webhook Callback**: InTouchPay dispatches an HTTP POST to `POST /api/v1/payments/webhook/intouchpay`.
4. **Fulfillment**:
   - Webhook controller records the raw JSON payload in `payments.raw_response`.
   - Updates `payments.status` to `VERIFIED`.
   - Emits `paymentEvents.emit('paymentCompleted', payment)`.
   - Subscribers (ContactUnlockService, SubscriptionService) atomically complete the corresponding purchase.

### 7.4 Dynamic Contact Unlocks & Lotto Entries
- **Dynamic Pricing from Database Settings**: Unlocking prices are not hardcoded; they are stored dynamically in PostgreSQL (`settings` table under key `contact_unlock_prices_rwf`) and administered in real-time by admins.
- **Party Roles**:
  - `OWNER`: Unlocks verified title owner contact (default: 1,000 RWF).
  - `BLOCKER`: Unlocks vetted field blocker contact (default: 500 RWF).
- **Public Pricing Endpoint**: `GET /api/v1/contact-unlocks/prices` enables mobile and web frontends to fetch live pricing anytime without app re-deployments.
- **Lotto Generation**: Upon successful unlock payment, `LottoRepository.create(userId, unlockId, client)` atomically mints a lottery entry inside a database transaction.

### 7.5 Dynamic Blocker Pro Subscriptions
- **Dynamic Subscription Plans in Settings**: All plan tiers, durations, and prices reside in the `settings` database table under key `subscription_plans`.
- **Default Configured Tiers**:
  - `MONTHLY`: 5,000 RWF for 30 days
  - `QUARTERLY`: 25,000 RWF for 90 days
  - `YEARLY`: 90,000 RWF for 365 days
- **Public Plans Endpoint**: `GET /api/v1/subscriptions/plans` returns the live tier map with prices and durations.
- **Renewal Stacking**: When a blocker purchases or renews an active plan, the new validity period stacks automatically on top of existing remaining time (`expiresAt = startsAt + planConfig.durationDays * 86400000`).
- **Status Inspection**: `GET /api/v1/subscriptions/status` computes remaining days and active standing.


### 7.6 Admin Management & Auditing
- **Pagination**: All admin endpoints accept `page` (default 1) and `limit` (default 20, max 100), returning:
  ```json
  {
    "data": [...],
    "pagination": {
      "total": 142,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
  ```
- **Filter by Status**: `?status=PENDING`, `?status=APPROVED`, `?status=REJECTED`, etc.

---

## 8. Complete API Reference

Base Server URL: `http://localhost:3000/api/v1`  
Interactive Swagger UI: `http://localhost:3000/api/v1/docs`  
Machine-readable OpenAPI Spec: `http://localhost:3000/docs.json`  

### 8.1 Authentication (`/auth`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/auth/register` | Public | Create new user account (`USER` role) and auto-send OTP |
| `POST` | `/auth/login` | Public | Authenticate with phone/email + password; returns access & refresh tokens |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for fresh access & rotated refresh token |
| `POST` | `/auth/logout` | Optional Bearer | Invalidate refresh token session and blacklist access token `jti` |
| `POST` | `/auth/logout-all` | Bearer | Terminate all active sessions across all devices simultaneously |
| `POST` | `/auth/verification/send` | Bearer | Send/resend 6-digit OTP code to registered email |
| `POST` | `/auth/verification/verify` | Bearer | Verify 6-digit OTP code to activate account |

### 8.2 Blocker Management (`/blockers`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/blockers/apply` | User | Submit application with National ID and operating location |
| `GET` | `/blockers/application/me` | User/Blocker | View current user's blocker application status |
| `GET` | `/blockers/applications` | Admin | List all pending blocker applications |
| `PATCH` | `/blockers/applications/:id/approve` | Admin (Fresh) | Approve blocker and elevate role to `BLOCKER` |
| `PATCH` | `/blockers/applications/:id/reject` | Admin (Fresh) | Reject blocker with reason |

### 8.3 Location Hierarchy (`/location`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/location/provinces` | Public | List Rwanda's 5 provinces |
| `GET` | `/location/:id/children` | Public | List child administrative divisions (Districts, Sectors, Cells, Villages) |

### 8.4 Property Listings (`/listings`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/listings` | Public | Browse approved listings with filters (`villageId`, `type`, `page`, `pageSize`) |
| `GET` | `/listings/:id` | Public | Get listing details (returns 404 for unapproved listings unless owner/admin) |
| `GET` | `/listings/:id/photos` | Public | Get all photos attached to listing |
| `POST` | `/listings` | Blocker | Create new listing with UPI and owner details (status: PENDING) |
| `GET` | `/listings/me/mine` | Blocker | Get all listings owned by authenticated blocker |
| `POST` | `/listings/:id/photos` | Blocker | Upload photo (multipart `photo`, max 5MB) |
| `DELETE` | `/listings/photos/:photoId` | Blocker | Delete attached photo |
| `GET` | `/listings/admin/pending` | Admin | List pending listings awaiting compliance review |
| `PATCH` | `/listings/:id/approve` | Admin (Fresh) | Approve listing to make it visible to the public |
| `PATCH` | `/listings/:id/reject` | Admin (Fresh) | Reject listing with explanation |

### 8.5 Contact Unlocks (`/listings` & `/contact-unlocks`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/contact-unlocks/prices` | Public | Live dynamic pricing in RWF for OWNER and BLOCKER contact unlocks |
| `POST` | `/listings/:listingId/contact/unlock` | Bearer | Initiate InTouchPay payment for contact details |
| `GET` | `/listings/:listingId/contact` | Bearer | View unlocked owner/blocker contact phone numbers |
| `GET` | `/contact-unlocks/mine` | Bearer | List all properties unlocked by authenticated user |

### 8.6 Payments (`/payments`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/payments/webhook/intouchpay` | Server | InTouchPay server-to-server transaction notification webhook |
| `GET` | `/payments/mine` | Bearer | View personal payment transaction history |
| `GET` | `/payments/:id` | Bearer | Check specific payment settlement details |

### 8.7 Subscriptions (`/subscriptions`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/subscriptions/plans` | Public | Live dynamic subscription plan options, prices (RWF), and durations |
| `POST` | `/subscriptions/initiate` | Blocker | Initiate Mobile Money payment for Blocker Pro tier |
| `GET` | `/subscriptions/mine` | Blocker | View blocker subscription history |
| `GET` | `/subscriptions/status` | Blocker | Check active subscription validity and remaining days |
| `PATCH` | `/subscriptions/:id/cancel` | Blocker | Cancel auto-renewal of subscription |


### 8.8 Lotto Rewards (`/lotto`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/lotto/mine` | Bearer | List lottery tickets earned from contact unlocks |
| `GET` | `/lotto/count` | Admin | Total lottery tickets count across system |

### 8.9 Administration (`/admin`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `POST` | `/admin/setup` | Secret Header | Bootstrap superadmin account via `x-admin-setup-secret` |
| `GET` | `/admin/blockers` | Admin | Paginated list of blockers with `?page`, `?limit`, `?status` |
| `GET` | `/admin/listings` | Admin | Paginated list of listings with `?page`, `?limit`, `?status` |
| `GET` | `/admin/subscriptions` | Admin | Paginated list of subscriptions with `?page`, `?limit`, `?status` |

### 8.10 Partners (`/partners`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/partners` | Public | Paginated list of certified due diligence partners (`?type`, `?locationId`, `?isCertified`, `?search`) |
| `GET` | `/partners/:id` | Public | Partner details with joined location and contact channels |
| `POST` | `/partners` | Admin | Create a new surveyor, notary, valuer, or engineer entry |
| `PATCH` | `/partners/:id` | Admin | Update partner information, certification status, or active toggle |
| `DELETE` | `/partners/:id` | Admin | Deactivate partner (or permanent delete with `?hard=true`) |

### 8.11 System Settings (`/settings`)
| Method | Path | Auth | Description |
|:---|:---|:---|:---|
| `GET` | `/settings/public` | Public | Retrieve whitelisted operational params (fees, support numbers, app version) |
| `GET` | `/settings` | Admin | List all system configuration entries |
| `GET` | `/settings/:key` | Admin | Retrieve single setting by key |
| `PUT` | `/settings/:key` | Admin | Upsert setting value and description |
| `DELETE` | `/settings/:key` | Admin | Remove custom setting entry |

---

## 9. Environment Variables Reference

| Variable | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `PORT` | Number | No | `3000` | Port for Express HTTP server |
| `NODE_ENV` | String | No | `development` | Environment mode (`development`, `production`, `test`) |
| `DATABASE_URL` | String | Yes | - | Full PostgreSQL connection string with credentials |
| `JWT_SECRET` | String | Yes | - | High-entropy secret key for signing Access Tokens |
| `JWT_EXPIRES_IN` | String | No | `15m` | Access token lifespan |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Number | No | `7` | Refresh token lifespan in days |
| `ADMIN_SETUP_SECRET` | String | Yes | - | Secret header required to mint the first admin account |
| `INTOUCHPAY_USERNAME` | String | No | - | InTouchPay gateway API username |
| `INTOUCHPAY_PASSWORD` | String | No | - | InTouchPay gateway API password |
| `INTOUCHPAY_CALLBACK_URL`| String | No | - | Public URL for InTouchPay webhook callbacks |
| `EMAIL_HOST` | String | No | `smtp.gmail.com` | SMTP host (Brevo / Gmail) |
| `EMAIL_PORT` | Number | No | `587` | SMTP port (587 TLS or 465 SSL) |
| `EMAIL_USE_TLS` | Boolean| No | `true` | Enable TLS encryption |
| `EMAIL_HOST_USER` | String | No | - | SMTP authenticated username |
| `EMAIL_HOST_PASSWORD` | String | No | - | SMTP app password or Brevo API key |
| `DEFAULT_FROM_EMAIL` | String | No | `GuraAha <noreply@guraaha.test>` | Sender address for outgoing emails |
| `FRONTEND_URL` | String | No | `http://localhost:5173` | Allowed CORS origin for web application |

---

## 10. How to Run, Test, and Regenerate Documentation

### 10.1 Running Migrations
```bash
npm run migrate
```
Executes all SQL files in `database/migrations/` sequentially.

### 10.2 Seeding Locations & Dev Data
```bash
npm run seedlocations
npm run seeddev
```

### 10.3 Regenerating OpenAPI Spec
```bash
npx --prefix backend tsx backend/src/scripts/generate-openapi.ts
```
Regenerates `backend/openapi.json` directly from the TypeScript Zod validator schemas without manual editing.

### 10.4 Accessing Interactive Documentation
Start the dev server:
```bash
npm run dev
```
Open your browser to:
- **Interactive UI**: `http://localhost:3000/api/v1/docs`
- **Raw JSON Spec**: `http://localhost:3000/docs.json`
