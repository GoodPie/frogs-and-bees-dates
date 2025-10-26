// Utilities for converting between human-readable time and ISO 8601 duration format
// ISO 8601 duration format: PT30M = 30 minutes, PT1H30M = 1 hour 30 minutes, PT2H = 2 hours

/**
 * Converts minutes to ISO 8601 duration format
 * @param minutes - Number of minutes
 * @returns ISO 8601 duration string (e.g., "PT30M", "PT1H30M")
 */
export const minutesToISO8601 = (minutes: number): string => {
    if (minutes <= 0) return 'PT0M';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    let duration = 'PT';
    if (hours > 0) duration += `${hours}H`;
    if (mins > 0) duration += `${mins}M`;

    return duration;
};

/**
 * Converts ISO 8601 duration to total minutes
 * @param duration - ISO 8601 duration string (e.g., "PT30M", "PT1H30M")
 * @returns Total minutes as number
 */
export const iso8601ToMinutes = (duration: string): number => {
    if (!duration || duration === 'PT0M') return 0;

    const hourMatch = duration.match(/(\d+)H/);
    const minuteMatch = duration.match(/(\d+)M/);

    const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;

    return hours * 60 + minutes;
};

/**
 * Converts ISO 8601 duration to human-readable format
 * @param duration - ISO 8601 duration string (e.g., "PT30M", "PT1H30M")
 * @returns Human-readable string (e.g., "30 minutes", "1 hour 30 minutes")
 */
export const iso8601ToReadable = (duration: string): string => {
    if (!duration || duration === 'PT0M') return '0 minutes';

    const minutes = iso8601ToMinutes(duration);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);

    return parts.join(' ');
};

/**
 * Converts hours and minutes to ISO 8601 duration format
 * @param hours - Number of hours
 * @param minutes - Number of minutes
 * @returns ISO 8601 duration string
 */
export const timeToISO8601 = (hours: number, minutes: number): string => {
    return minutesToISO8601(hours * 60 + minutes);
};
