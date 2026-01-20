# Mentorship Platform

## Overview
1:1 programming mentorship platform. Monthly subscription (₹8000) with daily sessions included. No discoverability needed — direct links only.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind
- **Hosting**: Vercel
- **Storage**: Vercel KV (session state) + Vercel Postgres (user data)
- **Auth**: Anonymous by default → GitHub/Google OAuth before payment
- **Calendar**: Google Calendar API (mentor availability + booking)
- **Payments**: Razorpay Subscriptions API

The entire app MUST be testable locally using whatever tool is need. For example, `vercel cli` for vercel dev. Or, mocks for Google Calendar API.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Public Pages                       │
├─────────────────────────────────────────────────────────┤
│  /                 Landing + mentor info                │
│  /book             Calendar view (read-only for anon)   │
│  /subscribe        OAuth gate → Razorpay checkout       │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Authenticated Pages                   │
├─────────────────────────────────────────────────────────┤
│  /dashboard        Subscription status + upcoming slots │
│  /book             Full booking (active subscribers)    │
│  /sessions         Past session history                 │
└─────────────────────────────────────────────────────────┘
```

## Data Models

```typescript
// Vercel Postgres
type User = {
  id: string
  email: string
  name: string
  provider: 'github' | 'google'
  provider_id: string
  created_at: Date
}

type Subscription = {
  id: string
  user_id: string
  razorpay_subscription_id: string
  current_period_end: Date
  created_at: Date
}

type Coupon = {
  id: string // what the user will enter
  expire: Date
  valid_for: string | null // email
  off_percent: number // 0% to 100%
  status: 'available' | 'unavailable'
}
```

## Implementation Phases

### Phase 1: Static Foundation
- [ ] Next.js project setup with shadcn/ui
- [ ] Landing page with a single `enroll` CTA
- [ ] Basic layout + navigation components

### Phase 2: Auth Flow
- [ ] NextAuth.js setup with GitHub + Google providers
- [ ] Anonymous session handling (cookie-based visitor ID)
- [ ] Protected route middleware
- [ ] Auth gate component for subscribe flow

### Phase 3: Google Calendar Integration
- [ ] Google Calendar API setup (service account)
- [ ] Fetch mentor availability slots
- [ ] Display calendar UI (week view)
- [ ] Create booking endpoint (authenticated + subscribed users only)

### Phase 4: Razorpay Integration
- [ ] Razorpay Subscriptions API setup
- [ ] Create subscription plan (₹8000/monthly)
- [ ] Checkout flow with subscription link generation
- [ ] Sync subscription status to DB

### Phase 5: Dashboard + Booking
- [ ] User dashboard (subscription status, next session)
- [ ] Full booking flow for active subscribers

### Phase 6: Admin (Mentor Side)
- [ ] View subscriber list

## Key Constraints

1. **Single mentor**: No multi-tenancy. Hardcode mentor's Google Calendar ID.

## Environment Variables

```bash
# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Calendar (service account)
GOOGLE_CALENDAR_ID=
GOOGLE_SERVICE_ACCOUNT_KEY=  # base64 encoded JSON

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PLAN_ID=

# Vercel Storage
POSTGRES_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## API Routes

```
POST /api/auth/[...nextauth]     NextAuth handlers
POST /api/subscribe/create       Create Razorpay subscription
POST /api/webhooks/razorpay      Razorpay webhook receiver
GET  /api/calendar/slots         Fetch available slots
POST /api/calendar/book          Book a session
DELETE /api/calendar/book/[id]   Cancel a session
GET  /api/sessions               List user's sessions
```

## Commands

```bash
pnpm dev          # local dev
pnpm build        # production build
pnpm db:push      # push schema to Vercel Postgres
pnpm db:studio    # open Drizzle Studio
```

---

Build a mentorship booking platform with:

1. **Landing page**: Hero with value prop, pricing (8000inr/mo, daily sessions), simple FAQ, CTA to subscribe

2. **Auth**: Anonymous browsing allowed. GitHub/Google OAuth required before payment. Use NextAuth.js.

3. **Calendar**: Display mentor's Google Calendar availability in a clean view. Use shadcn Calendar + custom slot picker. Service account auth for Google API.

4. **Payment**: Razorpay Subscriptions for 8000inr/mo one-time. Webhook-driven status sync.

5. **Booking**: Mentees can pay 8000inr to book sessions for the next 30days from the time of booking.

6. **Dashboard**: Show subscription status, upcoming sessions, quick-book for tomorrow, session history.

7. **Slots**: for any given day there can be max 5 sessions.

