-- salon-line-bot 初期スキーマ（段階1: 1-6）
-- faq: よくある質問と回答（管理画面で編集）
create table if not exists faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table faq enable row level security;

-- menus: メニューと料金（半年に1回の改定に対応）
create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null,
  description text,
  duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table menus enable row level security;

-- conversations: 会話ログ（確信度・エスカレーション記録つき）
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null,
  user_message text not null,
  bot_reply text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  escalated boolean not null default false,
  created_at timestamptz not null default now()
);
alter table conversations enable row level security;
create index if not exists conversations_created_at_idx on conversations (created_at desc);

-- RLSは全テーブル有効・ポリシーなし = 公開キーからは読み書き不可。
-- サーバー(秘密の鍵)のみアクセスできる構成（段階3の管理画面もサーバー経由）
