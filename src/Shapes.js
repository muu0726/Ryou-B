/**
 * Shapes.js - ブロック形状の定義
 * 各形状は相対座標の配列 [{x, y}, ...]
 * (0,0) は基準点
 */

export const SHAPES = {
    // === 1マス (無効化 - ゲームバランスのため) ===
    // DOT: [{ x: 0, y: 0 }],

    // === 2マス ===
    H2: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    V2: [{ x: 0, y: 0 }, { x: 0, y: 1 }],

    // === 3マス ===
    H3: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    V3: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
    L3_1: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    L3_2: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    L3_3: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    L3_4: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],

    // === 4マス ===
    H4: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
    V4: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
    SQUARE: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    T: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }],
    T_UP: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    T_LEFT: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
    T_RIGHT: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    S: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    Z: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    S_V: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    Z_V: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
    L4_1: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    L4_2: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    L4_3: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    L4_4: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
    L4_5: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    L4_6: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }],
    L4_7: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 0 }],
    L4_8: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],

    // === 5マス ===
    H5: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
    V5: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
    PLUS: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    L5_1: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    L5_2: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    L5_3: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    L5_4: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],

    // === 大きい形状 (難易度上昇用) ===
    SQUARE3: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }
    ],
    // 3x3のL字 (5マス)
    BIG_L: [
        { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 },
        { x: 1, y: 2 }, { x: 2, y: 2 }
    ],
    // 3x3のT字 (5マス)
    BIG_T: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 1, y: 1 }, { x: 1, y: 2 }
    ],
    // === 矩形 (2x3, 3x2) ===
    RECT_3x2: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }
    ],
    RECT_2x3: [
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 },
        { x: 0, y: 2 }, { x: 1, y: 2 }
    ],
};

// 難易度別の形状グループ (DOTは除外 - ゲームオーバー回避が容易になりすぎるため)
export const SHAPE_POOLS = {
    // 最初から大きいブロックも出るように修正
    EASY: [
        'H2', 'V2', 'H3', 'V3', 'L3_1', 'L3_2', 'L3_3', 'L3_4', 'SQUARE',
        'RECT_3x2', 'RECT_2x3', 'SQUARE3', 'BIG_L', 'BIG_T'
    ],
    MEDIUM: ['H3', 'V3', 'L3_1', 'L3_2', 'L3_3', 'L3_4', 'SQUARE', 'H4', 'V4', 'T', 'T_UP', 'T_LEFT', 'T_RIGHT', 'S', 'Z', 'S_V', 'Z_V', 'L4_1', 'L4_2', 'L4_3', 'L4_4', 'L4_5', 'L4_6', 'L4_7', 'L4_8', 'RECT_3x2', 'RECT_2x3', 'SQUARE3'],
    HARD: ['H4', 'V4', 'H5', 'V5', 'PLUS', 'SQUARE3', 'BIG_L', 'BIG_T', 'RECT_3x2', 'RECT_2x3'],
};

/**
 * 形状名からセル配列を取得
 * @param {string} shapeName 
 * @returns {Array<{x: number, y: number}>}
 */
export function getShape(shapeName) {
    return SHAPES[shapeName] || SHAPES.H2; // フォールバックはH2（DOTは除外）
}

/**
 * 形状のバウンディングボックスを計算
 * @param {Array<{x: number, y: number}>} cells 
 * @returns {{width: number, height: number}}
 */
export function getShapeBounds(cells) {
    let maxX = 0, maxY = 0;
    for (const cell of cells) {
        if (cell.x > maxX) maxX = cell.x;
        if (cell.y > maxY) maxY = cell.y;
    }
    return { width: maxX + 1, height: maxY + 1 };
}

/**
 * すべての形状名を配列で取得
 * @returns {string[]}
 */
export function getAllShapeNames() {
    return Object.keys(SHAPES);
}
