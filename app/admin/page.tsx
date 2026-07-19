import Link from "next/link";
import { fetchFaqs, fetchMenus } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 管理画面トップ: 3機能への入り口
export default async function AdminHome() {
  const [faqs, menus] = await Promise.all([fetchFaqs(), fetchMenus()]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        お店の情報を編集すると、LINEの自動返信にすぐ反映されます。
      </p>
      <Card
        href="/admin/faq"
        title="よくある質問"
        description={`お客様への自動返信のもとになる質問と答え（${faqs.length}件）`}
      />
      <Card
        href="/admin/menus"
        title="メニューと料金"
        description={`料金改定のときはここを更新（${menus.length}件）`}
      />
      <Card
        href="/admin/broadcast"
        title="お知らせ配信"
        description="臨時休業などを友だち全員のLINEに送る"
      />
    </div>
  );
}

function Card({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block min-h-11 rounded-xl border bg-white p-4 active:bg-gray-50"
    >
      <div className="font-bold">{title}</div>
      <div className="mt-1 text-sm text-gray-600">{description}</div>
    </Link>
  );
}
