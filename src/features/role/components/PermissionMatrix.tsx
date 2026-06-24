"use client";

import { useMemo } from "react";
import { Collapse, Checkbox, Spin, Alert } from "antd";
import { useGroupedPermissions } from "../hooks/use-role";
import type { PermissionGroupResponse } from "../types/role.type";
import { ShieldCheck, CheckSquare, Square } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";

interface PermissionMatrixProps {
  value?: string[];
  onChange?: (val: string[]) => void;
  disabled?: boolean;
}

export default function PermissionMatrix({ value = [], onChange, disabled = false }: PermissionMatrixProps) {
  const { data: groupedPermissions, isLoading, isError } = useGroupedPermissions();

  const handleCheckPermission = (permissionId: string, checked: boolean) => {
    if (disabled || !onChange) return;
    
    if (checked) {
      onChange([...value, permissionId]);
    } else {
      onChange(value.filter(id => id !== permissionId));
    }
  };

  const handleCheckGroup = (group: PermissionGroupResponse, checked: boolean) => {
    if (disabled || !onChange) return;

    const groupIds = group.permissions.map(p => p.id);
    if (checked) {
      // Add all from group that are not already in value
      const newIds = groupIds.filter(id => !value.includes(id));
      onChange([...value, ...newIds]);
    } else {
      // Remove all group ids from value
      onChange(value.filter(id => !groupIds.includes(id)));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (disabled || !onChange || !groupedPermissions) return;

    if (checked) {
      const allIds = groupedPermissions.flatMap(g => g.permissions.map(p => p.id));
      onChange(allIds);
    } else {
      onChange([]);
    }
  };

  const isAllSelected = useMemo(() => {
    if (!groupedPermissions || groupedPermissions.length === 0) return false;
    const allIds = groupedPermissions.flatMap(g => g.permissions.map(p => p.id));
    return allIds.length > 0 && allIds.every(id => value.includes(id));
  }, [groupedPermissions, value]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-brand-50/50 rounded-xl border border-brand-100">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !groupedPermissions) {
    return <Alert type="error" message="Không thể tải danh sách quyền hệ thống" />;
  }

  const collapseItems = groupedPermissions.map(group => {
    const groupIds = group.permissions.map(p => p.id);
    const checkedCount = groupIds.filter(id => value.includes(id)).length;
    const isGroupAllSelected = checkedCount === groupIds.length && groupIds.length > 0;
    const isIndeterminate = checkedCount > 0 && checkedCount < groupIds.length;

    return {
      key: group.resource,
      label: (
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-900 capitalize">{group.resource}</span>
            <span className="text-xs bg-brand-200 text-brand-700 px-2 py-0.5 rounded-full">
              {checkedCount} / {groupIds.length}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={isGroupAllSelected}
              indeterminate={isIndeterminate}
              disabled={disabled}
              onChange={(e) => handleCheckGroup(group, e.target.checked)}
              className="text-brand-600"
            >
              Chọn nhóm này
            </Checkbox>
          </div>
        </div>
      ),
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {group.permissions.map(perm => (
            <div key={perm.id} className="flex items-start gap-2 p-2 hover:bg-brand-50 rounded-lg transition-colors">
              <Checkbox
                checked={value.includes(perm.id)}
                disabled={disabled}
                onChange={(e) => handleCheckPermission(perm.id, e.target.checked)}
                className="mt-0.5"
              />
              <div className="flex flex-col cursor-pointer" onClick={() => handleCheckPermission(perm.id, !value.includes(perm.id))}>
                <span className="text-sm font-medium text-brand-900">{perm.name}</span>
                <span className="text-xs text-brand-500">{perm.description}</span>
              </div>
            </div>
          ))}
        </div>
      )
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-brand-200">
        <div className="flex items-center gap-2 text-brand-800">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="font-semibold text-lg">Ma trận quyền hạn</h3>
        </div>
        
        {!disabled && (
          <BaseButton 
            size="small" 
            type="dashed"
            icon={isAllSelected ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            onClick={() => handleSelectAll(!isAllSelected)}
          >
            {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </BaseButton>
        )}
      </div>

      <Collapse 
        items={collapseItems} 
        defaultActiveKey={groupedPermissions.map(g => g.resource)}
        className="bg-white border-brand-200"
      />
    </div>
  );
}
