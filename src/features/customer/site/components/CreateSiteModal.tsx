import React, { useState } from "react";
import { Modal, Form, Input, Button, Select, message, Tooltip } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateSiteMutation } from "../hooks/use-site";
import { CreateSiteRequest } from "../types/site.type";
import MapWrapper from "@/components/maps/MapWrapper";
import { MapPin } from "lucide-react";

interface CreateSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSiteModal({ isOpen, onClose }: CreateSiteModalProps) {
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  const { mutateAsync: createSite, isPending } = useCreateSiteMutation();
  
  // Local state to keep map in sync
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();

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
      if (!user?.tenantId) {
        message.error("Lỗi: Không xác định được Tenant ID");
        return;
      }

      const payload: CreateSiteRequest = {
        name: values.name,
        code: values.code || undefined,
        description: values.description || undefined,
        address: values.address || undefined,
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
        timezone: values.timezone || "Asia/Ho_Chi_Minh",
      };

      await createSite({
        tenantId: user.tenantId,
        data: payload,
      });

      message.success("Tạo công trình thành công!");
      handleClose();
    } catch (error: any) {
      console.error("Create Site Error:", error.response?.data || error);
      const errorMsg = error.response?.data?.message 
        || (error.response?.data?.details ? JSON.stringify(error.response.data.details) : "Có lỗi xảy ra khi tạo công trình");
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
    <Modal
      title={<span className="text-xl font-bold">Thêm Công Trình Mới</span>}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
      width={1000} // Increased width for 2-column layout
    >
      <div className="text-slate-500 mb-6 flex items-center gap-2">
        <MapPin size={16} />
        <span>Nhấp vào bản đồ để tự động lấy tọa độ và địa chỉ</span>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          timezone: "Asia/Ho_Chi_Minh",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Input Fields */}
          <div className="flex flex-col space-y-2">
            <Form.Item
              name="name"
              label={<span className="font-medium text-slate-700">Tên công trình <span className="text-red-500">*</span></span>}
              rules={[
                { required: true, message: "Vui lòng nhập tên công trình!" },
                { max: 100, message: "Tối đa 100 ký tự" }
              ]}
            >
              <Input placeholder="Ví dụ: Landmark 81" className="h-10" />
            </Form.Item>

            <Form.Item
              name="code"
              label={<span className="font-medium text-slate-700">Mã công trình</span>}
              rules={[
                { max: 50, message: "Tối đa 50 ký tự" },
                { pattern: /^[A-Za-z0-9\-_]*$/, message: "Chỉ chứa chữ cái, số, gạch ngang, gạch dưới" }
              ]}
            >
              <Input placeholder="Ví dụ: LM81-HCM" className="h-10" />
            </Form.Item>

            <Form.Item
              name="timezone"
              label={<span className="font-medium text-slate-700">Múi giờ</span>}
            >
              <Select className="h-10">
                <Select.Option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</Select.Option>
                <Select.Option value="UTC">UTC (GMT+0)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="address"
              label={<span className="font-medium text-slate-700">Địa chỉ thực tế</span>}
            >
              <Input.TextArea 
                placeholder="Nhấp vào bản đồ để tự động điền hoặc gõ tay..." 
                rows={2} 
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={<span className="font-medium text-slate-700">Mô tả thêm</span>}
            >
              <Input.TextArea placeholder="Ghi chú..." rows={2} />
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
            <div className="mt-3 flex gap-4 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div><span className="text-slate-500">Vĩ độ (Lat):</span> <span className="font-medium">{lat ? lat.toFixed(6) : "---"}</span></div>
              <div><span className="text-slate-500">Kinh độ (Lng):</span> <span className="font-medium">{lng ? lng.toFixed(6) : "---"}</span></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8 border-t border-slate-100 pt-6">
          <Button onClick={handleClose} className="mr-3 h-10 px-6">
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isPending}
            className="bg-brand-600 hover:bg-brand-700 font-semibold h-10 px-6"
          >
            Lưu công trình
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
