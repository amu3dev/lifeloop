// Shared design tokens so every screen draws from one palette and scale.
export const colors = {
  background: '#F7F6F2',
  surface: '#FFFFFF',
  ink: '#1C1C1A',
  inkMuted: '#5F5E5A',
  inkSubtle: '#888780',
  border: '#D3D1C7',
  hero: '#1C1C1A',
  heroText: '#F7F6F2',
  heroMuted: '#B4B2A9',
  heroDivider: '#444441',
  streak: '#F0997B',
  positive: '#97C459'
};

// Accent sets: Loop is the daily check-in/review, FocusFlow is the focus timer.
export const moduleThemes = {
  Loop: { background: '#EDEBE4', accent: '#1C1C1A', ink: '#1C1C1A' },
  FocusFlow: { background: '#E6F1FB', accent: '#185FA5', ink: '#042C53' }
};

// Track, fill, and label colours for the progress rings and mood tile.
export const statThemes = {
  todos: { track: '#E1F5EE', fill: '#1D9E75', ink: '#085041' },
  focus: { track: '#E6F1FB', fill: '#378ADD', ink: '#0C447C' },
  mood: { background: '#FAEEDA', ink: '#854F0B' }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  pill: 999
};

export const fontSize = {
  caption: 12,
  body: 15,
  heading: 17,
  title: 24,
  display: 34,
  hero: 56
};
