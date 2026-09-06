"use client";

import { Alert, Descriptions, Drawer, Tag } from "antd";
import { ExternalLink, FileCheck2, Printer, ReceiptText } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import type {
  BillingInvoiceStatus,
  BillingOrder,
  BillingOrderStatus,
} from "../types/billing.type";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const statusMeta: Record<BillingOrderStatus, { label: string; color: string }> = {
  CREATING: { label: "Đang tạo", color: "processing" },
  PENDING: { label: "Chờ thanh toán", color: "gold" },
  PROCESSING: { label: "Đang xử lý", color: "processing" },
  UNDERPAID: { label: "Chưa thanh toán đủ", color: "warning" },
  PAID: { label: "Đã thanh toán", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "default" },
  EXPIRED: { label: "Hết hạn", color: "default" },
  FAILED: { label: "Lỗi", color: "error" },
};

const invoiceMeta: Record<BillingInvoiceStatus, { label: string; color: string }> = {
  NOT_ELIGIBLE: { label: "Chưa phát sinh", color: "default" },
  PAYMENT_REVIEW: { label: "Cần xử lý khoản thiếu", color: "warning" },
  PENDING_ISSUANCE: { label: "Chờ phát hành", color: "gold" },
  ISSUED: { label: "Đã phát hành", color: "success" },
  FAILED: { label: "Phát hành lỗi", color: "error" },
};

function dateTime(value?: string) {
  return value
    ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "—";
}

