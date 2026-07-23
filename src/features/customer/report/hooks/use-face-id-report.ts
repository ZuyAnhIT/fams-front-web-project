import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { faceIdReportService } from "../services/face-id-report.service";
import type { FaceIdReportParams, FaceIdReportResponse } from "../types/face-id-report.type";

export const useFaceIdEnrollmentReport = (
  params: FaceIdReportParams,
  options?: Omit<UseQueryOptions<FaceIdReportResponse, Error>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["face-id-enrollment-report", params],
    queryFn: () => faceIdReportService.getEnrollmentReport(params),
    ...options,
  });
};
