import { format, startOfISOWeek, endOfISOWeek, addWeeks, subWeeks, getISOWeek, getYear } from 'date-fns';
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
