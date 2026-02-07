# Mentorship Platform

## Overview
1:1 programming mentorship platform. Monthly/weekly subscription with session limits. No discoverability — direct links only.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind
- **Hosting**: Vercel
- **Storage**: neon, neon auth
- **Auth**: Anonymous by default → GitHub/Google OAuth before payment
- **Calendar**: Google Calendar API (for creating invites)
- **Payments**: Razorpay Subscriptions API

---

## Pricing Structure

### Plans

| Plan | Sessions | Price | Per Session | Booking | Billing |
|------|----------|-------|-------------|---------|---------|
| **Weekly Weekday** | 3/week | ₹3000/week | ₹1000 | Mon-Fri only | Weekly |
| **Monthly Weekday** ⭐ | 12/month | ₹9600/month | ₹800 | Mon-Fri only | Monthly |
| **Anytime** | 8/month | ₹10000/month | ₹1250 | Any day | Monthly |

### Target Segments

| Plan | Target User | Why It Fits |
|------|-------------|-------------|
| Weekly Weekday | Testing the waters, irregular schedule | Low commitment, can cancel at the end of week |
| Monthly Weekday | Serious learners (unemployed/students) | Best value, weekday availability |
| Anytime | Working professionals | Weekend access, employed can afford premium |

### Nudge Strategy

**Weekly → Monthly conversion:**
- Weekly: 4 weeks × ₹3000 = ₹12000/month for 12 sessions
- Monthly: ₹9600/month for 12 sessions
- **Savings: ₹2400/month (20%)**
- UI: *"Save ₹2400/month with Monthly plan"*

**Monthly vs Anytime self-selection:**
- Monthly: More sessions (12), cheaper (₹800/each), weekdays only
- Anytime: Fewer sessions (8), premium (₹1250/each), weekend access
- Professionals *need* weekends → naturally choose Anytime

### Session Credit Rules

| Plan | Credit Expiry | Rollover |
|------|---------------|----------|
| Weekly Weekday | End of calendar week (Sunday midnight) | ❌ None |
| Monthly Weekday | End of billing period | ❌ None |
| Anytime | End of billing period | ❌ None |

### Plan Changes

| Change | When Allowed | How |
|--------|--------------|-----|
| Upgrade (Weekly → Monthly, Monthly → Anytime) | Cycle end only | User requests, takes effect next cycle |
| Downgrade (Anytime → Monthly, Monthly → Weekly) | Cycle end only | User requests, takes effect next cycle |
| Cancel | Anytime | Takes effect at cycle end (1 month minimum for monthly plans) |

---

## Business Rules

### Session Booking Rules
- **Per-user daily limit**: 1 session/day
- **Anti-hoarding**: Only 1 pending (scheduled) session per user at a time
- **Mentor daily capacity**: 5 sessions/day (configurable in admin)
- **Booking window**: 1-7 days ahead only
- **Session duration**: 50 minutes (fixed)
- **Weekend booking**: Anytime plan or active pack
- **Debit order**: Subscription sessions first, then pack sessions

### Booking Constraint Logic
```typescript
function canBookSlot(user: User, slot: Date): boolean {
  const dayOfWeek = slot.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sun or Sat

  if (!isWeekend) return true // Weekdays always allowed

  // Weekend: allowed if Anytime subscription OR active pack with sessions
  if (user.subscription?.plan.type === 'anytime') return true
  if (user.activePack?.sessions_remaining > 0) return true

  return false
}
```

### Cancellation Policy
- **By mentee**: 4hr minimum notice required
  - ≥4hr before: Session credited back to original source (subscription or pack)
  - <4hr before: Session forfeited (counts as used)
  - UI: Cancel button disabled when <4hr remaining
- **By mentor**: See "Mentor Blocks" section

### Packs (Session Packs)
A **pack** is a secondary session pool, independent of subscriptions. A user can have a subscription, a pack, or both.

**How packs are obtained:**
- **Coupons**: Mentor generates a coupon code → user redeems → sessions added to pack
- **Bundles**: User purchases a bundle from `/packs` page (bundles TBD, not implemented yet)

