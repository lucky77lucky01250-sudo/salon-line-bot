# 統合テスト報告書

- 実施日: 2026-07-19
- 対象環境: 本番（https://salon-line-bot-five.vercel.app）
- 方法: 署名付きWebhook直POST・管理画面Server Action直POST・Supabase実データ検証による自動E2E（スクリプト実行）+ スマホ実機UAT
- 結果: **自動テスト 16/16 PASS + 実機UAT 4/4 PASS**

## 自動テスト結果

### セキュリティ

| ID | 項目 | 結果 |
|---|---|---|
| SEC-1 | 署名なしWebhookは401で拒否 | PASS |
| SEC-2 | 不正署名Webhookは401で拒否 | PASS |
| SEC-3 | 認証なしの管理画面4ページ（/admin, faq, menus, broadcast）は401 | PASS |
| SEC-4 | 誤パスワードは401 | PASS |
| SEC-5 | 正パスワードで管理画面200 | PASS |

### bot応答

| ID | 項目 | 結果 |
|---|---|---|
| BOT-1 | Webhookは3秒以内に200応答（実測964ms。AI処理はレスポンス後） | PASS |
| BOT-2 | FAQ質問→高確信度で回答・会話ログ保存（confidence=high, escalated=false） | PASS |
| BOT-3 | FAQ外質問→low判定・エスカレーション記録（escalated=true・オーナーへ通知） | PASS |
| BOT-4 | スタンプ等テキスト以外のメッセージは無視して200（クラッシュしない） | PASS |

### 管理画面→bot連携

| ID | 項目 | 結果 |
|---|---|---|
| ADM-1 | FAQ画面のフォームからServer Action IDが取得できる | PASS |
| ADM-2 | FAQ追加→DB反映 | PASS |
| ADM-3 | 追加した新FAQがbotの回答に即反映（追加→質問→正答→high確信度） | PASS |
| ADM-4 | FAQ削除→DB反映 | PASS |

## 実機UAT（2026-07-19 スマホ・実LINEで確認）

| 項目 | 結果 |
|---|---|
| エスカレーション通知がオーナーのLINEに届く | PASS |
| 管理画面でFAQ編集→botの回答が変わる（営業時間9:00→10:00で確認） | PASS |
| お知らせ「自分にテスト送信」が自分のLINEに届く | PASS |
| 「全員に配信」が友だちに届く（配信前にInsight APIで友だち数=1を確認の上実施） | PASS |

## 既知の制約・注意事項

- 確信度 medium は自動回答扱い（エスカレーションは low のみ）。運用で誤回答が目立つ場合は閾値を medium に引き上げ可能（webhook内の判定1行）
- お知らせ配信は取り消し不可。管理画面はテスト送信→確認→全員配信の2段階+確認ダイアログで誤操作を抑止
- LINE無料プランのメッセージ数上限は月200通（応答メッセージはカウント外・push/broadcastが対象）。友だち300人への配信を行う月は有料プランが必要
- 管理画面はBasic認証（単一パスワード）。オーナー1人運用前提。複数人・権限分けが必要になったらPhase 2で認証方式を拡張
- Claude APIまたはDB障害時は、お客様に「オーナーに確認して折り返す」旨を返信しオーナーへ通知（無応答にはならない）
