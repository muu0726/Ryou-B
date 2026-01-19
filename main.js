/**
 * main.js - エントリーポイント
 * りょうたんブラスト
 */

import { Game } from './src/Game.js';

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('game-canvas');

    // 背景画像を読み込み
    const backgroundImage = new Image();
    backgroundImage.src = 'assets/background.jpg';

    backgroundImage.onload = () => {
        console.log('[Main] Background image loaded.');
        const game = new Game(canvas, backgroundImage);
        window.game = game; // Expose for testing
        console.log('[Main] Game initialized.');
    };

    backgroundImage.onerror = (err) => {
        console.error('[Main] Failed to load background image:', err);
        // フォールバック: 背景なしで開始
        const fallbackImage = new Image();
        fallbackImage.width = 400;
        fallbackImage.height = 400;

        // 単色の画像を生成
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 400;
        tempCanvas.height = 400;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = '#333';
        tempCtx.fillRect(0, 0, 400, 400);

        fallbackImage.src = tempCanvas.toDataURL();
        fallbackImage.onload = () => {
            const game = new Game(canvas, fallbackImage);
            console.log('[Main] Game initialized with fallback image.');
        };
    };
});
