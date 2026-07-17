import { validateSignature, type webhook } from "@line/bot-sdk";
import { getChannelSecret, getLineClient } from "@/lib/line";

// LINE Webhook受信エンドポイント
// 署名検証に生のリクエストボディが必要なため、request.text()で受ける
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!signature || !validateSignature(body, getChannelSecret(), signature)) {
    return Response.json({ message: "invalid signature" }, { status: 401 });
  }

  const events: webhook.Event[] = JSON.parse(body).events ?? [];
  await Promise.all(events.map(handleEvent));

  return Response.json({ ok: true });
}

// 段階1: オウム返し（受け取ったテキストをそのまま返す）
async function handleEvent(event: webhook.Event) {
  if (
    event.type !== "message" ||
    event.message.type !== "text" ||
    !event.replyToken
  ) {
    return;
  }
  await getLineClient().replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: "text", text: event.message.text }],
  });
}
