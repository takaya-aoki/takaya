# Claude Mail

GmailライクなUIで、Geminiがあなたのメールスタイルを学習し、毎回ぴったりの返信下書きを自動生成するメールアプリです。

## 費用

**すべて無料で動作します。**

| サービス | 費用 |
|---|---|
| Gmail API | 無料（個人利用の範囲で十分） |
| Google AI Studio (Gemini API) | **無料** — `gemini-1.5-flash` は1日1,500リクエストまで無料 |
| Next.js / next-auth / Tailwind | 無料 |
| Obsidian | すでに利用中 |

## 特徴

- **自動下書き生成**: メールを開くと Gemini が即座に返信下書きを生成
- **学習機能**: やりとりするたびに通信スタイルを Obsidian に蓄積
- **パーソナライズ**: 相手ごとのトーン・話題・フレーズを記憶して精度向上
- **Gmail UI**: 使い慣れた Gmail ライクなインターフェース

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して以下を設定：

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...            # openssl rand -base64 32
GOOGLE_AI_API_KEY=...          # Google AI Studio で無料取得
OBSIDIAN_VAULT_PATH=/path/to/your/vault
```

### 2. Google Cloud 設定（Gmail API）

1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクト作成
2. **Gmail API** を有効化
3. OAuth 2.0 クライアント ID を作成（種類: Webアプリケーション）
4. 承認済みリダイレクト URI に追加: `http://localhost:3000/api/auth/callback/google`
5. Client ID と Secret を `.env.local` に設定

### 3. Google AI Studio API キーを取得（無料）

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. Google アカウントでログイン
3. 「APIキーを作成」→ `.env.local` の `GOOGLE_AI_API_KEY` に設定

### 4. Obsidian Vault の設定

- `OBSIDIAN_VAULT_PATH` に Obsidian Vault の絶対パスを設定
- アプリが自動的に以下のフォルダを作成します：
  ```
  [Vault]/Email Intelligence/
    Contacts/      ← 相手ごとの通信スタイル
    Patterns/      ← あなたの書き方スタイル
    Threads/       ← スレッドサマリー
  ```

### 5. 起動

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開き、Google アカウントでログインします。

## 仕組み

1. **メールを開く** → Gemini がスレッド全体 + Obsidian の過去学習データを読み込んで下書きを生成
2. **送信ボタンを押す** → Gmail 経由で送信、同時にバックグラウンドでやりとりを分析
3. **Obsidian に保存** → 相手のプロファイル・あなたの書き方スタイルが更新される
4. **次回はさらに精度が上がる** → 繰り返すたびに下書きがあなたの返信に近づく

## 技術スタック

- **Next.js 14** (App Router)
- **next-auth** (Google OAuth2)
- **Gmail API** (googleapis)
- **Google AI Studio** (`gemini-1.5-flash` — 無料枠)
- **Obsidian** (local vault, markdown files)
- **Tailwind CSS**
