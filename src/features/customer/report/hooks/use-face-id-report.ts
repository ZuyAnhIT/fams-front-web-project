import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
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

export const usePendingFaceIdReviews = (enabled = true) =>
  useQuery({
    queryKey: ["face-id-pending-reviews"],
    queryFn: () => faceIdReportService.getPendingReviews(),
    enabled,
  });

export const usePendingFaceIdReviewPhoto = (
  employeeId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: ["face-id-pending-review-photo", employeeId],
    queryFn: () => faceIdReportService.getPendingReviewPhoto(employeeId),
    enabled: enabled && Boolean(employeeId),
    staleTime: 60_000,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

const useInvalidateFaceIdQueries = () => {
  const queryClient = useQueryClient();
  return (employeeId: string) => {
    queryClient.invalidateQueries({ queryKey: ["face-id-pending-reviews"] });
    queryClient.invalidateQueries({ queryKey: ["face-id-enrollment-report"] });
    queryClient.invalidateQueries({ queryKey: ["employees", employeeId] });
    queryClient.invalidateQueries({ queryKey: ["employees"] });
    queryClient.removeQueries({
      queryKey: ["face-id-pending-review-photo", employeeId],
    });
  };
};

export const useApproveFaceIdEnrollment = () => {
  const invalidate = useInvalidateFaceIdQueries();
  return useMutation({
    mutationFn: (employeeId: string) =>
      faceIdReportService.approveEnrollment(employeeId),
    onSuccess: (_, employeeId) => invalidate(employeeId),
  });
};

export const useRejectFaceIdEnrollment = () => {
  const invalidate = useInvalidateFaceIdQueries();
  return useMutation({
    mutationFn: ({
      employeeId,
      reason,
    }: {
      employeeId: string;
      reason: string;
    }) => faceIdReportService.rejectEnrollment(employeeId, reason),
    onSuccess: (_, variables) => invalidate(variables.employeeId),
  });
};
