"use server";

import { getLineClient } from "@/lib/line";

export type BroadcastResult = {
  status: "idle" | "success" | "error";
  message: string;
};

// お知らせ配信: mode=test は自分（オーナー）だけに送信、mode=all は友だち全員に配信
export async function sendBroadcast(
  _prev: BroadcastResult,
  formData: FormData,
): Promise<BroadcastResult> {
  const text = String(formData.get("text") ?? "").trim();
  const mode = String(formData.get("mode") ?? "");
  if (!text) {
    return { status: "error", message: "お知らせの内容を入力してください。" };
  }
  if (text.length > 500) {
    return { status: "error", message: "500文字以内で入力してください。" };
  }

  try {
    if (mode === "test") {
      const ownerId = process.env.OWNER_LINE_USER_ID;
      if (!ownerId) {
        return {
          status: "error",
          message: "テスト送信先が未設定です（OWNER_LINE_USER_ID）。",
        };
      }
      await getLineClient().pushMessage({
        to: ownerId,
        messages: [{ type: "text", text }],
      });
      return {
        status: "success",
        message: "あなたのLINEにテスト送信しました。内容を確認してください。",
      };
    }

    if (mode === "all") {
      await getLineClient().broadcast({
        messages: [{ type: "text", text }],
      });
      return {
        status: "success",
        message: "友だち全員に配信しました。",
      };
    }

    return { status: "error", message: "送信方法が不明です。" };
  } catch (err) {
    console.error("broadcast failed:", err instanceof Error ? err.message : err);
    return {
      status: "error",
      message: "送信に失敗しました。時間をおいてもう一度お試しください。",
    };
  }
}
