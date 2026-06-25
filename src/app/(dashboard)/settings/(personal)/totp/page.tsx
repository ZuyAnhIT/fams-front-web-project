import TotpSettingForm from "@/features/setting/components/TotpSettingForm";

export const metadata = {
  title: "Bảo mật 2 lớp | FAMS",
};

export default function TotpSettingsPage() {
  return (
    <div className="animate-fade-in">
      <TotpSettingForm />
    </div>
  );
}
