/**
 * Normalizes a quantity value to an integer string.
 * Used for display and API serialization to ensure "1" instead of "1.00".
 */
export function formatQty(q: string | number | null | undefined): string {
    if (q === null || q === undefined || q === '') return '1';
    const num = typeof q === 'string' ? parseFloat(q) : q;
    if (isNaN(num)) return '1';
    // Use Math.round to handle floating point noise, 
    // but the system will primarily store integers now.
    return Math.round(num).toString();
}

/**
 * Validates that a value is a positive integer.
 * Throws a Norwegian error if invalid.
 */
export function validateIntegerQty(q: any): number {
    const num = typeof q === 'string' ? parseFloat(q) : q;

    if (isNaN(num) || !Number.isFinite(num)) {
        throw new Error('Antall må være et tall');
    }

    // Check if it's an integer and positive
    if (!Number.isInteger(num) || num <= 0) {
        throw new Error('Antall må være et heltall over 0');
    }

    return num;
}
