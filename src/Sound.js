/**
 * Sound.js - サウンドエフェクト (AudioContext)
 * ファイル不要の合成音
 */

export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;
    }

    /**
     * ユーザー操作時に初期化（ブラウザ制約対応）
     */
    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('AudioContext not supported');
            this.enabled = false;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * 配置音（短いクリック音）
     */
    playPlace() {
        if (!this.enabled || !this.audioContext) return;
        this._playTone(400, 0.05, 'square', 0.3);
    }

    /**
     * ライン消去音（上昇音）
     */
    playClear() {
        if (!this.enabled || !this.audioContext) return;
        this._playTone(500, 0.15, 'sine', 0.4, 800);
    }

    /**
     * コンボ音（高めの音）
     * @param {number} combo 
     */
    playCombo(combo) {
        if (!this.enabled || !this.audioContext) return;
        const baseFreq = 600 + combo * 100;
        this._playTone(baseFreq, 0.2, 'sine', 0.5);
    }

    /**
     * パーフェクトクリア音（ファンファーレ風）
     */
    playPerfect() {
        if (!this.enabled || !this.audioContext) return;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 0.3, 'sine', 0.4), i * 100);
        });
    }

    /**
     * ゲームオーバー音（下降音）
     */
    playGameOver() {
        if (!this.enabled || !this.audioContext) return;
        this._playTone(400, 0.5, 'sawtooth', 0.3, 100);
    }

    /**
     * トーンを再生
     */
    _playTone(frequency, duration, type = 'sine', volume = 0.5, endFrequency = null) {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        if (endFrequency) {
            oscillator.frequency.linearRampToValueAtTime(endFrequency, ctx.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }
}
