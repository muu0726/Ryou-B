/**
 * Board.js - Bitboard を使用したボード状態管理
 * 8x8 = 64 bit を BigInt で表現
 */

import { CONFIG } from './Config.js';

export class Board {
    constructor() {
        this.state = 0n; // 64bit bitboard
        this.gridSize = CONFIG.GRID_SIZE;
    }

    /**
     * (x, y) のビット位置を計算
     * @param {number} x 
     * @param {number} y 
     * @returns {bigint}
     */
    _getBitPosition(x, y) {
        // Row-major: bit index = y * 8 + x
        return BigInt(y * this.gridSize + x);
    }

    /**
     * (x, y) にセルがあるか
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    isOccupied(x, y) {
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return true;
        const bit = 1n << this._getBitPosition(x, y);
        return (this.state & bit) !== 0n;
    }

    /**
     * ブロックを配置可能か（衝突・範囲外チェック）
     * @param {Array<{x: number, y: number}>} cells - 相対座標
     * @param {number} baseX 
     * @param {number} baseY 
     * @returns {boolean}
     */
    canPlace(cells, baseX, baseY) {
        for (const cell of cells) {
            const x = baseX + cell.x;
            const y = baseY + cell.y;
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
                return false;
            }
            if (this.isOccupied(x, y)) {
                return false;
            }
        }
        return true;
    }

    /**
     * ブロックを配置（ビットを立てる）
     * @param {Array<{x: number, y: number}>} cells 
     * @param {number} baseX 
     * @param {number} baseY 
     */
    place(cells, baseX, baseY) {
        for (const cell of cells) {
            const x = baseX + cell.x;
            const y = baseY + cell.y;
            const bit = 1n << this._getBitPosition(x, y);
            this.state |= bit;
        }
    }

    /**
     * 配置シミュレーション: 消えるラインの予測
     * @param {Array<{x: number, y: number}>} cells
     * @param {number} baseX
     * @param {number} baseY
     * @returns {{rows: number[], cols: number[]}}
     */
    getClearingLines(cells, baseX, baseY) {
        // 仮のボードを作成して配置
        // クローンコストを避けるため、ビット演算で直接計算しても良いが
        // ここでは安全のためクローンを使用
        const testBoard = this.state;
        let tempState = testBoard;

        // 配置
        for (const cell of cells) {
            const x = baseX + cell.x;
            const y = baseY + cell.y;
            // 範囲外チェックは呼び出し元で行われている前提だが念のため
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                const bit = 1n << BigInt(y * this.gridSize + x);
                tempState |= bit;
            }
        }

        const clearedRows = [];
        const clearedCols = [];

        // 行チェック
        for (let y = 0; y < this.gridSize; y++) {
            let rowMask = 0n;
            for (let x = 0; x < this.gridSize; x++) {
                rowMask |= 1n << BigInt(y * this.gridSize + x);
            }
            if ((tempState & rowMask) === rowMask) {
                clearedRows.push(y);
            }
        }

        // 列チェック
        for (let x = 0; x < this.gridSize; x++) {
            let colMask = 0n;
            for (let y = 0; y < this.gridSize; y++) {
                colMask |= 1n << BigInt(y * this.gridSize + x);
            }
            if ((tempState & colMask) === colMask) {
                clearedCols.push(x);
            }
        }

        return { rows: clearedRows, cols: clearedCols };
    }

    /**
     * 完成した行・列を検出して消去
     * @returns {{rows: number[], cols: number[], totalCleared: number}}
     */
    clearLines() {
        const rowMasks = [];
        const colMasks = [];

        // 各行のマスクを生成
        for (let y = 0; y < this.gridSize; y++) {
            let rowMask = 0n;
            for (let x = 0; x < this.gridSize; x++) {
                rowMask |= 1n << this._getBitPosition(x, y);
            }
            rowMasks.push(rowMask);
        }

        // 各列のマスクを生成
        for (let x = 0; x < this.gridSize; x++) {
            let colMask = 0n;
            for (let y = 0; y < this.gridSize; y++) {
                colMask |= 1n << this._getBitPosition(x, y);
            }
            colMasks.push(colMask);
        }

        const clearedRows = [];
        const clearedCols = [];

        // 完成した行をチェック
        for (let y = 0; y < this.gridSize; y++) {
            if ((this.state & rowMasks[y]) === rowMasks[y]) {
                clearedRows.push(y);
            }
        }

        // 完成した列をチェック
        for (let x = 0; x < this.gridSize; x++) {
            if ((this.state & colMasks[x]) === colMasks[x]) {
                clearedCols.push(x);
            }
        }

        // 消去を実行
        for (const y of clearedRows) {
            this.state &= ~rowMasks[y];
        }
        for (const x of clearedCols) {
            this.state &= ~colMasks[x];
        }

        return {
            rows: clearedRows,
            cols: clearedCols,
            totalCleared: clearedRows.length + clearedCols.length
        };
    }

    /**
     * ボードが空かチェック（パーフェクトクリア判定）
     * @returns {boolean}
     */
    isEmpty() {
        return this.state === 0n;
    }

    /**
     * 埋まっているセル数をカウント
     * @returns {number}
     */
    countOccupied() {
        let count = 0;
        let state = this.state;
        while (state > 0n) {
            count += Number(state & 1n);
            state >>= 1n;
        }
        return count;
    }

    /**
     * ボードをリセット
     */
    reset() {
        this.state = 0n;
    }

    /**
     * 状態のクローンを作成
     * @returns {Board}
     */
    clone() {
        const newBoard = new Board();
        newBoard.state = this.state;
        return newBoard;
    }

    /**
     * 任意の場所に配置可能かをチェック（ブロック単体）
     * @param {Array<{x: number, y: number}>} cells 
     * @returns {boolean}
     */
    canPlaceAnywhere(cells) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.canPlace(cells, x, y)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * デバッグ用: ボードを文字列表示
     * @returns {string}
     */
    toString() {
        let str = '';
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                str += this.isOccupied(x, y) ? '█' : '·';
            }
            str += '\n';
        }
        return str;
    }
}
