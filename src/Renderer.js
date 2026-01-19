/**
 * Renderer.js - Canvas描画ロジック
 * レイヤー構造:
 * 1. 背景（黒）
 * 2. ドラッグ中ブロック / ゴースト
 * 3. 置かれたセルの写真断片（最前面）
 */

import { CONFIG } from './Config.js';

export class Renderer {
    /**
     * @param {HTMLCanvasElement} canvas 
     * @param {HTMLImageElement} backgroundImage 
     */
    constructor(canvas, backgroundImage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.backgroundImage = backgroundImage;

        this.gridSize = CONFIG.GRID_SIZE;
        this.cellSize = CONFIG.CELL_SIZE;
        this.gridGap = CONFIG.GRID_GAP;

        // キャンバスサイズ設定
        const totalSize = this.gridSize * (this.cellSize + this.gridGap) + this.gridGap;
        this.canvas.width = totalSize;
        this.canvas.height = totalSize;

        // 背景画像をグリッドサイズに合わせてプリレンダリング
        this.prerenderedBg = this.prerenderBackground();
    }

    /**
     * 背景画像をグリッドサイズに合わせてプリレンダリング
     * @returns {HTMLCanvasElement}
     */
    prerenderBackground() {
        const offscreen = document.createElement('canvas');
        offscreen.width = this.canvas.width;
        offscreen.height = this.canvas.height;
        const offCtx = offscreen.getContext('2d');

        // 画像をキャンバス全体にフィットさせる (cover)
        const imgRatio = this.backgroundImage.width / this.backgroundImage.height;
        const canvasRatio = this.canvas.width / this.canvas.height;

        let sx, sy, sw, sh;
        if (imgRatio > canvasRatio) {
            // 画像が横長: 高さに合わせてクロップ
            sh = this.backgroundImage.height;
            sw = sh * canvasRatio;
            sx = (this.backgroundImage.width - sw) / 2;
            sy = 0;
        } else {
            // 画像が縦長: 幅に合わせてクロップ
            sw = this.backgroundImage.width;
            sh = sw / canvasRatio;
            sx = 0;
            sy = (this.backgroundImage.height - sh) / 2;
        }

        offCtx.drawImage(
            this.backgroundImage,
            sx, sy, sw, sh,
            0, 0, this.canvas.width, this.canvas.height
        );

        return offscreen;
    }

    /**
     * セル座標からピクセル座標を計算
     * @param {number} cellX 
     * @param {number} cellY 
     * @returns {{x: number, y: number}}
     */
    cellToPixel(cellX, cellY) {
        return {
            x: this.gridGap + cellX * (this.cellSize + this.gridGap),
            y: this.gridGap + cellY * (this.cellSize + this.gridGap),
        };
    }

    /**
     * メイン描画
     * @param {import('./Board.js').Board} board 
     * @param {object|null} draggingBlock - {cells, color, gridX, gridY} or null
     * @param {object|null} ghostPosition - {x, y, valid} or null
     * @param {object|null} clearingLines - {rows: number[], cols: number[]} or null
     */
    draw(board, draggingBlock = null, ghostPosition = null, clearingLines = null) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Layer 1: 背景（黒 + グリッド線）
        this.drawBackground();

        // Layer 1.5: 予測ハイライト (消えるラインを光らせる)
        if (clearingLines) {
            this.drawPredictionHighlight(clearingLines);
        }

        // Layer 2a: ゴースト表示
        if (ghostPosition && draggingBlock) {
            this.drawGhost(draggingBlock.cells, ghostPosition.x, ghostPosition.y, ghostPosition.valid);
        }

        // Layer 2b: ドラッグ中のブロック
        if (draggingBlock && draggingBlock.screenX !== undefined) {
            this.drawDraggingBlock(draggingBlock, draggingBlock.scale || 1.0);
        }

