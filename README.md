# EverCurrent — Daily Digest Tool for Hardware Engineering Teams

> A personalized AI-powered daily digest that surfaces the most relevant Slack and Jira updates for each team member based on their role, project phase, and priorities.

---

## Problem

Robotics hardware teams rely on Slack for day-to-day communication, but this creates three core problems:

1. **Knowledge silos** — critical updates get buried in threads across channels
2. **Information overload** — every role has different priorities, but everyone sees the same firehose
3. **Context drift** — a Mechanical Engineer in Validation phase needs completely different information than one in Prototype phase

## Solution

EverCurrent generates a personalized morning digest for each team member by:

- Pulling Slack messages and Jira tickets relevant to their role and subscribed channels
- Using vector similarity search to surface the most relevant content without expensive LLM calls
- Applying LLM reasoning only on pre-filtered, high-signal data
- Detecting silence alerts when critical tickets have no activity approaching their deadline

---

## Key Features

- **Role-based personalization** — 5 roles (Mechanical Engineer, Electrical Engineer, Supply Chain, Engineering Manager, Product Manager), each with tailored digest sections
- **Project phase adaptation** — digest content automatically adapts across 5 phases (Design, Prototype, Validation, Pre-production, Production)
- **Silence detection** — flags tickets approaching deadlines with no recent Slack activity, escalating severity after 3 days
- **Vector search filtering** — uses local vector DB (vectra) to pre-filter relevant messages before LLM call, reducing API cost by 60-80%
- **Mention priority boost** — messages where the user is @mentioned are surfaced first
- **N-person role handling** — filters tickets by assignee name when multiple people share the same role
- **Slack source view** — each digest section links back to original Slack messages
- **Dashboard layout** — 3-column view (Critical / High / Medium+Low) for at-a-glance prioritization
- **Smart caching** — thread summaries and digests are cached to avoid redundant LLM calls

---

## System Architecture

```
Slack Messages + Jira Tickets
         ↓
   Rule-based Filter
   (role, phase, date, channel)
         ↓
   Vector DB Search (vectra)
   (keyword similarity, no LLM call)
         ↓
   LLM Personalization (Claude)
   (role + phase context injection)
         ↓
   Personalized Digest
   (Critical / High / Medium columns)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| AI | Claude API (claude-sonnet-4-6) |
| Vector DB | vectra (local) |
| Caching | In-memory + localStorage |
| Data | Mock (Slack + Jira JSON) |

---

## LLM Cost Optimization

One of the core design decisions was minimizing LLM API calls:

1. **Rule-based pre-filtering** — only messages from subscribed channels in the last 24 business hours are passed forward
2. **Vector similarity search** — vectra indexes all messages and tickets locally; only top 10 semantically similar items are selected before the LLM call
3. **Thread summarization caching** — thread summaries are cached for 24 hours and only regenerated when new messages arrive
4. **Digest caching** — generated digests are cached per role/phase combination

In production, this would be extended with:
- pgvector or Pinecone for persistent vector storage
- Real embedding API (text-embedding-3-small at $0.02/1M tokens vs $3.00/1M for claude-sonnet)
- Estimated 60-80% reduction in LLM API costs

---

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key

### Installation

```bash
git clone https://github.com/[your-username]/evercurrent-digest
cd evercurrent-digest
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Environment Setup

```bash
cd backend
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### Run

```bash
cd evercurrent-digest
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/messages | Slack messages (filtered) |
| GET | /api/tickets | Jira tickets (filtered) |
| POST | /api/digest | Generate personalized digest |
| GET | /api/digest/cache | Get cached digest |
| GET | /api/user/profile | Get user profile |
| POST | /api/user/profile | Save user profile |
| POST | /api/thread/summarize | Summarize Slack thread |
| GET | /api/silence | Silence detection alerts |
| POST | /api/digest/trigger-schedule | Manually trigger scheduled digest (dev only) |
| GET | /api/digest/scheduled | Get pre-generated scheduled digest |

---

## Design Decisions

