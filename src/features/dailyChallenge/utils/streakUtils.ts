/**
 * Pure streak-computation utilities.
 * All date arithmetic uses UTC-canonical YYYY-MM-DD strings from daily_challenges.challenge_date.
 * Never parses local timezone Date objects to avoid off-by-one bugs.
 */

/**
 * Convert YYYY-MM-DD string to a simple integer day-index for arithmetic.
 * Uses UTC year/month/day so timezone never shifts the calendar date.
 */
function dateToDayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Compute days from a fixed epoch (2000-01-01) purely via month counts
  const EPOCH_YEAR = 2000;
  let days = 0;
  for (let yr = EPOCH_YEAR; yr < y; yr++) {
    days += isLeapYear(yr) ? 366 : 365;
  }
  const MONTH_DAYS = [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let mo = 1; mo < m; mo++) {
    days += MONTH_DAYS[mo - 1];
  }
  days += d;
  return days;
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Compute current and longest streak from an array of completion dates.
 *
 * Current streak rules:
 *   - Latest date is TODAY → count consecutive days back from today.
 *   - Latest date is YESTERDAY → streak still active (user has today left).
 *   - Latest date older than yesterday → currentStreak = 0.
 *
 * Longest streak: max consecutive-date run in full history.
 *
 * @param completionDates Array of YYYY-MM-DD strings (may be unsorted, may have duplicates)
 * @param todayStr YYYY-MM-DD of today (UTC). Pass explicitly to keep the function pure/testable.
 */
export function computeStreak(completionDates: string[], todayStr: string): StreakResult {
  if (completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Deduplicate and sort ascending
  const unique = Array.from(new Set(completionDates)).sort();
  const dayIndexes = unique.map(dateToDayIndex);

  // Compute longest streak over full history
  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < dayIndexes.length; i++) {
    if (dayIndexes[i] === dayIndexes[i - 1] + 1) {
      runLength++;
      longestStreak = Math.max(longestStreak, runLength);
    } else {
      runLength = 1;
    }
  }

  // Current streak
  const todayIndex = dateToDayIndex(todayStr);
  const latestIndex = dayIndexes[dayIndexes.length - 1];
  const gap = todayIndex - latestIndex;

  // If latest is older than yesterday, streak is broken
  if (gap > 1) {
    return { currentStreak: 0, longestStreak };
  }

  // Count backward from latest (inclusive of latest)
  let currentStreak = 1;
  for (let i = dayIndexes.length - 2; i >= 0; i--) {
    if (dayIndexes[i + 1] - dayIndexes[i] === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Returns today's UTC date as YYYY-MM-DD string.
 */
export function getUtcTodayString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