        // Layer 3: 占有セルの写真断片（最前面）
        this.drawRevealedCells(board);
    }

    /**
     * 予測ハイライト描画
     * @param {{rows: number[], cols: number[]}} clearingLines 
     */
    drawPredictionHighlight(clearingLines) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // 白く発光

        // 行ハイライト
        for (const y of clearingLines.rows) {
            const pos = this.cellToPixel(0, y);
            const width = this.gridSize * (this.cellSize + this.gridGap);
            this.ctx.fillRect(pos.x - this.gridGap, pos.y, width, this.cellSize);
        }

        // 列ハイライト
        for (const x of clearingLines.cols) {
            const pos = this.cellToPixel(x, 0);
            const height = this.gridSize * (this.cellSize + this.gridGap);
            this.ctx.fillRect(pos.x, pos.y - this.gridGap, this.cellSize, height);
        }
    }

    /**
     * 背景を描画（黒 + 薄いグリッド線）
     */
    drawBackground() {
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッド線
        this.ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= this.gridSize; i++) {
            const pos = this.gridGap + i * (this.cellSize + this.gridGap) - this.gridGap / 2;

            // 縦線
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();

            // 横線
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }

        // 空のセルを描画
        this.ctx.fillStyle = CONFIG.COLORS.CELL_EMPTY;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const pos = this.cellToPixel(x, y);
                this.ctx.fillRect(pos.x, pos.y, this.cellSize, this.cellSize);
            }
        }
    }

    /**
     * ゴースト（配置プレビュー）を描画
     * @param {Array<{x: number, y: number}>} cells 
     * @param {number} gridX 
     * @param {number} gridY 
     * @param {boolean} valid 
     */
    drawGhost(cells, gridX, gridY, valid) {
        this.ctx.fillStyle = valid ? CONFIG.COLORS.GHOST_VALID : CONFIG.COLORS.GHOST_INVALID;

        for (const cell of cells) {
            const x = gridX + cell.x;
            const y = gridY + cell.y;
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                const pos = this.cellToPixel(x, y);
                this.ctx.fillRect(pos.x, pos.y, this.cellSize, this.cellSize);
            }
        }
    }

    /**
     * ドラッグ中のブロックを描画（スクリーン座標で）
     * @param {object} block 
     * @param {number} scale 拡大率
     */
    drawDraggingBlock(block, scale = 1.0) {
        this.ctx.fillStyle = block.color;
        this.ctx.globalAlpha = 0.8;

        const cellSize = this.cellSize;
        const gap = this.gridGap;
        const totalCellSize = cellSize + gap;

        // Scaling center offset (approximate based on block center)
        // Correct scaling requires adjusting the position relative to the block's center
        // For simplicity, we scale each cell relative to the top-left of the block (screenX, screenY)
        // or just scale the cell size.

        // Let's just scale the cell size and gap
        const scaledCellSize = cellSize * scale;
        const scaledGap = gap * scale;
        const scaledTotal = scaledCellSize + scaledGap;

        // Adjustment to keep the block centered under the finger/offset
        // If we scale up, the block grows down-right. We should shift it up-left by half the growth.
        const width = block.bounds.width * totalCellSize - gap;
        const height = block.bounds.height * totalCellSize - gap;
        const scaledWidth = block.bounds.width * scaledTotal - scaledGap;
        const scaledHeight = block.bounds.height * scaledTotal - scaledGap;

        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        for (const cell of block.cells) {
            const px = block.screenX + offsetX + cell.x * scaledTotal;
            const py = block.screenY + offsetY + cell.y * scaledTotal;
            this.ctx.fillRect(px, py, scaledCellSize, scaledCellSize);
        }

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * 占有されたセルに対応する背景画像の断片を描画（最前面）
     * @param {import('./Board.js').Board} board 
     */
    drawRevealedCells(board) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (board.isOccupied(x, y)) {
                    const pos = this.cellToPixel(x, y);

                    // プリレンダリングされた背景から該当部分を切り出し
                    this.ctx.drawImage(
                        this.prerenderedBg,
                        pos.x, pos.y, this.cellSize, this.cellSize,
                        pos.x, pos.y, this.cellSize, this.cellSize
                    );

                    // セルの境界線（視認性向上）
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(pos.x, pos.y, this.cellSize, this.cellSize);
                }
            }
        }
    }

    /**
     * ライン消去エフェクトを描画
     * @param {number[]} rows - 消去された行のY座標
     * @param {number[]} cols - 消去された列のX座標
     * @param {number} progress - 0.0 ~ 1.0
     */
    drawLineClearEffect(rows, cols, progress) {
        const alpha = 1 - progress;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;

        // 行のフラッシュ
        for (const y of rows) {
            const pos = this.cellToPixel(0, y);
            const width = this.gridSize * (this.cellSize + this.gridGap);
            this.ctx.fillRect(pos.x - this.gridGap, pos.y, width, this.cellSize);
        }

        // 列のフラッシュ
        for (const x of cols) {
            const pos = this.cellToPixel(x, 0);
            const height = this.gridSize * (this.cellSize + this.gridGap);
            this.ctx.fillRect(pos.x, pos.y - this.gridGap, this.cellSize, height);
        }
    }

    /**
     * 配置エフェクトを描画
     * @param {Array<{x: number, y: number}>} cells
     * @param {number} baseX
     * @param {number} baseY
     * @param {number} progress - 0.0 ~ 1.0
     */
    drawPlacementEffect(cells, baseX, baseY, progress) {
        const scale = 1 + (1 - progress) * 0.2;
        const alpha = 1 - progress;

        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.lineWidth = 3;

        for (const cell of cells) {
            const x = baseX + cell.x;
            const y = baseY + cell.y;
            const pos = this.cellToPixel(x, y);
            const offset = (this.cellSize * (scale - 1)) / 2;

            this.ctx.strokeRect(
                pos.x - offset,
                pos.y - offset,
                this.cellSize * scale,
                this.cellSize * scale
            );
        }
    }

    /**
     * パーフェクトクリア演出: 全画像を表示
     * @returns {string} 画像データURL
     */
    getFullImageDataUrl() {
        return this.prerenderedBg.toDataURL('image/jpeg');
    }

    /**
     * ブロックトレイ用の小さなキャンバスを生成
     * @param {{cells: Array, color: string, bounds: {width: number, height: number}}} block 
     * @param {number} scale 
     * @returns {HTMLCanvasElement}
     */
    createBlockThumbnail(block, scale = 0.6) {
        const cellSize = this.cellSize * scale;
        const gap = this.gridGap * scale;

        const canvas = document.createElement('canvas');
        canvas.width = block.bounds.width * (cellSize + gap) + gap;
        canvas.height = block.bounds.height * (cellSize + gap) + gap;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = block.color;

        for (const cell of block.cells) {
            const px = gap + cell.x * (cellSize + gap);
            const py = gap + cell.y * (cellSize + gap);
            ctx.fillRect(px, py, cellSize, cellSize);
        }

        return canvas;
    }
}
