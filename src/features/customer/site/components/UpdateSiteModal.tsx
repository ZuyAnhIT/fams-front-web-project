import React, { useEffect, useState } from "react";
import { Form, Button, message, Input } from "antd";
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

interface UpdateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: SiteResponse | null;
}

export default function UpdateSiteModal({ isOpen, onClose, site }: UpdateSiteModalProps) {
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  const { mutateAsync: updateSite, isPending } = useUpdateSiteMutation();

  // Local state to keep map in sync
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();

  useEffect(() => {
    if (site && isOpen) {
      form.setFieldsValue({
        name: site.name,
        code: site.code,
        description: site.description,
        address: site.address,
        latitude: site.latitude,
        longitude: site.longitude,
        timezone: site.timezone,
        status: site.status === "active",
      });
      setLat(site.latitude);
      setLng(site.longitude);
    }
  }, [site, isOpen, form]);

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

  const handleFinish = async (values: any) => {
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
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
        timezone: values.timezone,
        status: values.status ? "active" : "inactive",
      };

      await updateSite({
        tenantId: user.tenantId,
        siteId: site.id,
        data: payload,
      });

      message.success("Cập nhật công trình thành công!");
      handleClose();
    } catch (error: any) {
      console.error("Update Site Error:", error.response?.data || error);
      const errorMsg = error.response?.data?.message
        || (error.response?.data?.details ? JSON.stringify(error.response.data.details) : "Có lỗi xảy ra khi cập nhật công trình");
      message.error(errorMsg);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setLat(undefined);
    setLng(undefined);
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
      destroyOnClose
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
              <Form.Item name="latitude"><Input /></Form.Item>
              <Form.Item name="longitude"><Input /></Form.Item>
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
              <div className="flex-1"><span className="text-slate-500 mr-2">Vĩ độ (Lat):</span><span className="font-semibold text-slate-700">{lat ? lat.toFixed(6) : "---"}</span></div>
              <div className="flex-1"><span className="text-slate-500 mr-2">Kinh độ (Lng):</span><span className="font-semibold text-slate-700">{lng ? lng.toFixed(6) : "---"}</span></div>
            </div>
          </div>
        </div>
      </Form>
    </BaseModal>
  );
}
