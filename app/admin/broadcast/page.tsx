"use client";

import { useActionState } from "react";
import { SubmitButton } from "../submit-button";
import { sendBroadcast, type BroadcastResult } from "./actions";

// お知らせ一斉配信: テスト送信→全員に配信の2段階
export default function BroadcastPage() {
  const [result, formAction] = useActionState<BroadcastResult, FormData>(
    sendBroadcast,
    { status: "idle", message: "" },
  );

  return (
    <div className="space-y-4">
      <h1 className="text-base font-bold">お知らせ配信</h1>
      <p className="text-sm text-gray-600">
        臨時休業などのお知らせを、LINEの友だち全員に送れます。まず「自分にテスト送信」で見え方を確認するのがおすすめです。
      </p>

      <form action={formAction} className="space-y-3">
        <label className="block text-sm">
          <span className="text-gray-700">お知らせの内容</span>
          <textarea
            name="text"
            required
            rows={6}
            maxLength={500}
            placeholder={"例）【臨時休業のお知らせ】\n7月20日（月）は都合によりお休みをいただきます。ご迷惑をおかけしますが、よろしくお願いいたします。"}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>

        {result.status !== "idle" && (
          <p
            role="status"
            className={`rounded-lg p-3 text-sm ${
              result.status === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {result.message}
          </p>
        )}

        <SubmitButton
          name="mode"
          value="test"
          className="w-full border border-blue-600 text-blue-600"
        >
          自分にテスト送信（ほかの人には届きません）
        </SubmitButton>
        <SubmitButton
          name="mode"
          value="all"
          className="w-full bg-blue-600 text-white"
          confirmMessage="友だち全員にこのお知らせを送ります。送った後は取り消せません。よろしいですか？"
        >
          全員に配信する
        </SubmitButton>
      </form>

      <p className="text-xs text-gray-500">
        ※配信は取り消せません。※LINEの無料プランで送れるのは月200通までです（友だち300人に配信すると300通になります）。
      </p>
    </div>
  );
}
