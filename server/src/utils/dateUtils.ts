export function getMonthName(date: Date = new Date()): string {
    return date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
}