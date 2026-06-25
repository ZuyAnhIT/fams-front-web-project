import ChangePasswordForm from "@/features/setting/components/ChangePasswordForm";

export const metadata = {
  title: "Đổi mật khẩu | FAMS",
};

export default function PasswordSettingsPage() {
  return (
    <div className="animate-fade-in">
      <ChangePasswordForm />
    </div>
  );
}
