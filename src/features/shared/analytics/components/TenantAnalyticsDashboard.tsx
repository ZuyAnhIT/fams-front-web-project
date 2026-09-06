"use client";

import { Alert, Progress, Spin, Table, Tabs, Tag } from "antd";
import dayjs from "dayjs";
import { AlertTriangle, Clock3, ShieldCheck, Timer, UserCheck, UserX, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BaseSelect } from "@/components/ui";
import { CUSTOMER_ROUTES } from "@/constants/routes";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { useShiftsQuery } from "@/features/customer/shift/hooks/use-shift";
import { useWorkspacesQuery } from "@/features/customer/workspace/hooks/use-workspace";
import { useRiskReport, useWorkforceReport } from "../hooks/use-analytics";
import type { AnalyticsFilters, RiskReport, WorkforceReport } from "../types/analytics.type";
import AnalyticsDateFilter, { type DateRangeValue } from "./AnalyticsDateFilter";
import AnalyticsKpi from "./AnalyticsKpi";

const chartColors = ["#e11d48", "#f59e0b", "#7c3aed", "#2563eb", "#059669", "#64748b"];
const violationLabels: Record<string, string> = {
  no_response: "Không phản hồi", location_fail: "Sai vị trí", face_fail: "Face ID",
  liveness_fail: "Liveness", face_verify_timeout: "AI quá hạn",
};

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p><div className="mt-5 h-72">{children}</div></section>;
}

function ReportLoading() {
  return <div className="flex h-80 items-center justify-center" role="status"><Spin size="large" /></div>;
}

