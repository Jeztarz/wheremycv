"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "not_allowed"; userId: string };

/** เปิดผ่าน LIFF → ล็อกอิน LINE อัตโนมัติ แล้วส่ง ID token ให้เซิร์ฟเวอร์ verify */
export function LoginScreen({ liffId, devLogin }: { liffId: string | null; devLogin: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!liffId) {
      setState({ kind: "error", message: "ยังไม่ได้ตั้งค่า LIFF_ID" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        const idToken = liff.getIDToken();
        if (!idToken) throw new Error("ไม่ได้รับ ID token จาก LINE (เช็กว่า LIFF เปิด scope openid)");
        const res = await fetch("/api/auth/line", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (cancelled) return;
        if (res.ok) return router.refresh();
        const data = (await res.json().catch(() => ({}))) as { error?: string; userId?: string };
        if (res.status === 403 && data.userId) return setState({ kind: "not_allowed", userId: data.userId });
        if (res.status === 401) {
          // token หมดอายุ → ล็อกอินใหม่
          liff.logout();
          liff.login({ redirectUri: window.location.href });
          return;
        }
        throw new Error(data.error ?? `ล็อกอินไม่สำเร็จ (${res.status})`);
      } catch (err) {
        if (!cancelled) setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [liffId, router]);

  async function devSignIn() {
    const res = await fetch("/api/auth/dev", { method: "POST" });
    if (res.ok) router.refresh();
    else setState({ kind: "error", message: "Dev login ใช้ไม่ได้ (เช็ก DEV_LOGIN_LINE_USER_ID และ ALLOWED_LINE_USER_IDS ใน .dev.vars)" });
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-sm text-muted">wheremycv</div>
      {state.kind === "loading" && <p className="text-lg font-semibold">กำลังล็อกอินด้วย LINE…</p>}
      {state.kind === "error" && (
        <>
          <p className="text-lg font-semibold">ล็อกอินไม่สำเร็จ</p>
          <p className="text-sm text-ink-2">{state.message}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-2 h-11 text-sm">
            ลองอีกครั้ง
          </button>
        </>
      )}
      {state.kind === "not_allowed" && (
        <>
          <p className="text-lg font-semibold">บัญชีนี้ไม่มีสิทธิ์ใช้งาน</p>
          <p className="text-sm text-ink-2">
            ถ้าคุณเป็นเจ้าของเว็บนี้ ให้เพิ่ม User ID ข้างล่างใน <code>ALLOWED_LINE_USER_IDS</code>
          </p>
          <code className="card select-all break-all px-4 py-3 text-sm">{state.userId}</code>
        </>
      )}
      {devLogin && (
        <button type="button" onClick={devSignIn} className="btn-ghost mt-6 h-11 text-sm">
          Dev login (localhost เท่านั้น)
        </button>
      )}
    </main>
  );
}
