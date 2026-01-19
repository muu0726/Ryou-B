/**
 * Config.js - ゲーム設定定数
 */

export const CONFIG = {
    // Grid
    GRID_SIZE: 8,
    CELL_SIZE: 40,
    GRID_GAP: 2,

    // Colors
    COLORS: {
        BACKGROUND: '#0a0a0a',
        GRID_LINE: '#1a1a1a',
        CELL_EMPTY: '#111111',
        GHOST_VALID: 'rgba(100, 255, 100, 0.3)',
        GHOST_INVALID: 'rgba(255, 100, 100, 0.3)',
        BLOCK_COLORS: [
            '#ff6b6b', // Red
            '#4ecdc4', // Teal
            '#ffe66d', // Yellow
            '#a29bfe', // Purple
            '#fd79a8', // Pink
            '#74b9ff', // Blue
            '#55efc4', // Mint
            '#fab1a0', // Peach
        ]
    },

    // Scoring
    SCORE: {
        BASE_POINTS: 10,
        LINE_BONUS: [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600], // Index = lines cleared
        COMBO_EXPONENT: 1.5,
        PERFECT_BONUS: 3000,
    },

    // Touch
    TOUCH_OFFSET_Y: -30, // Offset to show block above finger (reduced for easier bottom row placement)

    // Game
    BLOCKS_PER_SET: 3,
    PERFECT_THRESHOLD: 10, // Trigger "puzzle phase" if <= this many cells filled

    // Animation
    COMBO_DISPLAY_DURATION: 800,
    PERFECT_DISPLAY_DURATION: 3000,
};
