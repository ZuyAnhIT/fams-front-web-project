import ProfileSettingForm from "@/features/setting/components/ProfileSettingForm";

export const metadata = {
  title: "Thông tin cá nhân | FAMS",
};

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <ProfileSettingForm />
    </div>
  );
}
