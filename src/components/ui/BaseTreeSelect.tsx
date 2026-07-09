"use client";

import { TreeSelect, type TreeSelectProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { cn } from "@/utils/cn";

/**
 * BaseTreeSelect - Component nền tảng bọc TreeSelect của Ant Design.
 *
 * Mặc định:
 * - Bo góc (rounded-md) giống với BaseInput
 * - Chiều cao chuẩn (h-10)
 * - Tùy chỉnh hover, focus và xóa border mặc định của Antd
 *
 * Hỗ trợ nhận className từ bên ngoài và gộp an toàn.
 */
export interface BaseTreeSelectProps extends TreeSelectProps {
  className?: string;
}

export default function BaseTreeSelect({ className, ...props }: BaseTreeSelectProps) {
  return (
    <TreeSelect
      className={cn(
        "w-full h-10",
        "[&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!bg-slate-50 [&_.ant-select-selector]:hover:!bg-slate-100 [&.ant-select-focused_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!border-slate-200 [&_.ant-select-selector]:!shadow-none",
        className
      )}
      treeLine={{ showLeafIcon: false }}
      popupClassName={cn(
        "[&_.ant-select-tree-indent-unit::before]:!border-r-[2px] [&_.ant-select-tree-indent-unit::before]:!border-slate-400",
        "[&_.ant-select-tree-switcher-leaf-line::before]:!border-r-[2px] [&_.ant-select-tree-switcher-leaf-line::before]:!border-slate-400",
        "[&_.ant-select-tree-switcher-leaf-line::after]:!border-b-[2px] [&_.ant-select-tree-switcher-leaf-line::after]:!border-slate-400",
        "[&_.ant-select-tree-switcher-line-icon_svg]:!stroke-[2px] [&_.ant-select-tree-switcher-line-icon_svg]:!stroke-slate-400",
        props.popupClassName
      )}
      switcherIcon={({ expanded }: any) => (
        <DownOutlined
          className={`transition-transform duration-200 ${
            expanded ? "" : "-rotate-90"
          }`}
        />
      )}
      {...props}
    />
  );
}
