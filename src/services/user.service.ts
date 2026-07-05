import { apiClient } from "@/services/api-client";
import { type ApiResponse, type PageResponse } from "@/types/api";
import { UserProfile } from "@/features/customer/auth/types/auth.type";

export interface UserSearchParams {
  search?: string;
  page?: number;
  size?: number;
}

export const userService = {
  /**
   * Tìm kiếm người dùng (Global Search)
   * Yêu cầu quyền PLATFORM_ADMIN
   */
  async searchUsers(params: UserSearchParams): Promise<PageResponse<UserProfile>> {
    const response = await apiClient.get<ApiResponse<PageResponse<UserProfile>>>("/users", { params });
    return response.data.data;
  },
};
