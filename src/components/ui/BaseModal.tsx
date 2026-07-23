"use client";

import React from "react";
import { Modal, type ModalProps } from "antd";
import BaseButton from "./BaseButton";

export interface BaseModalProps extends Omit<ModalProps, "onOk"> {
  title: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Function called when confirm button is clicked. 
   * If not provided, and footer is not explicitly null, confirm button will just close the modal or not be rendered.
   */
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  confirmButtonProps?: Record<string, any>;
  cancelButtonProps?: Record<string, any>;
  hideFooter?: boolean;
}

export default function BaseModal({
  title,
  isOpen,
  onClose,
  onConfirm,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmLoading = false,
  confirmButtonProps = {},
  cancelButtonProps = {},
  hideFooter = false,
  footer,
  children,
  ...props
}: BaseModalProps) {
  
  const defaultFooter = hideFooter ? null : (
    <div className="flex justify-end gap-3 mt-6">
      <BaseButton 
        type="default" 
        onClick={onClose} 
        disabled={confirmLoading}
        {...cancelButtonProps}
      >
        {cancelText}
      </BaseButton>
      <BaseButton
        type="primary"
        onClick={onConfirm}
        loading={confirmLoading}
        className="font-semibold shadow-sm"
        {...confirmButtonProps}
      >
        {confirmText}
      </BaseButton>
    </div>
  );

  return (
    <Modal
      title={<span className="text-lg font-bold text-slate-800">{title}</span>}
      open={isOpen}
      onCancel={onClose}
      footer={footer !== undefined ? footer : defaultFooter}
      destroyOnClose
      classNames={{
        header: "border-b border-slate-100 pb-3 mb-4",
        body: "overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-slate-200 pr-1",
        footer: "border-t border-slate-100 pt-4 mt-4",
        ...(props.classNames || {})
      }}
      {...props}
    >
      {children}
    </Modal>
  );
}
