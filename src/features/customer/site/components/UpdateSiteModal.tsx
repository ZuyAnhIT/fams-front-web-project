import React, { useState } from "react";
import { Alert, Form, message } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { useUpdateSiteMutation } from "../hooks/use-site";
import { SiteResponse, UpdateSiteRequest } from "../types/site.type";
import MapWrapper from "@/components/maps/MapWrapper";
import { MapPin } from "lucide-react";
import BaseModal from "@/components/ui/BaseModal";
import BaseButton from "@/components/ui/BaseButton";
import BaseInput from "@/components/ui/BaseInput";
import BaseSelect from "@/components/ui/BaseSelect";
import BaseSwitch from "@/components/ui/BaseSwitch";
import BaseTextArea from "@/components/ui/BaseTextArea";
import {
  CHECKIN_POLICY_META,
  CHECKIN_POLICY_OPTIONS,
  type CheckinPolicy,
} from "../../checkin/constants/checkin-policy";
import { getApiErrorMessage } from "@/utils/api-error.util";

interface UpdateSiteFormValues {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  timezone?: string;
  checkinPolicy?: CheckinPolicy;
  status?: boolean;
}

interface UpdateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: SiteResponse | null;
}

export default function UpdateSiteModal({ isOpen, onClose, site }: UpdateSiteModalProps) {
  const [form] = Form.useForm();
  const checkinPolicy = Form.useWatch("checkinPolicy", form) as
    | CheckinPolicy
    | undefined;
  const user = useAuthStore((state) => state.user);
  const { mutateAsync: updateSite, isPending } = useUpdateSiteMutation();

  // Local state to keep map in sync
  const [lat, setLat] = useState<number | undefined>(site?.latitude);
  const [lng, setLng] = useState<number | undefined>(site?.longitude);

  const handleMapChange = (latitude: number, longitude: number, address?: string) => {
    setLat(latitude);
    setLng(longitude);

    // Auto-fill form fields
    form.setFieldsValue({
      latitude,
      longitude,
    });

    if (address) {
      form.setFieldsValue({ address });
    }
  };

  const handleFinish = async (values: UpdateSiteFormValues) => {
    try {
      if (!user?.tenantId || !site?.id) {
        message.error("Lỗi: Không xác định được thông tin Tenant/Site");
        return;
      }

      const payload: UpdateSiteRequest = {
        name: values.name,
        code: values.code || undefined,
        clearCode: !values.code && !!site.code,
        description: values.description || undefined,
        address: values.address || undefined,
        latitude:
          values.latitude !== undefined && values.latitude !== null
            ? Number(values.latitude)
            : undefined,
        longitude:
          values.longitude !== undefined && values.longitude !== null
            ? Number(values.longitude)
            : undefined,
        timezone: values.timezone,
        checkinPolicy: values.checkinPolicy,
        status: values.status ? "active" : "inactive",
      };

      await updateSite({
        tenantId: user.tenantId,
        siteId: site.id,
        data: payload,
      });

      message.success("Cập nhật công trình thành công!");
      handleClose();
    } catch (error: unknown) {
      console.error("Update Site Error:", error);
      message.error(getApiErrorMessage(error, "Có lỗi xảy ra khi cập nhật công trình"));
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <BaseModal
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Cập Nhật Công Trình</h2>
            <p className="text-sm text-slate-500 font-normal mt-0.5">Nhấp vào bản đồ để cập nhật lại tọa độ và địa chỉ</p>
          </div>
        </div>
      }
      isOpen={isOpen}
      onClose={handleClose}
      destroyOnHidden
      centered
      width={1000} // Increased width for 2-column layout
      footer={
        <div className="flex justify-end gap-3 w-full">
          <BaseButton onClick={handleClose} className="!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all">
            Hủy bỏ
          </BaseButton>
          <BaseButton
            type="primary"
            htmlType="submit"
            form="update-site-form"
            loading={isPending}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-10 px-6 rounded-lg font-bold transition-all"
          >
            Lưu công trình
          </BaseButton>
        </div>
      }
    >
      <Form
        form={form}
        initialValues={site ? {
          name: site.name,
          code: site.code,
          description: site.description,
          address: site.address,
          latitude: site.latitude,
          longitude: site.longitude,
          timezone: site.timezone,
          checkinPolicy: site.checkinPolicy || "gps_only",
          status: site.status === "active",
        } : undefined}
        layout="vertical"
        onFinish={handleFinish}
        id="update-site-form"
        className="max-h-[65vh] overflow-y-auto overflow-x-hidden pr-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Input Fields */}
          <div className="flex flex-col h-full space-y-4">
            <Form.Item
              name="name"
              label={<span className="font-medium text-slate-700">Tên công trình <span className="text-red-500">*</span></span>}
              rules={[
                { required: true, message: "Vui lòng nhập tên công trình!" },
                { max: 100, message: "Tối đa 100 ký tự" }
              ]}
            >
              <BaseInput placeholder="Ví dụ: Landmark 81" />
            </Form.Item>

            <Form.Item
              name="code"
              label={<span className="font-medium text-slate-700">Mã công trình</span>}
              rules={[
                { max: 50, message: "Tối đa 50 ký tự" },
                { pattern: /^[A-Za-z0-9\-_]*$/, message: "Chỉ chứa chữ cái, số, gạch ngang, gạch dưới" }
              ]}
            >
              <BaseInput placeholder="Ví dụ: LM81-HCM" />
            </Form.Item>

            <Form.Item
              name="timezone"
              label={<span className="font-medium text-slate-700">Múi giờ</span>}
            >
              <BaseSelect
                options={[
                  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh (GMT+7)" },
                  { value: "UTC", label: "UTC (GMT+0)" }
                ]}
              />
            </Form.Item>

            <Form.Item
              name="status"
              label={<span className="font-medium text-slate-700">Trạng thái (Tắt/Bật)</span>}
              valuePropName="checked"
            >
              <BaseSwitch />
            </Form.Item>

            <Form.Item
              name="checkinPolicy"
              label={
                <span className="font-medium text-slate-700">
                  Chính sách xác thực chấm công
                </span>
              }
              extra={
                checkinPolicy
                  ? CHECKIN_POLICY_META[checkinPolicy].description
                  : undefined
              }
            >
              <BaseSelect
                aria-label="Chính sách xác thực chấm công"
                options={CHECKIN_POLICY_OPTIONS}
              />
            </Form.Item>

            {checkinPolicy && checkinPolicy !== "gps_only" && (
              <Alert
                type="warning"
                showIcon
                title="Có thể làm gián đoạn chấm công"
                description="Hãy bảo đảm nhân viên tại công trình đã có Face ID được duyệt trước khi lưu chính sách này."
              />
            )}

            <Form.Item
              name="address"
              label={<span className="font-medium text-slate-700">Địa chỉ thực tế</span>}
            >
              <BaseTextArea
                placeholder="Nhấp vào bản đồ để tự động điền hoặc gõ tay..."
                rows={2}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={<span className="font-medium text-slate-700">Mô tả thêm</span>}
            >
              <BaseTextArea placeholder="Ghi chú..." rows={2} />
            </Form.Item>

            {/* Hidden actual inputs for submission */}
            <div className="hidden">
              <Form.Item name="latitude"><BaseInput /></Form.Item>
              <Form.Item name="longitude"><BaseInput /></Form.Item>
            </div>
          </div>

          {/* RIGHT COLUMN: Map */}
          <div className="flex flex-col h-full">
            <label className="font-medium text-slate-700 mb-2">Bản đồ định vị</label>
            <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-200" style={{ minHeight: "400px" }}>
              <MapWrapper
                latitude={lat}
                longitude={lng}
                onChange={handleMapChange}
                className="h-full w-full absolute inset-0 z-0"
              />
            </div>
            {/* Display selected coordinates nicely */}
            <div className="mt-4 flex gap-6 text-sm">
              <div className="flex-1"><span className="text-slate-500 mr-2">Vĩ độ (Lat):</span><span className="font-semibold text-slate-700">{lat != null ? lat.toFixed(6) : "---"}</span></div>
              <div className="flex-1"><span className="text-slate-500 mr-2">Kinh độ (Lng):</span><span className="font-semibold text-slate-700">{lng != null ? lng.toFixed(6) : "---"}</span></div>
            </div>
          </div>
        </div>
      </Form>
    </BaseModal>
  );
}
