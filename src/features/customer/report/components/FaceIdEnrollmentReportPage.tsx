"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ScanFace,
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  RefreshCcw,
  ChevronRight,
  ScanLine,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useFaceIdEnrollmentReport, useExportFaceIdNotEnrolled } from "../hooks/use-face-id-report";
import type {
  FaceIdReportRow,
  FaceIdStatus,
  FaceIdStatusFilter,
} from "../types/face-id-report.type";
import { CUSTOMER_ROUTES } from "@/constants/routes";
import { formatVietnameseName } from "@/utils/name.util";
import { useAuthStore } from "@/stores/auth.store";
import FaceIdPendingReviewTab from "./FaceIdPendingReviewTab";
import { useWorkspacesQuery } from "@/features/customer/workspace/hooks/use-workspace";
import { useSitesQuery } from "@/features/customer/site/hooks/use-site";
import { downloadBlob } from "./report-utils";

type StatusFilter = FaceIdStatusFilter | "all";
type ViewMode = "overview" | "pending";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "enrolled", label: "Đã đăng ký" },
  { value: "not_enrolled", label: "Chưa đăng ký" },
  { value: "pending", label: "Đang chờ xử lý" },
  { value: "revoked", label: "Đã thu hồi" },
];

const STATUS_TAG_MAP: Record<
  FaceIdStatus,
  { color: string; label: string; icon: React.ReactNode }
