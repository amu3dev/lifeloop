# LifeLoop: Ecosystem Concept

Status: all open decisions resolved on 2026-10-15. Nothing here is built yet.

## 1. Why we are rethinking LifeLoop

Today LifeLoop is four unrelated tools behind one tab bar:

| Module | What it promises | What it actually does |
|---|---|---|
| Mind Gym | "Prime your mindset" | A 1–100 number-guessing game, and the only source of points |
| Meal Mood | Meals that match your mood | A random pick from 5 meals; mood has no effect on it |
| Smart Wallet | "Stay on top of your spend" | A product-margin calculator against hard-coded competitors |
| Focus Flow | Pomodoro + todos | Exactly that, and the only module with real daily value |

There is no loop: no module feeds another, the points reward a guessing game, and the target user is unclear.

## 2. The new idea in one sentence

**LifeLoop is the context layer of a personal-life app ecosystem: it knows how your day is going and shares that with the other apps, which in turn report back what you did.**

It must still be worth opening on its own. A context hub that only feeds other apps gets no data, because nobody opens an app just to feed other apps. So LifeLoop has its own daily loop with direct value, and the context is what that loop produces.

## 3. The ecosystem

| App | Life dimension | Role in the ecosystem | Stack, storage |
|---|---|---|---|
| **LifeLoop** | The day itself | Daily loop + context hub | Expo, AsyncStorage |
| **Healthy Meal RN** | Body | Picks the meal using today's energy and day load | Expo, AsyncStorage |
| **Focus Galaxy** | Mind / priorities | Long-term priority map; nominates what deserves today | Web, localStorage (pnpm workspace already has API/DB packages for later) |
| **Zekr** | Spirit | Morning/evening adhkar anchor the start and end of the loop | Expo, AsyncStorage, **100% offline, zero permissions** |
| **ProofLayer** | Career | Receives "shipped / achieved" evidence from focused work (later) | Local-first |

SignalBoard, the consulting site, BrewAndBean and OriginAndOak are business projects and are out of scope.

## 4. The daily loop