**Single-pack constraint:**
- A user can only have **one active pack** at a time
- If the user already has an active (non-expired) pack, new sessions are added to it (sessions_total and sessions_remaining both increase)
- If no active pack exists, a new one is created
- Expiry is not extended — it stays at the 1st of the next month from when the pack was originally created

**Pack rules:**
- Sessions can book any day (like Anytime — weekdays and weekends)
- Same booking constraints: 1/day, 1 pending max
- Packs always expire on the **1st of the next month** (regardless of when created)
- No rollover — unused sessions are lost at expiry

**Debit priority when booking:**
1. Subscription sessions are debited first (if available and slot is valid for the plan)
2. Pack sessions are debited only if subscription has no remaining sessions or can't cover the slot (e.g., weekend on a weekday plan)

**Weekend access with packs:**
- A user with only a weekday subscription sees weekdays only
- A user with a pack (with or without subscription) sees all days including weekends
- Weekend bookings always debit from the pack (weekday subscriptions can't cover weekends)

**Cancellation credit-back:**
- Session tracks which source was debited (subscription or pack)
- On cancel with ≥4hr notice, the credit goes back to the original source

### Coupon System
- Mentor generates coupons that grant packs (N sessions)
- Coupons work for any logged-in user (no subscription required)
- Redeeming a coupon adds sessions to the user's active pack (or creates one if none exists)
- Coupon discovery points:
  - **`/redeem`**: Standalone page (linked directly by mentor)
  - **`/redeem?code=WELCOME5`**: URL-prefilled (mentor shares full link)
  - **`/subscribe`**: "Have a coupon?" input below plan cards
  - **`/dashboard`**: "Redeem Coupon" section for existing users

---

## Mentor Controls

### Planned Blocks (Vacation, etc.)
Mentor can block date ranges when unavailable.

**Rules:**
- No minimum notice required (emergencies happen)
- Reason is mandatory
- All active subscribers notified immediately via email
- Block days added as credits to each active subscription
- Credits extend "active access" window beyond Razorpay billing date

**Credit Extension Logic:**
```typescript
// User's effective subscription end:
effectiveEnd = subscription.current_period_end + sum(credits.days)

// User can book sessions until effectiveEnd
// Razorpay still bills on original schedule
// Credits tracked separately in our DB
```

**User sees:**
```
Your subscription: Active
Renews: Feb 1, 2025
Bonus days: +5 (mentor unavailable Jan 15-20)
Effective access until: Feb 6, 2025
```

**Handling existing bookings during block:**
- Sessions within blocked dates are auto-cancelled (`cancelled_by_mentor`)
- Google Calendar events are deleted
- Session credits are returned to the original source (subscription or pack)

### Mentor-Initiated Cancellation
Mentor can cancel a user's subscription (toxic user, violations, etc.)

**Rules:**
- Immediate cancellation (not end-of-cycle)
- Auto pro-rata refund calculated:
  ```
  refundAmount = unusedSessions * costPerSession(user.plan)
  ```
- Razorpay refund issued automatically
- User notified with reason
- User cannot re-subscribe (blocklist)

### Mentor Stopping Service
If mentor is winding down entirely:
- Cancel all subscriptions at cycle end (graceful)
- No refunds needed (users get full paid period)
- Disable new signups

---

## Data Models

```typescript
// Vercel Postgres

type User = {
  id: string
  email: string
  name: string
  image?: string                // OAuth profile picture URL
  provider: 'github' | 'google'
  provider_id: string
  blocked: boolean              // mentor blocklist
  created_at: Date
}

type Subscription = {
  id: string
  user_id: string
  razorpay_subscription_id: string
  plan_id: string               // references Plan
  status: 'active' | 'cancelled' | 'past_due'
  current_period_start: Date
  current_period_end: Date
  sessions_used_this_period: number
  pending_plan_change_id?: string  // for upgrade/downgrade at cycle end
  cancelled_at?: Date
  cancel_reason?: string
  created_at: Date
}

type Plan = {
  id: string
  name: string                  // "Weekly Weekday", "Monthly Weekday", "Anytime"
  slug: string                  // "weekly_weekday", "monthly_weekday", "anytime"
  razorpay_plan_id: string
  price_inr: number           // 2999, 9599, 9999
  sessions_per_period: number   // 3, 12, 8
  period: 'weekly' | 'monthly'
  weekend_access: boolean       // false, false, true
  active: boolean
  created_at: Date
}

type Session = {
  id: string
  user_id: string
  subscription_id?: string      // set if debited from subscription
  pack_id?: string              // set if debited from pack
  google_event_id: string
  scheduled_at: Date
  duration_minutes: number      // 50
  status: 'scheduled' | 'completed' | 'cancelled_by_user' | 'cancelled_by_mentor' | 'no_show'
  cancelled_at?: Date
  late_cancel: boolean          // true if <4hr notice
  created_at: Date
}

type MentorBlock = {
  id: string
  start_date: Date
  end_date: Date
  reason: string
  users_notified: boolean
  created_at: Date
}

type SubscriptionCredit = {
  id: string
  subscription_id: string
  days: number
  reason: string                // "Mentor block: Vacation Jan 15-20"
  block_id?: string             // references MentorBlock
  created_at: Date
}

type Coupon = {
  id: string
  code: string                  // "WELCOME5"
  sessions_granted: number      // 5
  expires_at?: Date
  max_uses?: number
  uses: number
  active: boolean
  created_at: Date
}

type Pack = {
  id: string
  user_id: string
  source: 'coupon' | 'bundle'
  coupon_id?: string            // set if source = 'coupon'
  sessions_total: number
  sessions_remaining: number
  expires_at: Date              // always 1st of next month
  created_at: Date
}

// Config (neon)
type MentorConfig = {
  max_sessions_per_day: number  // default 5
  booking_window_days: number   // default 7
  cancellation_notice_hours: number // default 4
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Public Pages                       │
├─────────────────────────────────────────────────────────┤
│  /                 Landing + mentor info + pricing      │
│  /pricing          Detailed plan comparison             │
│  /book             Calendar view (read-only, shows      │
│                    availability to entice signup)       │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                      Auth Gate                          │
├─────────────────────────────────────────────────────────┤
│  /login            GitHub / Google OAuth                │
│  /subscribe        Plan selection → Razorpay checkout   │
│                    + "Have a coupon?" inline redeem     │
│  /redeem           Coupon code entry → creates pack     │
│  /packs            Session pack bundles (TBD)           │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Subscriber Pages                      │
├─────────────────────────────────────────────────────────┤
│  /dashboard        Subscription status, sessions used,  │
│                    bonus days, upcoming session         │
│  /book             Full booking (if no pending session) │
│  /sessions         Session history                      │
│  /settings         Plan change request, cancel          │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                     Mentor Admin                        │
├─────────────────────────────────────────────────────────┤
│  /admin            Overview: today's sessions, stats    │
│  /admin/calendar   View/add blocks                      │
│  /admin/users      Subscriber list, cancel user         │
│  /admin/coupons    Create/manage coupons                │
│  /admin/config     Adjust limits (sessions/day, etc.)   │
└─────────────────────────────────────────────────────────┘
```

---

## API Routes

```
# Auth
POST /api/auth/[...nextauth]       NextAuth handlers

# Plans & Subscriptions
GET  /api/plans                    List active plans
POST /api/subscribe                Create Razorpay subscription
POST /api/subscribe/change         Request plan change (cycle end)
POST /api/subscribe/cancel         User cancels (end of period)
POST /api/webhooks/razorpay        Razorpay webhook receiver

# Booking
GET  /api/calendar/slots           Available slots (7-day window)
POST /api/calendar/book            Book a session
DELETE /api/calendar/book/[id]     Cancel a session

# User
GET  /api/me                       Current user + subscription status
GET  /api/sessions                 User's session history

# Packs & Coupons
POST /api/redeem                   Redeem coupon code → creates pack
GET  /api/packs                    User's active packs

# Admin (protected)
GET  /admin/api/stats              Dashboard stats
GET  /admin/api/users              List subscribers
POST /admin/api/users/[id]/cancel  Cancel user subscription
GET  /admin/api/blocks             List mentor blocks
POST /admin/api/blocks             Create block
DELETE /admin/api/blocks/[id]      Remove block
GET  /admin/api/coupons            List coupons
POST /admin/api/coupons            Create coupon
PATCH /admin/api/config            Update mentor config

# Cron (QStash-protected)
POST /api/cron/complete-sessions   Mark past sessions as completed
```

---

## Key Transactions

### Book a Session
```sql
BEGIN;
  -- 1. Load subscription (if any) with effective access
  SELECT s.*, p.* FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = $1 AND s.status = 'active'
  FOR UPDATE;

  -- 2. Load active pack (if any)
  SELECT * FROM packs
  WHERE user_id = $1 AND sessions_remaining > 0 AND expires_at > NOW()
  FOR UPDATE;

  -- 3. Must have at least one source with sessions
  -- subscription sessions remaining OR pack sessions remaining

  -- 4. Check no pending session exists
  SELECT 1 FROM sessions
  WHERE user_id = $1 AND status = 'scheduled';
  -- must return 0 rows

  -- 5. Check date is within booking window (1-7 days)

  -- 6. Check weekend access if booking Sat/Sun
  -- Allowed if: subscription.weekend_access = true OR active pack exists

  -- 7. Check mentor capacity for that day
  SELECT COUNT(*) FROM sessions
  WHERE DATE(scheduled_at) = $2 AND status = 'scheduled'
  FOR UPDATE;
  -- must be < max_sessions_per_day

  -- 8. Check user hasn't booked this day already
  SELECT 1 FROM sessions
  WHERE user_id = $1 AND DATE(scheduled_at) = $2
  AND status IN ('scheduled', 'completed');
  -- must return 0 rows

  -- 9. Determine debit source (priority: subscription first)
  --    - If weekday AND subscription has sessions → debit subscription
  --    - If weekend AND subscription is Anytime with sessions → debit subscription
  --    - Otherwise → debit pack

  -- 10. Create session with source reference
  INSERT INTO sessions (subscription_id, pack_id, ...);
  -- Increment/decrement the chosen source

  -- 11. Create Google Calendar event
COMMIT;
```

### Cancel Session (by user)
```sql
BEGIN;
  SELECT * FROM sessions WHERE id = $1 FOR UPDATE;

  -- Check ownership
  -- Check status = 'scheduled'

  IF scheduled_at - NOW() >= INTERVAL '4 hours' THEN
    -- Graceful cancel: credit back to original source
    UPDATE sessions SET status = 'cancelled_by_user', late_cancel = false;
    IF session.subscription_id IS NOT NULL THEN
      UPDATE subscriptions SET sessions_used_this_period = sessions_used_this_period - 1;
    ELSIF session.pack_id IS NOT NULL THEN
      UPDATE packs SET sessions_remaining = sessions_remaining + 1;
    END IF;
  ELSE
    -- Late cancel: no credit
    UPDATE sessions SET status = 'cancelled_by_user', late_cancel = true;
  END IF;

  -- Delete Google Calendar event
COMMIT;
```

### Weekly Subscription Reset (Cron or Webhook)
```typescript
// Triggered by Razorpay subscription.charged webhook for weekly plans
async function handleWeeklyRenewal(subscriptionId: string) {
  await db.subscriptions.update({
    where: { razorpay_subscription_id: subscriptionId },
    data: { 
      sessions_used_this_period: 0,
      current_period_start: new Date(),
      current_period_end: addDays(new Date(), 7)
    }
  })
}
```

### Process Plan Change at Cycle End
```typescript
// Triggered by Razorpay subscription.charged webhook
async function handleRenewal(subscriptionId: string) {
  const sub = await db.subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionId }
  })
  
  if (sub.pending_plan_change_id) {
    // Cancel old Razorpay subscription
    await razorpay.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: false })
    
    // Create new subscription on new plan
    const newPlan = await db.plans.findFirst({ where: { id: sub.pending_plan_change_id } })
    const newRzpSub = await razorpay.subscriptions.create({
      plan_id: newPlan.razorpay_plan_id,
      customer_notify: 1,
      total_count: 120 // ~10 years max
    })
    
    // Update DB
    await db.subscriptions.update({
      where: { id: sub.id },
      data: {
        plan_id: newPlan.id,
        razorpay_subscription_id: newRzpSub.id,
        pending_plan_change_id: null,
        sessions_used_this_period: 0
      }
    })
  } else {
    // Normal renewal, just reset counter
    await db.subscriptions.update({
      where: { id: sub.id },
      data: { sessions_used_this_period: 0 }
    })
  }
}
```

### Create Mentor Block
```typescript
async function createMentorBlock(start: Date, end: Date, reason: string) {
  const block = await db.mentorBlocks.create({ start, end, reason })
  
  const blockDays = daysBetween(start, end)
  const activeSubs = await db.subscriptions.findMany({ 
    where: { status: 'active' } 
  })
  
  // Credit each subscriber
  for (const sub of activeSubs) {
    await db.subscriptionCredits.create({
      subscription_id: sub.id,
      days: blockDays,
      reason: `Mentor unavailable: ${reason}`,
      block_id: block.id
    })
  }
  
  // Notify all subscribers
  await sendBulkEmail(
    activeSubs.map(s => s.user.email),
    'mentor_block_notice',
    { start, end, reason, creditDays: blockDays }
  )
  
  await db.mentorBlocks.update(block.id, { users_notified: true })
}
```

### Mentor Cancels User
```typescript
async function mentorCancelUser(userId: string, reason: string) {
  const sub = await db.subscriptions.findFirst({
    where: { user_id: userId, status: 'active' },
    include: { plan: true }
  })
  
  if (!sub) return
  
  // Calculate pro-rata refund
  const totalDays = sub.plan.period === 'weekly' ? 7 : 30
  const daysUsed = daysSince(sub.current_period_start)
  const daysRemaining = totalDays - daysUsed
  const refundPaise = Math.floor(sub.plan.price_paise * daysRemaining / totalDays)
  
  // Cancel in Razorpay
  await razorpay.subscriptions.cancel(sub.razorpay_subscription_id)
  
  // Issue refund
  if (refundPaise > 0) {
    const payments = await razorpay.subscriptions.fetchPayments(sub.razorpay_subscription_id)
    const lastPayment = payments.items[0]
    await razorpay.payments.refund(lastPayment.id, { amount: refundPaise })
  }
  
  // Update DB
  await db.subscriptions.update(sub.id, { 
    status: 'cancelled',
    cancelled_at: new Date(),
    cancel_reason: reason
  })
  
  // Block user from resubscribing
  await db.users.update(userId, { blocked: true })
  
  // Cancel any pending sessions
  await db.sessions.updateMany(
    { user_id: userId, status: 'scheduled' },
    { status: 'cancelled_by_mentor' }
  )
  
  // Notify user
  await sendEmail(sub.user.email, 'subscription_cancelled_by_mentor', { reason })
}
```

---

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

# Neon storage
NEON_CONNECTION_STRING=

# Secret App (be extra wary of spoofing attempts)
MENTOR_EMAIL=                 # for admin auth check

# QStash (session auto-completion cron)
QSTASH_TOKEN=                     # QStash API token (from Upstash dashboard)
QSTASH_CURRENT_SIGNING_KEY=       # For verifying incoming requests
QSTASH_NEXT_SIGNING_KEY=          # For verifying incoming requests
```

---

## Implementation Phases

### Phase 1: Foundation
- [x] Next.js project + shadcn/ui setup
- [x] Landing page with pricing table
- [x] Basic layout + navigation

### Phase 2: Auth
- [x] NextAuth.js with GitHub + Google
- [x] Protected route middleware
- [x] Admin route protection (check MENTOR_EMAIL)

### Phase 3: Database
- [x] Drizzle ORM setup
- [x] Schema migration
- [x] Seed plans and mentor config defaults

### Phase 4: Subscription Flow
- [x] Plan selection UI with nudge towards Monthly
- [x] Razorpay subscription creation (3 plans)
- [x] Webhook handler for subscription events
- [x] User dashboard with status
- [x] Plan change request flow
- [x] Subscription cancellation UI

### Phase 5: Booking
- [x] Google Calendar integration
- [x] Available slots API (respecting weekend access)
- [x] Booking flow with all validations
- [x] Cancel flow with 4hr rule
- [x] Session history

### Phase 6: Mentor Admin + Packs
- [x] Admin dashboard
- [x] Calendar block management
- [x] User management (view, cancel)
- [x] Config editor
- [x] Pack system (DB schema, debit/credit logic)
- [x] Update booking flow for pack debit priority
- [x] Update cancel flow for pack credit-back
- [x] Update calendar slots to show weekends when user has active pack
- [x] Coupon management (admin create/list)
- [x] Coupon redemption → pack creation (POST /api/redeem)
- [x] `/redeem` page with `?code=` prefill support
- [x] "Have a coupon?" input on `/subscribe`
- [x] "Redeem Coupon" section on `/dashboard`

### Phase 7: System Polish
- [x] Email notifications (Resend)
- [x] Error handling
- [x] Loading states
- [x] Mobile responsiveness

### Phase 8: UX Polish
- [x] Use Zod for API validation everywhere
- [x] Show dashboard when logged in
- [x] Show admin dashboard when logged in with mentor email
- [x] Dark mode (next-themes + ThemeToggle in header/mobile nav)
- [ ] Add level coaching branding (DEFERRED — needs design assets)
- [x] Prefill email when razorpay subscription modal shows up
- [x] Branded 404 page, with a link back to last page if within host domain, otherwise to `/`
- [x] Make "Payment Pending" alert on dashboard reactive, to auto refresh when subscription goes through
- [x] Grab pfp when available during login
- [x] Remove "enroll now" button when subscription active
- [x] Redirect to "Change Plan" under settings if a subscribed user lands on `/subscribe`
- [x] Show back button in settings page
- [x] When clicking on "sign-in" button, redirect to dashboard after successful login
- [x] After the cancellation window closes, the cancel button gets disabled. Add modal to explain why they can't cancel anymore.
- [x] After the session ends, it is not updated as completed. Add cron job or something to make sure it is reflected correctly. (can use qstash if not natively supported by nextjs)
- [x] The order of session history needs to be latest-to-oldest

### Phase 9: Security Audit
- [ ] Check for common threats
- [ ] Check for possible race conditions
- [ ] Setup automated tools for security analysis

---

Can start using the website beyond this phase, do a full production deployment

---

### Phase 10: Repo management
- [ ] Setup preview deployment on pull request
      - Create a matching branch on neon
      - Create a matching branch on vercel
      - Connect everything together
- [ ] Add Readme with architecture as mermaid
- [ ] Add validation to env file on startup with clear error message. Stop
      bootup with _all_ missing keys and add docs in readme for each variable, giving
      step for acquiring.

### Phase 11: Analytics
- [ ] Connect with posthog
---

## Commands

```bash
pnpm dev          # local dev
pnpm build        # production build
pnpm db:push      # push schema to Vercel Postgres
pnpm db:studio    # open Drizzle Studio
```

---

## Prompt

Build a mentorship booking platform with:

1. **Landing page**: Hero with value prop, 3-tier pricing table (Weekly ₹3000, Monthly ₹9600 highlighted, Anytime ₹10000), FAQ, testimonials placeholder, CTA to subscribe. Nudge users toward Monthly plan showing 20% savings vs Weekly.

2. **Auth**: Anonymous browsing allowed. GitHub/Google OAuth required before payment. Use NextAuth.js. Admin routes protected by MENTOR_EMAIL env var.

3. **Subscriptions**: Razorpay Subscriptions with 3 plans:
   - Weekly Weekday: 3 sessions/week, ₹3000, Mon-Fri only
   - Monthly Weekday: 12 sessions/month, ₹9600, Mon-Fri only  
   - Anytime: 8 sessions/month, ₹10000, any day including weekends
   
   Webhook-driven status sync. Track sessions used per billing period. Reset on renewal. Handle credits for mentor blocks. Plan changes only at cycle end.

4. **Calendar**: Display available slots in a clean week view. Service account auth for Google Calendar. Enforce: 1 session/day/user, 1 pending max, 5 total/day, 1-7 day window. **Weekend slots only visible/bookable for Anytime plan users.**

5. **Booking**: Subscribers can book if they have sessions remaining and no pending booking. 4hr cancellation policy enforced in UI (disable cancel button). Weekday plans blocked from weekend slots.

6. **Mentor Admin**: Dashboard with today's sessions, subscriber list, block management (with auto-credit), coupon system, user cancellation with pro-rata refund.

7. **Packs & Coupons**: Packs are secondary session pools (any day, expire 1st of month). Coupons create packs. Subscription sessions debited first, then pack. Redeemable via `/redeem`, `/subscribe` inline, and `/dashboard`.

Keep components minimal — single-mentor tool.
