import { fetchFaqs } from "@/lib/supabase";
import { SubmitButton } from "../submit-button";
import { createFaq, deleteFaq, updateFaq } from "./actions";

export const dynamic = "force-dynamic";

// よくある質問の一覧・追加・編集・削除
export default async function FaqAdminPage() {
  const faqs = await fetchFaqs();
  return (
    <div className="space-y-4">
      <h1 className="text-base font-bold">よくある質問</h1>
      <p className="text-sm text-gray-600">
        ここに登録した内容をもとに、LINEが自動でお返事します。
      </p>

      <details className="rounded-xl border bg-white p-4">
        <summary className="min-h-11 cursor-pointer font-medium flex items-center">
          ＋ 新しい質問を追加する
        </summary>
        <form action={createFaq} className="mt-3 space-y-3">
          <Field label="お客様からの質問" name="question" placeholder="例）駐車場はありますか？" />
          <FieldArea label="お店からの答え" name="answer" placeholder="例）店舗前に2台分ございます。" />
          <SubmitButton className="w-full bg-blue-600 text-white">
            追加する
          </SubmitButton>
        </form>
      </details>

      <ul className="space-y-3">
        {faqs.map((faq) => (
          <li key={faq.id}>
            <details className="rounded-xl border bg-white p-4">
              <summary className="min-h-11 cursor-pointer flex items-center font-medium">
                {faq.question}
              </summary>
              <form action={updateFaq} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={faq.id} />
                <Field label="お客様からの質問" name="question" defaultValue={faq.question} />
                <FieldArea label="お店からの答え" name="answer" defaultValue={faq.answer} />
                <div className="flex gap-2">
                  <SubmitButton className="flex-1 bg-blue-600 text-white">
                    保存する
                  </SubmitButton>
                </div>
              </form>
              <form action={deleteFaq} className="mt-2">
                <input type="hidden" name="id" value={faq.id} />
                <SubmitButton
                  className="w-full border border-red-300 text-red-600"
                  confirmMessage="この質問を削除します。よろしいですか？"
                >
                  削除する
                </SubmitButton>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required
        className="mt-1 w-full min-h-11 rounded-lg border px-3"
      />
    </label>
  );
}

function FieldArea({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required
        rows={4}
        className="mt-1 w-full rounded-lg border px-3 py-2"
      />
    </label>
  );
}
