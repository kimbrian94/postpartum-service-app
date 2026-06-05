import { parseISO, addDays, getDay, format } from 'date-fns';

/**
 * Calculate the end date for a postpartum care assignment based on service parameters.
 * Counts exactly (daysPerWeek × totalWeeks) service days, respecting weekly schedules.
 * 
 * Service day rules:
 * - 5 days/week: Monday-Friday only (skip Saturday and Sunday)
 * - 6 days/week: Monday-Saturday only (skip Sunday)
 * 
 * @param startDate - ISO date string (YYYY-MM-DD) for the start date
 * @param daysPerWeek - Number of service days per week (5 or 6)
 * @param totalWeeks - Number of weeks of service
 * @returns ISO date string (YYYY-MM-DD) for the calculated end date
 * 
 * @example
 * // Friday start, 5 days/week for 2 weeks (10 service days total)
 * // Fri(1) -> skip Sat-Sun -> Mon-Fri(5) -> skip Sat-Sun -> Mon-Thu(4) = 10 days
 * calculateEndDate('2026-05-08', 5, 2)
 * // Returns: '2026-05-21' (Thursday, 2 weeks + 1 day later)
 * 
 * @example
 * // Monday start, 6 days/week for 2 weeks (12 service days total)
 * // Mon-Sat(6) -> skip Sun -> Mon-Sat(6) = 12 days
 * calculateEndDate('2026-05-04', 6, 2)
 * // Returns: '2026-05-16' (Saturday, 1 week + 5 days later)
 */
export function calculateEndDate(
  startDate: string,
  daysPerWeek: number,
  totalWeeks: number
): string {
  if (!startDate || !daysPerWeek || !totalWeeks) {
    return '';
  }

  const totalServiceDays = daysPerWeek * totalWeeks;
  let currentDate = parseISO(startDate);
  let serviceDaysCounted = 0;

  // Determine which days are serviceable based on daysPerWeek
  const isServiceableDay = (dayOfWeek: number): boolean => {
    if (daysPerWeek === 5) {
      // 5 days/week: Monday(1) to Friday(5) only
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (daysPerWeek === 6) {
      // 6 days/week: Monday(1) to Saturday(6) only
      return dayOfWeek >= 1 && dayOfWeek <= 6;
    } else {
      // For other values, skip only Sunday (fallback to previous behavior)
      return dayOfWeek !== 0;
    }
  };

  // Validate and count the start date if it's a serviceable day
  const startDayOfWeek = getDay(currentDate); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  if (startDayOfWeek === 0) {
    // Start date is Sunday - should not happen due to validation
    return '';
  }
  
  if (!isServiceableDay(startDayOfWeek)) {
    // Start date is not a serviceable day (e.g., Saturday for 5 days/week)
    return '';
  }

  serviceDaysCounted = 1; // Count the start date

  // Keep adding days until we've counted the required number of service days
  while (serviceDaysCounted < totalServiceDays) {
    currentDate = addDays(currentDate, 1);
    const dayOfWeek = getDay(currentDate);
    
    // Count only serviceable days
    if (isServiceableDay(dayOfWeek)) {
      serviceDaysCounted++;
    }
  }

  // Return as ISO date string (YYYY-MM-DD)
  return format(currentDate, 'yyyy-MM-dd');
}

/**
 * Check if a given date is a Sunday.
 * 
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns true if the date is a Sunday, false otherwise
 */
export function isSunday(dateString: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return getDay(date) === 0;
}

/**
 * Check if a given date is valid for a specific days/week schedule.
 * 
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @param daysPerWeek - Number of service days per week (5 or 6)
 * @returns true if the date is valid for the schedule, false otherwise
 */
export function isValidStartDate(dateString: string, daysPerWeek: number): boolean {
  if (!dateString) return false;
  
  const date = parseISO(dateString);
  const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Sunday is never valid
  if (dayOfWeek === 0) return false;
  
  // For 5 days/week, Saturday is also not valid
  if (daysPerWeek === 5 && dayOfWeek === 6) {
    return false;
  }
  
  // For 6 days/week, Monday-Saturday are valid
  return true;
}

/**
 * Get a human-readable day name for a date.
 * 
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Day name (e.g., "Monday", "Sunday")
 */
export function getDayName(dateString: string): string {
  if (!dateString) return '';
  const date = parseISO(dateString);
  return format(date, 'EEEE');
}

/**
 * Get the serviceable day range description for a schedule.
 * 
 * @param daysPerWeek - Number of service days per week (5 or 6)
 * @returns Description of serviceable days
 */
export function getServiceDaysDescription(daysPerWeek: number): string {
  if (daysPerWeek === 5) {
    return 'Monday-Friday only';
  } else if (daysPerWeek === 6) {
    return 'Monday-Saturday only';
  }
  return 'Monday-Saturday (excluding Sunday)';
}
