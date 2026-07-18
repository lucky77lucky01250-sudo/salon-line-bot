import Anthropic from "@anthropic-ai/sdk";
import type { Faq, Menu } from "@/lib/supabase";

// Claude API クライアント（サーバー専用）
// モデルは env CLAUDE_MODEL で切替（デフォルト claude-sonnet-5）
function getClaudeModel() {
  return process.env.CLAUDE_MODEL ?? "claude-sonnet-5";
}

export type BotAnswer = {
  reply: string;
  confidence: "high" | "medium" | "low";
};

// 回答をJSONスキーマで固定し、確信度judgmentを同時に返させる
const answerSchema = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description: "お客様に送る返信文（日本語・丁寧・簡潔）",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description:
        "high: FAQ/メニューに明確な根拠がある。medium: 根拠から自然に導ける。low: 情報がなく答えられない",
    },
  },
  required: ["reply", "confidence"],
  additionalProperties: false,
} as const;

function buildSystemPrompt(faqs: Faq[], menus: Menu[]) {
  const faqText = faqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");
  const menuText = menus
    .map(
      (m) =>
        `${m.name}: ${m.price.toLocaleString()}円` +
        (m.duration_minutes ? `（約${m.duration_minutes}分）` : "") +
        (m.description ? ` — ${m.description}` : ""),
    )
    .join("\n");

  return `あなたは美容室のLINE受付アシスタントです。お客様からの質問に、以下のFAQとメニュー情報だけを根拠に日本語で答えてください。

## ルール
- 丁寧で親しみやすい言葉づかい。絵文字は控えめに
- 返信は3文以内を目安に簡潔に
- FAQ・メニューにない情報は推測で答えない。その場合は confidence を low にし、reply には「オーナーに確認して折り返しご連絡します」という趣旨の文を書く
- 予約の確定はこのbotでは行わない。予約希望には FAQ の案内に従う

## FAQ
${faqText || "（未登録）"}

## メニューと料金
${menuText || "（未登録）"}`;
}

// お客様の質問に回答を生成し、確信度を判定する
export async function answerQuestion(
  userMessage: string,
  faqs: Faq[],
  menus: Menu[],
): Promise<BotAnswer> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: getClaudeModel(),
    max_tokens: 1024,
    thinking: { type: "disabled" },
    system: buildSystemPrompt(faqs, menus),
    output_config: {
      format: { type: "json_schema", schema: answerSchema },
    },
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.stop_reason === "refusal") {
    return {
      reply: "申し訳ありません、その内容はオーナーに確認して折り返しご連絡します。",
      confidence: "low",
    };
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude response has no text block");
  }
  const parsed = JSON.parse(textBlock.text) as BotAnswer;
  if (!parsed.reply || !["high", "medium", "low"].includes(parsed.confidence)) {
    throw new Error("Claude response does not match schema");
  }
  return parsed;
}
