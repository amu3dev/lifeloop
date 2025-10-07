# LifeLoop

LifeLoop is a modular Expo app designed to help you close daily loops across focus, wellness, finance, and nutrition. The calm dashboard surfaces your progress and links into four habit-forming modules: Mind Gym, Meal Mood, Smart Wallet, and Focus Flow.

## Features

- **Home Dashboard** – Subtle fade-in summary of points, streaks, mood, todo completion, and the latest wallet metric.
- **Mind Gym** – Random number guessing mini-game that awards bonus points for correct answers.
- **Meal Mood** – Rotates healthy meal suggestions, remembers the last pick, and lets you tag your current mood.
- **Smart Wallet** – Calculates product margins, benchmarks against competitors, and saves entries in AsyncStorage.
- **Focus Flow** – Todo list with full CRUD plus a Pomodoro timer (25/5) that rewards streaks when tasks are cleared.
- **Persistent State** – AsyncStorage-backed AppContext keeps your data across sessions.
- **Reusable UI** – Custom header, info cards, and bottom navigation bar for a balanced, minimal interface.

## Tech Stack

- Expo SDK 52 (React Native 0.76)
- React Navigation (native stack + bottom tabs)
- React Context API with custom hook
- AsyncStorage for persistence
- Animated API for subtle UI motion
- @expo/vector-icons for iconography

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the app**

   ```bash
   npm run start         # opens Expo Dev Tools
   npm run ios           # launch iOS simulator
   npm run android       # launch Android emulator
   npm run web           # experimental web build
   ```

3. **Troubleshooting**

   - Ensure Expo CLI and platform toolchains (Xcode / Android Studio) are installed.
   - If AsyncStorage data becomes stale, run `expo start --clear` or reinstall the app in the simulator/emulator.

## Project Structure

```
lifeloop/
├── App.js
├── assets/
├── components/
│   └── shared/
│       ├── Header.js
│       ├── InfoCard.js
│       └── BottomNav.js
├── context/
│   └── AppContext.js
├── modules/
│   ├── mind-gym/
│   ├── meal-mood/
│   ├── smart-wallet/
│   └── focus-flow/
├── prompts/
│   └── prompt*.txt
├── screens/
│   └── HomeScreen.js
└── package.json
```

## App Context Overview

`context/AppContext.js` exports the global state and actions:

- State: `points`, `streaks`, `todayMood`, `walletHistory`, `todos`
- Actions: `addPoints`, `resetDay`, `addWalletEntry`, `addTodo`, `updateTodo`, `removeTodo`, `toggleTodo`, `setMood`
- Hook: `useAppContext()` for consuming state/actions in any screen or component

## Manual Testing Checklist

- Mind Gym: play until you win and confirm points increment.
- Meal Mood: press “New Meal,” set moods, and reload to verify persistence.
- Smart Wallet: add a product margin and confirm it appears in history after restart.
- Focus Flow: add/edit/delete todos, run the Pomodoro timer through a cycle, and check streak messaging.

## Future Enhancements

- Multi-device sync with authentication
- Push notifications or reminders
- Charts for Smart Wallet insights
- Localization and accessibility passes

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit changes: `git commit -m "Add descriptive message"`.
4. Push to the branch: `git push origin feature/my-feature`.
5. Open a pull request and describe your changes.

---

Built with ❤️ to keep your life loops tight.

