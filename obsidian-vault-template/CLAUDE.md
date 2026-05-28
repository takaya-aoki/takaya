# Obsidian Vault — Claude Code Instructions

## このプロジェクトについて

takaya-aoki の個人 Obsidian Vault。  
obsidian-git で自動同期されており、Claude Code on the web からどのデバイスでもアクセス可能。

## Vault 構造

| フォルダ | 用途 |
|---|---|
| `00_Home/` | ホーム・ナビゲーション用ノート |
| `10_Daily/` | 日次ノート（YYYY-MM-DD.md 形式） |
| `20_Knowledge/` | 知識・学び・情報（Keep/ サブフォルダあり） |
| `30_Projects/` | プロジェクト別ノート・議事録 |
| `40_Decisions/` | 意思決定ログ |
| `50_Preferences/` | プロフィール・チームメンバー情報 |
| `60_Self/` | 価値観・目標・思考スタイル等の自己記録 |

## ノートの形式

すべてのノートは Markdown（.md）。フロントマターで管理：

```yaml
---
created: YYYY-MM-DD
tags: [tag1, tag2]
---
```

## よく使う操作

### 今日のデイリーノートを読む
```
path: 10_Daily/YYYY-MM-DD.md
```

### ノートを作成・更新する
```
mcp__github__create_or_update_file
  owner: takaya-aoki
  repo: obsidian-vault
  branch: main
  path: 10_Daily/2026-05-28.md
  content: ...
  message: "add: daily note 2026-05-28"
```

### ノートを検索する
```
mcp__github__search_code
  q: "検索キーワード repo:takaya-aoki/obsidian-vault"
```

### 既存ノートを更新する（SHA必須）
```
1. get_file_contents で sha を取得
2. create_or_update_file で sha を指定して更新
```

## 行動指針

- ノートを作成するときは必ずフロントマターをつける
- 既存ノートを更新するときは必ず SHA を取得してから更新する
- [[WikiLink]] 形式でノート間をリンクする
- 日本語を優先して使用する
- デイリーノートは `10_Daily/` に保存
- プロジェクトノートは `30_Projects/` に保存
