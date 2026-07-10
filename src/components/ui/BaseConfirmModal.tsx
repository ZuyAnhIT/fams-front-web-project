"use client";

import React from "react";
import BaseModal from "./BaseModal";
import { AlertTriangle, Info, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";

export interface BaseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  type?: "danger" | "warning" | "info" | "primary";
}

export default function BaseConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  isLoading = false,
  type = "primary",
}: BaseConfirmModalProps) {
  // Determine icon and colors based on type
  let IconComponent = Info;
  let iconBgColor = "bg-blue-100 text-blue-600";
  let confirmBtnClass = "!bg-blue-600 hover:!bg-blue-700 shadow-blue-500/25";

  if (type === "danger") {
    IconComponent = AlertTriangle;
    iconBgColor = "bg-red-100 text-red-600";
    confirmBtnClass = "!bg-red-600 hover:!bg-red-700 shadow-red-500/25";
  } else if (type === "warning") {
    IconComponent = AlertTriangle;
    iconBgColor = "bg-amber-100 text-amber-600";
    confirmBtnClass = "!bg-amber-500 hover:!bg-amber-600 shadow-amber-500/25";
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconBgColor)}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 tracking-tight leading-tight block">{title}</span>
          </div>
        </div>
      }
      width={420}
      centered
      confirmText={confirmText}
      cancelText={cancelText}
      confirmLoading={isLoading}
      confirmButtonProps={{
        onClick: onConfirm,
        className: cn("!border-0 text-white !font-bold shadow-sm transition-all !h-8 !px-3 !rounded-md !text-xs", confirmBtnClass),
      }}
      cancelButtonProps={{
        disabled: isLoading,
        className: "!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 !h-8 !px-3 !rounded-md !font-semibold transition-all !text-xs",
      }}
    >
      <div className="pt-1 pb-1 text-slate-600 text-sm">
        {message}
      </div>
    </BaseModal>
  );
}
