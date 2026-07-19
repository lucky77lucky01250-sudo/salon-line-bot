import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "サロン管理画面",
  description: "FAQ・メニュー・お知らせの管理",
};

// スマホ前提（375px基準）の管理画面共通レイアウト
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4 text-gray-900">
        <header className="mb-4">
          <Link href="/admin" className="text-lg font-bold">
            サロン管理画面
          </Link>
        </header>
        {children}
      </div>
      <nav className="fixed inset-x-0 bottom-0 border-t bg-white">
        <div className="mx-auto flex max-w-md">
          <NavLink href="/admin/faq" label="よくある質問" />
          <NavLink href="/admin/menus" label="メニュー" />
          <NavLink href="/admin/broadcast" label="お知らせ" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-14 flex-1 items-center justify-center text-sm font-medium text-gray-700 active:bg-gray-100"
    >
      {label}
    </Link>
  );
}
