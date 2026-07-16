export type FaceIdStatus = "not_enrolled" | "pending" | "enrolled" | "revoked";

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
}

export interface FaceIdReportResponse {
  totalEmployees: number;
  enrolledCount: number;
  pendingCount: number;
  notEnrolledCount: number;
  revokedCount: number;
  statusFilter: FaceIdStatus | null;
  records: {
    content: FaceIdReportRow[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface FaceIdReportParams {
  status?: FaceIdStatus;
  page?: number;
  size?: number;
}