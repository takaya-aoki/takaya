# Obsidian Vault — Claude Code Instructions

## このプロジェクトについて

takaya-aoki の個人 Obsidian Vault。  
obsidian-git で自動同期されており、Claude Code on the web からどのデバイスでもアクセス可能。

## Vault 構造

| フォルダ | 用途 |
|---|---|
| `Daily Notes/` | 日次ノート（YYYY-MM-DD.md 形式） |
| `Projects/` | プロジェクト別ノート |
| `Areas/` | 継続的な関心領域 |
| `Resources/` | 参考資料・クリップ |
| `MOC/` | Map of Content（索引・ナビゲーション） |
| `Archive/` | 完了・不要になったノート |
| `Templates/` | ノートテンプレート |

## ノートの形式

すべてのノートは Markdown（.md）。フロントマターで管理：

```yaml
---
created: YYYY-MM-DD
tags: [tag1, tag2]
---
```

## よく使う操作

### ノートを読む
```
特定ファイル: mcp__github__get_file_contents で path を指定
ディレクトリ一覧: path にフォルダ名を指定
```

### ノートを作成・更新する
```
mcp__github__create_or_update_file で content, path, message を指定
branch: main を使用
```

### ノートを検索する
```
mcp__github__search_code で q="検索語 repo:takaya-aoki/obsidian-vault" を指定
```

### 今日のデイリーノートを確認する
Daily Notes/YYYY-MM-DD.md を読む（今日の日付で）

## 行動指針

- ノートを作成するときは必ずフロントマターをつける
- 既存ノートを更新するときは SHA を取得してから更新する
- タグは既存のものを優先して使う
- [[WikiLink]] 形式でノート間をリンクする
- 日本語を優先して使用する
