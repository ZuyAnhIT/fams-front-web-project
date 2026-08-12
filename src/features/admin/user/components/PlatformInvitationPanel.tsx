"use client";

import { useMemo, useState } from "react";
import { App, Alert, Tag } from "antd";
import { format } from "date-fns";
import { MailPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import DataTable from "@/components/tables/DataTable";
import ListHeader from "@/components/shared/layout/ListHeader";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import BaseModal from "@/components/ui/BaseModal";
import { BaseButton, BaseSelect } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useRolesQuery } from "@/features/admin/role-permission/hooks/use-role-permission";
import {
  useCancelPlatformInvitation,
  usePlatformInvitations,
  useSendPlatformInvitation,
} from "@/features/customer/employee/hooks/use-employee";
import type { PlatformInvitationResponse } from "@/features/customer/employee/types/employee.type";
import StatusBadge from "@/components/ui/StatusBadge";
import { INVITATION_STATUS } from "@/constants/status";
import { formatVietnameseName } from "@/utils/name.util";
import { getApiErrorMessage } from "@/utils/api-error.util";
import type { ColumnsType } from "antd/es/table";

const schema = z.object({
  email: z.string().email("Vui lòng nhập email hợp lệ"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function PlatformInvitationPanel() {
  const { message, modal } = App.useApp();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const invitations = usePlatformInvitations({
    email: debouncedSearch || undefined,
    status,
    page,
    size,
  });
  const sendInvitation = useSendPlatformInvitation();
  const cancelInvitation = useCancelPlatformInvitation();
  const roles = useRolesQuery({ size: 100, isActive: true });

  const roleOptions = useMemo(
    () =>
      (roles.data?.data.content ?? [])
        .filter(
          (role) =>
            role.tenantId === null &&
            role.isActive &&
            (!role.isSystem || role.name === "PLATFORM_STAFF"),
        )
        .map((role) => ({ label: role.name, value: role.id })),
    [roles.data],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", firstName: "", lastName: "", roleId: "" },
  });

  const submit = async (values: FormData) => {
    try {
      await sendInvitation.mutateAsync({
        email: values.email,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        roleId: values.roleId || undefined,
      });
      message.success(`Đã gửi lời mời nhân sự nền tảng tới ${values.email}`);
      setOpen(false);
      reset();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể gửi lời mời"));
    }
  };

  const confirmCancel = (record: PlatformInvitationResponse) => {
    modal.confirm({
      title: "Hủy lời mời nhân sự nền tảng?",
      content: `${record.email} sẽ không thể dùng đường dẫn trong email này nữa.`,
      okText: "Hủy lời mời",
      okButtonProps: { danger: true },
      cancelText: "Quay lại",
      onOk: async () => {
        try {
          await cancelInvitation.mutateAsync(record.id);
          message.success("Đã hủy lời mời");
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, "Không thể hủy lời mời"));
        }
      },
    });
  };

  const columns: ColumnsType<PlatformInvitationResponse> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value: string) => <span className="font-semibold text-slate-800">{value}</span>,
    },
    {
      title: "Họ tên",
      key: "name",
      render: (_: unknown, record: PlatformInvitationResponse) =>
        record.firstName || record.lastName
          ? formatVietnameseName(record.firstName, record.lastName)
          : "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value: string) => (
        <StatusBadge status={value} variant="tag" configMap={INVITATION_STATUS} />
      ),
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => format(new Date(value), "dd/MM/yyyy HH:mm"),
    },
    {
      title: "Hết hạn",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (value: string) => format(new Date(value), "dd/MM/yyyy HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: PlatformInvitationResponse) =>
        record.status === "pending" ? (
          <BaseButton type="text" danger size="small" onClick={() => confirmCancel(record)}>
            Hủy
          </BaseButton>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5 p-5">
      <Alert
        type="info"
        showIcon
        title="Nhân sự nền tảng không phải nhân viên của một công ty khách hàng"
        description="Khi chấp nhận, người dùng nhận vai trò cấp nền tảng và không tạo hồ sơ Employee, workspace, assignment hay Face ID."
      />

      <ListHeader
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder="Tìm lời mời theo email..."
        searchAriaLabel="Tìm lời mời nhân sự nền tảng"
        filters={
          <BaseSelect
            aria-label="Lọc trạng thái lời mời"
            allowClear
            placeholder="Tất cả trạng thái"
            className="w-48"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
            options={[
              { value: "pending", label: "Chờ xác nhận" },
              { value: "accepted", label: "Đã chấp nhận" },
              { value: "cancelled", label: "Đã hủy" },
              { value: "expired", label: "Hết hạn" },
            ]}
          />
        }
        actions={
          <BaseButton type="primary" icon={<MailPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>
            Mời nhân sự nền tảng
          </BaseButton>
        }
      />

      {invitations.isError && (
        <Alert type="error" showIcon title="Không thể tải danh sách lời mời nền tảng" />
      )}
      <DataTable
        ariaLabel="Danh sách lời mời nhân sự nền tảng"
        columns={columns}
        data={invitations.data?.content ?? []}
        loading={invitations.isLoading || invitations.isFetching}
        totalElements={invitations.data?.totalElements ?? 0}
        currentPage={page}
        pageSize={size}
        onPageChange={(nextPage, nextSize) => {
          setPage(nextPage);
          setSize(nextSize);
        }}
      />

      <BaseModal
        title="Mời nhân sự nền tảng"
        isOpen={open}
        onClose={() => setOpen(false)}
        confirmText="Gửi lời mời"
        confirmLoading={sendInvitation.isPending}
        confirmButtonProps={{ htmlType: "submit", form: "platform-invitation-form" }}
      >
        <form
          id="platform-invitation-form"
          className="space-y-4"
          onSubmit={handleSubmit(submit)}
        >
          <p className="text-sm text-slate-600">
            Người đã có tài khoản chỉ cần chấp nhận. Người mới sẽ đặt mật khẩu trước khi vào hệ thống.
          </p>
          <FormInput
            control={control}
            name="email"
            label="Email"
            required
            error={errors.email}
            placeholder="nhansu@fams.vn"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput control={control} name="lastName" label="Họ" error={errors.lastName} />
            <FormInput control={control} name="firstName" label="Tên" error={errors.firstName} />
          </div>
          <FormSelect
            control={control}
            name="roleId"
            label="Vai trò cấp nền tảng"
            placeholder="Mặc định PLATFORM_STAFF"
            allowClear
            loading={roles.isLoading}
            options={roleOptions}
            error={errors.roleId}
          />
          <Tag color="warning">Không chọn PLATFORM_ADMIN qua luồng mời mặc định</Tag>
        </form>
      </BaseModal>
    </div>
  );
}
