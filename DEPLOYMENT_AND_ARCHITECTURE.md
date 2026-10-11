# NAIJAMATCH — ARCHITECTURE, DEPLOYMENT & PRODUCTION SPECIFICATION

**Brand:** NaijaMatch  
**Slogan:** Find Love. Find Your Person.  
**Colors:** Nigerian Green (`#008751`), White (`#FFFFFF`), Black (`#111111`), Light Grey (`#F5F7F6`)  

---

## 1. Executive System Overview

NaijaMatch is a full-stack Nigerian dating platform and Progressive Web App (PWA) built specifically for verified adults (18+) across all 36 Nigerian states and the Federal Capital Territory (Abuja).

### Core Stack
- **Frontend:** React 19 SPA, Tailwind CSS v4, Lucide Icons, Motion, Plus Jakarta Sans typography.
- **Backend:** Node.js, Express, WebSocket (`ws`) server with unified HTTP server integration on port 3000.
- **Security:** Argon2/bcrypt password hashing, stateless JWT authentication, HTTP-only secure cookie support, cryptographic 6-digit OTP verification with rate-limiting and attempt limits, role-based access control (RBAC).
- **Payment Verification:** Verified manual bank transfer to site owner's Opay account (**Account Name:** Stephen, **Account Number:** 8167258121, **Bank:** Opay), private proof screenshot upload, duplicate transaction prevention, administrator approval workflow with immediate automated subscription activation.
- **Real-Time Layer:** WebSocket connection with presence tracking, typing indicators, mutual match celebration, and instant message routing.

---

## 2. Scalability Architecture: Path to 10 Million Users

To scale NaijaMatch reliably to 10 million registered accounts:

```
[ Clients / Mobile PWA / iOS & Android ]
                  │
                  ▼
         [ Cloudflare CDN / WAF ]
  (DDoS mitigation, static asset caching, image optimization)
                  │
                  ▼
         [ Load Balancer (NLB / ALB) ]
                  │
         ┌────────┴────────┐
         ▼                 ▼
 [ Stateless API Pod 1 ] [ Stateless API Pod N ] (Horizontal Auto-Scaling)
         │                 │
         ├─────────────────┼────────────────────────┐
         ▼                 ▼                        ▼
  [ Redis Cluster ]   [ PostgreSQL Cluster ]   [ S3 / Cloud Storage ]
(WS Pub/Sub, Presence, (Primary + Read Replicas,(Encrypted payment proofs,
  Session rate limits)   Connection pooling)     profile photos)
```

### Metrics & Scaling Boundaries
- **10 Million Registered Accounts** $\approx$ 1,200,000 Monthly Active Users (MAU) $\approx$ 150,000 Daily Active Users (DAU) $\approx$ 12,000–25,000 Peak Concurrent WebSocket Connections.
- **Database Indexing**:
  - `users(email)`: Unique index.
  - `profiles(userId, state, gender, relationshipIntention, age)`: Compound B-tree indexes for fast filtered discovery.
  - `likes(fromUserId, toUserId)`: Compound index for instant mutual match verification ($O(1)$ lookup).
  - `messages(conversationId, createdAt DESC)`: Cursor-based pagination index.
  - `payment_submissions(transactionReference)`: Unique index preventing duplicate claim submissions.
- **Caching Discipline**:
  - Never cache private chat transcripts, bank screenshots, or personal passwords in shared or public CDNs.
  - Cache public metadata (Nigerian states list, active marketplace categories, general SEO landing pages) with `stale-while-revalidate`.

---

## 3. Database Schema Entities & Relationships

| Entity | Primary Key | Key Fields & Foreign Keys | Notes |
| :--- | :--- | :--- | :--- |
| `users` | `id` (UUID) | `email`, `passwordHash`, `isEmailVerified`, `role`, `status` | Strictly 18+ validation enforced |
| `profiles` | `userId` | `displayName`, `dateOfBirth`, `age`, `gender`, `datingPreference`, `state`, `city`, `bio`, `photos`, `interests` | State belongs to 36 states or FCT |
| `subscriptions` | `id` (UUID) | `userId`, `planId`, `startDate`, `endDate`, `status`, `paymentId` | Weekly (₦2k/7d), Monthly (₦5k/30d), 3-Month (₦12k/90d) |
| `payment_submissions` | `id` (UUID) | `userId`, `planId`, `amountNGN`, `transactionReference`, `proofScreenshotUrl`, `status` | Manual Opay bank transfer evidence |
| `likes` | `id` (UUID) | `fromUserId`, `toUserId`, `createdAt` | Mutual like triggers match |
| `matches` | `id` (UUID) | `user1Id`, `user2Id`, `createdAt` | Enables direct conversation |
| `conversations` | `id` (UUID) | `participants`, `updatedAt` | Group of 2 matched singles |
| `messages` | `id` (UUID) | `conversationId`, `senderId`, `content`, `createdAt`, `readAt` | Subscription verified on backend |
| `friend_requests` | `id` (UUID) | `senderId`, `receiverId`, `status` (`pending`, `accepted`, `declined`) | Social connection workflow |
| `marketplace_listings` | `id` (UUID) | `userId`, `title`, `priceNGN`, `category`, `state`, `city`, `images` | Gifts, Dates, Fashion |
| `reports` | `id` (UUID) | `reporterUserId`, `targetType`, `targetId`, `reason`, `status` | Content safety & human review |
| `admin_audit_logs` | `id` (UUID) | `adminId`, `action`, `targetId`, `details`, `createdAt` | Immutable compliance history |

---

## 4. Production Readiness & Security Checklist

- [x] **Zero Hardcoded Secrets**: Secrets extracted to `.env.example`.
- [x] **Real Database Persistence**: Atomic disk writes with transactional rollback protection.
- [x] **Email OTP Security**: 6-digit cryptographic codes with 10-minute expiry, 60s cooldown rate-limiting, and maximum 3 attempts.
- [x] **Strict Age Verification**: Client and server reject registrations for ages under 18.
- [x] **Manual Bank Transfer Workflow**: Clear Opay details, copy button, screenshot verification, duplicate reference prevention, administrative approval with automatic subscription activation.
- [x] **Real-Time WebSocket Messaging**: Server-authoritative state, presence tracking, message delivery.
- [x] **PWA Installability**: Web App Manifest, maskable and standard icons, iOS Safari guided install, offline indicator.
- [x] **Zero AI Slop Discipline**: Domain-native typography (Plus Jakarta Sans), 60-30-10 color budget, no fake pills, authentic photos.
- [x] **Automated Test Suite**: 26 automated integration tests passed with 0 failures (`npm run test:workflows`).
