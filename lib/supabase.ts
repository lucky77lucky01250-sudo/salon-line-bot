import { createClient } from "@supabase/supabase-js";

// Supabase管理クライアント（サーバー専用・service role）
// RLSはポリシーなしのため、この鍵でのみ読み書きできる
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase env vars are not set");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
    // DBの内容は常に最新を読む（Next.jsのfetchキャッシュに乗せない）
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
};

export type Menu = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  duration_minutes: number | null;
};

// Supabase側の時計ズレで稀に「JWT issued at future」(PGRST303)が返るため、
// その場合のみ少し待って1回リトライする
async function withClockSkewRetry<T extends { error: { code?: string } | null }>(
  run: () => PromiseLike<T>,
): Promise<T> {
  const first = await run();
  if (first.error?.code !== "PGRST303") return first;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return run();
}

export async function fetchFaqs(): Promise<Faq[]> {
  const { data, error } = await withClockSkewRetry(() =>
    getSupabaseAdmin()
      .from("faq")
      .select("id, question, answer, category")
      .order("created_at", { ascending: true }),
  );
  if (error) throw new Error(`faq fetch failed: ${error.code} ${error.message}`);
  return data ?? [];
}

export async function fetchMenus(): Promise<Menu[]> {
  const { data, error } = await withClockSkewRetry(() =>
    getSupabaseAdmin()
      .from("menus")
      .select("id, name, price, description, duration_minutes")
      .order("created_at", { ascending: true }),
  );
  if (error) throw new Error(`menus fetch failed: ${error.code} ${error.message}`);
  return data ?? [];
}

// 会話ログを保存（確信度・エスカレーション有無つき)
export async function saveConversation(entry: {
  lineUserId: string;
  userMessage: string;
  botReply: string;
  confidence: "high" | "medium" | "low";
  escalated: boolean;
}) {
  const { error } = await withClockSkewRetry(() =>
    getSupabaseAdmin().from("conversations").insert({
      line_user_id: entry.lineUserId,
      user_message: entry.userMessage,
      bot_reply: entry.botReply,
      confidence: entry.confidence,
      escalated: entry.escalated,
    }),
  );
  if (error) throw new Error(`conversation insert failed: ${error.code} ${error.message}`);
}
