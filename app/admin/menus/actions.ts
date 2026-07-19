"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";

// メニューの追加・更新・削除（管理画面から呼ばれるServer Actions）

function parseMenuForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim();
  const duration = Number(formData.get("duration_minutes"));
  if (!name || !Number.isFinite(price) || price < 0) return null;
  return {
    name,
    price: Math.round(price),
    description: description || null,
    duration_minutes:
      Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
  };
}

export async function createMenu(formData: FormData) {
  const values = parseMenuForm(formData);
  if (!values) return;

  const { error } = await getSupabaseAdmin().from("menus").insert(values);
  if (error) throw new Error(`menu insert failed: ${error.code}`);
  revalidatePath("/admin/menus");
}

export async function updateMenu(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const values = parseMenuForm(formData);
  if (!id || !values) return;

  const { error } = await getSupabaseAdmin()
    .from("menus")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`menu update failed: ${error.code}`);
  revalidatePath("/admin/menus");
}

export async function deleteMenu(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await getSupabaseAdmin().from("menus").delete().eq("id", id);
  if (error) throw new Error(`menu delete failed: ${error.code}`);
  revalidatePath("/admin/menus");
}
