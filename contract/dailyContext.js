// Context contract v0 (see docs/ecosystem-concept.md, section 5).
// Kept free of app imports so it can move to the loop-contract repo unchanged.

export const SCHEMA_VERSION = 0;

export const ENERGY_LEVELS = [1, 2, 3, 4, 5];
export const MOODS = ['great', 'good', 'okay', 'low', 'stressed'];
export const SLEEP_LEVELS = ['poor', 'ok', 'good'];
export const DAY_LOADS = ['light', 'normal', 'heavy'];
export const EFFORTS = ['small', 'medium', 'large'];

const EFFORT_WEIGHT = { small: 1, medium: 2, large: 3 };

/**
 * @typedef {Object} DailyContext
 * @property {0} schemaVersion
 * @property {string} date YYYY-MM-DD, the loop day (not always the calendar day)
 * @property {string} [checkedInAt]
 * @property {1|2|3|4|5} [energy]
 * @property {'great'|'good'|'okay'|'low'|'stressed'} [mood]
 * @property {'poor'|'ok'|'good'} [sleep]
 * @property {'light'|'normal'|'heavy'} [dayLoad]
 * @property {{ id: string, title: string, source: 'lifeloop'|'focus-galaxy' }[]} topPriorities
 * @property {number} focusMinutes
 * @property {string} [reviewedAt]
 */

// Derives how demanding the day is from the effort of its priorities.
export const deriveDayLoad = priorities => {
  if (!priorities || priorities.length === 0) {
    return undefined;
  }

  const total = priorities.reduce(
    (sum, priority) => sum + (EFFORT_WEIGHT[priority.effort] ?? EFFORT_WEIGHT.medium),
    0
  );

  if (total <= 3) {
    return 'light';
  }
  if (total <= 6) {
    return 'normal';
  }
  return 'heavy';
};

/**
 * Builds the published context from a stored day record.
 * @returns {DailyContext}
 */
export const buildDailyContext = (date, day = {}) => {
  const priorities = day.priorities ?? [];
  const context = {
    schemaVersion: SCHEMA_VERSION,
    date,
    topPriorities: priorities.map(({ id, title, source }) => ({
      id,
      title,
      source: source ?? 'lifeloop'
    })),
    focusMinutes: (day.focusSessions ?? []).reduce(
      (sum, session) => sum + (session.minutes ?? 0),
      0
    )
  };

  if (day.checkIn) {
    context.checkedInAt = day.checkIn.at;
    context.energy = day.checkIn.energy;
    context.mood = day.checkIn.mood;
    context.sleep = day.checkIn.sleep;
  }

  const dayLoad = deriveDayLoad(priorities);
  if (dayLoad) {
    context.dayLoad = dayLoad;
  }

  if (day.review) {
    context.reviewedAt = day.review.at;
  }

  return context;
};

// Round-trip the calendar portion to reject normalization of dates such as February 30.
export const isCalendarDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const isTimestamp = value => {
  if (typeof value !== 'string') return false;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/);
  return Boolean(match && isCalendarDate(match[1]) && Number.isFinite(Date.parse(value)));
};

// Returns a list of problems; an empty list means the context is valid.
export const validateDailyContext = context => {
  const errors = [];
  if (!context || typeof context !== 'object' || Array.isArray(context)) return ['context must be an object'];
  if (context.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  if (!isCalendarDate(context.date)) errors.push('date must be YYYY-MM-DD');
  for (const key of ['checkedInAt', 'reviewedAt']) {
    if (context[key] !== undefined && !isTimestamp(context[key])) errors.push(`${key} must be an ISO timestamp`);
  }
  if (context.energy !== undefined && !ENERGY_LEVELS.includes(context.energy)) errors.push('energy must be 1-5');
  if (context.mood !== undefined && !MOODS.includes(context.mood)) errors.push(`mood must be one of ${MOODS.join(', ')}`);
  if (context.sleep !== undefined && !SLEEP_LEVELS.includes(context.sleep)) errors.push(`sleep must be one of ${SLEEP_LEVELS.join(', ')}`);
  if (context.dayLoad !== undefined && !DAY_LOADS.includes(context.dayLoad)) errors.push(`dayLoad must be one of ${DAY_LOADS.join(', ')}`);
  if (!Array.isArray(context.topPriorities)) {
    errors.push('topPriorities must be an array');
  } else if (context.topPriorities.some(priority =>
    !priority || typeof priority !== 'object' || Array.isArray(priority) ||
    typeof priority.id !== 'string' || !priority.id.trim() ||
    typeof priority.title !== 'string' || !priority.title.trim() ||
    !['lifeloop', 'focus-galaxy'].includes(priority.source)
  )) {
    errors.push('topPriorities must contain priorities with id, title and supported source');
  }
  if (!Number.isFinite(context.focusMinutes) || context.focusMinutes < 0) errors.push('focusMinutes must be a non-negative number');
  return errors;
};
