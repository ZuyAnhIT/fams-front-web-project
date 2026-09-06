"use client";

import { Alert, Progress, Spin, Table, Tabs, Tag } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { Activity, Building2, CircleDollarSign, CreditCard, RefreshCcw, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend,
  Line, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { useCustomerHealthReport, useRevenueReport } from "../hooks/use-analytics";
import type { PlatformAnalyticsFilters, TenantHealth } from "../types/analytics.type";
import AnalyticsDateFilter, { type DateRangeValue } from "./AnalyticsDateFilter";
import AnalyticsKpi from "./AnalyticsKpi";
import { BaseSelect } from "@/components/ui";
import { usePlans } from "@/features/admin/subscription/hooks/use-subscription";
import { useTenants } from "@/features/admin/tenant/hooks/use-tenant";

const colors = ["#2563eb", "#7c3aed", "#059669", "#f59e0b", "#e11d48", "#64748b"];
const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
const statusLabel: Record<string, string> = { TRIAL: "Dùng thử", ACTIVE: "Hoạt động", EXPIRED: "Hết hạn", CANCELLED: "Đã hủy", PAID: "Thành công", PENDING: "Chờ thanh toán", PROCESSING: "Đang xử lý", FAILED: "Thất bại", UNDERPAID: "Thiếu tiền" };

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p><div className="mt-5 h-72">{children}</div></section>;
}

function RevenuePanel({ range, filters }: { range: DateRangeValue; filters: PlatformAnalyticsFilters }) {
  const [expiryDays, setExpiryDays] = useState(30);
  const report = useRevenueReport(range.from, range.to, expiryDays, filters);
  if (report.isLoading) return <div className="flex h-80 items-center justify-center"><Spin size="large" /></div>;
  if (report.isError || !report.data) return <Alert type="error" showIcon title="Không thể tải báo cáo doanh thu" />;
  const data = report.data;
  const subscriptionData = Object.entries(data.subscriptionStatus).map(([name, value]) => ({ name: statusLabel[name] || name, value }));
  const paymentData = Object.entries(data.paymentStatus).map(([name, value]) => ({ name: statusLabel[name] || name, value }));
  const funnel = [
    { stage: "Bắt đầu Trial", value: data.funnel.trial }, { stage: "Thanh toán", value: data.funnel.paid },
    { stage: "Kích hoạt", value: data.funnel.activated }, { stage: "Gia hạn", value: data.funnel.renewed },
  ];
  return <div className="space-y-5">
    <Alert type="info" showIcon title="Doanh thu thực thu và MRR là hai chỉ số độc lập" description="Thực thu ghi nhận toàn bộ tiền đã nhận trong kỳ. MRR là giá trị thuê bao đang hoạt động quy đổi theo tháng; gói năm được chia 12 và không cộng toàn bộ hợp đồng vào MRR tháng." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AnalyticsKpi title="Doanh thu thực thu" value={money(data.kpis.collectedRevenue)} note={`${range.from} – ${range.to}`} icon={CircleDollarSign} tone="emerald" />
      <AnalyticsKpi title="MRR hiện tại" value={money(data.kpis.currentMrr)} note="Doanh thu định kỳ/tháng" icon={TrendingUp} />
      <AnalyticsKpi title="Chuyển đổi Trial" value={`${data.kpis.trialConversionRate}%`} note="Trial → trả phí" icon={RefreshCcw} tone="violet" />
      <AnalyticsKpi title="Tỷ lệ thanh toán" value={`${data.kpis.paymentSuccessRate}%`} note={`ARPA ${money(data.kpis.averageRevenuePerCompany)}`} icon={CreditCard} tone="amber" />
      <AnalyticsKpi title="Tỷ lệ gia hạn" value={`${data.kpis.renewalRate}%`} icon={TrendingUp} tone="emerald" />
      <AnalyticsKpi title="Tỷ lệ rời bỏ" value={`${data.kpis.churnRate}%`} icon={TrendingDown} tone="rose" />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Thực thu và MRR theo tháng" description="Cột: tiền thực nhận · Đường: MRR quy đổi">
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} /><Tooltip formatter={(v) => money(Number(v))} /><Legend /><Bar dataKey="collectedRevenue" name="Thực thu" fill="#2563eb" radius={[6, 6, 0, 0]} /><Line dataKey="mrr" name="MRR" stroke="#e11d48" strokeWidth={3} /></ComposedChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Cơ cấu thuê bao" description="Trạng thái subscription hiện tại">
        <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={subscriptionData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={3} label>{subscriptionData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Doanh thu theo gói" description="So sánh thực thu và số thuê bao active">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={data.byPlan}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="planName" /><YAxis yAxisId="money" tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} /><YAxis yAxisId="count" orientation="right" /><Tooltip formatter={(v, name) => name === "Thực thu" ? money(Number(v)) : Number(v)} /><Legend /><Bar yAxisId="money" dataKey="collectedRevenue" name="Thực thu" fill="#7c3aed" /><Bar yAxisId="count" dataKey="activeSubscriptions" name="Thuê bao active" fill="#10b981" /></BarChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Phễu chuyển đổi" description="Từ đăng ký dùng thử đến gia hạn">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={funnel} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="stage" width={105} /><Tooltip /><Bar dataKey="value" name="Số công ty" fill="#2563eb" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Kết quả thanh toán" description="Thành công, đang xử lý, thất bại, hết hạn hoặc hủy trong kỳ">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={paymentData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="Số giao dịch" fill="#0f766e" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </ChartCard>
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold text-slate-900">Thuê bao sắp hết hạn trong {expiryDays} ngày</h3><p className="text-sm text-slate-500">Danh sách cần liên hệ gia hạn, sắp xếp theo ngày hết hạn gần nhất.</p></div><BaseSelect aria-label="Cửa sổ thuê bao sắp hết hạn" className="w-44" value={expiryDays} onChange={setExpiryDays} options={[{ value: 7, label: "Trong 7 ngày" }, { value: 15, label: "Trong 15 ngày" }, { value: 30, label: "Trong 30 ngày" }]} /></div><Table rowKey="tenantId" size="small" pagination={{ pageSize: 8 }} dataSource={data.expiringSubscriptions} columns={[
      { title: "Công ty", dataIndex: "tenantName", render: (name: string, row) => <Link className="font-semibold text-blue-700" href={`/admin/tenants/${row.tenantId}`}>{name}</Link> },
      { title: "Gói", dataIndex: "planName" }, { title: "Chu kỳ", dataIndex: "billingCycle", render: (v: string) => v === "YEARLY" ? "Năm" : "Tháng" },
      { title: "Hết hạn", dataIndex: "expiresAt", render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
      { title: "Còn lại", dataIndex: "daysRemaining", render: (v: number) => <Tag color={v <= 7 ? "error" : v <= 15 ? "warning" : "processing"}>{v} ngày</Tag> },
    ]} /></section>
  </div>;
}

