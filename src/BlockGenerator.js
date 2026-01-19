/**
 * BlockGenerator.js - ブロック生成ロジック
 * - 動的難易度調整 (DDA)
 * - 詰み防止 (全順列チェック)
 * - 逆算シミュレーション (パズルフェーズ)
 */

import { CONFIG } from './Config.js';
import { SHAPES, SHAPE_POOLS, getShape, getShapeBounds } from './Shapes.js';

export class BlockGenerator {
    constructor(board) {
        this.board = board;
        this.currentScore = 0;
    }

    /**
     * スコアに応じた難易度レベルを取得
     * @returns {'EASY' | 'MEDIUM' | 'HARD'}
     */
    getDifficultyLevel() {
        if (this.currentScore < 500) return 'EASY';
        if (this.currentScore < 2000) return 'MEDIUM';
        return 'HARD';
    }

    /**
     * 難易度プールから重み付きでランダムに形状を選択
     * @returns {string} 形状名
     */
    pickRandomShape() {
        const level = this.getDifficultyLevel();
        let pool;

        // 難易度が上がると難しい形状も混ぜる
        if (level === 'EASY') {
            pool = SHAPE_POOLS.EASY;
        } else if (level === 'MEDIUM') {
            // EASY から 30%, MEDIUM から 70%
            pool = Math.random() < 0.3 ? SHAPE_POOLS.EASY : SHAPE_POOLS.MEDIUM;
        } else {
            // MEDIUM から 40%, HARD から 60%
            pool = Math.random() < 0.4 ? SHAPE_POOLS.MEDIUM : SHAPE_POOLS.HARD;
        }

        const index = Math.floor(Math.random() * pool.length);
        return pool[index];
    }

    /**
     * ブロックオブジェクトを生成
     * @param {string} shapeName 
     * @returns {{name: string, cells: Array, color: string, bounds: {width: number, height: number}}}
     */
    createBlock(shapeName) {
        // 安全策: DOT (1x1) が指定された場合は強制的に H2 に変更
        if (shapeName === 'DOT') {
            console.warn('[BlockGenerator] DOT requested, replacing with H2');
            shapeName = 'H2';
        }

        const cells = getShape(shapeName);
        const bounds = getShapeBounds(cells);
        const colorIndex = Math.floor(Math.random() * CONFIG.COLORS.BLOCK_COLORS.length);
        return {
            name: shapeName,
            cells: cells,
            color: CONFIG.COLORS.BLOCK_COLORS[colorIndex],
            bounds: bounds,
            used: false,
        };
    }

    /**
     * 3つのブロックセットを生成（詰み防止保証付き）
     * @returns {Array}
     */
    generateBlockSet() {
        const occupiedCount = this.board.countOccupied();

        // パズルフェーズ: 残りが少ない時は逆算を試みる
        if (occupiedCount > 0 && occupiedCount <= CONFIG.PERFECT_THRESHOLD) {
            const puzzleSet = this.tryGeneratePuzzleSet();
            if (puzzleSet) {
                console.log('[BlockGenerator] Puzzle phase activated!');
                return puzzleSet;
            }
        }

        // 通常生成 (詰み防止チェック + アイランド防止)
        let attempts = 0;
        const maxAttempts = 100;

        while (attempts < maxAttempts) {
            attempts++;
            const blocks = [
                this.createBlock(this.pickRandomShape()),
                this.createBlock(this.pickRandomShape()),
                this.createBlock(this.pickRandomShape()),
            ];

            // アイランド防止は厳しすぎる場合があるので、詰み防止のみ必須
            if (this.canPlaceAllInSomeOrder(blocks)) {
                return blocks;
            }
        }

        // 配置可能なブロックが生成できない場合はnullを返す（ゲームオーバー処理を呼び出し側で）
        console.warn('[BlockGenerator] Cannot generate placeable blocks - game should end');
        return null;
    }

