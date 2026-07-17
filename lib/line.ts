import { messagingApi } from "@line/bot-sdk";

// LINE Messaging APIクライアント（サーバー専用）
// トークン未設定のままビルドが落ちないよう、使用時に検証する
export function getLineClient() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");
  }
  return new messagingApi.MessagingApiClient({ channelAccessToken });
}

export function getChannelSecret() {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) {
    throw new Error("LINE_CHANNEL_SECRET is not set");
  }
  return secret;
}
