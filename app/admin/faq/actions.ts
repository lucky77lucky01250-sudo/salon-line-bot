"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";

// FAQの追加・更新・削除（管理画面から呼ばれるServer Actions）
// 認証はproxy.tsのBasic認証で担保。Server Actionも/admin配下のページ経由でのみ発火する

export async function createFaq(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;

  const { error } = await getSupabaseAdmin()
    .from("faq")
    .insert({ question, answer });
  if (error) throw new Error(`faq insert failed: ${error.code}`);
  revalidatePath("/admin/faq");
}

export async function updateFaq(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!id || !question || !answer) return;

  const { error } = await getSupabaseAdmin()
    .from("faq")
    .update({ question, answer, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`faq update failed: ${error.code}`);
  revalidatePath("/admin/faq");
}

export async function deleteFaq(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await getSupabaseAdmin().from("faq").delete().eq("id", id);
  if (error) throw new Error(`faq delete failed: ${error.code}`);
  revalidatePath("/admin/faq");
}
