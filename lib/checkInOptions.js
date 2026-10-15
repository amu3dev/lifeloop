// Display options for the contract's check-in and review values.
export const ENERGY_OPTIONS = [1, 2, 3, 4, 5].map(level => ({
  value: level,
  label: String(level),
  accessibilityLabel: `Energy ${level} of 5`
}));

export const MOOD_OPTIONS = [
  { value: 'great', label: 'Great', icon: 'sentiment-very-satisfied' },
  { value: 'good', label: 'Good', icon: 'sentiment-satisfied-alt' },
  { value: 'okay', label: 'Okay', icon: 'sentiment-neutral' },
  { value: 'low', label: 'Low', icon: 'sentiment-dissatisfied' },
  { value: 'stressed', label: 'Stressed', icon: 'sentiment-very-dissatisfied' }
];

export const SLEEP_OPTIONS = [
  { value: 'poor', label: 'Poorly' },
  { value: 'ok', label: 'OK' },
  { value: 'good', label: 'Well' }
];

export const EFFORT_OPTIONS = [
  { value: 'small', label: 'Quick' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Big' }
];

export const getMoodOption = mood => MOOD_OPTIONS.find(option => option.value === mood);
