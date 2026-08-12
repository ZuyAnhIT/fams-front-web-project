"use client";

import Link from "next/link";
import { Alert, Collapse, Tabs, Tag } from "antd";
import { BookOpenCheck, ExternalLink, HelpCircle, ShieldCheck, Smartphone, Users } from "lucide-react";
import ContentCard from "@/components/shared/layout/ContentCard";
import { ADMIN_ROUTES, CUSTOMER_ROUTES } from "@/constants/routes";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useAuthStore } from "@/stores/auth.store";

interface GuideSection {
  title: string;
  content: React.ReactNode;
}

const platformSections: GuideSection[] = [
  { title: "Quản lý tenant và gói dịch vụ", content: <p>Tạo tenant phải có email Owner hợp lệ; kiểm tra subscription, usage và giới hạn trước khi bàn giao. Suspend không xóa dữ liệu, reactivate khôi phục truy cập.</p> },
  { title: "Điều tra bằng audit log", content: <p>Lọc theo tenant/actor/hành động và dùng request ID để trace chuỗi thao tác. Dữ liệu nhạy cảm trong diff đã được Backend redact trước khi ghi; không có cơ chế xem nguyên bản từ Web.</p> },
  { title: "Giám sát hệ thống", content: <p>Kiểm tra DB, Redis, FCM, AI Service, queue và đủ 7 job nền. Phân biệt ERROR, NEVER_RUN và STALE; xem lần chạy kế tiếp, duration và ngưỡng stale trước khi kết luận hệ thống khỏe.</p> },
  { title: "Go-live tenant đầu tiên", content: <p>Tạo biên bản DRAFT theo tenant/môi trường/build, lưu đủ kết quả và bằng chứng cho 15 bước rồi hoàn tất. APPROVED/REJECTED là biên bản chính thức bất biến; muốn chạy lại phải tạo bản ghi mới.</p> },
];

const adminSections: GuideSection[] = [
  { title: "Thiết lập công ty ban đầu", content: <p>Tạo site và geofence tại vị trí thật, tạo ca làm đúng timezone, sau đó tổ chức phòng ban/workspace trước khi phân công nhân viên.</p> },
  { title: "Mời và quản lý nhân viên", content: <p>Ưu tiên mời qua email để người dùng tự tạo mật khẩu. Hồ sơ tạo thủ công chỉ lưu dữ liệu HR; khi người cùng email chấp nhận lời mời, Backend nối vào hồ sơ cũ thay vì tạo trùng.</p> },
  { title: "Bảo vệ dữ liệu cá nhân", content: <p>Backend trả `piiMasked=true` khi email/SĐT bị che; chỉ quyền `employees:pii:read` được xem đầy đủ. Excel áp dụng cùng quy tắc. Web không gửi chuỗi masked ngược về API khi sửa trường khác.</p> },
  { title: "Face ID và chấm công", content: <p>Face ID cần consent, enrollment và HR duyệt thủ công. Chấm công pending/invalid phải xử lý bằng bằng chứng; không chốt bảng công khi còn ngày chờ duyệt mà chưa cảnh báo.</p> },
  { title: "Random check và vi phạm", content: <p>Cấu hình tần suất/mode theo site; xem scheduled check, giải trình và xác nhận/dismiss violation theo bằng chứng. Không phản hồi tạo vi phạm nhưng HR vẫn có thể xử lý giải trình.</p> },
  { title: "Báo cáo và thông báo", content: <p>Lưu bộ lọc thường dùng, export đúng filter đang xem và cấu hình template theo event type/locale. Template có hiệu lực từ lần gửi tiếp theo, không cần nút kích hoạt.</p> },
];

const employeeSections: GuideSection[] = [
  { title: "Đăng ký Face ID", content: <p>Đọc consent, chụp ảnh thật đủ sáng và chờ HR duyệt. Nếu bị từ chối, xem lý do trước khi đăng ký lại.</p> },
  { title: "Chấm công đúng site", content: <p>Chọn site được phân công, kiểm tra vị trí so với geofence và hoàn tất GPS/Face ID/liveness theo policy. Giữ màn hình kết quả để biết valid, pending hay lỗi.</p> },
  { title: "Random check", content: <p>Phản hồi trước thời hạn bằng đúng mode được yêu cầu. Nếu mất sóng hoặc thiết bị lỗi, gửi giải trình và bằng chứng để HR xem xét.</p> },
  { title: "Tự kiểm tra bảng công", content: <p>Xem lịch sử check-in/out, công ngày/tháng, đi muộn, về sớm và OT. Báo HR sớm nếu thiếu checkout hoặc dữ liệu chưa chính xác.</p> },
  { title: "Bảo mật tài khoản", content: <p>Bật TOTP 2FA, lưu backup codes ở nơi an toàn và đăng xuất thiết bị lạ. Có thể bật/tắt độc lập thông báo hộp thư và push.</p> },
];