function HealthPanel({ range, filters }: { range: DateRangeValue; filters: PlatformAnalyticsFilters }) {
  const report = useCustomerHealthReport(range.from, range.to, filters);
  if (report.isLoading) return <div className="flex h-80 items-center justify-center"><Spin size="large" /></div>;
  if (report.isError || !report.data) return <Alert type="error" showIcon title="Không thể tải báo cáo sức khỏe khách hàng" />;
  const data = report.data;
  const moduleNames: Record<string, string> = { checkins: "Chấm công", faceId: "Face ID", randomChecks: "Random check", reports: "Báo cáo/Export" };
  const modules = Object.entries(data.moduleUsage).map(([name, value]) => ({ name: moduleNames[name] || name, value }));
  const tenantColumns = [
    { title: "Công ty", dataIndex: "tenantName", render: (name: string, row: TenantHealth) => <Link className="font-semibold text-blue-700" href={`/admin/tenants/${row.tenantId}`}>{name}</Link> },
    { title: "Gói", dataIndex: "planName" },
    { title: "Sức khỏe", dataIndex: "healthScore", render: (v: number) => <div className="min-w-28"><Progress percent={v} size="small" strokeColor={v < 50 ? "#e11d48" : v < 75 ? "#f59e0b" : "#10b981"} /></div> },
    { title: "Không hoạt động", dataIndex: "inactiveDays", render: (v: number) => `${v} ngày` },
    { title: "Khuyến nghị", dataIndex: "recommendedAction" },
  ];
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AnalyticsKpi title="Tổng công ty" value={data.kpis.totalTenants} note={`+${data.kpis.newTenants} trong kỳ`} icon={Building2} />
      <AnalyticsKpi title="Công ty hoạt động" value={data.kpis.activeTenants} note={`${data.kpis.suspendedTenants} bị khóa/hủy`} icon={Activity} tone="emerald" />
      <AnalyticsKpi title="Người dùng hoạt động 7 ngày" value={data.kpis.activeUsers7d} note={`${data.kpis.activeUsers30d} trong 30 ngày`} icon={Users} tone="violet" />
      <AnalyticsKpi title="Lượt chấm công trong kỳ" value={data.kpis.checkins.toLocaleString("vi-VN")} note={`${data.kpis.employees} nhân viên · ${data.kpis.sites} công trình`} icon={CreditCard} tone="amber" />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Tăng trưởng công ty và người dùng" description="Theo tháng trong khoảng đã chọn"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.growth}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Legend /><Area type="monotone" dataKey="newTenants" name="Công ty mới" stroke="#2563eb" fill="#bfdbfe" /><Area type="monotone" dataKey="newUsers" name="Người dùng mới" stroke="#7c3aed" fill="#ddd6fe" /></AreaChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Mức sử dụng tính năng" description="Số sự kiện phát sinh trong kỳ"><ResponsiveContainer width="100%" height="100%"><BarChart data={modules} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /><Tooltip /><Bar dataKey="value" name="Lượt sử dụng" fill="#059669" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Ma trận sức khỏe khách hàng" description="X: % sử dụng gói · Y: lượt chấm công 30 ngày · kích thước theo số nhân viên"><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid /><XAxis type="number" dataKey="maxPlanUsagePercent" name="Sử dụng gói" unit="%" /><YAxis type="number" dataKey="checkins30d" name="Hoạt động 30 ngày" /><Tooltip cursor={{ strokeDasharray: "3 3" }} /><Scatter data={data.tenantsAtRisk.concat(data.tenantsNearPlanLimit)} fill="#e11d48" /></ScatterChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Công ty không hoạt động" description="Phân nhóm theo số ngày không phát sinh hoạt động"><ResponsiveContainer width="100%" height="100%"><BarChart data={Object.entries(data.inactivityBuckets).map(([name, value]) => ({ name, value }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="Công ty" fill="#f59e0b" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
    </div>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">Cảnh báo khách hàng cần hành động</h3><p className="mb-4 mt-1 text-sm text-slate-500">Điểm thấp kết hợp mức độ hoạt động, thanh toán, sử dụng gói và lần hoạt động gần nhất.</p><Table rowKey="tenantId" size="small" pagination={{ pageSize: 8 }} dataSource={data.tenantsAtRisk} columns={tenantColumns} /></section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-900">Công ty gần chạm giới hạn gói</h3><Table className="mt-4" rowKey="tenantId" size="small" pagination={{ pageSize: 8 }} dataSource={data.tenantsNearPlanLimit} columns={[...tenantColumns.slice(0, 2), { title: "Sử dụng cao nhất", dataIndex: "maxPlanUsagePercent", render: (v: number) => <Tag color={v >= 100 ? "error" : "warning"}>{v.toFixed(1)}%</Tag> }, tenantColumns[4]]} /></section>
  </div>;
}

