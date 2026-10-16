# LifeLoop engineering principles

- Preserve the existing React Context / Expo architecture and daily loop.
- Make small, readable, scoped changes; reuse shared components, utilities and theme tokens.
- Preserve user changes and backward compatibility with saved data.
- Add regression tests for confirmed bugs using the existing Jest setup.
- Avoid dependencies, abstractions, speculative extension points and premature optimization.
- Do not add a backend, authentication, AI integrations, event buses, services or state libraries.
- Do not redesign the UI or change unrelated functionality.
- Keep documentation factual; distinguish automated checks from device verification.
- Do not reset, discard, automatically commit, force push or upgrade dependencies.
