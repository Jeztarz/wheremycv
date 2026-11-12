"use client";

/**
 * เปิดลิงก์ในเบราว์เซอร์ภายนอก — ใน LINE ต้องใช้ liff.openWindow({ external: true })
 * เพราะเบราว์เซอร์ใน LINE ดาวน์โหลด .ics และเปิดแอป Google Calendar ไม่ค่อยได้
 */
export function ExternalLink({ href, liffId, className, children }: { href: string; liffId: string | null; className?: string; children: React.ReactNode }) {
  async function open(e: React.MouseEvent) {
    if (!liffId || !/Line\//i.test(navigator.userAgent)) return; // ไม่ได้อยู่ใน LINE → ใช้ลิงก์ปกติ
    e.preventDefault();
    const url = new URL(href, window.location.origin).toString();
    try {
      const liff = (await import("@line/liff")).default;
      await liff.init({ liffId });
      liff.openWindow({ url, external: true });
    } catch {
      window.location.href = url;
    }
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={open} className={className}>
      {children}
    </a>
  );
}
