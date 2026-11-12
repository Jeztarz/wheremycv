import Link from "next/link";
import { isStatus, STATUS_META } from "@/lib/status";
import { IconBack } from "./icons";

export function StatusBadge({ status }: { status: string }) {
  const meta = isStatus(status) ? STATUS_META[status] : STATUS_META.sent;
  return <span className={`whitespace-nowrap rounded-[10px] px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>{meta.label}</span>;
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="flex flex-col gap-0.5 px-5 pb-3 pt-5">
      {sub && <div className="text-[13px] text-muted">{sub}</div>}
      <h1 className="text-[22px] font-bold">{title}</h1>
    </header>
  );
}

export function BackBar({ href, right }: { href: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2 pt-3">
      <Link href={href} aria-label="กลับ" className="flex h-11 w-11 items-center justify-center text-ink">
        <IconBack />
      </Link>
      {right}
    </div>
  );
}
