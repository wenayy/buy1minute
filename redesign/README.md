# Buy1Minute (Redesigned & Hardened)

A luxury, high-performance redesign of **Buy1Minute** with military-grade defensive security hardening, atomic checkout outbid protections, SSRF mitigation, and modern neo-editorial visual aesthetics.

## Key Improvements in This Redesign

1. **Defensive Security & Abuse Mitigation**:
   - **XSS & Protocol Whitelisting**: Strict `http:` / `https:` verification preventing `javascript:` and `data:` URI attacks.
   - **Hardened SSRF Protection**: Comprehensive IPv4/IPv6 private range, loopback, cloud metadata (169.254.169.254), and manual redirect checks.
   - **Atomic Outbid Protection**: Webhook verifies that an incoming outbid payment is strictly higher than any recently confirmed ownership before overwriting, preventing out-of-order payment race conditions.
   - **Reservation Anti-Hoarding**: Per-visitor reservation throttling and proactive garbage collection of expired reservations.
   - **Analytics Throttling**: Deduplicated event tracking preventing database exhaustion.
   - **Full Moderation Pipeline**: Live `/api/reports` and protected `/api/admin` moderation endpoints.

2. **Visual & UX Elevation**:
   - **Chronos Precision HUD**: Real-time sweeping seconds, UTC & local time conversion, radial minute progress ring.
   - **Dynamic Homepage Takeover**: Smooth transitions, verified domain badges, multi-provider brand favicons, and prominent outbid duels.
   - **24-Hour Solar Matrix (`/explore`)**: Density heatmap across 1,440 minutes with quick-jump hour dropdown, live search, and keyboard navigation.
   - **Live Creator Studio (`/setup/[slug]`)**: Instant multi-format preview cards with auto brand color and favicon extraction.
   - **Tiered Leaderboard (`/leaderboard`)**: Categorized ranking with dynamic filters.

## Development & Deployment

```bash
npm install
npm run dev
npm run build
```
