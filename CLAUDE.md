# takaya — Claude Code Project

## Obsidian Vault 連携

このプロジェクトは `obsidian-vault-template/` に Obsidian Vault の初期セットアップファイルを管理しています。

### Vault へのアクセス方法

Vault は `takaya-aoki/obsidian-vault` リポジトリに格納されています（obsidian-git で自動同期）。

**ノートを読む:**
```
mcp__github__get_file_contents
  owner: takaya-aoki
  repo: obsidian-vault
  path: Daily Notes/2025-05-28.md
```

**ノートを作成:**
```
mcp__github__create_or_update_file
  owner: takaya-aoki
  repo: obsidian-vault
  branch: main
  path: Projects/my-project.md
  content: ...
  message: "add: my-project note"
```

**ノートを検索:**
```
mcp__github__search_code
  q: "検索キーワード repo:takaya-aoki/obsidian-vault"
```

## obsidian-vault-template/

Vault リポジトリの初期ファイル一式。  
セットアップ手順は `obsidian-vault-template/` を参照。
