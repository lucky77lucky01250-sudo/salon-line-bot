<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# salon-line-bot

美容室オーナー向け LINE bot + AI自動応答（SKH模擬案件1）。
要件の正本は `docs/requirements.md`、提案書は `docs/proposal.md`、見積は `docs/wbs.md`。

## 構成

- Next.js (App Router) + TypeScript + Tailwind CSS / npm
- `app/api/webhook/route.ts` — LINE Webhook受信（署名検証必須）
- `lib/` — 外部サービスクライアント（LINE / Supabase / Claude）はここに一元化
- DB: Supabase（faq / menus / conversations、RLS有効・サーバーはservice role）
- AI: Claude API（モデルはenv `CLAUDE_MODEL` で切替、デフォルト claude-sonnet-5）

## ルール

- **環境変数・APIキーのコード直書き禁止**。必ず `process.env` 経由（`.env.local` はコミットしない）
- キーの値をログ・エラーメッセージに出力しない
- 命名: 変数・関数はcamelCase、コンポーネントはPascalCase、ファイルはkebab-case
- UIはスマホ前提（375px基準・タップ領域44px以上・専門用語を使わない・処理中はスピナー）
- 小さく実装→ `npm run build` で確認→コミット、の順で進める

## 進め方（4段階）

1. 基盤: 雛形+Webhookオウム返し ← 段階1
2. コア: Claude応答+確信度判定+エスカレーション
3. 管理画面+お知らせ一斉配信
4. 統合テスト

各作業日の終わりに `docs/progress/YYYY-MM-DD.md` に進捗メモを残す。
