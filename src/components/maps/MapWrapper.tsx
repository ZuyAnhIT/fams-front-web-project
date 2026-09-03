import dynamic from "next/dynamic";
import { Spin } from "antd";

// Dynamically import the map component with SSR disabled
const DynamicLocationPickerMap = dynamic(
  () => import("./LocationPickerMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
        <Spin description="Đang tải bản đồ..." />
      </div>
    )
  }
);

export default DynamicLocationPickerMap;
