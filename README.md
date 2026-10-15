# LifeLoop

LifeLoop is an Expo app built around one small loop every day: check in, focus on your top 3, and review. It is also meant to be the context layer for a set of personal-life apps (Healthy Meal, Focus Galaxy, Zekr): it knows how your day is going and will share that with them. See [docs/ecosystem-concept.md](docs/ecosystem-concept.md) for the full concept, decisions and phases.

This is **Phase 1, the Loop MVP**: LifeLoop on its own, with no connections to other apps yet.

## Features

- **Onboarding**: explains the loop and asks how it should be timed:
  - **Fixed times**: a wake-up time and a wind-down time. Late nights until 4:00 AM still count toward the same day.
  - **Prayer times**: check in after Fajr and review after Isha. Times are calculated on the phone from a city you pick, with no location permission.
- **Morning check-in**: energy (1–5), mood, sleep, and up to 3 priorities with an effort level. Unfinished priorities from yesterday are offered again.
- **Focus**: a 25/5 Pomodoro timer. Each finished block is logged against the priority you chose. The timer runs on wall-clock time, so it stays accurate while the phone is locked.
- **Evening review**: mark what got done and how the day felt, which closes the loop.
- **Today**: your loop streak, the three loop steps, the next thing to do, and progress on your top 3 and focus.

Everything is stored on the device with AsyncStorage.

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

Tests cover the loop logic: day boundaries (04:00 and Fajr), loop anchors, fixed-time validation, the streak, the focus timer, Home's next-action rules, and the context contract. `npm test` runs with `TZ=Africa/Cairo` so the prayer-time tests use a fixed time zone.

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
- Start a focus block, lock the phone for a few minutes, and check that the countdown has moved on.
- Tick priorities in Review, close with ✕, and check that nothing changed; then close the loop and check that the streak goes up.

## What's next

- Local reminders for check-in and review.
- Phase 2: move the contract to its own repo and connect Healthy Meal.

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`.
2. Run `npm test` before committing.
3. Open a pull request and describe your changes.
