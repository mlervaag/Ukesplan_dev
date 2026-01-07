'use client';

import { STANDARD_UNITS, DEFAULT_UNIT, isStandardUnit } from '@/lib/constants/units';

interface UnitSelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

/**
 * Dropdown select for unit selection.
 * Shows standard units and handles custom units gracefully.
 */
export function UnitSelect({ value, onChange, className = '' }: UnitSelectProps) {
    const hasCustomUnit = value && !isStandardUnit(value);

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`h-10 px-2 text-sm bg-surface border rounded-radius focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
            aria-label="Velg enhet"
        >
            {hasCustomUnit && (
                <option value={value} disabled>
                    Egendefinert: {value}
                </option>
            )}
            {STANDARD_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                    {unit}
                </option>
            ))}
        </select>
    );
}
