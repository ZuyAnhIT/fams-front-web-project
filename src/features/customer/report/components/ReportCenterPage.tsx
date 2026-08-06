'use client';

import { Tabs } from 'antd';
import RoleGuard from '@/components/guards/RoleGuard';
import { SystemRole } from '@/features/customer/auth/types/auth.type';
import DailyAttendanceReportTab from './DailyAttendanceReportTab';
import MonthlyAttendanceReportTab from './MonthlyAttendanceReportTab';
import ViolationReportTab from './ViolationReportTab';
import SitePresenceReportTab from './SitePresenceReportTab';
import FaceIdEnrollmentReportPage from './FaceIdEnrollmentReportPage';

export default function ReportCenterPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]} allowedPermissions={['reports:list']}>
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Báo cáo vận hành</h1>
          <p className="mt-1 text-sm text-slate-600">Công, vi phạm, hiện diện và Face ID trong đúng phạm vi công trình được phân quyền.</p>
        </header>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <Tabs
            destroyOnHidden
            items={[
              { key: 'daily', label: 'Công ngày', children: <DailyAttendanceReportTab /> },
              { key: 'monthly', label: 'Công tháng & Export', children: <MonthlyAttendanceReportTab /> },
              { key: 'violations', label: 'Vi phạm theo kỳ', children: <ViolationReportTab /> },
              { key: 'presence', label: 'Hiện diện công trình', children: <SitePresenceReportTab /> },
              { key: 'face-id', label: 'Trạng thái Face ID', children: <FaceIdEnrollmentReportPage /> },
            ]}
          />
        </div>
      </div>
    </RoleGuard>
  );
}

