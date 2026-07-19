# セットアップ手順書（開発引き継ぎ用）

このプロジェクトをゼロから動かすための手順。所要時間の目安は1〜2時間。

## 前提

- Node.js 20以上 / npm
- アカウント: GitHub / Vercel / Supabase / LINE Developers / Anthropic Console

## 1. コードの取得と依存関係

```bash
git clone https://github.com/lucky77lucky01250-sudo/salon-line-bot.git
cd salon-line-bot
npm install
```

## 2. Supabase（DB）

1. https://supabase.com で新規プロジェクト作成（リージョンは東京 ap-northeast-1 推奨）
2. SQL Editor で `docs/sql/001_init.sql` を実行（3テーブル作成・RLS有効）
3. 続けて `docs/sql/002_seed.sql` を実行（FAQ・メニューの初期データ。**既存の初期データを消して入れ直すので本番運用開始後は実行しないこと**）
4. Project Settings → API から以下を控える
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - publishable/anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - secret/service_role key → `SUPABASE_SERVICE_ROLE_KEY`

RLSはポリシーなしで有効＝secret key（サーバー）以外からは読み書き不可、という設計。

## 3. LINE公式アカウント

1. https://developers.line.biz でMessaging APIチャネルを作成（既存の公式アカウントに紐付け）
2. チャネル基本設定 → チャネルシークレット → `LINE_CHANNEL_SECRET`
3. Messaging API設定 → チャネルアクセストークン（長期）を発行 → `LINE_CHANNEL_ACCESS_TOKEN`
4. LINE Official Account Manager（manager.line.biz）の応答設定:
   - 応答メッセージ: オフ ／ あいさつメッセージ: 任意 ／ Webhook: オン

## 4. Claude API

1. https://console.anthropic.com でAPIキー発行 → `ANTHROPIC_API_KEY`
2. モデルを変えたい場合のみ `CLAUDE_MODEL` を設定（未設定なら claude-sonnet-5）

## 5. ローカル起動

`.env.local` をプロジェクト直下に作成:

```
LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OWNER_LINE_USER_ID=...   # 手順7で取得後に設定
ADMIN_PASSWORD=...       # 管理画面のパスワード（自分で決める）
```

```bash
npm run dev
# http://localhost:3000/admin にADMIN_PASSWORDでログインできれば成功
```

## 6. デプロイ（Vercel）

1. VercelでGitHubリポジトリをImport（framework: Next.js、設定はデフォルトでOK）
2. Settings → Environment Variables に `.env.local` と同じ変数を登録
3. デプロイ後、LINE Developers の Messaging API設定 → Webhook URL に
   `https://<デプロイ先ドメイン>/api/webhook` を設定し「検証」で成功を確認
   （**これを忘れるとデプロイ済みなのにbotが反応しない**）
4. スマホのLINEからbotに「営業時間は？」と送って自動応答が返れば完了

## 7. エスカレーション通知先の設定

1. オーナーのLINEからbotに何か1通送る
2. Supabaseの `conversations` テーブルの `line_user_id` 列に記録されたIDを控える
3. それを `OWNER_LINE_USER_ID` として .env.local と Vercel に設定 → VercelでRedeploy
4. FAQにない質問（例:「着物の着付けはできますか？」）を送り、オーナーのLINEに【要対応】通知が届けば成功

## 動作確認チェックリスト

- [ ] FAQにある質問 → 自動で正しい回答が返る
- [ ] FAQにない質問 → 「オーナーに確認します」+ オーナーに通知
- [ ] /admin にパスワードでログインできる（なしだと401）
- [ ] 管理画面でFAQを編集 → botの回答が変わる
- [ ] お知らせ「自分にテスト送信」が届く
