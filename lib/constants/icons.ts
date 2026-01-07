/**
 * Curated list of dinner-related icons.
 * Used for random assignment on dinner creation and user selection.
 */
export const DINNER_ICONS = [
    '🍝',  // Pasta
    '🍕',  // Pizza
    '🌮',  // Taco
    '🍔',  // Burger
    '🍣',  // Sushi
    '🥗',  // Salad
    '🍲',  // Stew/Soup
    '🍛',  // Curry
    '🥩',  // Steak
    '🍗',  // Chicken
    '🐟',  // Fish
    '🥘',  // Paella/Casserole
    '🍱',  // Bento
    '🌯',  // Wrap
    '🥙',  // Pita
    '🍜',  // Noodles
] as const;

export type DinnerIcon = typeof DINNER_ICONS[number];

/**
 * Get a random dinner icon.
 */
export function getRandomDinnerIcon(): DinnerIcon {
    return DINNER_ICONS[Math.floor(Math.random() * DINNER_ICONS.length)];
}

/**
 * Check if a string is a valid dinner icon.
 */
export function isValidDinnerIcon(icon: string): icon is DinnerIcon {
    return DINNER_ICONS.includes(icon as DinnerIcon);
}
