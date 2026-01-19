/**
 * ScoreManager.js - Firebase Firestore連携
 * スコアの保存とランキング取得を担当
 */

// GitHub Pages等の静的ホスティングで動作させるため、CDNからモジュールを読み込む
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class ScoreManager {
    constructor() {
        // Firebase configuration
        this.firebaseConfig = {
            apiKey: "AIzaSyBFwERt6btg9d4FClE6_QORyNXC7pD2SX8",
            authDomain: "ryoutan-blast.firebaseapp.com",
            projectId: "ryoutan-blast",
            storageBucket: "ryoutan-blast.firebasestorage.app",
            messagingSenderId: "1034150927670",
            appId: "1:1034150927670:web:af69a1933ee80b88b6e797",
            measurementId: "G-L71G5L5ZSR"
        };

        this.db = null;
        this.collectionName = 'scores';

        // 設定値がある場合のみ初期化
        if (this.firebaseConfig.projectId) {
            try {
                this.app = initializeApp(this.firebaseConfig);
                this.db = getFirestore(this.app);
                console.log('Firebase initialized');
                this.isInitialized = true;
            } catch (e) {
                console.error('Firebase initialization failed:', e);
                this.isInitialized = false;
            }
        } else {
            console.warn('Firebase config is missing. Leaderboard disabled.');
            this.isInitialized = false;
        }
    }

    /**
     * スコアを送信
     * @param {string} name プレイヤー名
     * @param {number} score スコア
     */
    async submitScore(name, score) {
        if (!this.isInitialized) return { success: false, error: 'Not initialized' };

        try {
            await addDoc(collection(this.db, this.collectionName), {
                name: name,
                score: score,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent // 簡易的な不正チェック用
            });
            return { success: true };
        } catch (e) {
            console.error('Error adding score: ', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * ランキングを取得
     * @param {number} limitCount 取得件数
     * @returns {Promise<Array>}
     */
    async getLeaderboard(limitCount = 10) {
        if (!this.isInitialized) return [];

        try {
            const q = query(
                collection(this.db, this.collectionName),
                orderBy('score', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const leaderboard = [];

            querySnapshot.forEach((doc) => {
                leaderboard.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return leaderboard;
        } catch (e) {
            console.error('Error fetching leaderboard: ', e);
            return [];
        }
    }
}
