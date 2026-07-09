import React from "react";
import { TreeSelectProps } from "antd";
import { Controller, Control } from "react-hook-form";
import BaseTreeSelect from "@/components/ui/BaseTreeSelect";

interface FormTreeSelectProps extends TreeSelectProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  label?: string;
  error?: any;
  helperText?: React.ReactNode;
}

export default function FormTreeSelect({
  control,
  name,
  label,
  error,
  helperText,
  ...treeSelectProps
}: FormTreeSelectProps) {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-[13px] font-semibold text-slate-700">
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
