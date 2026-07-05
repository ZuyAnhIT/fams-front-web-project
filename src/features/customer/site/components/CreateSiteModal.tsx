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
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
            <MapPin className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Thêm Công Trình Mới</h2>
            <p className="text-sm text-slate-500 font-normal mt-0.5">Nhấp vào bản đồ để tự động lấy tọa độ và địa chỉ</p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      destroyOnHidden
      centered
      width={1000}
      footer={
        <div className="flex justify-end gap-3 mt-4">
          <Button
            onClick={handleClose}
            disabled={isPending}
            className="!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-11 px-6 rounded-xl font-semibold transition-all"
          >
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form="create-site-form"
            loading={isPending}
            className="!bg-brand-primary !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-primary/25 h-11 px-8 rounded-xl font-bold hover:-translate-y-0.5 transition-all"
          >
            Lưu công trình
          </Button>
        </div>
      }
      classNames={{
        content: "!bg-white !rounded-3xl !p-0 overflow-hidden shadow-2xl shadow-brand-primary/10",
        header: "!bg-white border-b border-slate-100 px-8 py-5 m-0",
        body: "!bg-slate-50/50 p-6 md:p-8 overflow-y-auto max-h-[65vh] scrollbar-thin scrollbar-thumb-slate-200",
        footer: "!bg-white border-t border-slate-100 px-8 py-4 m-0",
        close: "mt-4 mr-4 hover:!bg-slate-100 !rounded-full transition-colors",
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          timezone: "Asia/Ho_Chi_Minh",
        }}
        id="create-site-form"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Input Fields */}
          <div className="flex flex-col space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <Form.Item
                name="name"
                label={<span className="font-medium text-slate-700">Tên công trình <span className="text-red-500">*</span></span>}
                rules={[
                  { required: true, message: "Vui lòng nhập tên công trình!" },
                  { max: 100, message: "Tối đa 100 ký tự" }
                ]}
                className="mb-0"
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
                className="mb-0"
              >
                <Input placeholder="Ví dụ: LM81-HCM" className="h-10" />
              </Form.Item>

              <Form.Item
                name="timezone"
                label={<span className="font-medium text-slate-700">Múi giờ</span>}
                className="mb-0"
              >
                <Select className="h-10">
                  <Select.Option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</Select.Option>
                  <Select.Option value="UTC">UTC (GMT+0)</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <Form.Item
                name="address"
                label={<span className="font-medium text-slate-700">Địa chỉ thực tế</span>}
                className="mb-0"
              >
                <Input.TextArea 
                  placeholder="Nhấp vào bản đồ để tự động điền hoặc gõ tay..." 
                  rows={2} 
                />
              </Form.Item>

              <Form.Item
                name="description"
                label={<span className="font-medium text-slate-700">Mô tả thêm</span>}
                className="mb-0"
              >
                <Input.TextArea placeholder="Ghi chú..." rows={2} />
              </Form.Item>
            </div>

            {/* Hidden actual inputs for submission */}
            <div className="hidden">
              <Form.Item name="latitude"><Input /></Form.Item>
              <Form.Item name="longitude"><Input /></Form.Item>
            </div>
          </div>

          {/* RIGHT COLUMN: Map */}
          <div className="flex flex-col h-full bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <label className="font-bold text-slate-800 text-[15px] mb-3">Bản đồ định vị</label>
            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200" style={{ minHeight: "360px" }}>
              <MapWrapper 
                latitude={lat} 
                longitude={lng} 
                onChange={handleMapChange} 
                className="h-full w-full absolute inset-0 z-0" 
              />
            </div>
            {/* Display selected coordinates nicely */}
            <div className="mt-4 flex gap-6 text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex-1"><span className="text-slate-500 block mb-1">Vĩ độ (Lat)</span> <span className="font-semibold text-slate-700">{lat ? lat.toFixed(6) : "---"}</span></div>
              <div className="flex-1"><span className="text-slate-500 block mb-1">Kinh độ (Lng)</span> <span className="font-semibold text-slate-700">{lng ? lng.toFixed(6) : "---"}</span></div>
            </div>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
