# Claude Mail

GmailライクなUIで、Claudeがあなたのメールスタイルを学習し、毎回ぴったりの返信下書きを自動生成するメールアプリです。

## 特徴

- **自動下書き生成**: メールを開くと Claude が即座に返信下書きを生成
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
NEXTAUTH_SECRET=...         # openssl rand -base64 32
ANTHROPIC_API_KEY=...
OBSIDIAN_VAULT_PATH=/path/to/your/vault
```

### 2. Google Cloud 設定

1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクト作成
2. **Gmail API** を有効化
3. OAuth 2.0 クライアント ID を作成（Webアプリケーション）
4. 承認済みリダイレクト URI に追加: `http://localhost:3000/api/auth/callback/google`
5. Client ID と Secret を `.env.local` に設定

### 3. Obsidian Vault の設定

- `OBSIDIAN_VAULT_PATH` に Obsidian Vault の絶対パスを設定
- アプリが自動的に以下のフォルダを作成します：
  ```
  [Vault]/Email Intelligence/
    Contacts/      ← 相手ごとの通信スタイル
    Patterns/      ← あなたの書き方スタイル
    Threads/       ← スレッドサマリー
  ```

### 4. 起動

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開き、Google アカウントでログインします。

## 仕組み

1. **メールを開く** → Claude がスレッド全体 + Obsidian の過去学習データを読み込んで下書きを生成
2. **送信ボタンを押す** → Gmail 経由で送信、同時にバックグラウンドでやりとりを分析
3. **Obsidian に保存** → 相手のプロファイル・あなたの書き方スタイルが更新される
4. **次回はさらに精度が上がる** → 繰り返すたびに下書きがあなたの返信に近づく

## 技術スタック

- **Next.js 14** (App Router)
- **next-auth** (Google OAuth2)
- **Gmail API** (googleapis)
- **Anthropic Claude API** (claude-sonnet-4-6 for drafts, claude-haiku for analysis)
- **Obsidian** (local vault, markdown files)
- **Tailwind CSS**
