"use client";

import { useRef, useState } from "react";
import { App } from "antd";
import { Building2, ImageUp, Trash2 } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import { useDeleteTenantLogo, useUploadTenantLogo } from "../hooks/use-tenant";
import type { Tenant } from "../types/tenant.type";

const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * #08: replaces the old "paste a logo URL" text field with a real file upload — same UX as the
 * account-avatar uploader. Uploads immediately on pick; the parent gets the fresh tenant back
 * so the header/list logo updates without a page reload.
 */
export default function TenantLogoUploader({
  tenantId,
  logoUrl,
  onChanged,
}: {
  tenantId?: string;
  logoUrl?: string | null;
  onChanged?: (tenant: Tenant) => void;
}) {
  const { message } = App.useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { mutateAsync: uploadLogo, isPending: isUploading } = useUploadTenantLogo();
  const { mutateAsync: deleteLogo, isPending: isDeleting } = useDeleteTenantLogo();
  const busy = isUploading || isDeleting;

  const shown = preview || logoUrl || null;

  const handlePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!tenantId) {
      message.error("Chưa xác định được công ty để tải logo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      message.error("Ảnh logo tối đa 5MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    try {
      const updated = await uploadLogo({ id: tenantId, file });
      message.success("Đã cập nhật logo công ty.");
      onChanged?.(updated);
    } catch (error: unknown) {
      setPreview(null);
      const err = error as { response?: { data?: { userMessage?: string; message?: string } } };
      message.error(err.response?.data?.userMessage || err.response?.data?.message || "Không thể tải logo lên.");
    }
  };

  const handleRemove = async () => {
    if (!tenantId) return;
    try {
      const updated = await deleteLogo({ id: tenantId });
      setPreview(null);
      message.success("Đã xoá logo công ty.");
      onChanged?.(updated);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { userMessage?: string; message?: string } } };
      message.error(err.response?.data?.userMessage || err.response?.data?.message || "Không thể xoá logo.");
    }
  };

  return (
    <div className="col-span-1 md:col-span-2">
      <label className="mb-2 block text-sm font-semibold text-slate-700">Logo công ty</label>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Logo công ty" className="h-full w-full object-contain" />
          ) : (
            <Building2 className="h-8 w-8 text-slate-300" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <BaseButton
              type="default"
              icon={<ImageUp className="h-4 w-4" />}
              loading={isUploading}
              disabled={busy || !tenantId}
              onClick={() => inputRef.current?.click()}
              className="!h-10 rounded-lg font-semibold"
            >
              {shown ? "Đổi logo" : "Tải logo lên"}
            </BaseButton>
            {logoUrl && (
              <BaseButton
                danger
                icon={<Trash2 className="h-4 w-4" />}
                loading={isDeleting}
                disabled={busy}
                onClick={() => void handleRemove()}
                className="!h-10 rounded-lg font-semibold"
              >
                Xoá
              </BaseButton>
            )}
          </div>
          <p className="text-xs text-slate-400">JPEG, PNG, WEBP hoặc SVG · tối đa 5MB</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => void handlePick(e)} />
    </div>
  );
}
