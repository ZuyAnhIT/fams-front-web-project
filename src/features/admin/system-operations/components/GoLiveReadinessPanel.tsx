"use client";

import { useMemo, useState } from "react";
import { Alert, App, Input, Modal, Pagination, Progress, Select, Tag } from "antd";
import { CheckCircle2, ClipboardCheck, FileSignature, Plus, ShieldCheck, XCircle } from "lucide-react";
import ContentCard from "@/components/shared/layout/ContentCard";
import { BaseButton, BaseInput, BaseSelect } from "@/components/ui";
import { useTenants } from "@/features/admin/tenant/hooks/use-tenant";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useAuthStore } from "@/stores/auth.store";
import {
  useCreateGoLiveRecord,
  useDecideGoLiveRecord,
  useGoLiveRecords,
  useUpdateGoLiveSteps,
} from "../hooks/use-system-operations";
import type { GoLiveRecord, GoLiveStep, GoLiveStepResult, SystemStatus } from "../types/system-operations.type";

const REQUIRED_COMPONENTS = [
  { key: "db", label: "PostgreSQL" },
  { key: "redis", label: "Redis" },
  { key: "fcm", label: "FCM / Notification provider" },
  { key: "aiService", label: "AI Service / Face ID" },
  { key: "randomCheckJob", label: "Random Check Job" },
  { key: "randomCheckQueue", label: "Random Check Queue" },
];

export const GO_LIVE_STEP_NAMES = [
  "Platform Admin tạo tenant mới với ownerEmail hợp lệ và đúng gói dịch vụ",
  "Owner đăng nhập lần đầu và xác nhận đúng tenant/quyền",
  "Owner/Admin tạo site, geofence và ca làm việc",
  "HR mời nhân viên đầu tiên qua email",
  "Ứng viên chấp nhận lời mời và Employee được tạo đúng một lần",
  "HR phân công nhân viên vào đúng site và ca",
  "Nhân viên đồng ý và đăng ký Face ID bằng ảnh thật",
  "HR duyệt Face ID, trạng thái chuyển sang enrolled",
  "Nhân viên check-in trong geofence bằng mode yêu cầu Face ID",
  "Nhân viên check-out, work minutes được tính đúng",
  "HR đối chiếu báo cáo công ngày/tháng với check-in/out",
  "HR export Excel và mở file xác nhận dữ liệu/encoding",
  "HR lưu bộ lọc thường dùng và kiểm tra default filter",
  "Platform Admin trace audit theo tenant/request ID",
  "Kiểm tra masking JSON/Excel giống nhau và cross-tenant bị chặn 403/404",
];

type EditableStep = Omit<GoLiveStep, "result"> & { result: GoLiveStepResult | "" };

function getErrorMessage(error: unknown, fallback: string) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function mergeWithTemplate(steps: GoLiveStep[]): EditableStep[] {
  const byName = new Map(steps.map((step) => [step.stepName, step]));
  const template = GO_LIVE_STEP_NAMES.map((stepName) => byName.get(stepName) || { stepName, result: "" as const });
  const custom = steps.filter((step) => !GO_LIVE_STEP_NAMES.includes(step.stepName));
  return [...template, ...custom];
}

function recordColor(status: GoLiveRecord["status"]) {
  return status === "APPROVED" ? "success" : status === "REJECTED" ? "error" : "processing";
}

