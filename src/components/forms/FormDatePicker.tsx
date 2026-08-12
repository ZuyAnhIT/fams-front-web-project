import React from "react";
import { DatePickerProps } from "antd";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import BaseDatePicker from "@/components/ui/BaseDatePicker";

interface FormDatePickerProps<T extends FieldValues> extends Omit<DatePickerProps, 'name'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  error?: { message?: string };
  helperText?: React.ReactNode;
  required?: boolean;
}

export default function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  error,
  helperText,
  required,
  ...datePickerProps
}: FormDatePickerProps<T>) {
  const inputId = datePickerProps.id || name;
  const messageId = `${inputId}-${error ? "error" : "help"}`;

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>} {datePickerProps.disabled && <span className="text-slate-400 font-normal ml-1">(Chỉ xem)</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value, ref } }) => (
          <BaseDatePicker
            {...datePickerProps}
            id={inputId}
            onChange={onChange}
            value={value}
            ref={ref}
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