### Why vector search before LLM?
A 6-month project generates thousands of Slack messages. Passing all of them to an LLM on every digest generation would be prohibitively expensive. Vector search filters to the top 10 most relevant items locally, then LLM reasons over that small set.

### Why role + phase combination?
A Mechanical Engineer in Validation phase cares about tolerance sign-offs and DVT checklists. The same engineer in Prototype phase cares about assembly fit and weight budget. Role alone is not enough — phase context is essential for accurate personalization.

### Why silence detection?
The biggest risk in hardware teams is not missing information — it's missing the absence of information. A ticket due in 48 hours with no Slack activity is more urgent than one with active discussion.

### Why AI provider abstraction?
The `ai.service.js` layer abstracts the LLM provider, making it trivial to swap Claude for GPT-4o or any other provider by changing one environment variable.

### Why in-memory feedback storage?

Feedback is currently stored in-memory for prototype simplicity. This means:
- Feedback persists during a server session
- Restarting the server resets feedback history
- localStorage on the frontend persists the UI state (👍/👎 button selection)

In production, this would be replaced with:
- PostgreSQL for persistent feedback storage
- Feedback weighted into vector search ranking
- A/B testing to measure digest quality over time

---

## Future Roadmap

- [ ] Real Slack API integration (OAuth + webhooks)
- [ ] Real Jira API integration (REST API v3)
- [x] Scheduled digest generation (cron job, 8AM daily)
- [x] Feedback loop — users mark sections as useful/not useful to improve future digests
- [ ] Confirmation log — track when users view digest items (audit trail for team accountability)
- [ ] Role Handoff Tracker — detect when work transitions between roles
- [ ] Phase Transition Alert — auto-update digest priorities when project phase changes
- [ ] pgvector for persistent vector storage
- [ ] Multi-user support with server-side session management
- [ ] Mobile responsive design
- [ ] Holiday calendar for silence detection
- [ ] Jira ticket creation from action items
- [x] Test coverage (Jest + Supertest)
- [ ] Persistent feedback storage (PostgreSQL)
- [ ] Feedback-weighted vector search ranking
- [ ] Digest quality metrics dashboard
```

---

## Testing

### Current Test Coverage

```bash
npm test
```

| Test Suite | Type | Tests | Status |
|-----------|------|-------|--------|
| silence.service | Unit | 12 | ✅ passing |
| vector.service | Unit | 6 | ✅ passing |
| digest API | Integration | 8 | ✅ passing |
| **Total** | | **26** | ✅ **all passing** |

### Known Limitations

Current tests run against a small, clean Mock dataset (25 messages, 21 tickets). This means:

- **Edge cases not covered** — noisy messages, typos, context-free Slack messages
- **Claude API is called directly** — no mocking, so tests incur real API cost and depend on network availability
- **No E2E tests** — onboarding → digest generation full flow is not automated

### Production Test Plan

For a production system, the following would be added:

**Unit tests**
- `thread.service` — summarization logic and cache invalidation
- `vector.service` — embedding quality and similarity threshold tuning
- `ai.service` — JSON parsing robustness with mocked Claude responses

**Integration tests**
- Cache behavior (hit/miss/expiry)
- N-person role filtering with multiple assignees
- Silence detection across all priority/phase combinations

**E2E tests (Playwright)**
- Onboarding → role selection → digest generation
- Role switch → cache invalidation → new digest
- Silence alert banner → dismiss → localStorage persistence

**API mocking**
- `jest.mock` for Claude API — consistent results, zero cost, faster CI
- Fixture-based test data with realistic noise (typos, off-topic messages, missing fields)

**CI/CD**
- GitHub Actions pipeline — run tests on every PR
- Block merge if tests fail
- Separate test/staging environment with seed data

## Scheduler

Digests are automatically generated every weekday at 8:00 AM PST for all roles.

Pre-generated digests can be retrieved without an additional LLM call:

```bash
curl "http://localhost:3001/api/digest/scheduled?role=Electrical%20Engineer&phase=Validation"
```

> **Development note:** A manual trigger endpoint is available for testing purposes.
> See `src/routes/digest.js` for implementation details.