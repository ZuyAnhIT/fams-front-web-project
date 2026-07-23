import React from "react";
import { SelectProps } from "antd";
import { Controller, Control } from "react-hook-form";
import BaseSelect from "@/components/ui/BaseSelect";

interface FormSelectProps extends SelectProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label?: string;
  error?: any;
  options: { label: React.ReactNode; value: any }[];
  helperText?: React.ReactNode;
  required?: boolean;
}

export default function FormSelect({
  control,
  name,
  label,
  error,
  options,
  helperText,
  required,
  ...selectProps
}: FormSelectProps) {
  const inputId = selectProps.id || name;
  const messageId = `${inputId}-${error ? "error" : "help"}`;

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>} {selectProps.disabled && <span className="text-slate-400 font-normal ml-1">(Chỉ xem)</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <BaseSelect
            {...field}
            {...selectProps}
            id={inputId}
            options={options}
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
