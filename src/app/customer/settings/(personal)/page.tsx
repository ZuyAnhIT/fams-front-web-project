import ProfileSettingForm from "@/features/customer/setting/components/ProfileSettingForm";
import AccountIdentifiersForm from "@/features/customer/setting/components/AccountIdentifiersForm";

export const metadata = {
  title: "Thông tin cá nhân | FAMS",
};

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <ProfileSettingForm />
      <AccountIdentifiersForm />
    </div>
  );
}
