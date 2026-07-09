import React from "react";
import { SelectProps } from "antd";
import { Controller, Control } from "react-hook-form";
import BaseSelect from "@/components/ui/BaseSelect";

interface FormSelectProps extends SelectProps {
  control: Control<any>;
  name: string;
  label?: string;
  error?: any;
  options: { label: React.ReactNode; value: any }[];
  helperText?: React.ReactNode;
}

export default function FormSelect({
  control,
  name,
  label,
  error,
  options,
  helperText,
  ...selectProps
}: FormSelectProps) {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-[13px] font-semibold text-slate-700">
          {label} {selectProps.disabled && <span className="text-slate-400 font-normal ml-1">(Chỉ xem)</span>}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <BaseSelect
            {...field}
            {...selectProps}
            options={options}
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
