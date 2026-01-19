/**
 * Game.js - メインゲームループと状態管理
 */

import { CONFIG } from './Config.js';
import { Board } from './Board.js';
import { BlockGenerator } from './BlockGenerator.js';
import { Renderer } from './Renderer.js';
import { InputHandler } from './Input.js';
import { SoundManager } from './Sound.js';
import { ScoreManager } from './ScoreManager.js';

export class Game {
    /**
     * @param {HTMLCanvasElement} canvas 
     * @param {HTMLImageElement} backgroundImage 
     */
    constructor(canvas, backgroundImage) {
        this.canvas = canvas;
        this.backgroundImage = backgroundImage;

        // Core
        this.board = new Board();
        this.renderer = new Renderer(canvas, backgroundImage);
        this.blockGenerator = new BlockGenerator(this.board);
        this.input = new InputHandler(canvas, this.renderer);
        this.sound = new SoundManager();
        this.scoreManager = new ScoreManager();

        // State
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.combo = 0;
        this.currentBlocks = [];
        this.draggingBlockIndex = -1;
        this.draggingBlock = null;
        this.ghostPosition = null;
        this.gameState = 'playing'; // 'playing', 'gameover'

        this.dragState = {
            isActive: false,
            startTime: 0,
            pointerX: 0,
            pointerY: 0,
            currentScale: 1.0,
            currentOffsetY: 0
        };

        // UI Elements
        this.scoreEl = document.getElementById('score');
        this.highScoreEl = document.getElementById('high-score');
        this.comboDisplay = document.getElementById('combo-display');
        this.comboCountEl = document.getElementById('combo-count');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalHighScoreEl = document.getElementById('final-high-score');
        this.restartBtn = document.getElementById('restart-btn');
        this.perfectOverlay = document.getElementById('perfect-overlay');
        this.perfectImage = document.getElementById('perfect-image');
        this.blockTray = document.getElementById('block-tray');

        this._setupInputCallbacks();
        this._setupUI();
        this.init();
    }

    init() {
        this.board.reset();
        this.score = 0;
        this.combo = 0;
        this.gameState = 'playing';

        // UI Cleanups
        if (this.leaderboardOverlay) this.leaderboardOverlay.classList.add('hidden');
        if (this.gameOverOverlay) this.gameOverOverlay.classList.add('hidden');

        this.currentBlocks = this.blockGenerator.generateBlockSet();
        this.updateUI();
        this.renderBlockTray();
        this.render();
    }

    _setupInputCallbacks() {
        this.input.onDragMove = (canvasX, canvasY) => {
            if (this.draggingBlockIndex < 0 || !this.draggingBlock) return;

            // Just update pointer position, the loop handles the rest
            this.dragState.pointerX = canvasX;
            this.dragState.pointerY = canvasY;
        };

        this.input.onDragEnd = (gridX, gridY) => {
            if (this.draggingBlockIndex < 0 || !this.draggingBlock) {
                this.cancelDrag();
                return;
            }

            // Use the calculated ghost position (which accounts for offset and centering)
            if (this.ghostPosition && this.ghostPosition.valid) {
                this.placeBlock(this.draggingBlockIndex, this.ghostPosition.x, this.ghostPosition.y);
            }

            this.cancelDrag();
        };

        this.input.onDragCancel = () => {
            this.cancelDrag();
        };
    }

    _setupUI() {
        this.restartBtn.addEventListener('click', () => {
            if (confirm('ゲームをリスタートしますか？')) {
                this.gameOverOverlay.classList.add('hidden');
                this.init();
            }
        });

        // Settings UI
        const settingsOverlay = document.getElementById('settings-overlay');
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettingsBtn = document.getElementById('close-settings-btn');
        // ... (lines 123-447 are skipped for brevity in this replacement chunk, wait, replace_file_content requires contiguous block. I should split this if lines are far apart.
        // Actually, _setupInputCallbacks is around line 83. _updateDragLogic is around line 434. They are far apart.
        // I must use multi_replace_file_content.


        this.input.onDragCancel = () => {
            this.cancelDrag();
        };
    }

