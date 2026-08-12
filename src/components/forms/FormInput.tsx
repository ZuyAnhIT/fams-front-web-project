"use client";

import React from "react";
import { Controller, type Control, type FieldError, type FieldValues, type Path } from "react-hook-form";
import BaseInput from "@/components/ui/BaseInput";
import BaseInputPassword from "@/components/ui/BaseInputPassword";
import { cn } from "@/utils/cn";

export interface FormInputProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
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
  const inputId = id || String(name);
  const messageId = `${inputId}-${error ? "error" : "help"}`;

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
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
            id={inputId}
            placeholder={placeholder}
            status={error ? "error" : undefined}
            aria-invalid={Boolean(error)}
            aria-required={required}
            aria-describedby={(error || helpText) ? messageId : undefined}
            size={size}
            type={type !== "password" ? type : undefined}
            disabled={disabled}
          />
        )}
      />
      {helpText && !error && (
        <p id={messageId} className="mt-1 text-xs text-brand-500">{helpText}</p>
      )}
      {error && (
        <p id={messageId} role="alert" className="mt-1 text-xs text-red-600">{error.message}</p>
      )}
    </div>
  );
}
