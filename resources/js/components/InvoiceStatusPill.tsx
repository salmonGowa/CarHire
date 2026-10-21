import type { InvoiceStatus } from "@/types/models";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_STYLE } from "@/lib/format";

export default function InvoiceStatusPill({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${INVOICE_STATUS_STYLE[status]}`}>
      {INVOICE_STATUS_LABEL[status]}
    </span>
  );
}
