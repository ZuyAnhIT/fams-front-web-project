"use client";

import { useState } from "react";
import { Alert, Avatar, Space, Switch, Tabs, Tag } from "antd";
import { Mail, ShieldPlus, Users } from "lucide-react";
import { format } from "date-fns";
import ContentCard from "@/components/shared/layout/ContentCard";
import ListHeader from "@/components/shared/layout/ListHeader";
import DataTable from "@/components/tables/DataTable";
import { BaseButton, BaseSelect } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsersQuery } from "@/hooks/use-user";
import type { UserProfile } from "@/features/customer/auth/types/auth.type";
import { AssignPlatformRoleModal } from "@/features/admin/role-permission/components/AssignPlatformRoleModal";
import { PlatformInvitationPanel } from "./PlatformInvitationPanel";

export function UserDirectoryPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [platformAdminsOnly, setPlatformAdminsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"email" | "displayName" | "createdAt" | "lastLoginAt">("lastLoginAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<UserProfile>();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching, isError } = useUsersQuery({
    search: debouncedSearch || undefined,
    isActive,
    isPlatformAdmin: platformAdminsOnly ? true : undefined,
    sortBy,
    sortDir,
    page,
    size,
  });

  const columns = [
    {
      title: "Người dùng",
      key: "user",
      dataIndex: "displayName",
      sorter: true,
      render: (_: string, user: UserProfile) => (
        <div className="flex items-center gap-3">
          <Avatar src={user.avatarUrl || undefined}>{(user.displayName || user.email || "?").charAt(0).toUpperCase()}</Avatar>
          <div>
            <div className="font-semibold text-slate-800">{user.displayName || "Chưa đặt tên"}</div>
            <div className="text-xs text-slate-500">{user.email || "Không có email"}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => <Tag color={active ? "success" : "default"}>{active ? "Hoạt động" : "Đã khóa"}</Tag>,
    },
    {
      title: "Loại tài khoản",
      dataIndex: "platformAdmin",
      key: "platformAdmin",
      render: (platformAdmin: boolean) => (
        <Tag color={platformAdmin ? "purple" : "blue"}>
          {platformAdmin ? "Platform Admin" : "Người dùng thường"}
        </Tag>
      ),
    },
    {
      title: "Đăng nhập gần nhất",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      sorter: true,
      render: (value?: string | null) => value ? format(new Date(value), "dd/MM/yyyy HH:mm") : "Chưa đăng nhập",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (value: string) => format(new Date(value), "dd/MM/yyyy"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, user: UserProfile) => (
        <BaseButton
          size="small"
          icon={<ShieldPlus className="h-4 w-4" />}
          onClick={() => setSelectedUser(user)}
        >
          Gán vai trò
        </BaseButton>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          <Users className="h-7 w-7 text-blue-600" />
          Nhân sự FAMS
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Danh mục tài khoản toàn hệ thống và điểm vào để gán vai trò cấp nền tảng.
        </p>
      </div>

      <ContentCard noPadding>
        <Tabs
          className="px-5 pt-3"
          items={[
            {
              key: "directory",
              label: <span className="flex items-center gap-2"><Users className="h-4 w-4" />Danh mục tài khoản</span>,
              children: (
                <>
        <Alert
          type="info"
          showIcon
          message="Danh mục này gồm mọi tài khoản trên hệ thống"
          description="Dùng tìm người và gán vai trò cấp nền tảng. Bộ lọc bên dưới chỉ dựa trên cờ Platform Admin, không đại diện cho role PLATFORM_STAFF."
          className="m-5 mb-0"
        />
        {isError && (
          <Alert
            type="error"
            showIcon
            message="Không thể tải danh mục người dùng toàn hệ thống"
            className="m-5"
          />
        )}
        <ListHeader
          className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between"
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          searchPlaceholder="Tìm theo tên hoặc email..."
          searchAriaLabel="Tìm người dùng toàn hệ thống"
          filters={
            <Space wrap>
              <BaseSelect
                aria-label="Lọc trạng thái tài khoản"
                allowClear
                placeholder="Trạng thái"
                className="w-44"
                value={isActive === undefined ? undefined : String(isActive)}
                onChange={(value) => {
                  setIsActive(value === undefined ? undefined : value === "true");
                  setPage(0);
                }}
                options={[
                  { value: "true", label: "Hoạt động" },
                  { value: "false", label: "Đã khóa" },
                ]}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <Switch
                  checked={platformAdminsOnly}
                  onChange={(checked) => {
                    setPlatformAdminsOnly(checked);
                    setPage(0);
                  }}
                />
                Chỉ tài khoản có cờ Platform Admin
              </label>
            </Space>
          }
        />
        <div className="p-5">
          <DataTable
            ariaLabel="Danh sách người dùng toàn hệ thống"
            columns={columns as any}
            data={data?.content || []}
            loading={isLoading || isFetching}
            totalElements={data?.totalElements || 0}
            currentPage={page}
            pageSize={size}
            onPageChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setSize(nextSize);
            }}
            onChange={(_, __, sorter: any) => {
              if (!Array.isArray(sorter) && sorter.order) {
                const key = sorter.columnKey === "user" ? "displayName" : sorter.columnKey;
                if (["email", "displayName", "createdAt", "lastLoginAt"].includes(key)) {
                  setSortBy(key);
                  setSortDir(sorter.order === "ascend" ? "asc" : "desc");
                  setPage(0);
                }
              }
            }}
          />
        </div>
                </>
              ),
            },
            {
              key: "invitations",
              label: <span className="flex items-center gap-2"><Mail className="h-4 w-4" />Lời mời nền tảng</span>,
              children: <PlatformInvitationPanel />,
            },
          ]}
        />
      </ContentCard>

      <AssignPlatformRoleModal
        open={Boolean(selectedUser)}
        initialUser={selectedUser}
        onClose={() => setSelectedUser(undefined)}
      />
    </div>
  );
}
