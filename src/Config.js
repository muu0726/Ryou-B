/**
 * Config.js - ゲーム設定定数
 */

export const CONFIG = {
    // Grid
    GRID_SIZE: 8,
    CELL_SIZE: 40,
    GRID_GAP: 2,

    // 難易度調整
    DIFFICULTY: {
        WAVE_CYCLE: 10, // 何手ごとに波を変えるか
        ADAPTIVE_THRESHOLD: 0.7, // 盤面充填率70%で「ピンチ」と判定
    },

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
        BASE_POINTS: 1,       // 1セルあたりの配置点
        LINE_BASE: 10,        // 1ライン消去の基礎点
        MULTI_LINE_BONUS: 30, // 複数ライン消去時の1ラインあたりボーナス加算
        COMBO_MULTIPLIER: 0.5, // コンボ倍率係数 (1 + combo * 0.5)
        PERFECT_BONUS: 300,   // 全消しボーナス
    },

    // Touch
    TOUCH_OFFSET_Y: -100, // 指の上に大きく表示（ブロックブラスト風の距離感）

    // Game
    BLOCKS_PER_SET: 3,
    PERFECT_THRESHOLD: 10, // Trigger "puzzle phase" if <= this many cells filled

    // Animation
    COMBO_DISPLAY_DURATION: 800,
    PERFECT_DISPLAY_DURATION: 3000,
};