function openPrintableReceipt(order: BillingOrder) {
  if (!order.paymentReceiptAvailable) return;
  const receiptWindow = window.open("", "_blank", "width=900,height=900");
  if (!receiptWindow) return;
  receiptWindow.opener = null;
  const receiptDocument = receiptWindow.document;
  receiptDocument.documentElement.lang = "vi";
  receiptDocument.title = order.paymentReceiptNumber || `PT-${order.orderCode}`;

  const style = receiptDocument.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 40px; color: #0f172a; font: 15px/1.5 Arial, sans-serif; background: #f8fafc; }
    main { max-width: 760px; margin: 0 auto; padding: 44px; border: 1px solid #cbd5e1; border-radius: 16px; background: white; }
    .brand { color: #1d4ed8; font-size: 18px; font-weight: 800; letter-spacing: .08em; }
    h1 { margin: 18px 0 4px; font-size: 26px; text-align: center; }
    .subtitle { margin: 0 0 30px; color: #64748b; text-align: center; }
    .row { display: grid; grid-template-columns: 210px 1fr; gap: 20px; padding: 11px 0; border-bottom: 1px solid #e2e8f0; }
    .label { color: #64748b; }
    .value { font-weight: 600; overflow-wrap: anywhere; }
    .total { margin-top: 22px; padding: 18px; border-radius: 12px; background: #eff6ff; color: #1d4ed8; font-size: 22px; text-align: right; font-weight: 800; }
    .note { margin-top: 24px; padding: 14px; border-left: 4px solid #f59e0b; background: #fffbeb; color: #92400e; }
    .actions { margin: 24px auto 0; max-width: 760px; text-align: right; }
    button { border: 0; border-radius: 9px; padding: 11px 18px; background: #2563eb; color: white; font-weight: 700; cursor: pointer; }
    @media print { body { padding: 0; background: white; } main { border: 0; } .actions { display: none; } }
  `;
  receiptDocument.head.appendChild(style);

  const main = receiptDocument.createElement("main");
  const addText = (tag: string, value: string, className?: string) => {
    const element = receiptDocument.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    main.appendChild(element);
  };
  addText("div", "FAMS", "brand");
  addText("h1", "PHIẾU XÁC NHẬN THANH TOÁN NỘI BỘ");
  addText("p", `Số ${order.paymentReceiptNumber || "—"}`, "subtitle");

  const rows = [
    ["Công ty", order.tenantName || "—"],
    ["Mã đơn", `#${order.orderCode}`],
    ["Gói dịch vụ", order.planDisplayName],
    ["Chu kỳ", order.billingCycle === "YEARLY" ? "Hàng năm" : "Hàng tháng"],
    ["Mã giao dịch PayOS", order.paymentReference || "—"],
    ["Thời gian thanh toán (giờ VN)", dateTime(order.paidAt)],
  ];
  rows.forEach(([label, value]) => {
    const row = receiptDocument.createElement("div");
    row.className = "row";
    const labelElement = receiptDocument.createElement("span");
    labelElement.className = "label";
    labelElement.textContent = label;
    const valueElement = receiptDocument.createElement("span");
    valueElement.className = "value";
    valueElement.textContent = value;
    row.append(labelElement, valueElement);
    main.appendChild(row);
  });
  addText("div", `Đã thanh toán: ${money.format(order.amountPaid)}`, "total");
  addText("p", "Tài liệu này dùng để đối soát trong FAMS, không thay thế hóa đơn điện tử/hóa đơn VAT.", "note");

  const actions = receiptDocument.createElement("div");
  actions.className = "actions";
  const printButton = receiptDocument.createElement("button");
  printButton.type = "button";
  printButton.textContent = "In hoặc lưu PDF";
  printButton.addEventListener("click", () => receiptWindow.print());
  actions.appendChild(printButton);
  receiptDocument.body.append(main, actions);
  receiptWindow.focus();
}

export default function BillingOrderDetailDrawer({
  order,
  open,
  onClose,
}: {
  order?: BillingOrder;
  open: boolean;
  onClose: () => void;
}) {
  if (!order) return null;
  const status = statusMeta[order.status];
  const invoiceStatus = invoiceMeta[order.invoiceStatus || "NOT_ELIGIBLE"];
  const remaining = Math.max(0, order.amount - order.amountPaid);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(620px, 100vw)"
      title={`Chi tiết thanh toán #${order.orderCode}`}
      styles={{ body: { padding: 0 } }}
    >
      <div className="app-scrollbar space-y-6 overflow-y-auto p-5 sm:p-6">
        <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Đơn mua gói</p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">{order.planDisplayName}</h3>
              <p className="mt-1 text-sm text-slate-600">{order.tenantName || "Công ty chưa xác định"}</p>
            </div>
            <Tag color={status.color}>{status.label}</Tag>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4">
            <span className="text-sm text-slate-500">Tổng thanh toán</span>
            <strong className="text-xl text-blue-700">{money.format(order.amount)}</strong>
          </div>
        </section>

        <section>
          <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
            <ReceiptText className="h-4 w-4 text-blue-600" aria-hidden="true" />
            Thông tin giao dịch
          </h4>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Mã đơn">#{order.orderCode}</Descriptions.Item>
            <Descriptions.Item label="Công ty">{order.tenantName || "—"}</Descriptions.Item>
            <Descriptions.Item label="Chu kỳ">{order.billingCycle === "YEARLY" ? "Hàng năm" : "Hàng tháng"}</Descriptions.Item>
            <Descriptions.Item label="Phải thu">{money.format(order.amount)}</Descriptions.Item>
            <Descriptions.Item label="Đã nhận">{money.format(order.amountPaid)}</Descriptions.Item>
            {remaining > 0 && <Descriptions.Item label="Còn thiếu">{money.format(remaining)}</Descriptions.Item>}
            <Descriptions.Item label="Tạo lúc (giờ VN)">{dateTime(order.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Hết hạn lúc (giờ VN)">{dateTime(order.expiresAt)}</Descriptions.Item>
            {order.paidAt && <Descriptions.Item label="Thanh toán lúc (giờ VN)">{dateTime(order.paidAt)}</Descriptions.Item>}
            {order.cancelledAt && <Descriptions.Item label="Hủy lúc (giờ VN)">{dateTime(order.cancelledAt)}</Descriptions.Item>}
            <Descriptions.Item label="Mã giao dịch PayOS">{order.paymentReference || "—"}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái PayOS">{order.providerStatus || "—"}</Descriptions.Item>
            {order.failureReason && <Descriptions.Item label="Ghi chú/Lỗi">{order.failureReason}</Descriptions.Item>}
          </Descriptions>
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="flex items-center gap-2 font-bold text-slate-900">
              <FileCheck2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Chứng từ và hóa đơn
            </h4>
            <Tag color={invoiceStatus.color}>Hóa đơn: {invoiceStatus.label}</Tag>
          </div>

          {!order.paymentReceiptAvailable ? (
            <Alert
              className="mt-4"
              type="info"
              showIcon
              title="Chưa phát sinh chứng từ thanh toán"
              description="Đơn chờ thanh toán, bị hủy, hết hạn hoặc lỗi chỉ có thông tin giao dịch. Chứng từ thu tiền chỉ được tạo sau khi PayOS xác nhận đã nhận đủ tiền."
            />
          ) : (
            <div className="mt-4 rounded-lg bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-900">Phiếu xác nhận thanh toán nội bộ</p>
              <p className="mt-1 text-sm text-emerald-800">
                Số {order.paymentReceiptNumber} · {dateTime(order.paymentReceiptIssuedAt)}
              </p>
              <BaseButton
                className="mt-3"
                size="small"
                icon={<Printer className="h-3.5 w-3.5" />}
                onClick={() => openPrintableReceipt(order)}
              >
                In / lưu PDF
              </BaseButton>
            </div>
          )}

          {order.invoiceStatus === "ISSUED" ? (
            <div className="mt-4 rounded-lg border border-emerald-200 p-4 text-sm">
              <p><span className="text-slate-500">Số hóa đơn:</span> <strong>{order.invoiceNumber}</strong></p>
              <p className="mt-1"><span className="text-slate-500">Phát hành:</span> {dateTime(order.invoiceIssuedAt)}</p>
              {order.invoiceLookupUrl && (
                <a className="mt-3 inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline" href={order.invoiceLookupUrl} target="_blank" rel="noreferrer">
                  Tra cứu hóa đơn <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ) : order.invoiceStatus === "PAYMENT_REVIEW" ? (
            <Alert
              className="mt-4"
              type="warning"
              showIcon
              title="Đã nhận một phần tiền, cần xử lý trước khi phát hành hóa đơn"
              description="Gói chưa được kích hoạt vì số tiền chưa đủ. Bộ phận vận hành cần đối soát để thu phần còn thiếu hoặc hoàn tiền, đồng thời xử lý chứng từ theo kết quả thực tế."
            />
          ) : order.invoiceStatus === "PENDING_ISSUANCE" ? (
            <Alert
              className="mt-4"
              type="warning"
              showIcon
              title="Thanh toán đã thành công, hóa đơn điện tử đang chờ phát hành"
              description="Hệ thống đã ghi nhận nghĩa vụ xuất hóa đơn. Cần kết nối nhà cung cấp hóa đơn điện tử hợp pháp để nhận số hóa đơn và đường dẫn tra cứu."
            />
          ) : order.invoiceStatus === "FAILED" ? (
            <Alert className="mt-4" type="error" showIcon title="Phát hành hóa đơn chưa thành công" description="Vui lòng liên hệ bộ phận vận hành để xử lý lại." />
          ) : null}

          {order.paymentReceiptAvailable && (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Phiếu xác nhận thanh toán nội bộ dùng để đối soát trong FAMS, không thay thế hóa đơn điện tử/hóa đơn VAT.
            </p>
          )}
        </section>
      </div>
    </Drawer>
  );
}
