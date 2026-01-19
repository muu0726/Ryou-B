/**
 * Input.js - タッチ/マウス入力処理
 * スナップ（吸着）機能付き
 */

import { CONFIG } from './Config.js';

export class InputHandler {
    /**
     * @param {HTMLCanvasElement} canvas 
     * @param {import('./Renderer.js').Renderer} renderer
     */
    constructor(canvas, renderer) {
        this.canvas = canvas;
        this.renderer = renderer;

        this.isDragging = false;
        this.draggedBlockIndex = -1;
        this.dragOffset = { x: 0, y: 0 };
        this.currentScreenPos = { x: 0, y: 0 };

        // コールバック
        this.onDragStart = null; // (blockIndex, screenX, screenY)
        this.onDragMove = null;  // (screenX, screenY)
        this.onDragEnd = null;   // (gridX, gridY) or null if invalid
        this.onDragCancel = null;

        this._setupEventListeners();
    }

    _setupEventListeners() {
        // タッチイベント
        this.canvas.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchcancel', this._handleTouchCancel.bind(this), { passive: false });

        // マウスイベント（デスクトップ対応）
        // startはキャンバス上、move/upはドキュメント全体で処理（ドラッグ継続のため）
        this.canvas.addEventListener('mousedown', this._handleMouseDown.bind(this));
        document.addEventListener('mousemove', this._handleMouseMove.bind(this));
        document.addEventListener('mouseup', this._handleMouseUp.bind(this));
        // mouseleaveは削除（キャンバス外でもドラッグ継続）
    }

    /**
     * スクリーン座標からCanvas相対座標に変換
     * @param {number} clientX 
     * @param {number} clientY 
     * @returns {{x: number, y: number}}
     */
    clientToCanvas(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }

    /**
     * Canvas座標からグリッド座標に変換（スナップ機能付き）
     * @param {number} canvasX 
     * @param {number} canvasY 
     * @returns {{x: number, y: number}}
     */
    canvasToGrid(canvasX, canvasY) {
        const cellSize = CONFIG.CELL_SIZE;
        const gap = CONFIG.GRID_GAP;
        const cellTotal = cellSize + gap;

        // スナップ: 最も近いグリッド座標に丸める
        // 範囲外でも最寄りのセルにスナップ（下の行に置きやすくする）
        const gridX = Math.round((canvasX - gap - cellSize / 2) / cellTotal);
        const gridY = Math.round((canvasY - gap - cellSize / 2) / cellTotal);

        return {
            x: Math.max(0, Math.min(CONFIG.GRID_SIZE - 1, gridX)),
            y: Math.max(0, Math.min(CONFIG.GRID_SIZE - 1, gridY)),
        };
    }

    // === Touch Events ===
    _handleTouchStart(e) {
        // キャンバス外（UIボタンなど）のタッチは阻害しない
        if (e.target !== this.canvas) return;

        e.preventDefault();
        if (e.touches.length === 0) return;

        const touch = e.touches[0];
        this._startDrag(touch.clientX, touch.clientY);
    }

    _handleTouchMove(e) {
        // ドラッグ中のみスクロール等を防ぐ
        if (!this.isDragging) return;

        e.preventDefault();
        if (e.touches.length === 0) return;

        const touch = e.touches[0];
        this._moveDrag(touch.clientX, touch.clientY);
    }

    _handleTouchEnd(e) {
        // ドラッグ中のみ処理
        if (!this.isDragging) return;

        e.preventDefault();
        this._endDrag();
    }

    _handleTouchCancel(e) {
        e.preventDefault();
        this._cancelDrag();
    }

    // === Mouse Events ===
    _handleMouseDown(e) {
        this._startDrag(e.clientX, e.clientY);
    }

    _handleMouseMove(e) {
        if (!this.isDragging) return;
        this._moveDrag(e.clientX, e.clientY);
    }

    _handleMouseUp(e) {
        this._endDrag();
    }

    // === Drag Logic ===
    _startDrag(clientX, clientY) {
        // このクラスはCanvas上のドラッグ移動のみを処理
        // 実際のドラッグ開始はトレイからGameクラスで処理
        this.isDragging = true;
        this.currentScreenPos = { x: clientX, y: clientY };
    }

    _moveDrag(clientX, clientY) {
        // タッチオフセット適用
        const offsetY = CONFIG.TOUCH_OFFSET_Y;
        this.currentScreenPos = {
            x: clientX,
            y: clientY + offsetY,
        };

        if (this.onDragMove) {
            const canvasPos = this.clientToCanvas(this.currentScreenPos.x, this.currentScreenPos.y);
            this.onDragMove(canvasPos.x, canvasPos.y);
        }
    }

    _endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;

        if (this.onDragEnd) {
            const canvasPos = this.clientToCanvas(this.currentScreenPos.x, this.currentScreenPos.y);
            const gridPos = this.canvasToGrid(canvasPos.x, canvasPos.y);
            this.onDragEnd(gridPos.x, gridPos.y);
        }
    }

    _cancelDrag() {
        this.isDragging = false;
        if (this.onDragCancel) {
            this.onDragCancel();
        }
    }

    /**
     * 外部からドラッグ状態を設定
     * @param {boolean} isDragging 
     */
    setDragging(isDragging) {
        this.isDragging = isDragging;
    }
}
