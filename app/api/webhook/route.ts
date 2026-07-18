import { after } from "next/server";
import { validateSignature, type webhook } from "@line/bot-sdk";
import { getChannelSecret, getLineClient } from "@/lib/line";
import { answerQuestion } from "@/lib/claude";
import { fetchFaqs, fetchMenus, saveConversation } from "@/lib/supabase";

// AI応答（Claude API）に数秒かかることがあるため余裕を持たせる
export const maxDuration = 60;

// LINE Webhook受信エンドポイント
// 署名検証に生のリクエストボディが必要なため、request.text()で受ける
// LINEプラットフォームへは即200を返し、AI応答はafter()でレスポンス後に処理する（タイムアウト対策）
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!signature || !validateSignature(body, getChannelSecret(), signature)) {
    return Response.json({ message: "invalid signature" }, { status: 401 });
  }

  const events: webhook.Event[] = JSON.parse(body).events ?? [];
  after(async () => {
    await Promise.all(events.map(handleEvent));
  });

  return Response.json({ ok: true });
}

// 段階2: FAQ+メニューを根拠にClaudeが回答。確信度lowはオーナーへエスカレーション
async function handleEvent(event: webhook.Event) {
  if (
    event.type !== "message" ||
    event.message.type !== "text" ||
    !event.replyToken
  ) {
    return;
  }
  const userMessage = event.message.text;
  const lineUserId = event.source?.userId ?? "unknown";

  // 1. 回答生成（失敗したら謝罪文にフォールバックし、オーナー対応扱いにする）
  let reply: string;
  let confidence: "high" | "medium" | "low";
  try {
    const [faqs, menus] = await Promise.all([fetchFaqs(), fetchMenus()]);
    ({ reply, confidence } = await answerQuestion(userMessage, faqs, menus));
  } catch (err) {
    console.error("answer generation failed:", err instanceof Error ? err.message : err);
    reply =
      "申し訳ありません、ただいま応答できませんでした。オーナーに確認して折り返しご連絡します。";
    confidence = "low";
  }
  const escalated = confidence === "low";

  // 2. お客様への返信（これが最優先。失敗はログのみ）
  try {
    await getLineClient().replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: reply }],
    });
  } catch (err) {
    console.error("replyMessage failed:", err instanceof Error ? err.message : err);
  }

  // 3. エスカレーション通知と会話ログ（失敗しても返信には影響させない）
  if (escalated) {
    await notifyOwner(userMessage).catch((err) =>
      console.error("notifyOwner failed:", err instanceof Error ? err.message : err),
    );
  }
  await saveConversation({
    lineUserId,
    userMessage,
    botReply: reply,
    confidence,
    escalated,
  }).catch((err) =>
    console.error("saveConversation failed:", err instanceof Error ? err.message : err),
  );
}

// botが答えられなかった質問をオーナーのLINEにpush通知する
async function notifyOwner(userMessage: string) {
  const ownerId = process.env.OWNER_LINE_USER_ID;
  if (!ownerId) {
    console.warn("OWNER_LINE_USER_ID is not set; skipping escalation push");
    return;
  }
  await getLineClient().pushMessage({
    to: ownerId,
    messages: [
      {
        type: "text",
        text: `【要対応】botが答えられない質問が届きました。\n\n質問: ${userMessage}\n\nLINE公式アカウントの管理画面から直接ご返信ください。`,
      },
    ],
  });
}
