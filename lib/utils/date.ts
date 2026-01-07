import { format, startOfISOWeek, endOfISOWeek, addWeeks, subWeeks, getISOWeek, getYear, addDays, startOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';

export function getISOWeekDetails(date: Date) {
    return {
        week: getISOWeek(date),
        year: getYear(date),
    };
}

export function getDateFromYearWeek(year: number, week: number) {
    const jan4 = new Date(year, 0, 4);
    const startOfYearWeek = startOfISOWeek(jan4);
    return addWeeks(startOfYearWeek, week - 1);
}

export function getWeekDisplay(year: number, week: number) {
    const targetDate = getDateFromYearWeek(year, week);
    const start = startOfISOWeek(targetDate);
    const end = endOfISOWeek(targetDate);

    return {
        label: `Uke ${week}, ${year}`,
        range: `${format(start, 'd. MMM', { locale: nb })} – ${format(end, 'd. MMM', { locale: nb })}`,
        start,
        end,
    };
}

export function getDayName(dayOfWeek: number) {
    const names = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
    return names[dayOfWeek - 1];
}

/**
 * Returns a UTC Date for a specific day of a week.
 * dayOfWeek: 1-7 (Monday-Sunday)
 */
export function getDateForWeekDay(year: number, week: number, dayOfWeek: number) {
    const targetDate = getDateFromYearWeek(year, week);
    // targetDate is already normalized to start of ISO week (Monday) by getDateFromYearWeek
    const date = addDays(targetDate, dayOfWeek - 1);
    return startOfDay(date); // Ensure time is 00:00:00
}

/**
 * Checks if a template is eligible for a specific date based on
 * intervalWeeks and date boundaries.
 */
export function isTemplateEligibleForDate(template: { startDate: Date, endDate?: Date | null, intervalWeeks?: number | null }, targetDate: Date) {
    const targetTime = targetDate.getTime();
    const startTime = startOfDay(template.startDate).getTime();

    // 1. Check startDate boundary
    if (targetTime < startTime) return false;

    // 2. Check endDate boundary (inclusive)
    if (template.endDate) {
        const endTime = startOfDay(template.endDate).getTime();
        if (targetTime > endTime) return false;
    }

    // 3. Check interval (every N weeks)
    const interval = template.intervalWeeks || 1;
    if (interval > 1) {
        const diffInWeeks = Math.floor((targetTime - startTime) / (7 * 24 * 60 * 60 * 1000));
        if (diffInWeeks % interval !== 0) return false;
    }

    return true;
}