const faq = [
  { key: "checkin", label: "Tại sao tôi không chấm công được?", children: "Kiểm tra phân công, site/ca đang active, thời gian cho phép, geofence và trạng thái Face ID nếu policy yêu cầu." },
  { key: "masking", label: "Tại sao email hoặc số điện thoại bị che?", children: "Đây là kiểm soát dữ liệu cá nhân theo quyền do Backend áp dụng, không phải lỗi giao diện. Web không thể và không nên tự giải che." },
  { key: "random", label: "Không phản hồi random check vì lý do khách quan thì sao?", children: "Hệ thống vẫn ghi nhận no_response theo thời hạn; hãy gửi giải trình kèm bằng chứng để HR xem xét dismiss hoặc giữ vi phạm." },
  { key: "tenant", label: "Vì sao đổi công ty rồi dữ liệu thay đổi?", children: "Mỗi tenant có role, permission, nhân viên và Face ID độc lập. Sau khi switch, mọi màn hình phải dùng tenant/employee mới." },
];

function GuideContent({ sections }: { sections: GuideSection[] }) {
  return <Collapse items={sections.map((section, index) => ({ key: String(index), label: section.title, children: <div className="text-sm leading-7 text-slate-600">{section.content}</div> }))} />;
}

export default function RoleUserGuidePage() {
  const user = useAuthStore((state) => state.user);
  const isPlatform = user?.role === SystemRole.PLATFORM_ADMIN || user?.role === SystemRole.PLATFORM_STAFF;
  const isEmployee = user?.role === SystemRole.EMPLOYEE;
  const items = isPlatform
    ? [{ key: "platform", label: "Platform Admin/Ops", children: <GuideContent sections={platformSections} /> }]
    : isEmployee
      ? [{ key: "employee", label: "Nhân viên", children: <GuideContent sections={employeeSections} /> }]
      : [
          { key: "admin", label: "Company Admin / HR", children: <GuideContent sections={adminSections} /> },
          { key: "employee", label: "Hỗ trợ nhân viên", children: <GuideContent sections={employeeSections} /> },
        ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl"><BookOpenCheck className="h-7 w-7 text-blue-600" />Hướng dẫn sử dụng theo vai trò</h1>
        <p className="mt-1 text-sm text-slate-500">Các luồng nghiệp vụ đã được đối chiếu với quyền và contract Backend hiện tại.</p>
      </div>

      <Alert showIcon type="info" title="Quyền hiển thị do phiên đăng nhập hiện tại quyết định" description="Nếu một chức năng không xuất hiện hoặc API trả 403, hãy kiểm tra role/permission trong đúng công ty đang chọn; không dùng quyền của tenant khác để thao tác." />

      <ContentCard className="p-5">
        <Tabs items={items} />
      </ContentCard>

      <div className="grid gap-4 md:grid-cols-3">
        {isPlatform ? <Link href={ADMIN_ROUTES.SYSTEM_STATUS} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"><ShieldCheck className="h-5 w-5 text-blue-600" /><p className="mt-3 font-semibold">Vận hành & Go-live</p><p className="mt-1 text-sm text-slate-500">Health, job, UAT và delivery log</p></Link> : <>
          <Link href={CUSTOMER_ROUTES.EMPLOYEES} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"><Users className="h-5 w-5 text-blue-600" /><p className="mt-3 font-semibold">Quản lý nhân viên</p><p className="mt-1 text-sm text-slate-500">Hồ sơ, lời mời và phân công</p></Link>
          <Link href={CUSTOMER_ROUTES.SETTINGS} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"><Smartphone className="h-5 w-5 text-blue-600" /><p className="mt-3 font-semibold">Cài đặt tài khoản</p><p className="mt-1 text-sm text-slate-500">2FA, phiên và thông báo</p></Link>
        </>}
        <a href="#faq" className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"><HelpCircle className="h-5 w-5 text-blue-600" /><p className="mt-3 flex items-center gap-1 font-semibold">Câu hỏi thường gặp <ExternalLink className="h-3.5 w-3.5" /></p><p className="mt-1 text-sm text-slate-500">Xử lý các tình huống phổ biến</p></a>
      </div>

      <div id="faq">
        <ContentCard className="space-y-4 p-5">
          <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-blue-600" /><h2 className="text-lg font-semibold">Câu hỏi thường gặp</h2><Tag color="blue">FAQ</Tag></div>
          <Collapse items={faq} />
        </ContentCard>
      </div>
    </div>
  );
}
