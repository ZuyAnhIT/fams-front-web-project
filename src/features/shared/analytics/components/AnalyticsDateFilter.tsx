"use client";

import { DatePicker, Segmented } from "antd";
import dayjs, { type Dayjs } from "dayjs";

export interface DateRangeValue { from: string; to: string }

const presets = [
  { label: "7 ngày", value: "7" },
  { label: "30 ngày", value: "30" },
  { label: "Tháng này", value: "month" },
  { label: "Quý này", value: "quarter" },
];

export default function AnalyticsDateFilter({ value, onChange }: { value: DateRangeValue; onChange: (value: DateRangeValue) => void }) {
  const applyPreset = (preset: string | number) => {
    const today = dayjs();
    if (preset === "month") onChange({ from: today.startOf("month").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") });
    else if (preset === "quarter") {
      const quarterStartMonth = Math.floor(today.month() / 3) * 3;
      onChange({ from: today.month(quarterStartMonth).startOf("month").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") });
    } else onChange({ from: today.subtract(Number(preset) - 1, "day").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") });
  };
  const setRange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates?.[0] && dates[1]) onChange({ from: dates[0].format("YYYY-MM-DD"), to: dates[1].format("YYYY-MM-DD") });
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented options={presets} defaultValue="30" onChange={applyPreset} />
      <DatePicker.RangePicker
        value={[dayjs(value.from), dayjs(value.to)]}
        onChange={setRange}
        format="DD/MM/YYYY"
        allowClear={false}
        aria-label="Khoảng thời gian báo cáo"
      />
    </div>
  );
}