export default function PlatformAnalyticsDashboard() {
  const [range, setRange] = useState<DateRangeValue>({ from: dayjs().subtract(11, "month").startOf("month").format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") });
  const [filters, setFilters] = useState<PlatformAnalyticsFilters>({});
  const tenants = useTenants({ page: 0, size: 100, sortBy: "name", sortDir: "asc" });
  const plans = usePlans(false, { page: 0, size: 100 });
  return <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Báo cáo điều hành nền tảng</h2><p className="mt-1 text-sm text-slate-500">Doanh thu, thuê bao, tăng trưởng và cảnh báo khách hàng cần hành động.</p></div><AnalyticsDateFilter value={range} onChange={setRange} /></div>
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
      <BaseSelect aria-label="Lọc báo cáo theo công ty" allowClear showSearch optionFilterProp="label" placeholder="Tất cả công ty" value={filters.tenantId} onChange={(tenantId) => setFilters((current) => ({ ...current, tenantId }))} options={(tenants.data?.content ?? []).map((tenant) => ({ value: tenant.id, label: tenant.name }))} />
      <BaseSelect aria-label="Lọc báo cáo theo gói" allowClear showSearch optionFilterProp="label" placeholder="Tất cả gói" value={filters.planId} onChange={(planId) => setFilters((current) => ({ ...current, planId }))} options={(plans.data?.content ?? []).map((plan) => ({ value: plan.id, label: plan.displayName }))} />
      <BaseSelect aria-label="Lọc báo cáo theo trạng thái thuê bao" allowClear placeholder="Tất cả trạng thái thuê bao" value={filters.subscriptionStatus} onChange={(subscriptionStatus) => setFilters((current) => ({ ...current, subscriptionStatus }))} options={[{ value: "TRIAL", label: "Dùng thử" }, { value: "ACTIVE", label: "Hoạt động" }, { value: "EXPIRED", label: "Hết hạn" }, { value: "CANCELLED", label: "Đã hủy" }]} />
    </div><Tabs items={[
    { key: "revenue", label: "Doanh thu & gói dịch vụ", children: <RevenuePanel range={range} filters={filters} /> },
    { key: "health", label: "Tăng trưởng & sức khỏe khách hàng", children: <HealthPanel range={range} filters={filters} /> },
  ]} /></section>;
}