export default function GoLiveReadinessPanel({ status, loading }: { status?: SystemStatus; loading: boolean }) {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === SystemRole.PLATFORM_ADMIN || Boolean(user?.permissions?.includes("golive:manage"));
  const [statusFilter, setStatusFilter] = useState<GoLiveRecord["status"] | undefined>();
  const [tenantFilter, setTenantFilter] = useState<string>();
  const [recordPage, setRecordPage] = useState(0);
  const recordsQuery = useGoLiveRecords({ tenantId: tenantFilter, status: statusFilter, page: recordPage, size: 20 }, canManage);
  const tenantsQuery = useTenants({ page: 0, size: 100, sortBy: "name", sortDir: "asc" }, canManage);
  const createMutation = useCreateGoLiveRecord();
  const updateMutation = useUpdateGoLiveSteps();
  const decideMutation = useDecideGoLiveRecord();
  const [activeRecord, setActiveRecord] = useState<GoLiveRecord | null>(null);
  const [editableSteps, setEditableSteps] = useState<EditableStep[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string>();
  const [environment, setEnvironment] = useState("production");
  const [buildVersion, setBuildVersion] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const checks = useMemo(() => {
    const components = REQUIRED_COMPONENTS.map((component) => ({
      ...component,
      status: status?.healthComponents?.[component.key]?.status?.toUpperCase() || "MISSING",
    }));
    const jobsRecorded = status?.jobs?.length === 7;
    const jobsHealthy = jobsRecorded && status!.jobs.every((job) => job.lastStatus.toUpperCase() === "OK" && !job.stale);
    const overallHealthy = status?.overallHealth?.toUpperCase() === "UP";
    const componentsHealthy = components.every((component) => component.status === "UP");
    return { components, jobsRecorded, jobsHealthy, overallHealthy, componentsHealthy };
  }, [status]);

  const automaticReady = checks.overallHealthy && checks.componentsHealthy && checks.jobsHealthy;
  const completedCount = editableSteps.filter((step) => step.result).length;
  const allStepsCompleted = editableSteps.length > 0 && editableSteps.every((step) => step.result);
  const percent = editableSteps.length ? Math.round((completedCount / editableSteps.length) * 100) : 0;
  const readOnly = activeRecord?.status !== "DRAFT";

  const openRecord = (record: GoLiveRecord) => {
    setActiveRecord(record);
    setEditableSteps(mergeWithTemplate(record.steps || []));
  };

  const createRecord = async () => {
    if (!tenantId || !environment.trim() || !buildVersion.trim()) {
      message.warning("Vui lòng chọn tenant, môi trường và nhập build version.");
      return;
    }
    try {
      const created = await createMutation.mutateAsync({ tenantId, environment: environment.trim(), buildVersion: buildVersion.trim(), steps: [] });
      setCreateOpen(false);
      setBuildVersion("");
      openRecord(created);
      message.success("Đã tạo biên bản go-live ở trạng thái DRAFT.");
    } catch (error) {
      message.error(getErrorMessage(error, "Không thể tạo biên bản go-live."));
    }
  };

  const saveSteps = async (completed: boolean) => {
    if (!activeRecord) return;
    if (completed && !allStepsCompleted) {
      message.warning("Mọi bước phải có kết quả PASS, FAIL hoặc SKIP trước khi hoàn tất.");
      return;
    }
    const steps = editableSteps.filter((step): step is GoLiveStep => Boolean(step.result));
    try {
      const updated = await updateMutation.mutateAsync({ id: activeRecord.id, steps, completed });
      openRecord(updated);
      message.success(completed ? "Đã hoàn tất checklist và ghi nhận thời gian." : "Đã lưu toàn bộ kết quả hiện tại.");
    } catch (error) {
      message.error(getErrorMessage(error, "Không thể lưu checklist."));
    }
  };

  const submitDecision = async () => {
    if (!activeRecord || !decision) return;
    try {
      const updated = await decideMutation.mutateAsync({ id: activeRecord.id, decision, note: decisionNote.trim() || undefined });
      openRecord(updated);
      setDecision(null);
      setDecisionNote("");
      message.success(decision === "approve" ? "Biên bản đã được phê duyệt và khóa." : "Biên bản đã bị từ chối và khóa.");
    } catch (error) {
      message.error(getErrorMessage(error, "Không thể ký quyết định go-live."));
    }
  };

  const updateStep = (index: number, patch: Partial<EditableStep>) => {
    setEditableSteps((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step));
  };

  return (
    <div className="space-y-5">
      <Alert
        showIcon
        type={automaticReady ? "success" : "error"}
        message={automaticReady ? "Hạ tầng và 7 job đều sẵn sàng" : "Chưa đủ điều kiện kỹ thuật để go-live"}
        description="Mọi health component bắt buộc phải UP; đủ 7 job phải từng chạy OK và không stale. NEVER_RUN, ERROR hoặc stale đều cần được điều tra trước khi ký biên bản."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentCard className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            {checks.overallHealthy ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
            <h2 className="font-semibold text-slate-900">Kiểm tra tự động</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"><span>Overall health</span><Tag color={checks.overallHealthy ? "success" : "error"}>{status?.overallHealth || (loading ? "LOADING" : "MISSING")}</Tag></div>
            {checks.components.map((component) => <div key={component.key} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"><span>{component.label}</span><Tag color={component.status === "UP" ? "success" : "error"}>{component.status}</Tag></div>)}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"><span>Catalog 7 job, đều OK và không stale</span><Tag color={checks.jobsHealthy ? "success" : "error"}>{checks.jobsHealthy ? "OK" : checks.jobsRecorded ? "CẦN KIỂM TRA" : "THIẾU CATALOG"}</Tag></div>
          </div>
        </ContentCard>

        <ContentCard className="space-y-4 p-5">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Nguyên tắc bảo mật bắt buộc</h2></div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>HR không có `employees:pii:read` phải nhận `piiMasked=true`; JSON và Excel đều che PII.</li>
            <li>Token có quyền ở tenant A gọi URL tenant B phải bị Backend từ chối 403/404.</li>
            <li>Audit employee create/update phải có actor, request ID và old/new value đã redact.</li>
            <li>Không có nút “xem nguyên bản” hoặc logic tự giải che ở Web.</li>
          </ul>
        </ContentCard>
      </div>

      {!canManage ? (
        <Alert showIcon type="warning" message="Bạn chỉ có quyền xem System Health" description="Cần quyền golive:manage để xem và ký biên bản go-live." />
      ) : (
        <>
          <ContentCard className="space-y-4 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><h2 className="flex items-center gap-2 font-semibold text-slate-900"><FileSignature className="h-5 w-5 text-blue-600" />Biên bản go-live đã lưu</h2><p className="mt-1 text-sm text-slate-500">APPROVED/REJECTED là trạng thái cuối và không thể sửa hoặc xóa.</p></div>
              <div className="flex flex-wrap gap-2"><BaseSelect allowClear showSearch optionFilterProp="label" className="w-56" placeholder="Tất cả tenant" value={tenantFilter} options={(tenantsQuery.data?.content || []).map((tenant) => ({ value: tenant.id, label: tenant.name }))} onChange={(value) => { setTenantFilter(value); setRecordPage(0); }} /><BaseSelect allowClear className="w-44" placeholder="Tất cả trạng thái" value={statusFilter} options={["DRAFT", "APPROVED", "REJECTED"].map((value) => ({ value, label: value }))} onChange={(value) => { setStatusFilter(value); setRecordPage(0); }} /><BaseButton icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Tạo biên bản</BaseButton></div>
            </div>
            {recordsQuery.isError && <Alert showIcon type="error" message="Không thể tải biên bản" description={getErrorMessage(recordsQuery.error, "Vui lòng thử lại.")} />}
            <div className="grid gap-3 lg:grid-cols-2">
              {(recordsQuery.data?.content || []).map((record) => (
                <button key={record.id} type="button" onClick={() => openRecord(record)} className={`rounded-lg border p-4 text-left transition hover:border-blue-300 ${activeRecord?.id === record.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{record.tenantName}</p><p className="text-xs text-slate-500">{record.environment} · {record.buildVersion}</p></div><Tag color={recordColor(record.status)}>{record.status}</Tag></div>
                  <p className="mt-2 text-xs text-slate-500">Kiểm tra bởi {record.performedByName} · {new Date(record.startedAt).toLocaleString("vi-VN")}</p>
                </button>
              ))}
              {!recordsQuery.isLoading && !recordsQuery.data?.content.length && <p className="text-sm text-slate-500">Chưa có biên bản phù hợp.</p>}
            </div>
            {(recordsQuery.data?.totalElements || 0) > 20 && <div className="flex justify-end"><Pagination current={recordPage + 1} pageSize={20} total={recordsQuery.data?.totalElements || 0} showSizeChanger={false} onChange={(page) => setRecordPage(page - 1)} /></div>}
          </ContentCard>

          {activeRecord && (
            <ContentCard className="space-y-4 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><h2 className="flex items-center gap-2 font-semibold text-slate-900"><ClipboardCheck className="h-5 w-5 text-blue-600" />{activeRecord.tenantName} · {activeRecord.buildVersion}</h2><p className="mt-1 text-sm text-slate-500">{activeRecord.environment} · người thực hiện {activeRecord.performedByName}</p></div>
                <Tag color={recordColor(activeRecord.status)}>{activeRecord.status}</Tag>
              </div>
              {readOnly && <Alert showIcon type={activeRecord.status === "APPROVED" ? "success" : "error"} message="Biên bản chính thức đã khóa" description={`${activeRecord.approvedByName || "Người phê duyệt"} · ${activeRecord.approvedAt ? new Date(activeRecord.approvedAt).toLocaleString("vi-VN") : "—"}${activeRecord.approvalNote ? ` · ${activeRecord.approvalNote}` : ""}`} />}
              <Progress percent={percent} status={percent === 100 ? "success" : "active"} />
              <div className="space-y-3">
                {editableSteps.map((step, index) => (
                  <div key={`${step.stepName}-${index}`} className="rounded-lg border border-slate-200 p-3">
                    <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_150px_minmax(220px,0.8fr)_minmax(220px,0.8fr)] xl:items-start">
                      <p className="text-sm leading-6 text-slate-700"><strong>Bước {index + 1}.</strong> {step.stepName}</p>
                      <Select aria-label={`Kết quả bước ${index + 1}`} disabled={readOnly} placeholder="Chọn kết quả" value={step.result || undefined} options={["PASS", "FAIL", "SKIP"].map((value) => ({ value, label: value }))} onChange={(result) => updateStep(index, { result })} />
                      <Input aria-label={`Ghi chú bước ${index + 1}`} disabled={readOnly} value={step.note || ""} placeholder="Ghi chú (nên có khi FAIL/SKIP)" onChange={(event) => updateStep(index, { note: event.target.value })} />
                      <Input aria-label={`Bằng chứng bước ${index + 1}`} disabled={readOnly} value={step.evidenceUrl || ""} placeholder="URL bằng chứng" onChange={(event) => updateStep(index, { evidenceUrl: event.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
              {!readOnly && <div className="flex flex-wrap justify-end gap-2"><BaseButton type="default" loading={updateMutation.isPending} onClick={() => void saveSteps(false)}>Lưu nháp</BaseButton><BaseButton loading={updateMutation.isPending} disabled={!allStepsCompleted} onClick={() => void saveSteps(true)}>Hoàn tất checklist</BaseButton><BaseButton danger type="default" onClick={() => setDecision("reject")}>Từ chối</BaseButton><BaseButton disabled={!activeRecord.completedAt || !allStepsCompleted} onClick={() => setDecision("approve")}>Phê duyệt</BaseButton></div>}
              {!readOnly && !automaticReady && <Alert showIcon type="warning" message="Health/job chưa được xác nhận đầy đủ" description="Kiểm tra tín hiệu vận hành trước khi phê duyệt. Backend không ép điều kiện này nên Web cảnh báo nhưng không tự thay đổi contract phê duyệt." />}
            </ContentCard>
          )}
        </>
      )}

      <Modal title="Tạo biên bản go-live" open={createOpen} confirmLoading={createMutation.isPending} okText="Tạo DRAFT" cancelText="Hủy" onOk={() => void createRecord()} onCancel={() => setCreateOpen(false)}>
        <div className="space-y-4 pt-3"><div><label className="mb-1 block text-sm font-medium">Tenant</label>{tenantsQuery.isError ? <><BaseInput aria-label="Tenant go-live" value={tenantId || ""} placeholder="Nhập UUID tenant" onChange={(event) => setTenantId(event.target.value)} /><p className="mt-1 text-xs text-amber-600">Tài khoản không đọc được tenant directory; nhập UUID tenant từ yêu cầu triển khai.</p></> : <BaseSelect aria-label="Tenant go-live" showSearch optionFilterProp="label" value={tenantId} options={(tenantsQuery.data?.content || []).map((tenant) => ({ value: tenant.id, label: `${tenant.name} (${tenant.slug})` }))} onChange={setTenantId} placeholder="Chọn tenant" />}</div><div><label className="mb-1 block text-sm font-medium">Môi trường</label><BaseSelect aria-label="Môi trường go-live" value={environment} options={["production", "staging", "uat"].map((value) => ({ value, label: value }))} onChange={setEnvironment} /></div><div><label className="mb-1 block text-sm font-medium">Build version</label><BaseInput aria-label="Build version" value={buildVersion} placeholder="Ví dụ: 2026.08.06-1" onChange={(event) => setBuildVersion(event.target.value)} /></div></div>
      </Modal>

      <Modal title={decision === "approve" ? "Phê duyệt go-live" : "Từ chối go-live"} open={Boolean(decision)} confirmLoading={decideMutation.isPending} okButtonProps={{ danger: decision === "reject" }} okText={decision === "approve" ? "Phê duyệt và khóa" : "Từ chối và khóa"} cancelText="Hủy" onOk={() => void submitDecision()} onCancel={() => setDecision(null)}>
        <Alert className="mb-4" showIcon type="warning" message="Quyết định này là bất biến" description="Sau khi ký, checklist không thể sửa, ký lại hoặc xóa. Nên áp dụng maker-checker: người phê duyệt khác người thực hiện. Nếu cần chạy lại phải tạo biên bản mới." />
        <Input.TextArea rows={4} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Ghi chú phê duyệt/từ chối" />
      </Modal>
    </div>
  );
}
