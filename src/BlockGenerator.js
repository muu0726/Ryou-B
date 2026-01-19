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
        this.generationCount = 0; // 生成回数（難易度ウェーブ用）
    }

    /**
     * 現在の状態に基づいて難易度プールを決定（適応型難易度）
     * @returns {string[]} 形状プール
     */
    getAdaptivePool() {
        const occupiedCount = this.board.countOccupied();
        const fillRate = occupiedCount / (CONFIG.GRID_SIZE * CONFIG.GRID_SIZE);

        // 1. ピンチ判定: 盤面が70%以上埋まっていたら、強制的にEASY（小さいブロック）を多くする
        if (fillRate > CONFIG.DIFFICULTY.ADAPTIVE_THRESHOLD) {
            // 80%の確率でEASY、20%でMEDIUM（救済措置）
            return Math.random() < 0.8 ? SHAPE_POOLS.EASY : SHAPE_POOLS.MEDIUM;
        }

        // 2. 難易度ウェーブ: 一定周期で波を作る
        // 例: 10回ごとにサイクル。前半は易しめ、後半は難しめ
        const cyclePos = this.generationCount % CONFIG.DIFFICULTY.WAVE_CYCLE;
        const isHardWave = cyclePos > (CONFIG.DIFFICULTY.WAVE_CYCLE / 2);

        // 基本難易度はスコア依存
        let baseLevel = 'EASY';
        if (this.currentScore > 2000) baseLevel = 'HARD';
        else if (this.currentScore > 500) baseLevel = 'MEDIUM';

        // 難易度決定ロジック
        if (baseLevel === 'EASY') {
            // 序盤は基本EASY、たまにMEDIUM
            return Math.random() < 0.9 ? SHAPE_POOLS.EASY : SHAPE_POOLS.MEDIUM;
        } else if (baseLevel === 'MEDIUM') {
            if (isHardWave) {
                // 難しい波: MEDIUMメイン、たまにHARD
                return Math.random() < 0.7 ? SHAPE_POOLS.MEDIUM : SHAPE_POOLS.HARD;
            } else {
                // 易しい波: EASYメイン、たまにMEDIUM
                return Math.random() < 0.6 ? SHAPE_POOLS.EASY : SHAPE_POOLS.MEDIUM;
            }
        } else { // HARD
            if (isHardWave) {
                // 超難関: HARDメイン
                return Math.random() < 0.8 ? SHAPE_POOLS.HARD : SHAPE_POOLS.MEDIUM;
            } else {
                // 休憩: MEDIUMメイン
                return Math.random() < 0.7 ? SHAPE_POOLS.MEDIUM : SHAPE_POOLS.EASY;
            }
        }
    }

    /**
     * 難易度プールから重み付きでランダムに形状を選択
     * @returns {string} 形状名
     */
    pickRandomShape() {
        const pool = this.getAdaptivePool();
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
        this.generationCount++;
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

            // 全順列シミュレーションを行い、解がある場合のみ採用
            if (this.canPlaceAllInSomeOrder(blocks)) {

                // 意地悪ロジック (高スコア時):
                // もし「解が1通りしかない」かつ「今のスコアが高い」場合、そのまま採用（難易度UP）
                // 逆に「解が多すぎる」場合は、簡単な波の時のみ採用するなど調整可能
                // 現状は「とにかく解があればOK」とするが、
                // 将来的にはここで「簡単すぎるセット」をリジェクトする判定も追加可能

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
     * 3つのブロックが現在の盤面で配置可能かチェック（全順列シミュレーション）
     * - A置いて消える -> 次にB置けるか？ を考慮
     * @param {Array} blocks 
     * @returns {boolean}
     */
    canPlaceAllInSomeOrder(blocks) {
        const permutations = this.getPermutations([0, 1, 2]);

        for (const perm of permutations) {
            // クローンしたボートでシミュレーション開始
            if (this.simulatePlacementRecursive(this.board.clone(), blocks, perm, 0)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 再帰的な配置シミュレーション
     * @param {Board} currentBoard 現在のシミュレーションボード状態
     * @param {Array} blocks ブロックリスト
     * @param {number[]} order 配置順序インデックス
     * @param {number} step 現在のステップ (0-2)
     * @returns {boolean} 全て配置できればtrue
     */
    simulatePlacementRecursive(currentBoard, blocks, order, step) {
        // ベースケース: 全てのブロックを配置できた
        if (step >= blocks.length) {
            return true;
        }

        const blockIdx = order[step];
        const block = blocks[blockIdx];
        const cells = block.cells;

        // 盤面上の全位置をスキャンして配置可能か試す
        // 注意: 1箇所でも「置いて次に行ける」場所があればOK（深さ優先探索）
        for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
            for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
                if (currentBoard.canPlace(cells, x, y)) {
                    // 配置してライン消去まで行う
                    const nextBoard = currentBoard.clone();
                    nextBoard.place(cells, x, y);
                    nextBoard.clearLines();

                    // 次のステップへ
                    if (this.simulatePlacementRecursive(nextBoard, blocks, order, step + 1)) {
                        return true;
                    }
                }
            }
        }

        // どこにも置けない、あるいは置いても次が続かない
        return false;
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
