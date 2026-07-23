import React from "react";
import { Input } from "antd";
import { Controller } from "react-hook-form";
import BaseTextArea from "@/components/ui/BaseTextArea";
import { TextAreaProps } from "antd/es/input";

interface FormTextAreaProps extends Omit<TextAreaProps, 'name'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label?: string;
  error?: any;
  helperText?: React.ReactNode;
  required?: boolean;
}

export default function FormTextArea({
  control,
  name,
  label,
  error,
  helperText,
  required,
  ...textAreaProps
}: FormTextAreaProps) {
  const inputId = textAreaProps.id || name;
  const messageId = `${inputId}-${error ? "error" : "help"}`;

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>} {textAreaProps.disabled && <span className="text-slate-400 font-normal ml-1">(Chỉ xem)</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <BaseTextArea
            {...field}
            {...textAreaProps}
            id={inputId}
            status={error ? "error" : undefined}
            aria-invalid={Boolean(error)}
            aria-required={required}
            aria-describedby={(error?.message || helperText) ? messageId : undefined}
          />
        )}
      />
      {error?.message && (
        <p id={messageId} role="alert" className="text-xs text-rose-600">{error.message}</p>
      )}
      {helperText && !error?.message && (
        <p id={messageId} className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
