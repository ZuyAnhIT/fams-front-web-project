"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  App,
  Empty,
  Segmented,
  Space,
  Spin,
  Tag,
  Tooltip,
  Tree,
} from "antd";
import { DownOutlined } from "@ant-design/icons";
import {
  ArrowRightLeft,
  Building2,
  Edit3,
  ListTree,
  Plus,
  Search,
  Table2,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import BaseInput from "@/components/ui/BaseInput";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { EMPLOYEE_STATUS } from "@/constants/status";
import { useAuthStore } from "@/stores/auth.store";
import { formatVietnameseName } from "@/utils/name.util";
import {
  useDeleteWorkspaceMutation,
  useRemoveMemberMutation,
  useWorkspaceMembersQuery,
  useWorkspacesQuery,
  useWorkspaceTreeQuery,
} from "../hooks/use-workspace";
import type {
  WorkspaceMemberResponse,
  WorkspaceListParams,
  WorkspaceResponse,
  WorkspaceTreeResponse,
} from "../types";
import AddMemberModal from "./AddMemberModal";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import TransferMemberModal from "./TransferMemberModal";
import UpdateWorkspaceModal from "./UpdateWorkspaceModal";
import { getApiErrorMessage } from "@/utils/api-error.util";
import type { DataNode } from "antd/es/tree";

type ViewMode = "tree" | "list";

const roleLabels: Record<WorkspaceMemberResponse["role"], string> = {
  member: "Nhân viên",
  lead: "Trưởng nhóm",
  manager: "Quản lý",
};

function findNodeById(
  nodes: WorkspaceTreeResponse[],
  id: string,
): WorkspaceTreeResponse | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function employeeName(member: WorkspaceMemberResponse) {
  return (
    member.employee?.fullName ||
    formatVietnameseName(
      member.employee?.firstName ?? "",
      member.employee?.lastName ?? "",
    ) ||
    "Không xác định"
  );
}

function deleteBlockReason(workspace: WorkspaceResponse) {
  const memberCount = workspace.activeMemberCount ?? 0;
  const childCount = workspace.childWorkspaceCount ?? 0;
  if (memberCount > 0 && childCount > 0) {
    return `Không thể xóa: còn ${memberCount} nhân viên và ${childCount} đơn vị con. Hãy chuyển hết dữ liệu liên quan trước.`;
  }
  if (memberCount > 0) {
    return `Không thể xóa: còn ${memberCount} nhân viên. Hãy chuyển hoặc gỡ hết nhân viên trước.`;
  }
  if (childCount > 0) {
    return `Không thể xóa: còn ${childCount} đơn vị con. Hãy đổi đơn vị cha hoặc xóa các đơn vị con trước.`;
  }
  return null;
}

export default function WorkspacePage() {
  const { message, modal } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId ?? undefined;

  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkspaceListParams["status"]>();
  const [typeFilter, setTypeFilter] = useState<WorkspaceListParams["type"]>();
  const [listPage, setListPage] = useState(0);
  const [listSize, setListSize] = useState(20);
  const [memberPage, setMemberPage] = useState(0);
  const [memberSize, setMemberSize] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedWorkspaceSnapshot, setSelectedWorkspace] =
    useState<WorkspaceResponse | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] =
    useState<WorkspaceResponse | null>(null);
  const [transferMember, setTransferMember] =
    useState<WorkspaceMemberResponse | null>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setListPage(0);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const treeQuery = useWorkspaceTreeQuery({
    tenantId,
    search: debouncedSearch || undefined,
    status: statusFilter,
  });
  const listQuery = useWorkspacesQuery({
    tenantId,
    search: debouncedSearch || undefined,
    status: statusFilter,
    type: typeFilter,
    sortBy: "name",
    sortDir: "asc",
    page: listPage,
    size: listSize,
  });
  const treeNodes = useMemo(() => treeQuery.data?.data ?? [], [treeQuery.data]);
  const listData = listQuery.data?.data;
  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceSnapshot) return null;
    return (
      findNodeById(treeNodes, selectedWorkspaceSnapshot.id) ??
      selectedWorkspaceSnapshot
    );
  }, [selectedWorkspaceSnapshot, treeNodes]);

  const membersQuery = useWorkspaceMembersQuery(
    tenantId,
    selectedWorkspace?.id,
    memberPage,
    memberSize,
  );
  const members = membersQuery.data?.data?.content ?? [];

  const deleteWorkspace = useDeleteWorkspaceMutation();
  const removeMember = useRemoveMemberMutation();

  const canTransfer =
    hasPermission("workspace_members:create") &&
    hasPermission("workspace_members:delete");
  const canRemove = hasPermission("workspace_members:delete");
  const canDeleteWorkspace = hasPermission("workspaces:delete");

  const selectWorkspace = (workspace: WorkspaceResponse) => {
    setSelectedWorkspace(workspace);
    setSelectedKeys([workspace.id]);
    setMemberPage(0);
  };

  const confirmDeleteWorkspace = (workspace: WorkspaceResponse) => {
    const blockedReason = deleteBlockReason(workspace);
    if (blockedReason || !tenantId) return;
    modal.confirm({
      title: `Xóa “${workspace.name}”?`,
      content:
        "Workspace sẽ được xóa mềm và không còn xuất hiện trong cơ cấu tổ chức. Hành động này chỉ dành cho quản trị công ty.",
      okText: "Xóa workspace",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteWorkspace.mutateAsync({
            tenantId,
            workspaceId: workspace.id,
          });
          if (selectedWorkspace?.id === workspace.id) {
            setSelectedWorkspace(null);
            setSelectedKeys([]);
          }
          message.success("Đã xóa workspace");
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, "Không thể xóa workspace"));
          throw error;
        }
      },
    });
  };

  const confirmRemoveMember = (member: WorkspaceMemberResponse) => {
    if (!tenantId || !selectedWorkspace) return;
    modal.confirm({
      title: `Gỡ ${employeeName(member)} khỏi workspace?`,
      content:
        "Thao tác chỉ gỡ quan hệ với workspace này, không xóa hồ sơ nhân viên.",
      okText: "Gỡ nhân sự",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await removeMember.mutateAsync({
            tenantId,
            workspaceId: selectedWorkspace.id,
            memberId: member.id,
          });
          message.success("Đã gỡ nhân sự khỏi workspace");
        } catch (error: unknown) {
          message.error(getApiErrorMessage(error, "Không thể gỡ nhân sự"));
          throw error;
        }
      },
    });
  };

  const formatTreeData = (nodes: WorkspaceTreeResponse[]): DataNode[] =>
    nodes.map((node) => ({
      key: node.id,
      title: (
        <div className="flex items-center gap-2 py-0.5">
          {node.type === "team" ? (
            <Users className="h-3.5 w-3.5 text-purple-500" />
          ) : (
            <Building2 className="h-3.5 w-3.5 text-blue-500" />
          )}
          <span
            className={
              node.status === "inactive"
                ? "font-medium text-slate-400"
                : "font-medium text-slate-700"
            }
          >
            {node.name}
          </span>
          <span className="text-xs text-slate-400">
            {node.activeMemberCount ?? 0} người
          </span>
        </div>
      ),
      children: formatTreeData(node.children ?? []),
    }));

  const workspaceActions = (workspace: WorkspaceResponse) => {
    const blockedReason = deleteBlockReason(workspace);
    return (
      <Space size={4} onClick={(event) => event.stopPropagation()}>
        {hasPermission("workspaces:update") && (
          <Tooltip title="Chỉnh sửa">
            <BaseButton
              aria-label={`Chỉnh sửa ${workspace.name}`}
              type="text"
              size="small"
              icon={<Edit3 className="h-4 w-4" />}
              onClick={() => setEditingWorkspace(workspace)}
            />
          </Tooltip>
        )}
        {canDeleteWorkspace && (
          <Tooltip title={blockedReason || "Xóa workspace"}>
            <span>
              <BaseButton
                aria-label={`Xóa ${workspace.name}`}
                type="text"
                danger
                size="small"
                disabled={Boolean(blockedReason)}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => confirmDeleteWorkspace(workspace)}
              />
            </span>
          </Tooltip>
        )}
      </Space>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-5">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Cơ cấu tổ chức
          </h1>
          <p className="mt-1 text-sm text-brand-600">
            Quản lý phòng ban, đội nhóm và nhân sự trực thuộc trong toàn công ty
          </p>
        </div>
        {hasPermission("workspaces:create") && (
          <BaseButton
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
            className="!border-0 !bg-blue-600 !text-white hover:!bg-blue-700"
          >
            Tạo workspace
          </BaseButton>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 xl:flex-row">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <BaseInput
              aria-label="Tìm workspace"
              placeholder="Tìm theo tên workspace..."
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              allowClear
              className="sm:max-w-sm"
            />
            <BaseSelect
              aria-label="Lọc workspace theo trạng thái"
              placeholder="Tất cả trạng thái"
              allowClear
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setListPage(0);
              }}
              className="w-full sm:w-48"
              options={[
                { value: "active", label: "Đang hoạt động" },
                { value: "inactive", label: "Ngừng hoạt động" },
              ]}
            />
            {viewMode === "list" && (
              <BaseSelect
                aria-label="Lọc workspace theo loại"
                placeholder="Tất cả loại"
                allowClear
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  setListPage(0);
                }}
                className="w-full sm:w-44"
                options={[
                  { value: "department", label: "Phòng ban" },
                  { value: "team", label: "Đội nhóm" },
                ]}
              />
            )}
          </div>
          <Segmented
            aria-label="Chọn kiểu hiển thị workspace"
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            options={[
              {
                value: "tree",
                label: "Cây tổ chức",
                icon: <ListTree className="h-4 w-4" />,
              },
              {
                value: "list",
                label: "Danh sách",
                icon: <Table2 className="h-4 w-4" />,
              },
            ]}
          />
        </div>
      </div>

      {viewMode === "list" ? (
        <DataTable
          ariaLabel="Danh sách workspace"
          emptyTitle="Không có workspace phù hợp"
          emptyDescription="Thử thay đổi bộ lọc hoặc tạo workspace đầu tiên."
          columns={[
            {
              title: "Workspace",
              key: "name",
              render: (_, workspace: WorkspaceResponse) => (
                <div>
                  <div className="font-semibold text-slate-800">
                    {workspace.name}
                  </div>
                  <div className="max-w-md truncate text-xs text-slate-500">
                    {workspace.description || "Chưa có mô tả"}
                  </div>
                </div>
              ),
            },
            {
              title: "Loại",
              dataIndex: "type",
              key: "type",
              render: (type: WorkspaceResponse["type"]) => (
                <Tag color={type === "team" ? "purple" : "blue"}>
                  {type === "team" ? "Đội nhóm" : "Phòng ban"}
                </Tag>
              ),
            },
            {
              title: "Nhân sự",
              dataIndex: "activeMemberCount",
              key: "activeMemberCount",
              align: "right",
              render: (count: number) => count ?? 0,
            },
            {
              title: "Đơn vị con",
              dataIndex: "childWorkspaceCount",
              key: "childWorkspaceCount",
              align: "right",
              render: (count: number) => count ?? 0,
            },
            {
              title: "Trạng thái",
              key: "status",
              render: (_, workspace: WorkspaceResponse) => (
                <div>
                  <Tag color={workspace.status === "active" ? "success" : "default"}>
                    {workspace.status === "active"
                      ? "Hoạt động"
                      : "Ngừng hoạt động"}
                  </Tag>
                  {workspace.status === "inactive" &&
                    (workspace.activeMemberCount ?? 0) > 0 && (
                      <div className="mt-1 max-w-xs text-xs text-amber-700">
                        Vẫn còn {workspace.activeMemberCount} nhân viên cần cân nhắc
                        điều chuyển.
                      </div>
                    )}
                </div>
              ),
            },
            {
              title: "Thao tác",
              key: "actions",
              width: 110,
              render: (_, workspace: WorkspaceResponse) =>
                workspaceActions(workspace),
            },
          ]}
          data={listData?.content ?? []}
          loading={listQuery.isLoading}
          totalElements={listData?.totalElements ?? 0}
          currentPage={listPage}
          pageSize={listSize}
          onPageChange={(page, size) => {
            setListPage(page);
            setListSize(size);
          }}
          onRow={(workspace) => ({
            className: "cursor-pointer",
            onClick: () => {
              selectWorkspace(workspace);
              setViewMode("tree");
            },
          })}
        />
      ) : (
        <div className="grid min-h-[520px] gap-5 lg:grid-cols-[minmax(300px,380px)_1fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">Cây đơn vị</h2>
            <div className="max-h-[650px] overflow-auto pr-1">
              {treeQuery.isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spin />
                </div>
              ) : treeNodes.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có workspace phù hợp"
                />
              ) : (
                <Tree
                  showLine={{ showLeafIcon: false }}
                  switcherIcon={({ expanded }: { expanded?: boolean }) => (
                    <DownOutlined
                      className={expanded ? "" : "-rotate-90"}
                    />
                  )}
                  defaultExpandAll
                  treeData={formatTreeData(treeNodes)}
                  selectedKeys={selectedKeys}
                  onSelect={(keys: React.Key[]) => {
                    setSelectedKeys(keys);
                    const selected = keys[0]
                      ? findNodeById(treeNodes, String(keys[0]))
                      : null;
                    setSelectedWorkspace(selected);
                    setMemberPage(0);
                  }}
                />
              )}
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {!selectedWorkspace ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-slate-400">
                <Building2 className="mb-4 h-16 w-16 text-slate-200" />
                <p className="text-base font-medium text-slate-500">
                  Chọn một workspace để xem và quản lý nhân sự
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-800">
                        {selectedWorkspace.name}
                      </h2>
                      <Tag
                        color={
                          selectedWorkspace.status === "active"
                            ? "success"
                            : "default"
                        }
                      >
                        {selectedWorkspace.status === "active"
                          ? "Hoạt động"
                          : "Ngừng hoạt động"}
                      </Tag>
                      <Tag
                        color={
                          selectedWorkspace.type === "team" ? "purple" : "blue"
                        }
                      >
                        {selectedWorkspace.type === "team"
                          ? "Đội nhóm"
                          : "Phòng ban"}
                      </Tag>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedWorkspace.description || "Chưa có mô tả"}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-slate-500">
                      <span>
                        {selectedWorkspace.activeMemberCount ?? 0} nhân sự hoạt động
                      </span>
                      <span>
                        {selectedWorkspace.childWorkspaceCount ?? 0} đơn vị con
                      </span>
                    </div>
                  </div>
                  {workspaceActions(selectedWorkspace)}
                </div>

                {selectedWorkspace.status === "inactive" && (
                  <Alert
                    type="warning"
                    showIcon
                    title="Workspace đã ngừng hoạt động"
                    description={
                      (selectedWorkspace.activeMemberCount ?? 0) > 0
                        ? `Không thể thêm hoặc chuyển nhân sự vào đây. Workspace vẫn còn ${selectedWorkspace.activeMemberCount} nhân viên; bạn có thể chuyển họ sang đơn vị đang hoạt động.`
                        : "Không thể thêm hoặc chuyển nhân sự vào workspace này."
                    }
                  />
                )}

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Danh sách nhân sự
                  </h3>
                  {hasPermission("workspace_members:create") && (
                    <Tooltip
                      title={
                        selectedWorkspace.status === "inactive"
                          ? "Workspace ngừng hoạt động không thể nhận thêm nhân sự"
                          : undefined
                      }
                    >
                      <span>
                        <BaseButton
                          type="primary"
                          icon={<Plus className="h-4 w-4" />}
                          disabled={selectedWorkspace.status === "inactive"}
                          onClick={() => setIsAddMemberOpen(true)}
                          className="!border-0 !bg-emerald-600 !text-white hover:!bg-emerald-700"
                        >
                          Thêm nhân sự
                        </BaseButton>
                      </span>
                    </Tooltip>
                  )}
                </div>

                <DataTable
                  ariaLabel={`Nhân sự thuộc ${selectedWorkspace.name}`}
                  emptyTitle="Workspace chưa có nhân sự"
                  emptyDescription="Thêm nhân sự để hoàn thiện cơ cấu tổ chức."
                  columns={[
                    {
                      title: "Mã NV",
                      dataIndex: ["employee", "employeeCode"],
                      key: "code",
                      render: (value) => value || "-",
                    },
                    {
                      title: "Nhân viên",
                      key: "employee",
                      render: (_, member: WorkspaceMemberResponse) => (
                        <div>
                          <div className="font-medium text-slate-800 flex items-center gap-2">
                            {employeeName(member)}
                            {member.isPrimary && (
                              <Tag color="gold" className="m-0">Chính</Tag>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {member.employee?.email || member.employee?.position || "-"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Vai trò",
                      dataIndex: "role",
                      key: "role",
                      render: (role: WorkspaceMemberResponse["role"]) => (
                        <Tag color={role === "manager" ? "blue" : role === "lead" ? "purple" : "default"}>
                          {roleLabels[role]}
                        </Tag>
                      ),
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: ["employee", "status"],
                      key: "status",
                      render: (status: string) =>
                        status ? (
                          <StatusBadge
                            status={status}
                            variant="dot"
                            configMap={EMPLOYEE_STATUS}
                          />
                        ) : (
                          "-"
                        ),
                    },
                    {
                      title: "Thao tác",
                      key: "actions",
                      width: 120,
                      render: (_, member: WorkspaceMemberResponse) => (
                        <Space size={2}>
                          {canTransfer && (
                            <Tooltip title="Chuyển sang workspace khác">
                              <BaseButton
                                aria-label={`Chuyển ${employeeName(member)}`}
                                type="text"
                                size="small"
                                icon={<ArrowRightLeft className="h-4 w-4" />}
                                onClick={() => setTransferMember(member)}
                              />
                            </Tooltip>
                          )}
                          {canRemove && (
                            <Tooltip title="Gỡ khỏi workspace">
                              <BaseButton
                                aria-label={`Gỡ ${employeeName(member)}`}
                                type="text"
                                danger
                                size="small"
                                icon={<UserMinus className="h-4 w-4" />}
                                onClick={() => confirmRemoveMember(member)}
                              />
                            </Tooltip>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                  data={members}
                  loading={membersQuery.isLoading}
                  totalElements={membersQuery.data?.data?.totalElements ?? 0}
                  currentPage={memberPage}
                  pageSize={memberSize}
                  onPageChange={(page, size) => {
                    setMemberPage(page);
                    setMemberSize(size);
                  }}
                />
              </div>
            )}
          </section>
        </div>
      )}

      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <UpdateWorkspaceModal
        workspace={editingWorkspace}
        isOpen={Boolean(editingWorkspace)}
        onClose={() => setEditingWorkspace(null)}
      />
      {selectedWorkspace && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          workspaceId={selectedWorkspace.id}
        />
      )}
      {selectedWorkspace && transferMember && (
        <TransferMemberModal
          isOpen
          onClose={() => setTransferMember(null)}
          sourceWorkspaceId={selectedWorkspace.id}
          memberId={transferMember.id}
          employeeName={employeeName(transferMember)}
          currentRole={transferMember.role}
        />
      )}
    </div>
  );
}
