import { redirect } from "next/navigation";

// トップページは管理画面へ（bot本体はLINE上で動くためWebのトップは不要）
export default function Home() {
  redirect("/admin");
}
