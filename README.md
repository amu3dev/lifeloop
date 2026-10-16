# LifeLoop

LifeLoop is an Expo app built around one small loop every day: check in, focus on your top 3, and review. Its future ecosystem role is to connect meaningful daily context across personal-life apps. The current app is standalone; no cross-app connections are implemented. See [docs/ecosystem-concept.md](docs/ecosystem-concept.md) for the full concept, decisions and phases.

This is **LifeLoop 0.2, the standalone daily loop**: LifeLoop on its own, with no connections to other apps yet.

## Features

- **Onboarding**: explains the loop and asks how it should be timed:
  - **Fixed times**: a wake-up time and a wind-down time. Late nights until 4:00 AM still count toward the same day.
  - **Prayer times**: check in after Fajr and review after Isha. Times are calculated on the phone from a city you pick, with no location permission.
- **Morning check-in**: energy (1–5), mood, sleep, and up to 3 priorities with an effort level. Unfinished priorities from yesterday are offered again.
- **Focus**: a 25/5 Pomodoro timer with an optional 15-minute focus duration. Energy 1–2 suggests starting with 15 minutes; energy 3–5 or no check-in uses the 25-minute recommendation. Choose the duration yourself before starting; a running or paused block is never changed by a new check-in. Breaks remain five minutes. Running and paused timers, selected duration, original priority ID/title and owning loop day persist on the device. Finished blocks are recorded once, even when restored after their end time.
- **Evening review**: mark what got done and how the day felt. A loop is closed only when both check-in and review exist; focus is optional. Check-in and review drafts keep the loop date they were opened for, with an explicit confirmation if saved after the day boundary.
- **Today**: your loop streak, the three loop steps, the next thing to do, progress on your top 3 and focus, and the last seven loop days. History shows check-in/review status, completed priorities, focus minutes and energy, distinguishing missing records from recorded zero activity.

Everything is stored on the device with AsyncStorage. Missing storage initializes normally. Unreadable JSON, unsafe saved structure or a read failure blocks hydration and persistence, leaving the stored value untouched. The recovery screen offers a retry; it never clears data automatically. A write failure shows a retry banner.

Timer advancement and session history are saved together under the existing storage key. On foreground/restart the timer reconciles against wall-clock timestamps, with no background service. After focus ends, the five-minute break keeps its original end time. As before, a break followed by a focus phase that has also elapsed while away returns to an idle timer, rather than inventing unattended focus blocks. Reset discards unfinished time but preserves an already completed block and the chosen duration.

AsyncStorage writes are asynchronous: an immediate process kill before a write finishes can lose the latest change. Keep the app open if it reports a save error. Unsaved form drafts remain in memory while open; they are not restored after process termination. Recovery preserves unreadable data but does not repair it or provide an export/reset workflow.

## Tech stack

- Expo SDK 57 (React Native 0.86, React 19)
- React Navigation 7 (native stack + bottom tabs)
- React Context for state, AsyncStorage for persistence
- [adhan](https://github.com/batoulapps/adhan-js) for offline prayer times
- react-native-svg for the progress rings
- Jest with `jest-expo`

## Getting started

```bash
npm install
npm start
```

Running in the iOS Simulator with Expo Go requires the Expo Go build for SDK 57.

## Tests

```bash
npm test
```

Tests cover loop timing, streak/next-action consistency, strict context validation, safe storage hydration, provider restart/persistence, timer attribution/completion, form boundary handling, focus suggestions and seven-day history. Component tests use mocked native surfaces and do not establish device behavior. `npm test` runs with `TZ=Africa/Cairo` so the prayer-time tests use a fixed time zone. If Watchman is unavailable or restricted, run `npm test -- --runInBand --watchman=false`.

## Project structure

```
App.js                     Navigation: onboarding gate, Today/Focus tabs, modal screens
contract/dailyContext.js   Context contract v0 (moves to its own repo in Phase 2)
context/AppContext.js      Loop state, actions and derived values
lib/                       Pure logic: loop timing, streak, focus timer, next action, cities
screens/                   Today, Onboarding, Check-in, Review, Settings
modules/focus-flow/        Focus timer and today's top 3
components/shared/         Header, Card, Button, TextField, OptionChips, ProgressRing, ...
theme/theme.js             Design tokens (colors, spacing, radius, font sizes)
docs/                      Ecosystem concept
__tests__/                 Jest tests for lib/ and contract/
```

## Manual testing checklist

- Onboard with each timing mode and check that Today shows the right review time.
- Check in with three priorities, including one typed but not added with the Add button.
- With energy 1 or 2, choose 15 minutes and confirm the real countdown starts at 15:00; repeat with 25 minutes. Ensure check-in edits do not change an active/paused block.
- Start a focus block, lock the phone for a few minutes, and check that the countdown has moved on. Pause/resume, switch tabs and remount, then terminate/relaunch after a saved running or paused block. Confirm the original duration, priority and date remain, and completion is recorded once.
- Complete/delete the original priority during a block; verify its historical ID/title remains attributed correctly.
- In fixed and prayer modes, open check-in/review just before 04:00/Fajr and save after it. Keep editing once, then save to the original date and verify today stays separate. Restore a timer spanning each boundary.
- On disposable test data, inject malformed JSON or simulate a read error. Confirm recovery appears and the exact stored bytes remain unchanged. Restore valid bytes and retry. Simulate a failed write and retry saving.
- Inspect empty and partially populated seven-day history, including month/year boundaries. Check large text, screen-reader labels, recovery/alert layout and the added history on both platforms.
- Tick priorities in Review, close with ✕, and check that nothing changed; then close the loop and check that the streak goes up.

## Validation and product limits

For 0.2, automated validation passed with 103 tests across 8 Jest suites. `expo export --platform ios --platform android` generated both JavaScript/Hermes bundles. No device or simulator validation was performed; the manual checks above remain required. An export is not a native build or production-readiness claim.

`dayLoad` still sums priority effort (small = 1, medium = 2, large = 3): totals up to 3 are light, 4–6 normal, 7+ heavy, with no priorities left unspecified. This means one large priority is light under the existing rule. Whether load should instead reflect individual intensity is a deferred product decision; 0.2 does not change that meaning.

## What's next

- Local reminders for check-in and review.
- Phase 2: move the contract to its own repo and connect Healthy Meal.

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`.
2. Run `npm test` before committing.
3. Open a pull request and describe your changes.