    _setupUI() {
        this.restartBtn.addEventListener('click', () => {
            this.gameOverOverlay.classList.add('hidden');
            this.init();
        });

        // Settings UI
        const settingsOverlay = document.getElementById('settings-overlay');
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettingsBtn = document.getElementById('close-settings-btn');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                settingsOverlay.classList.remove('hidden');
            });
        }

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                settingsOverlay.classList.add('hidden');
            });
        }

        // リトライボタン（即座にリセット）
        const retryBtn = document.getElementById('retry-btn');
        retryBtn.addEventListener('click', () => {
            if (confirm('ゲームをリスタートしますか？')) {
                this.init();
                settingsOverlay.classList.add('hidden');
            }
        });

        // サウンドトグルボタン
        const soundBtn = document.getElementById('sound-btn');
        soundBtn.addEventListener('click', () => {
            this.sound.init(); // 初回クリックでAudioContextを初期化
            const enabled = this.sound.toggle();

            // Update UI for complex button structure
            const statusEl = soundBtn.querySelector('.status');
            if (statusEl) {
                statusEl.textContent = enabled ? 'ON' : 'OFF';
            }
            soundBtn.classList.toggle('muted', !enabled);
        });

        // SNSシェアボタン
        const shareBtn = document.getElementById('share-btn');
        shareBtn.addEventListener('click', () => {
            this.shareScore();
        });

        // ハイスコア表示
        this.highScoreEl.textContent = this.highScore;

        // ランキングUI
        this._setupLeaderboardUI();
    }

    _setupLeaderboardUI() {
        // 要素取得
        this.leaderboardOverlay = document.getElementById('leaderboard-overlay');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
        this.showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
        this.submitScoreArea = document.getElementById('score-submit-area');
        this.submitScoreBtn = document.getElementById('submit-score-btn');
        this.playerNameInput = document.getElementById('player-name-input');
        this.myScoreDisplay = document.getElementById('my-score-display');
        this.headerRankingBtn = document.getElementById('header-ranking-btn');

        // イベントリスナー
        this.showLeaderboardBtn.addEventListener('click', () => {
            // ゲームオーバー時は登録フォームを表示
            const showInput = (this.gameState === 'gameover' && this.score > 0);
            this.showLeaderboard(showInput);
        });

        // プレイ画面のランキングボタン（閲覧のみ）
        if (this.headerRankingBtn) {
            this.headerRankingBtn.addEventListener('click', () => {
                this.showLeaderboard(false);
            });
        }

        this.closeLeaderboardBtn.addEventListener('click', () => {
            this.leaderboardOverlay.classList.add('hidden');
        });

        this.submitScoreBtn.addEventListener('click', () => {
            this.submitScore();
        });
    }

    async showLeaderboard(showSubmitInput = false) {
        this.leaderboardOverlay.classList.remove('hidden');
        this.leaderboardList.innerHTML = '<div style="text-align:center; padding: 20px;">Loading...</div>';

        // 送信エリアの表示切替
        if (showSubmitInput) {
            this.submitScoreArea.classList.remove('hidden');
            this.myScoreDisplay.textContent = `あなたのスコア: ${this.score}`;
            // 保存された名前があれば入力済みにしておく
            const savedName = localStorage.getItem('ryoutan-blast-username');
            if (savedName) this.playerNameInput.value = savedName;
        } else {
            this.submitScoreArea.classList.add('hidden');
            this.myScoreDisplay.textContent = '';
        }

        // データを取得して表示
        const scores = await this.scoreManager.getLeaderboard(20);
        this.renderLeaderboardList(scores);
    }

    renderLeaderboardList(scores) {
        this.leaderboardList.innerHTML = '';

        if (scores.length === 0) {
            this.leaderboardList.innerHTML = '<div style="text-align:center; padding: 20px; color: #888;">No scores yet. Be the first!</div>';
            return;
        }

        scores.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';

            // 順位メダル
            let rankStr = `${index + 1}`;
            if (index === 0) rankStr = '🥇';
            if (index === 1) rankStr = '🥈';
            if (index === 2) rankStr = '🥉';

            item.innerHTML = `
                <div style="width: 30px; text-align: center;">${rankStr}</div>
                <div style="flex: 1; margin-left: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(entry.name)}</div>
                <div style="width: 80px; text-align: right; font-family: monospace;">${entry.score.toLocaleString()}</div>
            `;
            this.leaderboardList.appendChild(item);
        });
    }

    async submitScore() {
        const name = this.playerNameInput.value.trim();
        if (!name) return;

        // スコア0以下の場合は送信しない
        if (this.score <= 0) {
            alert('スコアが0のため登録できません。');
            return;
        }

        // 名前を保存
        localStorage.setItem('ryoutan-blast-username', name);

        // ボタンを無効化
        this.submitScoreBtn.disabled = true;
        this.submitScoreBtn.textContent = 'Sending...';

        const result = await this.scoreManager.submitScore(name, this.score);

        if (result.success) {
            // 再読み込み
            this.submitScoreBtn.textContent = 'Sent!';
            setTimeout(() => {
                this.submitScoreArea.classList.add('hidden');
                this.submitScoreBtn.disabled = false;
                this.submitScoreBtn.textContent = '送信';
                this.showLeaderboard(false); // input無しで再表示（リスト更新）
            }, 1000);
        } else {
            alert('Error: ' + result.error);
            this.submitScoreBtn.disabled = false;
            this.submitScoreBtn.textContent = '送信';
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * SNSシェア
     */
    shareScore() {
        const text = `🎮 りょうたんブラストで ${this.score} 点を獲得！\n#りょうたんブラスト #BlockBlast`;
        const url = window.location.href;

        // Web Share APIが使える場合
        if (navigator.share) {
            navigator.share({ title: 'りょうたんブラスト', text, url })
                .catch(() => this._openTwitterShare(text));
        } else {
            this._openTwitterShare(text);
        }
    }

    _openTwitterShare(text) {
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(tweetUrl, '_blank', 'width=550,height=420');
    }

    /**
     * ブロックトレイをDOMにレンダリング
     */
    renderBlockTray() {
        this.blockTray.innerHTML = '';

        this.currentBlocks.forEach((block, index) => {
            const wrapper = document.createElement('div');

            // 配置可能かチェック
            const canPlace = !block.used && this.board.canPlaceAnywhere(block.cells);

            let className = 'tray-block';
            if (block.used) className += ' used';
            else if (!canPlace) className += ' disabled';

            wrapper.className = className;
            wrapper.dataset.index = index;

            const thumbnail = this.renderer.createBlockThumbnail(block);
            wrapper.appendChild(thumbnail);

            if (!block.used && canPlace) {
                // タッチ/マウスでドラッグ開始
                const startDrag = (e) => {
                    e.preventDefault();
                    if (this.gameState !== 'playing') return;

                    // Get coordinates
                    let clientX, clientY;
                    if (e.touches && e.touches.length > 0) {
                        clientX = e.touches[0].clientX;
                        clientY = e.touches[0].clientY;
                    } else {
                        clientX = e.clientX;
                        clientY = e.clientY;
                    }

                    // Convert to canvas coords
                    const rect = this.canvas.getBoundingClientRect();
                    const canvasX = clientX - rect.left;
                    const canvasY = clientY - rect.top;

                    this.startDrag(index, canvasX, canvasY);
                };

                wrapper.addEventListener('touchstart', startDrag, { passive: false });
                wrapper.addEventListener('mousedown', startDrag);
            }

            this.blockTray.appendChild(wrapper);
        });
    }

    /**
     * ドラッグ開始
     * @param {number} blockIndex 
     * @param {number} startX Canvas X
     * @param {number} startY Canvas Y
     */
    startDrag(blockIndex, startX, startY) {
        const block = this.currentBlocks[blockIndex];
        if (block.used) return;

        this.draggingBlockIndex = blockIndex;
        this.draggingBlock = {
            cells: block.cells,
            color: block.color,
            bounds: block.bounds,
            screenX: 0,
            screenY: 0,
        };

        // Initialize Drag State
        this.dragState.isActive = true;
        this.dragState.startTime = performance.now();
        this.dragState.pointerX = startX;
        this.dragState.pointerY = startY;
        this.dragState.currentScale = 1.0;
        this.dragState.currentOffsetY = 0;

        // 視覚的フィードバック: ドラッグ中のブロックをハイライト
        document.body.classList.add('is-dragging');
        const trayBlocks = this.blockTray.querySelectorAll('.tray-block');
        trayBlocks[blockIndex]?.classList.add('dragging');

        this.input.setDragging(true);

        // Start Loop
        this._dragLoop();
    }

    _dragLoop() {
        if (!this.dragState.isActive) return;

        const now = performance.now();
        const elapsed = now - this.dragState.startTime;
        const progress = Math.min(elapsed / CONFIG.PICKUP_DURATION, 1.0);

        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        this.dragState.currentOffsetY = CONFIG.DRAG_OFFSET_Y * ease;
        this.dragState.currentScale = 1.0 + (CONFIG.DRAG_SCALE - 1.0) * ease;

        // Apply Logic
        this._updateDragLogic();

        this.render();

        if (this.dragState.isActive) {
            requestAnimationFrame(this._dragLoop.bind(this));
        }
    }

    _updateDragLogic() {
        if (!this.draggingBlock) return;

        const block = this.draggingBlock;

        // Calculate Block Top-Left in Screen Coords
        // Center of block is at (pointerX, pointerY + offset)
        // Wait, normally we drag by the center? Or where we touched?
        // Let's assume center dragging for simplicity as per previous code logic
        // Previous logic: draggingBlock.screenX = canvasX - (width / 2)

        const centerX = this.dragState.pointerX;
        const centerY = this.dragState.pointerY + this.dragState.currentOffsetY;

        // Visual Position (Top-Left)
        block.screenX = centerX - (block.bounds.width * (CONFIG.CELL_SIZE + CONFIG.GRID_GAP)) / 2;
        block.screenY = centerY - (block.bounds.height * (CONFIG.CELL_SIZE + CONFIG.GRID_GAP)) / 2;

        // Grid Logic
        // We want the block to snap based on its "Visual" position aka 'centerY'
        // Input.canvasToGrid expects the touch position normally...
        // But here we are offsetting the touch. 
        // We should pass the "Effective Touch Position" (Where the block is)

        // Grid Logic
        // Calculate Grid Position based on Center, then shift to find Anchor (Top-Left)
        // This ensures the block is centered under the finger (or offset point)
        const gridPos = this.input.canvasToGrid(centerX, centerY);

        const shiftX = Math.floor(block.bounds.width / 2);
        const shiftY = Math.floor(block.bounds.height / 2);

        const anchorX = gridPos.x - shiftX;
        const anchorY = gridPos.y - shiftY;

        // ゴースト位置を更新
        const valid = this.board.canPlace(block.cells, anchorX, anchorY);
        this.ghostPosition = { x: anchorX, y: anchorY, valid };

        // 予測ハイライト
        let clearingLines = null;
        if (valid) {
            clearingLines = this.board.getClearingLines(block.cells, anchorX, anchorY);
        }
        this.clearingLines = clearingLines;
    }

    /**
     * ドラッグキャンセル
     */
    cancelDrag() {
        // ドラッグ状態の視覚的フィードバックを解除
        document.body.classList.remove('is-dragging');
        const trayBlocks = this.blockTray.querySelectorAll('.tray-block');
        trayBlocks.forEach(el => el.classList.remove('dragging'));

        this.draggingBlockIndex = -1;
        this.draggingBlock = null;
        this.ghostPosition = null;
        this.clearingLines = null;
        this.input.setDragging(false);
        this.dragState.isActive = false; // Stop loop
        this.render();
    }

    /**
     * ブロックを配置
     * @param {number} blockIndex 
     * @param {number} gridX 
     * @param {number} gridY 
     */
    placeBlock(blockIndex, gridX, gridY) {
        const block = this.currentBlocks[blockIndex];

        // 1. Arrange: 配置と使用フラグ更新
        this.board.place(block.cells, gridX, gridY);
        block.used = true;

        // 配置サウンド
        this.sound.init();
        this.sound.playPlace();

        // 配置エフェクト
        this.playPlacementEffect(block.cells, gridX, gridY);

        // スコア加算 (配置分)
        const placementScore = CONFIG.SCORE.BASE_POINTS * block.cells.length;
        this.score += placementScore;

        // 2. Clear: ライン消去
        const clearResult = this.board.clearLines();
        const linesCleared = clearResult.totalCleared;

        if (linesCleared > 0) {
            this.combo++;

            // ベース計算: (ライン数 * 基礎点) + (複数ラインボーナス * ライン数)
            let baseLineScore = linesCleared * CONFIG.SCORE.LINE_BASE;

            // マルチラインボーナス: 2列以上でボーナス加算
            if (linesCleared > 1) {
                baseLineScore += linesCleared * CONFIG.SCORE.MULTI_LINE_BONUS;
            }

            // コンボ倍率
            const multiplier = 1 + (this.combo * CONFIG.SCORE.COMBO_MULTIPLIER);

            const totalActionScore = Math.floor(baseLineScore * multiplier);
            this.score += totalActionScore;

            // ライン消去エフェクト
            this.playLineClearEffect(clearResult.rows, clearResult.cols);

            // ヒットストップ & シェイク演出
            const magnitude = (linesCleared > 1 || this.combo > 2) ? 2 : 1;
            this.triggerHitStop(magnitude);

            this.sound.playClear();
            this.showCombo(this.combo);
        } else {
            this.combo = 0;
        }

        // パーフェクトクリアチェック
        if (this.board.isEmpty()) {
            this.score += CONFIG.SCORE.PERFECT_BONUS;
            this.showPerfectClear();
        }

        // ハイスコア更新
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore(this.highScore);
        }

        // 3. Refill: ブロック補充
        const allUsed = this.currentBlocks.every(b => b.used);
        if (allUsed) {
            this.blockGenerator.updateScore(this.score);
            const newBlocks = this.blockGenerator.generateBlockSet();

            if (!newBlocks) {
                // 生成失敗（論理的な詰みなど）
                this.gameState = 'gameover';
                this.sound.playGameOver();
                this.showGameOver();
                this.render();
                return;
            }

            this.currentBlocks = newBlocks;
        }

        // UI更新（スコアアニメーション付き）
        this.updateUI(true);
        this.renderBlockTray();

        // 4. Game Over Check: 補充後の状態に基づいて判定
        // 新しいブロック（あるいは残りのブロック）のうち、少なくとも1つが置けるか？
        this.checkGameOver();

        this.render();
    }

    /**
     * 配置エフェクトを再生
     */
    playPlacementEffect(cells, gridX, gridY) {
        const duration = 200;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.render();
            this.renderer.drawPlacementEffect(cells, gridX, gridY, progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * ライン消去エフェクトを再生
     */
    playLineClearEffect(rows, cols) {
        if (rows.length === 0 && cols.length === 0) return;

        const duration = 300;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.render();
            this.renderer.drawLineClearEffect(rows, cols, progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * ゲームオーバー判定
     */
    checkGameOver() {
        // 残っているブロックがどれも配置できなければゲームオーバー
        const availableBlocks = this.currentBlocks.filter(b => !b.used);

        for (const block of availableBlocks) {
            if (this.board.canPlaceAnywhere(block.cells)) {
                return; // 置ける場所がある
            }
        }

        // ゲームオーバー
        this.gameState = 'gameover';
        this.sound.playGameOver();
        this.showGameOver();
    }

    /**
     * ゲームオーバー画面を表示
     */
    showGameOver() {
        this.finalScoreEl.textContent = this.score;
        this.finalHighScoreEl.textContent = this.highScore;
        this.gameOverOverlay.classList.remove('hidden');

        // ランキング登録を促す (例えばハイスコア更新時や一定スコア以上)
        if (this.score > 0) {
            // 少し遅延させて「ランキングに登録しませんか？」感を出すことも可能
            // 今回はボタンを押して登録するフローにするのでここでは何もしない
            // ただし、ボタン自体はセットアップ済み
        }
    }

    /**
     * コンボ表示
     * @param {number} count 
     */
    showCombo(count) {
        this.comboCountEl.textContent = count;
        this.comboDisplay.classList.remove('hidden');
        this.comboDisplay.classList.add('show');
        this.sound.playCombo(count);

        setTimeout(() => {
            this.comboDisplay.classList.remove('show');
        }, CONFIG.COMBO_DISPLAY_DURATION);
    }

    /**
     * パーフェクトクリア演出
     */
    showPerfectClear() {
        this.perfectImage.src = this.renderer.getFullImageDataUrl();
        this.perfectOverlay.classList.remove('hidden');
        this.sound.playPerfect();

        setTimeout(() => {
            this.perfectOverlay.classList.add('hidden');
        }, CONFIG.PERFECT_DISPLAY_DURATION);
    }

    /**
     * UI更新
     * @param {boolean} animate - スコアアニメーションを再生するか
     */
    updateUI(animate = false) {
        this.scoreEl.textContent = this.score;
        this.highScoreEl.textContent = this.highScore;

        // スコアポップアニメーション
        if (animate) {
            this.scoreEl.classList.remove('score-pop');
            // 強制リフロー
            void this.scoreEl.offsetWidth;
            this.scoreEl.classList.add('score-pop');
        }
    }

    /**
     * 描画
     */
    render() {
        // ヒットストップ中は描画更新をスキップ（静止効果）
        if (this.isHitStopped) return;

        this.renderer.draw(this.board, this.draggingBlock, this.ghostPosition, this.clearingLines);

        // Pass scale if dragging
        if (this.draggingBlock && this.dragState.isActive) {
            // Re-draw dragging block with scale?
            // actually renderer.draw calls drawDraggingBlock inside.
            // We need to modify renderer.draw signature or modify how it calls drawDraggingBlock
            // Let's modify Renderer.draw in a separate tool call as it's cleaner,
            // OR I can just call drawDraggingBlock manually here? 
            // No, layer order matters.

            // Wait, I updated Renderer.js's drawDraggingBlock, but NOT Renderer.js's draw().
            // Renderer.js's draw() calls `this.drawDraggingBlock(draggingBlock)`. 
            // It doesn't pass scale.

            // Force redraw of dragging block? No, I should have updated Renderer.draw to accept scale or read it from block.
            // Since block is a plain object, I can attach scale to it!
            this.draggingBlock.scale = this.dragState.currentScale;
        }
    }

    /**
     * ヒットストップ演出（衝撃で画面を止める）
     * @param {number} magnitude 1:弱, 2:強
     */
    triggerHitStop(magnitude) {
        // わずかな時間、描画をフリーズさせる
        this.isHitStopped = true;
        const duration = magnitude === 2 ? 100 : 40; // ms

        // バイブレーション (Haptics)
        if (navigator.vibrate) {
            navigator.vibrate(magnitude === 2 ? 40 : 15);
        }

        // 画面シェイク (CSSクラス付与)
        document.body.classList.remove('shake', 'shake-hard');
        void document.body.offsetWidth; // リフロー
        document.body.classList.add(magnitude === 2 ? 'shake-hard' : 'shake');

        setTimeout(() => {
            this.isHitStopped = false;
            this.render(); // 再開時に1回描画
            document.body.classList.remove('shake', 'shake-hard');
        }, duration);
    }

    /**
     * ハイスコア読み込み
     * @returns {number}
     */
    loadHighScore() {
        const saved = localStorage.getItem('ryoutan-blast-highscore');
        return saved ? parseInt(saved, 10) : 0;
    }

    /**
     * ハイスコア保存
     * @param {number} score 
     */
    saveHighScore(score) {
        localStorage.setItem('ryoutan-blast-highscore', score.toString());
    }
}
