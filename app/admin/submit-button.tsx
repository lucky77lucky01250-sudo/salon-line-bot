"use client";

import { useFormStatus } from "react-dom";

// 送信ボタン（処理中はスピナー表示・二度押し防止）
// タップ領域44px以上を確保する
export function SubmitButton({
  children,
  confirmMessage,
  className,
  name,
  value,
}: {
  children: React.ReactNode;
  confirmMessage?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className={`min-h-11 rounded-lg px-4 font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
        className ?? "bg-blue-600 text-white"
      }`}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="処理中"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
