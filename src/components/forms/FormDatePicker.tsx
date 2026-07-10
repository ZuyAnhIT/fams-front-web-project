import React from "react";
import { DatePickerProps } from "antd";
import { Controller } from "react-hook-form";
import BaseDatePicker from "@/components/ui/BaseDatePicker";

interface FormDatePickerProps extends Omit<DatePickerProps, 'name'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label?: string;
  error?: any;
  helperText?: React.ReactNode;
  required?: boolean;
}

export default function FormDatePicker({
  control,
  name,
  label,
  error,
  helperText,
  required,
  ...datePickerProps
}: FormDatePickerProps) {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-[13px] font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>} {datePickerProps.disabled && <span className="text-slate-400 font-normal ml-1">(Chỉ xem)</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value, ref } }) => (
          <BaseDatePicker
            {...datePickerProps}
            onChange={onChange}
            value={value}
            ref={ref}
            status={error ? "error" : undefined}
          />
        )}
      />
      {error?.message && (
        <p className="text-xs text-rose-500">{error.message}</p>
      )}
      {helperText && !error?.message && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
