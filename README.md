# りょうたんブラスト 🎮

Block Blast風のパズルゲーム。ブロックを配置して行・列を消去し、隠された画像を解放しよう！

![Game Screenshot](assets/screenshot.png)

## 🎯 遊び方

1. 画面下部の3つのブロック候補から1つを選んでドラッグ
2. 8x8のグリッド上にドロップして配置
3. 行または列が揃うと消去され、スコア獲得
4. 全てのブロックを消すと「パーフェクト」でボーナス！
5. ブロックが置けなくなったらゲームオーバー

## ✨ 特徴

- **ユニークなビジュアル**: ブロックを置くと背景画像の断片が浮かび上がる
- **スマホ最適化**: タッチ操作に対応、指で隠れないオフセット機能
- **詰み防止**: 必ず配置可能な組み合わせが出現
- **動的難易度**: スコアに応じて難しい形状が登場
- **パーフェクトクリア**: 全消しで特別演出と大量ボーナス

## 🛠 技術仕様

- **Vanilla JS** (フレームワーク不使用)
- **HTML5 Canvas** による描画
- **Bitboard (BigInt)** による高速な衝突・ライン判定
- **LocalStorage** によるハイスコア保存

## 🚀 起動方法

```bash
# プロジェクトディレクトリで
python -m http.server 3000
# または
npx serve .

# ブラウザで http://localhost:3000 を開く
```

## 📁 ファイル構成

```
Ryoutan-Blast/
├── index.html          # メインHTML
├── style.css           # スタイル
├── main.js             # エントリーポイント
├── assets/
│   └── background.jpg  # 背景画像
└── src/
    ├── Config.js       # 設定定数
    ├── Shapes.js       # ブロック形状
    ├── Board.js        # Bitboardロジック
    ├── BlockGenerator.js # ブロック生成
    ├── Renderer.js     # 描画
    ├── Input.js        # 入力処理
    └── Game.js         # ゲームロジック
```

## 📝 スコア計算

```
Score = (Base × Blocks) + (LineBonus × Combo^1.5)
```

| アクション | ボーナス |
|------------|----------|
| 1列消去 | 100点 |
| 2列同時 | 300点 |
| 3列同時 | 600点 |
| パーフェクト | 3000点 |

## 📄 ライセンス

MIT License

## 🌐 GitHubリポジトリ

[https://github.com/muu0726/Ryou-B](https://github.com/muu0726/Ryou-B)