> = {
  enrolled: {
    color: "success",
    label: "Đã đăng ký",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  not_enrolled: {
    color: "default",
    label: "Chưa đăng ký",
    icon: <ScanLine className="w-3.5 h-3.5" />,
  },
  revoked: {
    color: "error",
    label: "Đã thu hồi",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

interface StatCardProps {
  title: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "slate" | "rose";
}

const toneClasses: Record<StatCardProps["tone"], { bg: string; ring: string; text: string; icon: string }> = {
  emerald: {
    bg: "from-emerald-50 to-white",
    ring: "ring-emerald-100",
    text: "text-emerald-700",
    icon: "bg-emerald-100 text-emerald-600",
  },
  amber: {
    bg: "from-amber-50 to-white",
    ring: "ring-amber-100",
    text: "text-amber-700",
    icon: "bg-amber-100 text-amber-600",
  },
  slate: {
    bg: "from-slate-50 to-white",
    ring: "ring-slate-100",
    text: "text-slate-700",
    icon: "bg-slate-100 text-slate-600",
  },
  rose: {
    bg: "from-rose-50 to-white",
    ring: "ring-rose-100",
    text: "text-rose-700",
    icon: "bg-rose-100 text-rose-600",
  },
};

function StatCard({ title, value, total, icon, tone }: StatCardProps) {
  const percent = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
  const classes = toneClasses[tone];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br ${classes.bg} p-5 shadow-[0_4px_24px_rgb(0,0,0,0.03)] ring-1 ${classes.ring} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </div>
          <div className={`mt-2 text-3xl font-black leading-none ${classes.text}`}>
            {value}
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-500">
            {total > 0 ? `${percent}% tổng số NV` : "Chưa có dữ liệu"}
          </div>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${classes.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function FaceIdEnrollmentReportPage() {
  const router = useRouter();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = useAuthStore((state) => state.user?.tenantId || undefined);
  const canViewReport = hasPermission("reports:list");
  const canManageFaceId = hasPermission("face_id:manage");
  const { state, setPagination } = usePagination(20);
  const [viewMode, setViewMode] = useState<ViewMode>(
    canViewReport ? "overview" : "pending",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [siteId, setSiteId] = useState<string>();
  const [searchInput, setSearchInput] = useState(state.search || "");
  const exportMutation = useExportFaceIdNotEnrolled();
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    const currentSearch = state.search || "";
    if (debouncedSearch !== currentSearch) {
      setPagination({ search: debouncedSearch });
    }
  }, [debouncedSearch, state.search, setPagination]);

  const apiStatus: FaceIdStatusFilter | undefined =
    statusFilter === "all" ? undefined : statusFilter;

  const { data: departmentPage } = useWorkspacesQuery({
    tenantId,
    type: "department",
    status: "active",
    sortBy: "name",
    sortDir: "asc",
    page: 0,
    size: 100,
  });
  const departments = departmentPage?.data?.content ?? [];
  const { data: sitePage } = useSitesQuery({ tenantId, status: "active", sortBy: "name", sortDir: "asc", page: 0, size: 100 });
  const sites = sitePage?.data?.content ?? [];

  const { data, isLoading, isFetching, refetch } = useFaceIdEnrollmentReport({
    status: apiStatus,
    departmentId: state.department,
    siteId,
    search: debouncedSearch.trim() || undefined,
    page: state.page,
    size: state.size,
  }, {
    enabled: canViewReport && viewMode === "overview",
  });

  const handleExportNotEnrolled = async () => {
    const blob = await exportMutation.mutateAsync({ departmentId: state.department, siteId });
    downloadBlob(blob, "face-id-chua-dang-ky.xlsx");
  };

  const rows = data?.records?.content ?? [];
  const total = data?.records.totalElements ?? 0;

  const columns: ColumnsType<FaceIdReportRow> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_, __, index) => (
        <span className="font-mono text-xs font-bold text-slate-400">
          {state.page * state.size + index + 1}
        </span>
      ),
    },
    {
      title: "Nhân viên",
      key: "name",
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold uppercase shadow-inner">
            {(record.lastName || record.firstName || "?")[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 text-sm truncate">
              {formatVietnameseName(record.firstName, record.lastName)}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate">
              {record.email || "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Mã NV",
      dataIndex: "employeeCode",
      key: "employeeCode",
      width: 120,
      render: (text: string | null) => (
        <span className="font-mono font-medium text-slate-600 text-sm">
          {text || "—"}
        </span>
      ),
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
      width: 140,
      render: (text: string | null) => (
        <span className="font-medium text-slate-600 text-sm">
          {text || "—"}
        </span>
      ),
    },
    {
      title: "Trạng thái Face ID",
      key: "faceIdStatus",
      width: 180,
      render: (_, record) => {
        const cfg = STATUS_TAG_MAP[record.faceIdStatus];
        return (
          <Tag
            color={cfg.color}
            className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md m-0 border-0"
          >
            {cfg.icon}
            <span>{cfg.label}</span>
          </Tag>
        );
      },
    },
    {
      title: "Xét duyệt",
      key: "reviewStatus",
      width: 170,
      render: (_: unknown, record) => {
        if (record.reviewStatus === "pending") {
          return <Tag color="processing">Chờ HR duyệt</Tag>;
        }
        if (record.reviewStatus === "rejected") {
          return (
            <div className="space-y-1">
              <Tag color="error">Bị từ chối</Tag>
              {record.rejectionReason && (
                <div
                  className="max-w-48 truncate text-xs text-slate-500"
                  title={record.rejectionReason}
                >
                  {record.rejectionReason}
                </div>
              )}
            </div>
          );
        }
        return <span className="text-slate-400">—</span>;
      },
    },
    {
      title: "Consent",
      key: "consent",
      width: 140,
      render: (_, record) =>
        record.consentGiven ? (
          <Tag color="success" className="font-medium m-0 border-0 bg-emerald-50 text-emerald-700">
            Đã đồng ý
          </Tag>
        ) : (
          <Tag color="default" className="font-medium m-0 border-0 bg-slate-100 text-slate-500">
            Chưa xác nhận
          </Tag>
        ),
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "enrolledAt",
      key: "enrolledAt",
      width: 150,
      render: (val: string | null) =>
        val ? (
          <span className="font-medium text-slate-600 text-sm">
            {format(new Date(val), "dd/MM/yyyy HH:mm")}
          </span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
    {
      title: "Chất lượng",
      dataIndex: "qualityScore",
      key: "qualityScore",
      width: 110,
      render: (val: number | null) =>
        val != null ? (
          <span className="font-mono font-medium text-slate-600 text-sm">
            {Math.round(val * 100)}%
          </span>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 130,
      fixed: "right",
      render: (_, record) => (
        <BaseButton
          type="default"
          icon={<ChevronRight className="h-4 w-4" />}
          className="!text-blue-600 !border-blue-200 hover:!bg-blue-50 hover:!border-blue-300 h-8 px-3 rounded-lg text-xs font-bold flex flex-row-reverse hover:-translate-y-0.5 transition-all duration-200 shadow-[0_2px_10px_rgb(0,0,0,0.04)]"
          onClick={() => {
            router.push(`${CUSTOMER_ROUTES.EMPLOYEES}/${record.employeeId}`);
          }}
        >
          Chi tiết
        </BaseButton>
      ),
    },
  ];

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30">
            <ScanFace className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Quản lý Face ID
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Theo dõi đăng ký, consent và xét duyệt hồ sơ sinh trắc học.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canViewReport && (
            <BaseButton
              type={viewMode === "overview" ? "primary" : "default"}
              onClick={() => setViewMode("overview")}
            >
              Tổng quan
            </BaseButton>
          )}
          {canManageFaceId && (
            <BaseButton
              type={viewMode === "pending" ? "primary" : "default"}
              onClick={() => setViewMode("pending")}
            >
              Chờ duyệt ({data?.pendingCount ?? "—"})
            </BaseButton>
          )}
          {viewMode === "overview" && (
            <BaseButton
              icon={<RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />}
              onClick={() => refetch()}
              loading={isFetching}
              className="!bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50 font-semibold shadow-sm"
            >
              Tải lại
            </BaseButton>
          )}
          {viewMode === "overview" && canViewReport && (
            <BaseButton
              type="primary"
              icon={<Download className="h-4 w-4" />}
              loading={exportMutation.isPending}
              onClick={() => void handleExportNotEnrolled()}
            >
              Xuất DS chưa đăng ký
            </BaseButton>
          )}
        </div>
      </div>

      {viewMode === "pending" ? (
        <ContentCard>
          <FaceIdPendingReviewTab enabled={canManageFaceId} />
        </ContentCard>
      ) : !canViewReport ? (
        <Alert
          type="warning"
          showIcon
          title="Bạn không có quyền xem báo cáo Face ID"
        />
      ) : (
      <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Tổng nhân viên"
          value={data?.totalEmployees ?? 0}
          total={data?.totalEmployees ?? 0}
          icon={<UserCheck className="h-5 w-5" />}
          tone="slate"
        />
        <StatCard
          title="Đã đăng ký"
          value={data?.enrolledCount ?? 0}
          total={data?.totalEmployees ?? 0}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          title="Chờ duyệt"
          value={data?.pendingCount ?? 0}
          total={data?.totalEmployees ?? 0}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          title="Chưa đăng ký"
          value={data?.notEnrolledCount ?? 0}
          total={data?.totalEmployees ?? 0}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          title="Đã thu hồi"
          value={data?.revokedCount ?? 0}
          total={data?.totalEmployees ?? 0}
          icon={<XCircle className="h-5 w-5" />}
          tone="rose"
        />
      </div>

      {/* Filters & Table */}
      <ContentCard>
        <ListHeader
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Tìm theo tên, email hoặc mã nhân viên..."
          searchAriaLabel="Tìm kiếm báo cáo Face ID phía server"
          filters={
            <>
              <BaseSelect
                aria-label="Lọc báo cáo theo phòng ban"
                allowClear
                placeholder="Tất cả phòng ban"
                value={state.department}
                onChange={(department) => setPagination({ department })}
                options={departments.map((department) => ({ value: department.id, label: department.name }))}
              />
              <BaseSelect
                aria-label="Lọc báo cáo theo công trình"
                allowClear
                placeholder="Tất cả công trình"
                value={siteId}
                onChange={setSiteId}
                options={sites.map((site) => ({ value: site.id, label: site.name }))}
              />
              <BaseSelect
                aria-label="Lọc báo cáo theo trạng thái Face ID"
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as StatusFilter);
                  setPagination({ page: 0 });
                }}
                options={STATUS_OPTIONS}
              />
            </>
          }
          actions={
            statusFilter !== "all" && (
              <span className="text-xs font-bold text-slate-500">
                Đang lọc:{" "}
                <span className="text-blue-600">
                  {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
                </span>
              </span>
            )
          }
        />

        <div className="mt-5">
          <DataTable<FaceIdReportRow>
            ariaLabel="Báo cáo trạng thái đăng ký Face ID"
            emptyTitle="Không có dữ liệu Face ID"
            emptyDescription="Thử thay đổi trạng thái hoặc từ khóa lọc."
            columns={columns}
            data={rows}
            loading={isLoading}
            totalElements={total}
            currentPage={state.page}
            pageSize={state.size}
            onPageChange={(page, size) => setPagination({ page, size })}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <div>
            Đang hiển thị{" "}
            <span className="font-bold text-slate-700">{rows.length}</span> /{" "}
            <span className="font-bold text-slate-700">{total}</span> nhân viên
          </div>
          {debouncedSearch && (
            <div>
              Từ khoá:{" "}
              <span className="font-bold text-blue-600">&quot;{debouncedSearch}&quot;</span>
              <span className="ml-2 text-slate-400">
                (tìm kiếm toàn bộ phía server)
              </span>
            </div>
          )}
        </div>
      </ContentCard>
      </>
      )}
    </div>
  );
}