1. **Morning check-in (about 30 s):** energy 1–5, mood, sleep quality, and today's top 3 (suggested from Focus Galaxy, confirmed by the user). Optionally opened right after morning adhkar in Zekr.
2. **During the day:** focus sessions against the top 3 (today's Focus Flow, kept and improved).
3. **Evening review (about 30 s):** what got done and how the day felt. Events reported by the other apps (meal eaten, adhkar done) are already filled in.
4. **Over weeks:** patterns such as "you focus better on days you slept well" or "heavy lunches precede your weakest afternoon sessions".

The streak counts days where the loop was closed (check-in + review), not guessing-game points.

### Loop timing (decided 2026-10-15)

The loop is defined by actions (check-in, focus, review), not by the clock. Timing only controls **reminders** and **where one day ends and the next begins**. The user chooses the timing mode during onboarding and can change it later in settings:

| | Fixed times | Prayer-anchored |
|---|---|---|
| Check-in reminder | User's chosen wake-up time | After Fajr, or when morning adhkar are finished in Zekr (once Zekr is connected) |
| Review reminder | User's chosen wind-down time | After Isha |
| Day boundary | 04:00 local time, not midnight, so late nights count toward the right day | Fajr |
| Setup | Two time pickers | City picked manually; prayer times calculated offline on the device (e.g. `adhan-js`) with no location permission |

Notes:
- The evening review is **not** tied to evening adhkar. Their window (Asr to Maghrib) is too early for reviewing the day.
- Check-in is always available as soon as the app is opened, whatever the mode. Reminders are only nudges.

## 5. Context contract (v0)

Two shapes: one **DailyContext** that LifeLoop publishes, and **LoopEvents** that apps report back. Both are versioned so apps can ignore fields they don't understand.

```ts
// Published by LifeLoop, read by other apps.
type DailyContext = {
  schemaVersion: 0;
  date: string;            // local date, YYYY-MM-DD
  checkedInAt?: string;    // ISO timestamp; absent until morning check-in
  energy?: 1 | 2 | 3 | 4 | 5;
  mood?: 'great' | 'good' | 'okay' | 'low' | 'stressed';
  sleep?: 'poor' | 'ok' | 'good';
  dayLoad?: 'light' | 'normal' | 'heavy';   // derived from top-3 effort
  topPriorities: Array<{ id: string; title: string; source: 'lifeloop' | 'focus-galaxy' }>;
  focusMinutes: number;
  reviewedAt?: string;     // evening review done
};

// Reported by any app, read by LifeLoop.
type LoopEvent = {
  schemaVersion: 0;
  id: string;              // unique, so replays are idempotent
  app: 'healthy-meal' | 'focus-galaxy' | 'zekr' | 'prooflayer';
  type:
    | 'meal.chosen'          // { mealId, title, tags }
    | 'priority.nominated'   // { priorityId, title, importance, urgency, effort }
    | 'dhikr.session.completed' // { kind: 'morning' | 'evening' | 'other' }
    | 'evidence.captured';   // { title }  (later)
  at: string;              // ISO timestamp
  payload: Record<string, unknown>;
};
```

Deliberately minimal. No free-text journal and no counts or content from Zekr beyond "a session was completed". Fields are added only when a consuming app needs them.

### Where the contract lives (decided 2026-10-15)

- **Phase 1:** inside LifeLoop at `contract/`, written so it can be moved out unchanged. Only LifeLoop uses it at this point.
- **From Phase 2:** its own **public** repo, `loop-contract`, installed by git tag (`npm install github:<user>/loop-contract#v0.1.0`). There is no npm registry and nothing to publish. Each app upgrades the version when it is ready.
- **Contents:**
  - Types (`DailyContext`, `LoopEvent`, `schemaVersion`).
  - Small hand-written validators with zero runtime dependencies, which keeps Zekr's dependency footprint minimal.
  - Deep-link encode/decode helpers for Stage A.
  - Golden fixtures that every app runs in its own tests.
- **Build output:** plain JS plus `.d.ts`, so it works in LifeLoop (JS), Zekr (TS) and Focus Galaxy (web).
- **Why not copy a folder into each app:** the contract is exactly the part that must not drift. Four hand-synced copies would drift silently, and the integration would break without errors.

## 6. What each app reads and writes

| App | Reads from LifeLoop | Writes to LifeLoop | First useful behaviour |
|---|---|---|---|
| Healthy Meal | `energy`, `dayLoad`, `mood` | `meal.chosen` | Low energy or heavy day → lighter, steadier-energy meal of the day |
| Focus Galaxy | `focusMinutes`, `topPriorities` (to show progress) | `priority.nominated` | The top 3 by Focus Score appear as suggestions in the morning check-in |
| Zekr | nothing (stays fully offline) | `dhikr.session.completed`, only if the user opts in | Finishing morning adhkar offers "Continue your day in LifeLoop" (off by default) |
| ProofLayer | completed priorities (later) | `evidence.captured` (later) | Weekly "things you shipped" become evidence candidates |

### Per-app decisions (decided 2026-10-15)

**Focus Galaxy stays a web app** and is positioned as the weekly planning tool for a big screen. LifeLoop is the phone tool for daily execution. There will be no Expo shell, which would only duplicate LifeLoop on the phone.
- Stage A: a "Send top 3 to LifeLoop" button in Focus Galaxy shows a **QR code** containing a `lifeloop://` link. Scanning it with the phone camera opens LifeLoop with the priorities pre-filled as check-in suggestions. No backend is involved, and nothing leaves the two devices.
- Stage B: sync builds on the API and DB packages already in Focus Galaxy's pnpm workspace.

**Healthy Meal stays deterministic, and context becomes one more input.**
- Today `getDailyMeal` (`lib/mealUtils.js`) hashes the local date key plus the enabled preferences. `energy` and `dayLoad` join that selection key and filter candidates with simple, explainable rules over the existing meal fields (`calories`, `protein`, `tags`). For example, a heavy day prefers lighter meals.
- **Lock on choice:** once the user chooses the day's meal, it is pinned for that date and `meal.chosen` is emitted. Context only affects the pick if it arrives before the choice, so the meal never changes under the user mid-day.
- The reason is shown ("Picked because you said your energy is low"). No medical or nutritional claims; it is a preference rule.

**Zekr gets the smallest possible integration: opt-in and off by default.**
- After morning adhkar, a "Continue your day in LifeLoop" button appears **only if the user has turned it on in settings**.
- The button opens LifeLoop on the same phone with a link carrying only `kind=morning`. No counts, no adhkar, no other details.
- This keeps the manifesto: no permissions, no internet, nothing leaves the phone. Add one line to Zekr's manifesto stating this explicitly.
- Fallback if the user prefers Zekr unchanged: LifeLoop shows an "Open Zekr" button in prayer-anchored mode, and Zekr sends nothing.

## 7. Privacy principles

1. **Per-app, per-field opt-in.** The user sees exactly what each app shares and can revoke it.
2. **Zekr's promise is non-negotiable.** Zekr is 100% offline with zero permissions, so it never syncs to a server. Its only integration is the opt-in, off-by-default handoff on the same phone described in section 6.
   - **Zekr is Sadaqah Jariyah and non-profit.** If LifeLoop ever has subscriptions, ads or any paid tier, Zekr must never be used as an acquisition channel for it: no prompts, no promotion, and no default-on links.
3. **Local-first by default.** Every app stays fully usable with no ecosystem connection.
4. **Derived, not raw.** Share `dayLoad: 'heavy'`, not the task titles, unless the receiving app needs titles (only Focus Galaxy does).

## 8. How data moves between apps

Separate apps on one phone cannot read each other's AsyncStorage, and Focus Galaxy is a web app. Options, in order:

| Stage | Transport | Good for | Limits |
|---|---|---|---|
| A | **Deep links / URL handoff** (`lifeloop://event?...`, `healthymeal://today?energy=2&load=heavy`), plus a **QR code** carrying the same link when the source is Focus Galaxy on a desktop browser | Personal use, demos, Zekr, Focus Galaxy | One-shot, user-initiated, no background sync |
| B | **Small shared backend** (e.g. Supabase: one account, `daily_context` and `loop_events` tables, row-level security) | Real sync across all apps including web | Needs auth, a privacy policy, and per-app consent; never used by Zekr |

Recommendation: build the contract once (section 5), ship Stage A first, and move to Stage B only when the loop has proven itself in daily use.

## 9. What happens to the current modules

| Module | Decision |
|---|---|
| Focus Flow | **Keep.** It becomes the "during the day" part of the loop, working on the top 3. |
| Meal Mood | **Remove.** Healthy Meal RN does meals properly; mood moves into the morning check-in. |
| Smart Wallet | **Remove.** It solves a shop-owner problem, not a personal-life one. |
| Mind Gym | **Remove.** |
| Home | **Redesign** into "Your day": check-in state, top 3, focus progress, and today's events from other apps. |

The visual redesign done so far (theme tokens, shared Header/Card/Button/TextField/ProgressRing) carries over unchanged.

## 10. Phases and exit criteria

| Phase | Scope | Done when |
|---|---|---|
| **1. Loop MVP** (personal use) | Morning check-in, top 3, focus sessions, evening review, local `DailyContext`, loop-based streak, timing mode chosen at onboarding (fixed or prayer-anchored); remove the three modules | You use it every day for two weeks without forcing it |
| **2. First connection** | Move `contract/` into the public `loop-contract` repo and tag `v0.1.0`; deep-link handoff LifeLoop → Healthy Meal (`energy`, `dayLoad`) and back (`meal.chosen`) | Healthy Meal's daily pick visibly changes with your check-in, and the review shows the meal |
| **3. Ecosystem** (portfolio) | Focus Galaxy → top-3 suggestions; Zekr opt-in handoff; a case-study write-up of the system | Three apps connected; demo video and docs ready |
| **4. Release** | Stage B backend, auth, consent screens, privacy policy, store listing | A stranger can install it, connect one app, and understand what is shared |

## 11. Open decisions

1. ~~**Loop timing**~~ Decided: the user chooses fixed times or prayer-anchored (see section 4, "Loop timing").
2. ~~**Contract home**~~ Decided: `contract/` inside LifeLoop for Phase 1, then a public `loop-contract` repo installed by git tag (see section 5).
3. ~~**Focus Galaxy on mobile**~~ Decided: it stays web, used for weekly planning, with a QR handoff in Stage A (see section 6).
4. ~~**Healthy Meal changes**~~ Decided: it stays deterministic, context is added as an input, and the meal locks once chosen (see section 6).
5. ~~**Zekr**~~ Decided: an opt-in, off-by-default handoff carrying only `kind=morning`, plus the non-profit rule (see sections 6 and 7).

All open decisions are resolved. Next step: Phase 1, the Loop MVP.