function comparisonNote(value: number, label: string) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}% ${label}`;
}

function WorkforcePanel({ report, openAttendance }: { report: WorkforceReport; openAttendance: (filters?: { date?: string; siteId?: string }) => void }) {
  const clickDate = (event: unknown) => {
    const date = (event as { activeLabel?: string } | undefined)?.activeLabel;
    if (date) openAttendance({ date });
  };
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AnalyticsKpi title="Tỷ lệ đi làm" value={`${report.kpis.attendanceRate}%`} change={report.comparison.attendanceRateChange} note="so với kỳ trước" icon={UserCheck} tone="emerald" />
      <AnalyticsKpi title="Tỷ lệ vắng" value={`${report.kpis.absenceRate}%`} change={report.comparison.absenceRateChange} note="so với kỳ trước" icon={UserX} tone="rose" />
      <AnalyticsKpi title="Đi muộn / về sớm" value={`${report.kpis.lateRate}% / ${report.kpis.earlyLeaveRate}%`} note={`${report.kpis.missingCheckoutRate}% thiếu check-out`} icon={Clock3} tone="amber" />
      <AnalyticsKpi title="Tổng giờ / OT" value={`${Math.round(report.kpis.totalWorkMinutes / 60)}h / ${Math.round(report.kpis.totalOtMinutes / 60)}h`} note={`${(report.kpis.averageWorkMinutesPerEmployee / 60).toFixed(1)}h/người · ${comparisonNote(report.comparison.otMinutesChange, "OT")}`} icon={Timer} tone="violet" />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Có mặt, đi muộn và vắng theo ngày" description="Bấm vào một ngày để mở danh sách chấm công tương ứng.">
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={report.dailyTrend} onClick={clickDate} className="cursor-pointer"><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(v) => dayjs(v).format("DD/MM")} /><YAxis allowDecimals={false} /><Tooltip labelFormatter={(v) => dayjs(String(v)).format("DD/MM/YYYY")} /><Legend /><Line type="monotone" dataKey="present" name="Có mặt" stroke="#059669" strokeWidth={3} /><Line type="monotone" dataKey="late" name="Đi muộn" stroke="#f59e0b" strokeWidth={2} /><Line type="monotone" dataKey="absent" name="Vắng" stroke="#e11d48" strokeWidth={2} /></ComposedChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Giờ làm thường và OT theo công trình" description="So sánh tổng giờ phát sinh trong kỳ.">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={report.bySite}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="siteName" /><YAxis tickFormatter={(v) => `${Math.round(Number(v) / 60)}h`} /><Tooltip formatter={(v) => `${(Number(v) / 60).toFixed(1)} giờ`} /><Legend /><Bar stackId="hours" dataKey="workMinutes" name="Giờ làm" fill="#2563eb" /><Bar stackId="hours" dataKey="otMinutes" name="OT" fill="#f59e0b" /></BarChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Thiếu người theo ngày trong tuần" description="Tỷ lệ vắng trên tổng số lượt được phân công.">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={report.shortageByWeekday}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="weekday" /><YAxis unit="%" /><Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} /><Bar dataKey="absenceRate" name="Tỷ lệ vắng" fill="#e11d48" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Hiệu quả theo công trình" description="Tỷ lệ có mặt giúp nhận diện nơi thiếu nhân sự.">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={report.bySite} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" unit="%" /><YAxis type="category" dataKey="siteName" width={115} /><Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} /><Bar dataKey="attendanceRate" name="Tỷ lệ có mặt" fill="#059669" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
      </ChartCard>
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">Công trình cần chú ý</h3><p className="mb-4 mt-1 text-sm text-slate-500">Sắp xếp theo tỷ lệ có mặt thấp nhất; bấm xem để drill-down.</p><Table rowKey="siteId" size="small" pagination={false} dataSource={[...report.bySite].sort((a, b) => a.attendanceRate - b.attendanceRate)} columns={[
      { title: "Công trình", dataIndex: "siteName" },
      { title: "Được phân công", dataIndex: "assigned" },
      { title: "Có mặt", dataIndex: "present" },
      { title: "Vắng", dataIndex: "absent", render: (v: number) => <Tag color={v ? "error" : "success"}>{v}</Tag> },
      { title: "Tỷ lệ", dataIndex: "attendanceRate", render: (v: number) => <Progress percent={v} size="small" /> },
      { title: "Thao tác", key: "action", render: (_, row) => <button className="font-semibold text-blue-700" onClick={() => openAttendance({ siteId: row.siteId })} type="button">Xem chấm công</button> },
    ]} /></section>
  </div>;
}

function RiskPanel({ report, openViolations }: { report: RiskReport; openViolations: () => void }) {
  const sortedTypes = Object.entries(report.byType).sort((a, b) => b[1] - a[1]);
  const totalByType = sortedTypes.reduce((sum, [, count]) => sum + count, 0);
  const typeData = sortedTypes.map(([type, count], index) => {
    const cumulativeCount = sortedTypes.slice(0, index + 1).reduce((sum, [, value]) => sum + value, 0);
    return { name: violationLabels[type] || type, count, cumulativePercent: totalByType ? Math.round(cumulativeCount * 1000 / totalByType) / 10 : 0 };
  });
  const agingLabels: Record<string, string> = { under24h: "Dưới 24h", oneToThreeDays: "1–3 ngày", threeToSevenDays: "3–7 ngày", overSevenDays: "Trên 7 ngày" };
  const aging = Object.entries(report.aging).map(([name, value]) => ({ name: agingLabels[name] || name, value }));
  const funnel = [
    { stage: "Phát hiện", value: report.funnel.detected }, { stage: "Giải trình", value: report.funnel.explained },
    { stage: "Đã duyệt", value: report.funnel.reviewed }, { stage: "Xác nhận", value: report.funnel.confirmed },
    { stage: "Bác bỏ", value: report.funnel.dismissed },
  ];
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AnalyticsKpi title="Vi phạm / 100 lượt công" value={report.kpis.violationsPer100Checkins} note={`${report.kpis.attendanceImpactViolations}/${report.kpis.violations} ảnh hưởng bảng công`} icon={AlertTriangle} tone="rose" />
      <AnalyticsKpi title="Chưa xử lý / quá hạn" value={`${report.kpis.unresolved} / ${report.kpis.overdue}`} note="Quá hạn trên 24 giờ" icon={Clock3} tone="amber" />
      <AnalyticsKpi title="Đạt random check" value={`${report.kpis.randomCheckPassRate}%`} note={`${report.kpis.faceEnrollmentRate}% đã đăng ký Face ID`} icon={ShieldCheck} tone="emerald" />
      <AnalyticsKpi title="Thời gian xử lý" value={`${report.kpis.averageResolutionHours}h`} note={`Trung vị ${report.kpis.medianResolutionHours}h · chấp nhận GT ${report.kpis.acceptedExplanationRate}%`} icon={Timer} tone="violet" />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Xu hướng vi phạm theo loại" description="Stacked Area thể hiện cơ cấu nguyên nhân qua thời gian.">
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={pivotRiskTrend(report)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(v) => dayjs(v).format("DD/MM")} /><YAxis allowDecimals={false} /><Tooltip labelFormatter={(v) => dayjs(String(v)).format("DD/MM/YYYY")} /><Legend />{Object.keys(report.byType).map((type, index) => <Area key={type} stackId="risk" type="monotone" dataKey={type} name={violationLabels[type] || type} stroke={chartColors[index % chartColors.length]} fill={chartColors[index % chartColors.length]} />)}</AreaChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Pareto nguyên nhân vi phạm" description="Cột: số vi phạm · Đường: tỷ lệ tích lũy để ưu tiên nhóm nguyên nhân chính.">
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={typeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis yAxisId="count" allowDecimals={false} /><YAxis yAxisId="percent" orientation="right" domain={[0, 100]} unit="%" /><Tooltip /><Legend /><Bar yAxisId="count" dataKey="count" name="Vi phạm" fill="#e11d48" radius={[6, 6, 0, 0]} /><Line yAxisId="percent" type="monotone" dataKey="cumulativePercent" name="Tích lũy" stroke="#2563eb" strokeWidth={3} /></ComposedChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Tuổi tồn đọng" description="Thời gian các vi phạm chưa được xử lý.">
        <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={aging} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} label>{aging.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Luồng xử lý vi phạm" description="Phát hiện → giải trình → xét duyệt → kết quả.">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={funnel} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="stage" width={90} /><Tooltip /><Bar dataKey="value" name="Hồ sơ" fill="#7c3aed" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
      </ChartCard>
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">Điểm nóng rủi ro</h3><p className="mt-1 text-sm text-slate-500">Chuẩn hóa trên 100 lượt chấm công để so sánh công bằng.</p></div><button type="button" className="font-semibold text-blue-700" onClick={openViolations}>Xử lý vi phạm</button></div><Table className="mt-4" rowKey={(row) => `${row.siteId}-${row.violationType}`} size="small" pagination={{ pageSize: 6 }} dataSource={report.siteRisk} columns={[
        { title: "Công trình", dataIndex: "siteName" }, { title: "Loại", dataIndex: "violationType", render: (v: string) => violationLabels[v] || v },
        { title: "Số lượng", dataIndex: "count" }, { title: "/100 lượt", dataIndex: "per100Checkins", render: (v: number) => <Tag color={v >= 10 ? "error" : "warning"}>{v}</Tag> },
      ]} /></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">Nhân viên tái phạm</h3><p className="mt-1 text-sm text-slate-500">Danh sách cần xem xét hoặc hỗ trợ trực tiếp.</p><Table className="mt-4" rowKey="employeeId" size="small" pagination={{ pageSize: 6 }} dataSource={report.repeatOffenders} columns={[
        { title: "Nhân viên", dataIndex: "employeeName" }, { title: "Mã NV", dataIndex: "employeeCode", render: (v?: string) => v || "—" },
        { title: "Vi phạm", dataIndex: "violations" }, { title: "Chưa xử lý", dataIndex: "unresolved", render: (v: number) => <Tag color={v ? "error" : "success"}>{v}</Tag> },
      ]} /></section>
    </div>
  </div>;
}

function pivotRiskTrend(report: RiskReport): Array<Record<string, string | number>> {
  const rows = new Map<string, Record<string, string | number>>();
  report.trend.forEach((point) => {
    const row = rows.get(point.date) || { date: point.date };
    row[point.violationType] = point.count;
    rows.set(point.date, row);
  });
  return [...rows.values()];
}

export default function TenantAnalyticsDashboard({ tenantId, siteId }: { tenantId: string; siteId?: string }) {
  const router = useRouter();
  const [range, setRange] = useState<DateRangeValue>({ from: dayjs().subtract(29, "day").format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") });
  const [workspaceId, setWorkspaceId] = useState<string>();
  const [shiftId, setShiftId] = useState<string>();
  const [employeeId, setEmployeeId] = useState<string>();
  const filters = useMemo<AnalyticsFilters>(() => ({ ...range, siteId, workspaceId, shiftId, employeeId }), [employeeId, range, shiftId, siteId, workspaceId]);
  const workforce = useWorkforceReport(tenantId, filters);
  const risk = useRiskReport(tenantId, filters);
  const { data: workspacePage } = useWorkspacesQuery({ tenantId, status: "active", size: 100 });
  const { data: shiftPage } = useShiftsQuery(tenantId, siteId || "", { page: 0, size: 100 });
  const { data: employeePage } = useEmployees({ page: 0, size: 100, sortBy: "firstName", sortDir: "asc" }, { enabled: Boolean(tenantId) });
  const employees = employeePage?.content ?? [];
  const shifts = shiftPage?.content ?? [];
  const queryString = (extra?: Record<string, string>) => {
    const params = new URLSearchParams({ tab: "checkins", from: range.from, to: range.to });
    if (siteId) params.set("siteId", siteId);
    if (workspaceId) params.set("workspaceId", workspaceId);
    if (shiftId) params.set("shiftId", shiftId);
    if (employeeId) params.set("employeeId", employeeId);
    Object.entries(extra || {}).forEach(([key, value]) => params.set(key, value));
    return params.toString();
  };

  const workforceContent = workforce.isLoading ? <ReportLoading /> : workforce.isError || !workforce.data
    ? <Alert type="error" showIcon title="Không thể tải báo cáo hiệu quả nhân sự" />
    : <WorkforcePanel report={workforce.data} openAttendance={(drilldown) => router.push(`${CUSTOMER_ROUTES.ATTENDANCE}?${queryString({
      ...(drilldown?.date ? { from: drilldown.date, to: drilldown.date } : {}),
      ...(drilldown?.siteId ? { siteId: drilldown.siteId } : {}),
    })}`)} />;
  const riskContent = risk.isLoading ? <ReportLoading /> : risk.isError || !risk.data
    ? <Alert type="error" showIcon title="Không thể tải báo cáo rủi ro và tuân thủ" />
    : <RiskPanel report={risk.data} openViolations={() => router.push(`${CUSTOMER_ROUTES.VIOLATIONS}?${queryString()}`)} />;

  return <section className="space-y-4" aria-labelledby="tenant-analytics-title">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="tenant-analytics-title" className="text-xl font-bold text-slate-900">Báo cáo điều hành công ty</h2><p className="mt-1 text-sm text-slate-500">Hiệu quả nhân sự, chấm công và cảnh báo tuân thủ có thể drill-down.</p></div><AnalyticsDateFilter value={range} onChange={setRange} /></div>
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
      <BaseSelect aria-label="Lọc báo cáo theo workspace" allowClear showSearch optionFilterProp="label" placeholder="Tất cả workspace" value={workspaceId} onChange={setWorkspaceId} options={(workspacePage?.data?.content ?? []).map((workspace) => ({ value: workspace.id, label: workspace.name }))} />
      <BaseSelect aria-label="Lọc báo cáo theo ca" allowClear showSearch optionFilterProp="label" disabled={!siteId} placeholder={siteId ? "Tất cả ca" : "Chọn công trình để lọc ca"} value={shiftId} onChange={setShiftId} options={shifts.map((shift) => ({ value: shift.id, label: `${shift.name} (${shift.startTime}–${shift.endTime})` }))} />
      <BaseSelect aria-label="Lọc báo cáo theo nhân viên" allowClear showSearch optionFilterProp="label" placeholder="Tất cả nhân viên" value={employeeId} onChange={setEmployeeId} options={employees.map((employee) => ({ value: employee.id, label: `${employee.fullName || `${employee.lastName} ${employee.firstName}`} · ${employee.employeeCode || "Chưa có mã"}` }))} />
    </div>
    <Tabs items={[
      { key: "workforce", label: <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />Hiệu quả nhân sự & chấm công</span>, children: workforceContent },
      { key: "risk", label: <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Rủi ro & tuân thủ</span>, children: riskContent },
    ]} />
  </section>;
}
