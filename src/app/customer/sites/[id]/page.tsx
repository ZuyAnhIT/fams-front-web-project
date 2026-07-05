"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useSiteDetailQuery } from "@/features/customer/site/hooks/use-site";
import { useAssignments } from "@/features/customer/assignment/hooks/use-assignments";
import { useCancelAssignmentMutation } from "@/features/customer/assignment/hooks/use-assignment";
import { AssignmentResponse } from "@/features/customer/assignment/types/assignment.type";
import AssignmentFormModal from "@/features/customer/assignment/components/AssignmentFormModal";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { GeofenceMap } from "@/features/customer/site/components/GeofenceMap";
import { useGeofenceHistoryQuery } from "@/features/customer/geofence/hooks/use-geofence";
import EditGeofenceModal from "@/features/customer/geofence/components/EditGeofenceModal";
import { useShiftsQuery } from "@/features/customer/shift/hooks/use-shift";
import ShiftFormModal from "@/features/customer/shift/components/ShiftFormModal";
import ShiftOtConfigModal from "@/features/customer/shift/components/ShiftOtConfigModal";
import { ShiftResponse } from "@/features/customer/shift/types/shift.type";
import { Tabs, Table, Badge, Card, Tag, Button, Spin, Modal, Popconfirm, message, Select, Input } from "antd";
import { ArrowLeftOutlined, ClockCircleOutlined, EnvironmentOutlined, GlobalOutlined, EditOutlined, EyeOutlined, PlusOutlined, SettingOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { GeofenceResponse } from "@/features/customer/site/types/site.type";

export default function SiteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || undefined;

  // Pagination for assignments and history
  const [assignmentPage, setAssignmentPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [shiftPage, setShiftPage] = useState(0);

  // Assignment Filters & Sorting
  const [assignmentFilters, setAssignmentFilters] = useState({
    status: undefined as string | undefined,
    role: undefined as string | undefined,
    shiftId: undefined as string | undefined,
    employeeId: undefined as string | undefined,
  });
  const [assignmentSort, setAssignmentSort] = useState({
    sortBy: "startDate",
    sortDir: "desc" as "asc" | "desc" | undefined,
  });

  // Modals state
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [selectedHistoryGeofence, setSelectedHistoryGeofence] = useState<GeofenceResponse | null>(null);
  
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<ShiftResponse | null>(null);

  // Assignment modal state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<AssignmentResponse | null>(null);
  const cancelAssignmentMutation = useCancelAssignmentMutation();

  // Queries
  const { data: siteDetailRes, isLoading: isSiteLoading } = useSiteDetailQuery(tenantId, siteId);
  const site = siteDetailRes?.data;

  const { data: assignmentsRes, isLoading: isAssignmentsLoading } = useAssignments(
    tenantId || "",
    siteId as string,
    { page: assignmentPage, size: 10, ...assignmentFilters, sortBy: assignmentSort.sortBy, sortDir: assignmentSort.sortDir }
  );
  const assignments = assignmentsRes?.data?.content || [];
  const totalAssignments = assignmentsRes?.data?.totalElements || 0;

  const { data: shiftsRes, isLoading: isShiftsLoading } = useShiftsQuery(
    tenantId,
    siteId,
    { page: shiftPage, size: 10 }
  );
  const shifts = shiftsRes?.content || [];
  const totalShifts = shiftsRes?.totalElements || 0;

  const { data: historyRes, isLoading: isHistoryLoading } = useGeofenceHistoryQuery(
    tenantId,
    siteId,
    { page: historyPage, size: 10 }
  );
  const history = historyRes?.content || [];
  const totalHistory = historyRes?.totalElements || 0;

  // Fetch all employees to map names (simplified for now)
  const { data: employeesRes } = useEmployees({ size: 100 });
  const employees = employeesRes?.content || [];
  const getEmployeeName = (id: string) => {
    const emp = employees.find((e: any) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  const getShiftName = (id: string | null) => {
    if (!id) return "Không cố định";
    const shift = site?.shifts?.find((s) => s.id === id);
    return shift ? shift.name : id;
  };

  if (isSiteLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-xl text-slate-800">Không tìm thấy thông tin công trình.</h1>
      </div>
    );
  }

  // Columns for Shifts Table
  const shiftColumns = [
    {
      title: "Tên ca",
      dataIndex: "name",
      key: "name",
      className: "font-medium text-slate-700",
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_: any, record: any) => (
        <span className="text-slate-600">
          {record.startTime} - {record.endTime}
        </span>
      ),
    },
    {
      title: "Qua đêm",
      dataIndex: "allowOvernight",
      key: "allowOvernight",
      render: (val: boolean) => (val ? <Tag color="blue">Có</Tag> : <Tag color="default">Không</Tag>),
    },
    {
      title: "Tăng ca",
      dataIndex: "allowOvertime",
      key: "allowOvertime",
      render: (val: boolean) => (val ? <Tag color="green">Có</Tag> : <Tag color="default">Không</Tag>),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Badge status={val === "active" ? "success" : "default"} text={val === "active" ? "Đang áp dụng" : "Ngừng áp dụng"} className="text-slate-600" />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: any, record: ShiftResponse) => (
        <div className="flex gap-2">
          <Button 
            type="text" 
            size="small"
            icon={<EditOutlined className="text-blue-500" />} 
            onClick={() => {
              setActiveShift(record);
              setIsShiftModalOpen(true);
            }}
            title="Sửa ca làm việc"
          />
          <Button 
            type="text" 
            size="small"
            icon={<SettingOutlined className="text-purple-500" />} 
            onClick={() => {
              setActiveShift(record);
              setIsOtModalOpen(true);
            }}
            title="Cấu hình OT"
          />
        </div>
      ),
    },
  ];

  // Xử lý hủy phân công
  const handleCancelAssignment = (record: AssignmentResponse) => {
    if (!tenantId) return;
    cancelAssignmentMutation.mutate(
      { tenantId, siteId, assignmentId: record.id },
      {
        onSuccess: () => message.success("Hủy phân công thành công!"),
        onError: (err: any) => message.error(err.response?.data?.message || "Có lỗi xảy ra khi hủy phân công."),
      }
    );
  };

  // Columns for Assignments Table
  const assignmentColumns = [
    {
      title: "Nhân viên",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (val: string) => <span className="font-medium text-slate-700">{getEmployeeName(val)}</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      sorter: true,
      render: (val: string) => (
        <Tag color={val === "supervisor" ? "purple" : "cyan"}>
          {val === "supervisor" ? "Giám sát" : "Nhân viên"}
        </Tag>
      ),
    },
    {
      title: "Ca làm việc",
      dataIndex: "shiftId",
      key: "shiftId",
      render: (val: string | null) => <span className="text-slate-600">{getShiftName(val)}</span>,
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      sorter: true,
      className: "text-slate-600",
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "endDate",
      key: "endDate",
      sorter: true,
      render: (val: string | null) => <span className="text-slate-600">{val || "Vô thời hạn"}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      sorter: true,
      render: (val: string) => (
        <Badge
          status={val === "active" ? "success" : "default"}
          text={val === "active" ? "Đang làm việc" : "Đã hủy"}
          className="text-slate-600"
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: any, record: AssignmentResponse) => (
        <div className="flex gap-2">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => {
              setActiveAssignment(record);
              setIsAssignmentModalOpen(true);
            }}
            title="Sửa phân công"
          />
          {record.status === "active" && (
            <Popconfirm
              title="Xác nhận hủy phân công"
              description="Nhân viên sẽ không thể chấm công tại công trình này nữa. Bạn có chắc chắn?"
              onConfirm={() => handleCancelAssignment(record)}
              okText="Xác nhận hủy"
              cancelText="Không"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined className="text-red-500" />}
                title="Hủy phân công"
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  // Columns for History Table
  const historyColumns = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val: string) => new Date(val).toLocaleString("vi-VN"),
    },
    {
      title: "Bán kính (Buffer)",
      dataIndex: "bufferMeters",
      key: "bufferMeters",
      render: (val: number) => `${val}m`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Badge status={val === "active" ? "success" : "default"} text={val === "active" ? "Đang áp dụng" : "Bị thay thế (Cũ)"} className="text-slate-600" />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: GeofenceResponse) => (
        <Button 
          type="text" 
          icon={<EyeOutlined className="text-blue-500" />} 
          onClick={() => setSelectedHistoryGeofence(record)}
        >
          Xem bản đồ
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined className="text-slate-600" />} 
          onClick={() => router.back()}
          className="hover:bg-slate-100"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 m-0">{site.name}</h1>
            <Badge 
              status={site.status === "active" ? "success" : "default"} 
              text={site.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"} 
              className="text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200" 
            />
          </div>
          {site.code && <p className="text-slate-500 mt-1">Mã công trình: {site.code}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map & Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card 
            className="bg-white border-slate-200 shadow-sm" 
            title={<span className="text-slate-800 font-semibold">Bản đồ khu vực chấm công</span>}
            extra={
              <Button type="link" icon={<EditOutlined />} onClick={() => setIsGeofenceModalOpen(true)}>
                Cập nhật
              </Button>
            }
          >
            {site.latitude && site.longitude ? (
              <GeofenceMap 
                latitude={site.latitude} 
                longitude={site.longitude} 
                polygonCoordinates={site.geofence?.coordinates} 
              />
            ) : (
              <div className="h-[300px] w-full bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                <span className="text-slate-400">Chưa cấu hình tọa độ</span>
              </div>
            )}
            
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 text-slate-600">
                <EnvironmentOutlined className="mt-1 text-blue-500" />
                <div>
                  <div className="font-medium text-slate-700">Địa chỉ</div>
                  <div className="text-sm">{site.address || "Chưa cập nhật"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <GlobalOutlined className="text-green-500" />
                <div>
                  <div className="font-medium text-slate-700">Múi giờ</div>
                  <div className="text-sm">{site.timezone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <ClockCircleOutlined className="text-purple-500" />
                <div>
                  <div className="font-medium text-slate-700">Tọa độ trung tâm</div>
                  <div className="text-sm">{site.latitude}, {site.longitude}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm h-full" bodyStyle={{ padding: '0 24px 24px' }}>
            <Tabs 
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: <span className="text-slate-700 font-medium">Ca làm việc ({totalShifts})</span>,
                  children: (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-slate-500 m-0">Quản lý các ca làm việc tiêu chuẩn áp dụng tại công trình này.</p>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setActiveShift(null);
                            setIsShiftModalOpen(true);
                          }}
                        >
                          Tạo ca làm việc
                        </Button>
                      </div>
                      <Table 
                        dataSource={shifts} 
                        columns={shiftColumns} 
                        rowKey="id"
                        loading={isShiftsLoading}
                        bordered
                        pagination={{
                          current: shiftPage + 1,
                          pageSize: 10,
                          total: totalShifts,
                          onChange: (page) => setShiftPage(page - 1),
                          showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} bản ghi`,
                        }}
                      />
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: <span className="text-slate-700 font-medium">Nhân sự phân công ({totalAssignments})</span>,
                  children: (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setActiveAssignment(null);
                            setIsAssignmentModalOpen(true);
                          }}
                        >
                          Tạo phân công
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Search Input */}
                        <div className="flex flex-col gap-1 lg:col-span-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tìm kiếm</label>
                          <Input
                            placeholder="Tìm kiếm theo tên, mã..."
                            prefix={<SearchOutlined className="text-slate-400" />}
                            allowClear
                            className="w-full"
                            onPressEnter={() => message.info("Chức năng tìm kiếm (search) đang chờ Backend cập nhật API")}
                          />
                        </div>
                        
                        {/* Empty space to force next row on desktop */}
                        <div className="hidden lg:block lg:col-span-2"></div>

                        {/* Filters */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</label>
                          <Select
                            showSearch
                            placeholder="Lọc theo nhân viên..."
                            allowClear
                            className="w-full"
                            value={assignmentFilters.employeeId}
                            onChange={(val) => {
                              setAssignmentFilters(prev => ({ ...prev, employeeId: val || undefined }));
                              setAssignmentPage(0);
                            }}
                            filterOption={(input, option) =>
                              (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                            options={employees.map(emp => ({
                              label: `${emp.firstName} ${emp.lastName} ${emp.employeeCode ? `(${emp.employeeCode})` : ''}`,
                              value: emp.id
                            }))}
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</label>
                          <Select
                            placeholder="Tất cả trạng thái"
                            allowClear
                            className="w-full"
                            value={assignmentFilters.status}
                            onChange={(val) => {
                              setAssignmentFilters(prev => ({ ...prev, status: val || undefined }));
                              setAssignmentPage(0);
                            }}
                            options={[
                              { label: "Đang làm việc", value: "active" },
                              { label: "Đã hủy", value: "cancelled" }
                            ]}
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</label>
                          <Select
                            placeholder="Tất cả vai trò"
                            allowClear
                            className="w-full"
                            value={assignmentFilters.role}
                            onChange={(val) => {
                              setAssignmentFilters(prev => ({ ...prev, role: val || undefined }));
                              setAssignmentPage(0);
                            }}
                            options={[
                              { label: "Nhân viên", value: "worker" },
                              { label: "Giám sát", value: "supervisor" }
                            ]}
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ca làm việc</label>
                          <Select
                            placeholder="Tất cả ca làm việc"
                            allowClear
                            className="w-full"
                            value={assignmentFilters.shiftId}
                            onChange={(val) => {
                              setAssignmentFilters(prev => ({ ...prev, shiftId: val || undefined }));
                              setAssignmentPage(0);
                            }}
                            options={[
                              ...shifts.map(shift => ({
                                label: shift.name,
                                value: shift.id
                              }))
                            ]}
                          />
                        </div>
                      </div>
                      <Table 
                        dataSource={assignments} 
                        columns={assignmentColumns} 
                        rowKey="id"
                        loading={isAssignmentsLoading}
                        bordered
                        pagination={{
                          current: assignmentPage + 1,
                          pageSize: 10,
                          total: totalAssignments,
                          showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} bản ghi`,
                        }}
                        onChange={(pagination, filters, sorter: any) => {
                          if (pagination.current) {
                            setAssignmentPage(pagination.current - 1);
                          }
                          if (sorter && sorter.columnKey) {
                            setAssignmentSort({
                              sortBy: sorter.columnKey,
                              sortDir: sorter.order === 'ascend' ? 'asc' : 'desc'
                            });
                          } else {
                            setAssignmentSort({ sortBy: "startDate", sortDir: "desc" });
                          }
                        }}
                      />
                    </div>
                  ),
                },
                {
                  key: "3",
                  label: <span className="text-slate-700 font-medium">Lịch sử cấu hình</span>,
                  children: (
                    <Table 
                      dataSource={history} 
                      columns={historyColumns} 
                      rowKey="id"
                      loading={isHistoryLoading}
                      bordered
                      pagination={{
                        current: historyPage + 1,
                        pageSize: 10,
                        total: totalHistory,
                        onChange: (page) => setHistoryPage(page - 1),
                        showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} bản ghi`,
                      }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      {site.latitude && site.longitude && (
        <EditGeofenceModal
          isOpen={isGeofenceModalOpen}
          onClose={() => setIsGeofenceModalOpen(false)}
          siteId={siteId}
          latitude={site.latitude}
          longitude={site.longitude}
          activeGeofence={site.geofence}
        />
      )}

      {/* View Historical Geofence Modal */}
      <Modal
        title={
          <span className="text-slate-800">
            Bản đồ chấm công - Phiên bản ngày {selectedHistoryGeofence ? new Date(selectedHistoryGeofence.createdAt).toLocaleString("vi-VN") : ""}
          </span>
        }
        open={!!selectedHistoryGeofence}
        onCancel={() => setSelectedHistoryGeofence(null)}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        <div className="py-4 space-y-4">
          <div className="flex gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
            <div className="text-slate-600">
              <span className="font-semibold text-slate-700">Bán kính cho phép:</span> {selectedHistoryGeofence?.bufferMeters} mét
            </div>
            <div className="text-slate-600">
              <span className="font-semibold text-slate-700">Trạng thái:</span>{" "}
              {selectedHistoryGeofence?.status === "active" ? (
                <span className="text-green-600 font-medium">Đang áp dụng</span>
              ) : (
                <span className="text-slate-500 font-medium">Bị thay thế (Lịch sử)</span>
              )}
            </div>
          </div>
          {site.latitude && site.longitude && selectedHistoryGeofence && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-[450px] border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                <GeofenceMap 
                  latitude={site.latitude} 
                  longitude={site.longitude} 
                  polygonCoordinates={selectedHistoryGeofence.coordinates} 
                  heightClassName="h-full"
                />
              </div>
              <div className="lg:col-span-1 border border-slate-200 rounded-lg p-3 bg-white h-[450px] overflow-y-auto shadow-inner">
                <div className="font-semibold text-slate-700 mb-3 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
                  Tọa độ chi tiết ({selectedHistoryGeofence.coordinates.length > 1 ? selectedHistoryGeofence.coordinates.length - 1 : 0} điểm)
                </div>
                <div className="space-y-3">
                  {selectedHistoryGeofence.coordinates.map((coord, index) => {
                    // Skip the last point if it's identical to the first (closed loop)
                    if (index > 0 && index === selectedHistoryGeofence.coordinates.length - 1 && coord[0] === selectedHistoryGeofence.coordinates[0][0] && coord[1] === selectedHistoryGeofence.coordinates[0][1]) {
                      return null;
                    }
                    return (
                      <div key={index} className="flex flex-col gap-1 p-2 bg-slate-50 border border-slate-200 rounded-md shadow-sm">
                        <span className="text-xs font-bold text-slate-600">Điểm {index + 1}</span>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white border border-slate-200 rounded p-1 text-xs text-slate-600 text-center">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Vĩ độ (Lat)</span>
                            {coord[1]}
                          </div>
                          <div className="flex-1 bg-white border border-slate-200 rounded p-1 text-xs text-slate-600 text-center">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Kinh độ (Lng)</span>
                            {coord[0]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Shift Form Modal */}
      <ShiftFormModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        siteId={siteId}
        activeShift={activeShift}
      />

      {/* Shift OT Config Modal */}
      <ShiftOtConfigModal
        isOpen={isOtModalOpen}
        onClose={() => setIsOtModalOpen(false)}
        siteId={siteId}
        activeShift={activeShift}
      />

      {/* Assignment Form Modal */}
      <AssignmentFormModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        siteId={siteId}
        activeAssignment={activeAssignment}
      />
    </div>
  );
}
