export type FaceIdStatus = "not_enrolled" | "enrolled" | "revoked";
export type FaceIdReviewStatus = "none" | "pending" | "rejected";
export type FaceIdStatusFilter = FaceIdStatus | "pending";

export interface FaceIdReportRow {
  employeeId: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  department: string | null;
  faceIdStatus: FaceIdStatus;
  consentGiven: boolean;
  consentGivenAt: string | null;
  enrolledAt: string | null;
  revokedAt: string | null;
  reviewStatus: FaceIdReviewStatus;
  submittedAt: string | null;
  rejectionReason: string | null;
}

export interface FaceIdReportResponse {
  totalEmployees: number;
  enrolledCount: number;
  pendingCount: number;
  notEnrolledCount: number;
  revokedCount: number;
  statusFilter: FaceIdStatusFilter | null;
  departmentId: string | null;
  search: string | null;
  records: {
    content: FaceIdReportRow[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface FaceIdReportParams {
  status?: FaceIdStatusFilter;
  departmentId?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface FaceIdReviewItem {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  status: FaceIdStatus;
  consentGiven: boolean;
  consentGivenAt: string | null;
  enrolledAt: string | null;
  revokedAt: string | null;
  reviewStatus: FaceIdReviewStatus;
  pendingPhotoCount: number | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}
