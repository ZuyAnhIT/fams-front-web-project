"use client";

import { Switch, type SwitchProps } from "antd";
import { cn } from "@/utils/cn";

export interface BaseSwitchProps extends SwitchProps {
  className?: string;
}

/**
 * BaseSwitch - Component nền tảng bọc Switch của Ant Design.
 * Mặc định sử dụng màu xanh lá (green-500) khi được bật để đồng bộ UI.
 */
export default function BaseSwitch({ className, ...props }: BaseSwitchProps) {
  return (
    <Switch 
      className={cn(
        "[&.ant-switch-checked]:!bg-green-500 hover:[&.ant-switch-checked]:!bg-green-600",
        className
      )} 
      {...props} 
    />
  );
}
