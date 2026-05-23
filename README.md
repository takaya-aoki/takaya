# Claude Mail

GmailライクなUIで、Geminiがあなたのメールスタイルを学習し、毎回ぴったりの返信下書きを自動生成するメールアプリです。  
やりとりはすべて **ローカルの Obsidian Vault** (`C:\Users\aoki`) に保存されます。

## 費用

**すべて無料で動作します。**

| サービス | 費用 |
|---|---|
| Gmail API | 無料（個人利用の範囲で十分） |
| Google AI Studio (Gemini API) | **無料** — `gemini-1.5-flash` は1日1,500リクエストまで |
| Next.js / next-auth / Tailwind | 無料 |
| Obsidian | すでに利用中（ローカル保存） |

## セットアップ

### 1. リポジトリをクローンして依存をインストール

```bash
git clone <repo-url>
cd takaya
npm install
```

### 2. 環境変数の設定

```bash
copy .env.local.example .env.local
```

`.env.local` をメモ帳などで編集：

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...               # 後述
GOOGLE_AI_API_KEY=...             # Google AI Studio で無料取得
OBSIDIAN_VAULT_PATH=C:/Users/aoki/Documents/MyVault
```

> **Windows パスの注意**: `.env` ファイルではバックスラッシュを `/` に変えてください。  
> `C:\Users\aoki\...` → `C:/Users/aoki/...`

#### NEXTAUTH_SECRET の生成（PowerShell）

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Google Cloud 設定（Gmail API）

1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクト作成
2. **Gmail API** を有効化
3. OAuth 2.0 クライアント ID を作成（種類: Webアプリケーション）
4. 承認済みリダイレクト URI に追加:  
   `http://localhost:3000/api/auth/callback/google`
5. Client ID と Secret を `.env.local` に設定

### 4. Google AI Studio API キーを取得（無料）

1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) にアクセス
2. Google アカウントでログイン
3. 「APIキーを作成」→ `.env.local` の `GOOGLE_AI_API_KEY` に設定

### 5. Obsidian Vault パスを設定

`OBSIDIAN_VAULT_PATH` に既存の Obsidian Vault のパスを指定します：

```
OBSIDIAN_VAULT_PATH=C:/Users/aoki/Documents/MyVault
```

アプリ起動後、Vault 内に以下のフォルダが自動作成されます：

```
C:\Users\aoki\Documents\MyVault\
  Email Intelligence\
    Contacts\      ← 相手ごとの通信スタイル (.md)
    Patterns\      ← あなたの書き方スタイル
    Threads\       ← スレッドサマリー
```

Obsidian で開けばそのまま参照・編集できます。

### 6. 起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開き、Google アカウントでログインします。

## 仕組み

1. **メールを開く** → Gemini がスレッド + ローカルの Obsidian 学習データを読み込んで下書きを生成
2. **送信ボタンを押す** → Gmail 経由で送信、バックグラウンドでやりとりを分析
3. **ローカルに保存** → `C:\Users\aoki\...\Email Intelligence\` に相手プロファイルとスタイルが更新
4. **次回はさらに精度が上がる** → 繰り返すたびに下書きがあなたの返信に近づく

## 技術スタック

- **Next.js 14** (App Router)
- **next-auth** (Google OAuth2)
- **Gmail API** (googleapis)
- **Google AI Studio** (`gemini-1.5-flash` — 無料枠)
- **Obsidian** (C:\Users\aoki — ローカル保存)
- **Tailwind CSS**
