import React from "react";
import { TreeSelectProps } from "antd";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import BaseTreeSelect from "@/components/ui/BaseTreeSelect";

interface FormTreeSelectProps<T extends FieldValues> extends TreeSelectProps {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  error?: { message?: string };
  helperText?: React.ReactNode;
}

export default function FormTreeSelect<T extends FieldValues>({
  control,
  name,
  label,
  error,
  helperText,
  ...treeSelectProps
}: FormTreeSelectProps<T>) {
  const inputId = treeSelectProps.id || name;
  const messageId = `${inputId}-${error ? "error" : "help"}`;

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-slate-700">
          {label} {treeSelectProps.disabled && <span className="text-slate-400 font-normal ml-1">(Chỉ xem)</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <BaseTreeSelect
            {...field}
            {...treeSelectProps}
            id={inputId}
            status={error ? "error" : undefined}
            aria-invalid={Boolean(error)}
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
