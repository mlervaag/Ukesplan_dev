export function normalizeName(name: string): string {
    return name.toLowerCase().trim();
}

export function normalizeUnit(unit: string | null | undefined): string {
    if (!unit) return '';
    return unit.toLowerCase().trim();
}

/**
 * Generates a stable key for merging items.
 * Per V4: Merge only when normalized name AND normalized unit match.
 */
export function getMergeKey(name: string, unit: string | null | undefined): string {
    const n = normalizeName(name);
    const u = normalizeUnit(unit);
    return `${n}|${u}`;
}
