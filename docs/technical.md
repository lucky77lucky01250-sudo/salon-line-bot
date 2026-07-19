# 技術ドキュメント（引き継ぎ用）

## システム構成図

```
お客様のLINE
    │ メッセージ送信
    ▼
LINE Messaging API ──Webhook(POST)──▶ Vercel: Next.js
                                        │
                                        │ /api/webhook
                                        │  1. HMAC-SHA256署名検証（不正は401）
                                        │  2. 即200を返す（LINEタイムアウト対策）
                                        │  3. after()でレスポンス後に本処理
                                        ▼
                              ┌─ Supabase(faq/menus) ─── FAQ・メニュー取得
                              │
                              ├─ Claude API ────────── 回答+確信度を構造化出力で生成
                              │
                              ├─ LINE reply API ────── お客様へ回答送信
                              ├─ LINE push API ─────── 確信度lowならオーナーへ【要対応】通知
                              │
                              └─ Supabase(conversations) ─ 会話ログ保存

オーナーのスマホ ──▶ /admin（Basic認証: proxy.ts）
                     ├─ /admin/faq       FAQのCRUD（Server Actions）
                     ├─ /admin/menus     メニューのCRUD（Server Actions）
                     └─ /admin/broadcast テスト送信(push) / 全員配信(broadcast)
```

## API仕様

### POST /api/webhook — LINE Webhook受信

| 項目 | 内容 |
|---|---|
| 認証 | `x-line-signature` ヘッダのHMAC-SHA256署名を `LINE_CHANNEL_SECRET` で検証。失敗時401 |
| 応答 | 検証後ただちに200 `{"ok":true}`。AI処理は `after()`（レスポンス送信後）で実行 |
| 処理対象 | `message` イベントかつ `text` メッセージのみ。それ以外（スタンプ等）は無視 |
| タイムアウト | `maxDuration = 60`（AI処理の余裕をみて延長） |

処理フロー（`app/api/webhook/route.ts` の `handleEvent`）:

1. faq・menusを並列取得 → Claudeで回答+確信度を生成
2. 生成失敗時は謝罪文にフォールバックし low 扱い（お客様を無応答にしない）
3. replyMessageでお客様へ返信（最優先。失敗はログのみ）
4. 確信度 low → `OWNER_LINE_USER_ID` へpush通知（未設定時はスキップ+警告ログ）
5. conversationsへログ保存（3〜5は互いに失敗しても他へ影響させない）

### /admin 配下 — 管理画面（Server Actions）

| 画面 | アクション | 内容 |
|---|---|---|
| /admin/faq | createFaq / updateFaq / deleteFaq | faqテーブルのCRUD。保存後 `revalidatePath` |
| /admin/menus | createMenu / updateMenu / deleteMenu | menusテーブルのCRUD。価格は整数化・負値拒否 |
| /admin/broadcast | sendBroadcast(mode=test) | オーナーのみへpush（見え方確認用） |
| /admin/broadcast | sendBroadcast(mode=all) | 全友だちへbroadcast。500文字上限 |

認証は `proxy.ts`（Next.js 16のProxy＝旧Middleware）で `/admin/:path*` にBasic認証を適用。
パスワードは `ADMIN_PASSWORD`。未設定時は全リクエスト401（fail closed）。
Server ActionのPOSTも同パスに届くため同じ認証で保護される。

## AI応答の設計（lib/claude.ts）

- モデル: env `CLAUDE_MODEL`（デフォルト claude-sonnet-5）
- 入力: システムプロンプトにDBのFAQ全件+メニュー全件を埋め込み、「この情報だけを根拠に回答」と制約
- 出力: 構造化出力（JSONスキーマ固定）で `{ reply, confidence }` を1回の呼び出しで取得
  - `high`: FAQ/メニューに明確な根拠がある
  - `medium`: 根拠から自然に導ける
  - `low`: 情報がない → エスカレーション（回答文も「オーナーに確認して折り返す」趣旨に固定）
- 拒否応答（refusal）時も low 扱いで安全側に倒す
- 閾値変更: エスカレーション条件は webhook 内の `confidence === "low"` 1箇所。誤回答が目立つ場合は `!== "high"` に変えれば medium もオーナー確認に回せる

## DB設計（Supabase / PostgreSQL）

すべてRLS有効・ポリシーなし（= service roleのみアクセス可。公開キーでは読めない）。

### faq
| 列 | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| question | text | お客様からの質問 |
| answer | text | お店からの答え |
| category | text? | 分類（現UIでは未使用・将来用） |
| created_at / updated_at | timestamptz | |

### menus
| 列 | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| name | text | メニュー名 |
| price | integer | 税込価格（円） |
| description | text? | ひとこと説明 |
| duration_minutes | integer? | 目安時間（分） |
| created_at / updated_at | timestamptz | |

### conversations
| 列 | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| line_user_id | text | 送信者のLINE userId |
| user_message | text | お客様の質問 |
| bot_reply | text? | botの回答 |
| confidence | text | high / medium / low（check制約） |
| escalated | boolean | オーナー通知したか |
| created_at | timestamptz | index(desc)あり |

## 外部サービスと認証情報

| サービス | 用途 | 認証情報（env） |
|---|---|---|
| LINE Messaging API | 受信Webhook / reply / push / broadcast | LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN |
| Claude API | 回答生成 | ANTHROPIC_API_KEY, CLAUDE_MODEL(任意) |
| Supabase | DB | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ほか |
| Vercel | ホスティング・自動デプロイ | （GitHub連携） |

## 運用上の注意

- Supabaseへのリクエストは `cache: "no-store"` 固定（Next.jsのfetchキャッシュに乗せない）。まれな `PGRST303`（時計ズレ）は1回リトライで吸収
- LINE無料プランは push/broadcast 合計 月200通まで（replyはカウント外）。友だち300人へ配信する月は有料プランが必要
- 障害時の挙動: Claude/DB障害でもお客様には謝罪文を返信しオーナーに通知（無応答にならない設計）
