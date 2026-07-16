import { useQuery } from "@tanstack/react-query";
import { faceIdReportService } from "../services/face-id-report.service";
import type { FaceIdReportParams } from "../types/face-id-report.type";

export const useFaceIdEnrollmentReport = (
  params: FaceIdReportParams,
  options?: Omit<import("@tanstack/react-query").UseQueryOptions<any, any, any, any>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["face-id-enrollment-report", params],
    queryFn: () => faceIdReportService.getEnrollmentReport(params),
    ...options,
  });
};