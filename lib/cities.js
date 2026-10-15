// Cities offered for prayer-anchored timing. Picked manually so the app
// never needs location permission. `method` is an adhan CalculationMethod name.
export const CITIES = [
  { id: 'cairo', name: 'Cairo', latitude: 30.0444, longitude: 31.2357, method: 'Egyptian' },
  { id: 'alexandria', name: 'Alexandria', latitude: 31.2001, longitude: 29.9187, method: 'Egyptian' },
  { id: 'mecca', name: 'Mecca', latitude: 21.3891, longitude: 39.8579, method: 'UmmAlQura' },
  { id: 'medina', name: 'Medina', latitude: 24.5247, longitude: 39.5692, method: 'UmmAlQura' },
  { id: 'riyadh', name: 'Riyadh', latitude: 24.7136, longitude: 46.6753, method: 'UmmAlQura' },
  { id: 'jeddah', name: 'Jeddah', latitude: 21.4858, longitude: 39.1925, method: 'UmmAlQura' },
  { id: 'dubai', name: 'Dubai', latitude: 25.2048, longitude: 55.2708, method: 'Dubai' },
  { id: 'doha', name: 'Doha', latitude: 25.2854, longitude: 51.531, method: 'Qatar' },
  { id: 'kuwait', name: 'Kuwait City', latitude: 29.3759, longitude: 47.9774, method: 'Kuwait' },
  { id: 'istanbul', name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, method: 'Turkey' },
  { id: 'london', name: 'London', latitude: 51.5074, longitude: -0.1278, method: 'MoonsightingCommittee' },
  { id: 'new-york', name: 'New York', latitude: 40.7128, longitude: -74.006, method: 'NorthAmerica' }
];

export const getCity = cityId => CITIES.find(city => city.id === cityId) ?? CITIES[0];
