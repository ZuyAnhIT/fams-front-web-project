import { useQuery } from "@tanstack/react-query";
import { userService, UserSearchParams } from "@/services/user.service";

export const useSearchUsers = (params: UserSearchParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["users", "search", params],
    queryFn: () => userService.searchUsers(params),
    enabled: enabled && (params.search?.length || 0) >= 2, // Chỉ tìm khi gõ từ 2 ký tự trở lên
    staleTime: 60 * 1000, // 1 phút
  });
};

export const useUsersQuery = (params: UserSearchParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["users", "directory", params],
    queryFn: () => userService.searchUsers(params),
    enabled,
    staleTime: 30 * 1000,
  });
};
