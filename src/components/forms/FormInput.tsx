"use client";

import React from "react";
import { Control, Controller, FieldError, FieldValues, Path } from "react-hook-form";
import BaseInput from "@/components/ui/BaseInput";
import BaseInputPassword from "@/components/ui/BaseInputPassword";
import { cn } from "@/utils/cn";

export interface FormInputProps<T extends FieldValues = FieldValues> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: Path<T>;
  label?: React.ReactNode;
  placeholder?: string;
  type?: string;
  error?: FieldError;
  id?: string;
  size?: "small" | "middle" | "large";
  required?: boolean;
  className?: string;
  disabled?: boolean;
  helpText?: string;
  labelClassName?: string;
}

export default function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  error,
  id,
  size = "large",
  required,
  className,
  disabled,
  helpText,
  labelClassName,
}: FormInputProps<T>) {
  const InputComponent = type === "password" ? BaseInputPassword : BaseInput;

  return (
    <div className={className}>
      <label
        htmlFor={id || name}
        className={cn("mb-2 block text-[14px] font-medium tracking-wide text-slate-700", labelClassName)}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <InputComponent
            {...field}
            id={id || name}
            placeholder={placeholder}
            status={error ? "error" : undefined}
            size={size}
            type={type !== "password" ? type : undefined}
            disabled={disabled}
          />
        )}
      />
      {helpText && !error && (
        <p className="mt-1 text-xs text-brand-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error.message}</p>
      )}
    </div>
  );
}
