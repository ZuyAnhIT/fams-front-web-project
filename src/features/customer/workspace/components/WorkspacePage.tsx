"use client";

import React, { useState, useMemo } from "react";
import { Empty, Spin, Tree, Tag } from "antd";
import { Search, Plus, Building2, Users, Edit3, Filter } from "lucide-react";
import BaseInput from "@/components/ui/BaseInput";
import BaseSelect from "@/components/ui/BaseSelect";
import BaseButton from "@/components/ui/BaseButton";
import DataTable from "@/components/tables/DataTable";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import UpdateWorkspaceModal from "./UpdateWorkspaceModal";
import AddMemberModal from "./AddMemberModal";
import TransferMemberModal from "./TransferMemberModal";
import { useWorkspaceTreeQuery, useWorkspaceMembersQuery } from "../hooks/use-workspace";
import { useAuthStore } from "@/stores/auth.store";
import { WorkspaceResponse, WorkspaceTreeResponse } from "../types";
import { DownOutlined } from "@ant-design/icons";
import { formatVietnameseName } from "@/utils/name.util";
import StatusBadge from "@/components/ui/StatusBadge";
import { EMPLOYEE_STATUS } from "@/constants/status";

export default function WorkspacePage() {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  // Simple debounce for search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [memberPage, setMemberPage] = useState(0);
  const [memberSize, setMemberSize] = useState(10);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: treeResponse, isLoading } = useWorkspaceTreeQuery({
    tenantId: tenantId || undefined,
    search: debouncedSearchTerm,
    status: statusFilter,
  });

  const treeDataRaw = treeResponse?.data || [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceResponse | null>(null);

  // Transfer modal state
  const [transferMemberId, setTransferMemberId] = useState<string | null>(null);
  const [transferEmployeeName, setTransferEmployeeName] = useState<string>("");
  const [transferRole, setTransferRole] = useState<string>("");

  // Recursively find a node by ID
  const findNodeById = (nodes: WorkspaceTreeResponse[], id: string): WorkspaceTreeResponse | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedWorkspaceData = useMemo(() => {
    if (!selectedKeys.length) return null;
    return findNodeById(treeDataRaw, selectedKeys[0] as string);
  }, [selectedKeys, treeDataRaw]);

  const { data: membersResponse, isLoading: isLoadingMembers } = useWorkspaceMembersQuery(
    tenantId,
    selectedWorkspaceData?.id,
    memberPage,
    memberSize
  );

  const memberData = membersResponse?.data?.content || [];

  const formatTreeData = (nodes: WorkspaceTreeResponse[]): any[] => {
    return nodes.map((node) => ({
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
                ? "text-slate-400 line-through"
                : "text-slate-700 font-medium"
            }
          >
            {node.name}
          </span>
        </div>
      ),
      key: node.id,
      children: node.children ? formatTreeData(node.children) : [],
    }));
  };



  return (
    <div className="flex flex-col h-full max-w-[1600px] mx-auto py-2 w-full">
      {/* HEADER TRANG */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="!text-[35px] !font-semibold text-brand-950">Cơ cấu tổ chức</h1>
          <p className="text-sm text-brand-600 mt-1">
            Quản lý sơ đồ phòng ban, đội nhóm và nhân sự trực thuộc
          </p>
        </div>
        {hasPermission("workspaces:create") && (
          <BaseButton
            type="primary"
            icon={<Plus className="h-4.5 w-4.5" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 font-bold hover:-translate-y-0.5"
          >
            Thêm mới
          </BaseButton>
        )}
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
        {/* CỘT TRÁI: SƠ ĐỒ TỔ CHỨC */}
        <div className="w-full lg:w-1/3 lg:min-w-[320px] lg:max-w-[400px] bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col h-[calc(100vh-10.5rem)]">


          <div className="flex gap-2 mb-4">
            <BaseInput
              placeholder="Tìm kiếm..."
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-slate-200 hover:border-brand-400 focus:border-brand-500"
              allowClear
            />
            <BaseSelect
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val === "all" ? undefined : val)}
              className="w-32"
              options={[
                { value: "all", label: "Tất cả" },
                { value: "active", label: "Đang HĐ" },
                { value: "inactive", label: "Tạm dừng" },
              ]}
              defaultValue="all"
            />
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar pr-2">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spin />
              </div>
            ) : treeDataRaw.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có phòng ban nào"
              />
            ) : (
              <Tree
                showLine={{ showLeafIcon: false }}
                switcherIcon={({ expanded }: any) => (
                  <DownOutlined
                    className={`transition-transform duration-200 ${
                      expanded ? "" : "-rotate-90"
                    }`}
                  />
                )}
                defaultExpandAll
                treeData={formatTreeData(treeDataRaw)}
                selectedKeys={selectedKeys}
                onSelect={(keys) => {
                  setSelectedKeys(keys);
                  setMemberPage(0);
                }}
                className="text-sm [&_.ant-tree-indent-unit::before]:!border-r-[2px] [&_.ant-tree-indent-unit::before]:!border-slate-400 [&_.ant-tree-switcher-leaf-line::before]:!border-r-[2px] [&_.ant-tree-switcher-leaf-line::before]:!border-slate-400 [&_.ant-tree-switcher-leaf-line::after]:!border-b-[2px] [&_.ant-tree-switcher-leaf-line::after]:!border-slate-400 [&_.ant-tree-switcher-line-icon_svg]:!stroke-[2px] [&_.ant-tree-switcher-line-icon_svg]:!stroke-slate-400"
              />
            )}
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT & NHÂN SỰ */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-10.5rem)] overflow-auto custom-scrollbar">
          {selectedWorkspaceData ? (
            <div className="flex flex-col h-full animate-fade-in">
              {/* Header Chi tiết */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-bold text-slate-800">
                      {selectedWorkspaceData.name}
                    </h2>
                    {selectedWorkspaceData.status === "active" ? (
                      <Tag color="success" className="m-0 rounded-md">Hoạt động</Tag>
                    ) : (
                      <Tag color="default" className="m-0 rounded-md">Tạm dừng</Tag>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    {selectedWorkspaceData.type === "team" ? (
                      <><Users className="w-4 h-4" /> Đội nhóm</>
                    ) : (
                      <><Building2 className="w-4 h-4" /> Phòng ban</>
                    )}
                    {selectedWorkspaceData.description && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{selectedWorkspaceData.description}</span>
                      </>
                    )}
                  </p>
                </div>

                {hasPermission("workspaces:update") && (
                  <BaseButton
                    type="default"
                    icon={<Edit3 className="h-4 w-4" />}
                    onClick={() => setEditingWorkspace(selectedWorkspaceData)}
                    className="font-medium text-slate-600 hover:!text-brand-600 !border-slate-400 hover:!border-brand-400"
                  >
                    Chỉnh sửa
                  </BaseButton>
                )}
              </div>

              {/* Bảng Nhân sự */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Danh sách Nhân sự
                  </h3>
                  {hasPermission("workspace_members:create") && (
                    <BaseButton
                      type="primary"
                      icon={<Plus className="h-4 w-4" />}
                      onClick={() => setIsAddMemberModalOpen(true)}
                      className="!bg-emerald-600 !text-white hover:!bg-emerald-700 !border-0 shadow-lg shadow-emerald-500/25 font-semibold"
                    >
                      Thêm nhân sự
                    </BaseButton>
                  )}
                </div>
                <DataTable
                  columns={[
                    {
                      title: "Mã NV",
                      dataIndex: ["employee", "employeeCode"],
                      key: "code",
                      render: (text) => text || "-"
                    },
                    {
                      title: "Họ và tên",
                      dataIndex: ["employee", "fullName"],
                      key: "name",
                      sorter: (a: any, b: any) => {
                        const nameA = a.employee?.fullName || formatVietnameseName(a.employee?.firstName, a.employee?.lastName);
                        const nameB = b.employee?.fullName || formatVietnameseName(b.employee?.firstName, b.employee?.lastName);
                        return nameA.localeCompare(nameB);
                      },
                      render: (_, record: any) => record.employee?.fullName || formatVietnameseName(record.employee?.firstName, record.employee?.lastName)
                    },
                    {
                      title: "Chức vụ",
                      dataIndex: ["employee", "position"],
                      key: "position",
                      render: (text) => text || "-"
                    },
                    {
                      title: "Quyền trong PB",
                      dataIndex: "role",
                      key: "role",
                      render: (role: string) => (
                        <Tag color={role === "manager" ? "blue" : "default"}>
                          {role === "manager" ? "Quản lý" : "Nhân viên"}
                        </Tag>
                      )
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: ["employee", "status"],
                      key: "status",
                      render: (status: string) => (
                        <StatusBadge status={status} variant="dot" configMap={EMPLOYEE_STATUS} />
                      )
                    },
                    {
                      title: "Thao tác",
                      key: "actions",
                      width: 100,
                      render: (_, record: any) => {
                        if (!hasPermission("workspaces:update")) return null;
                        return (
                          <BaseButton
                            type="text"
                            size="small"
                            className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                            onClick={() => {
                              setTransferMemberId(record.id);
                              setTransferEmployeeName(record.employee?.fullName || formatVietnameseName(record.employee?.firstName, record.employee?.lastName) || 'Không xác định');
                              setTransferRole(record.role);
                            }}
                          >
                            Chuyển
                          </BaseButton>
                        );
                      }
                    }
                  ]}
                  data={memberData}
                  loading={isLoadingMembers}
                  totalElements={membersResponse?.data?.totalElements || 0}
                  currentPage={memberPage}
                  pageSize={memberSize}
                  onPageChange={(page, size) => {
                    setMemberPage(page);
                    setMemberSize(size);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <Building2 className="h-16 w-16 mb-4 text-slate-200" />
              <p className="text-lg font-medium text-slate-500">
                Chọn một phòng ban bên trái để xem chi tiết
              </p>
            </div>
          )}
        </div>

        <CreateWorkspaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        <UpdateWorkspaceModal
          workspace={editingWorkspace}
          isOpen={!!editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
        />

        {selectedWorkspaceData && (
          <AddMemberModal
            isOpen={isAddMemberModalOpen}
            onClose={() => setIsAddMemberModalOpen(false)}
            workspaceId={selectedWorkspaceData.id}
          />
        )}

        {selectedWorkspaceData && (
          <TransferMemberModal
            isOpen={!!transferMemberId}
            onClose={() => {
              setTransferMemberId(null);
              setTransferEmployeeName("");
              setTransferRole("");
            }}
            sourceWorkspaceId={selectedWorkspaceData.id}
            memberId={transferMemberId!}
            employeeName={transferEmployeeName}
            currentRole={transferRole}
          />
        )}
      </div>
    </div>
  );
}
