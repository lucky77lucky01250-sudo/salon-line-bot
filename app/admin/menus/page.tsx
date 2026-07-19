import { fetchMenus } from "@/lib/supabase";
import { SubmitButton } from "../submit-button";
import { createMenu, deleteMenu, updateMenu } from "./actions";

export const dynamic = "force-dynamic";

// メニューと料金の一覧・追加・編集・削除
export default async function MenuAdminPage() {
  const menus = await fetchMenus();
  return (
    <div className="space-y-4">
      <h1 className="text-base font-bold">メニューと料金</h1>
      <p className="text-sm text-gray-600">
        料金を変えたいときは、ここを更新するだけでLINEの返信にも反映されます。
      </p>

      <details className="rounded-xl border bg-white p-4">
        <summary className="min-h-11 cursor-pointer font-medium flex items-center">
          ＋ 新しいメニューを追加する
        </summary>
        <form action={createMenu} className="mt-3 space-y-3">
          <MenuFields />
          <SubmitButton className="w-full bg-blue-600 text-white">
            追加する
          </SubmitButton>
        </form>
      </details>

      <ul className="space-y-3">
        {menus.map((menu) => (
          <li key={menu.id}>
            <details className="rounded-xl border bg-white p-4">
              <summary className="min-h-11 cursor-pointer flex items-center justify-between font-medium">
                <span>{menu.name}</span>
                <span className="text-gray-600">
                  {menu.price.toLocaleString()}円
                </span>
              </summary>
              <form action={updateMenu} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={menu.id} />
                <MenuFields
                  defaults={{
                    name: menu.name,
                    price: menu.price,
                    description: menu.description ?? "",
                    duration_minutes: menu.duration_minutes ?? undefined,
                  }}
                />
                <SubmitButton className="w-full bg-blue-600 text-white">
                  保存する
                </SubmitButton>
              </form>
              <form action={deleteMenu} className="mt-2">
                <input type="hidden" name="id" value={menu.id} />
                <SubmitButton
                  className="w-full border border-red-300 text-red-600"
                  confirmMessage="このメニューを削除します。よろしいですか？"
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

function MenuFields({
  defaults,
}: {
  defaults?: {
    name: string;
    price: number;
    description: string;
    duration_minutes?: number;
  };
}) {
  return (
    <>
      <label className="block text-sm">
        <span className="text-gray-700">メニュー名</span>
        <input
          name="name"
          defaultValue={defaults?.name}
          placeholder="例）カット"
          required
          className="mt-1 w-full min-h-11 rounded-lg border px-3"
        />
      </label>
      <div className="flex gap-3">
        <label className="block flex-1 text-sm">
          <span className="text-gray-700">料金（円）</span>
          <input
            name="price"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={defaults?.price}
            placeholder="4400"
            required
            className="mt-1 w-full min-h-11 rounded-lg border px-3"
          />
        </label>
        <label className="block flex-1 text-sm">
          <span className="text-gray-700">目安時間（分）</span>
          <input
            name="duration_minutes"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={defaults?.duration_minutes}
            placeholder="60"
            className="mt-1 w-full min-h-11 rounded-lg border px-3"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-gray-700">ひとこと説明（なくてもOK）</span>
        <input
          name="description"
          defaultValue={defaults?.description}
          placeholder="例）シャンプー・ブロー込み"
          className="mt-1 w-full min-h-11 rounded-lg border px-3"
        />
      </label>
    </>
  );
}