    /**
     * ブロック配置後にアイランド（孤立した1マス）ができるかチェック
     * @param {Array} blocks 
     * @returns {boolean} アイランドができる場合true
     */
    wouldCreateIsland(blocks) {
        const testBoard = this.board.clone();

        // 全ブロックを順番に配置してシミュレート
        for (const block of blocks) {
            let placed = false;
            for (let y = 0; y < CONFIG.GRID_SIZE && !placed; y++) {
                for (let x = 0; x < CONFIG.GRID_SIZE && !placed; x++) {
                    if (testBoard.canPlace(block.cells, x, y)) {
                        testBoard.place(block.cells, x, y);
                        testBoard.clearLines();
                        placed = true;
                    }
                }
            }
        }

        // アイランド検出: 各空きセルの周囲4方向をチェック
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                if (!testBoard.isOccupied(x, y)) {
                    // 隣接する空きセル数をカウント
                    const neighbors = [
                        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
                    ];

                    let emptyNeighbors = 0;
                    for (const { dx, dy } of neighbors) {
                        const nx = x + dx, ny = y + dy;
                        if (nx < 0 || nx >= CONFIG.GRID_SIZE || ny < 0 || ny >= CONFIG.GRID_SIZE) {
                            continue; // 境界外は問題なし
                        }
                        if (!testBoard.isOccupied(nx, ny)) {
                            emptyNeighbors++;
                        }
                    }

                    // 完全に孤立（周囲が全て埋まっている）している場合
                    if (emptyNeighbors === 0) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * 3つのブロックが任意の順序で全て配置可能かチェック
     * @param {Array} blocks 
     * @returns {boolean}
     */
    canPlaceAllInSomeOrder(blocks) {
        const permutations = this.getPermutations([0, 1, 2]);

        for (const perm of permutations) {
            if (this.canPlaceInOrder(blocks, perm)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 指定順序で配置可能かシミュレーション
     * @param {Array} blocks 
     * @param {number[]} order 
     * @returns {boolean}
     */
    canPlaceInOrder(blocks, order) {
        const testBoard = this.board.clone();

        for (const idx of order) {
            const cells = blocks[idx].cells;
            let placed = false;

            // 配置可能な場所を探す
            outer:
            for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
                for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                    if (testBoard.canPlace(cells, x, y)) {
                        testBoard.place(cells, x, y);
                        testBoard.clearLines(); // ライン消去をシミュレート
                        placed = true;
                        break outer;
                    }
                }
            }

            if (!placed) {
                return false;
            }
        }
        return true;
    }

    /**
     * パズルフェーズ: 全消し可能な3つのブロックを逆算で生成
     * @returns {Array|null}
     */
    tryGeneratePuzzleSet() {
        // 現在の盤面で占有されているセルを取得
        const occupiedCells = [];
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                if (this.board.isOccupied(x, y)) {
                    occupiedCells.push({ x, y });
                }
            }
        }

        // 占有数が多すぎると計算コストが高すぎる
        if (occupiedCells.length > CONFIG.PERFECT_THRESHOLD) {
            return null;
        }

        // すべての形状の組み合わせを試す（簡易版: ランダムサンプリング）
        // DOT (1x1) は除外
        const allShapes = Object.keys(SHAPES).filter(name => name !== 'DOT');
        const sampleSize = 50; // 計算コスト削減

        for (let attempt = 0; attempt < sampleSize; attempt++) {
            const candidate = [
                this.createBlock(allShapes[Math.floor(Math.random() * allShapes.length)]),
                this.createBlock(allShapes[Math.floor(Math.random() * allShapes.length)]),
                this.createBlock(allShapes[Math.floor(Math.random() * allShapes.length)]),
            ];

            if (this.canClearBoardWithBlocks(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    /**
     * 3つのブロックで盤面が空になる配置順が存在するかチェック
     * @param {Array} blocks 
     * @returns {boolean}
     */
    canClearBoardWithBlocks(blocks) {
        const permutations = this.getPermutations([0, 1, 2]);

        for (const perm of permutations) {
            if (this.simulateClear(blocks, perm)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 指定順序で配置してボードが空になるかシミュレーション
     * @param {Array} blocks 
     * @param {number[]} order 
     * @returns {boolean}
     */
    simulateClear(blocks, order) {
        const testBoard = this.board.clone();

        for (const idx of order) {
            const cells = blocks[idx].cells;
            let placed = false;

            // 最も「ライン完成に近い」場所に配置するヒューリスティック
            let bestPos = null;
            let bestScore = -1;

            for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
                for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                    if (testBoard.canPlace(cells, x, y)) {
                        // 簡易スコア: 配置後にどれだけセルが減るか
                        const tempBoard = testBoard.clone();
                        tempBoard.place(cells, x, y);
                        const before = tempBoard.countOccupied();
                        tempBoard.clearLines();
                        const after = tempBoard.countOccupied();
                        const reduction = before - after;

                        if (reduction > bestScore) {
                            bestScore = reduction;
                            bestPos = { x, y };
                        }
                    }
                }
            }

            if (bestPos) {
                testBoard.place(cells, bestPos.x, bestPos.y);
                testBoard.clearLines();
                placed = true;
            }

            if (!placed) {
                return false;
            }
        }

        return testBoard.isEmpty();
    }

    /**
     * 配列の全順列を取得
     * @param {Array} arr 
     * @returns {Array<Array>}
     */
    getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            for (const perm of this.getPermutations(rest)) {
                result.push([arr[i], ...perm]);
            }
        }
        return result;
    }

    /**
     * スコアを更新
     * @param {number} score 
     */
    updateScore(score) {
        this.currentScore = score;
    }
}
