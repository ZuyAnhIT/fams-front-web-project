"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export interface PaginationState {
  page: number; // 0-indexed for Backend API, but we display as 1-indexed on UI (Antd)
  size: number;
  search?: string;
  email?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  status?: string;
  department?: string;
  industry?: string;
  countryCode?: string;
  workspaceId?: string;
  faceRegistered?: boolean;
}

export function usePagination(defaultSize = 20) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getNumberParam = (key: string, defaultVal: number, min: number) => {
    const val = searchParams.get(key);
    if (val === null || !/^\d+$/.test(val)) return defaultVal;
    const parsed = Number(val);
    return Number.isSafeInteger(parsed) && parsed >= min ? parsed : defaultVal;
  };

  const getStringParam = (key: string, defaultVal?: string) => {
    return searchParams.get(key) || defaultVal;
  };

  const getBooleanParam = (key: string): boolean | undefined => {
    const val = searchParams.get(key);
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  };

  const requestedSize = getNumberParam("size", defaultSize, 1);
  const size = [10, 20, 50, 100].includes(requestedSize)
    ? requestedSize
    : defaultSize;
  const requestedSortDir = getStringParam("sortDir", "desc");

  const state: PaginationState = {
    page: getNumberParam("page", 0, 0), // Default 0 for backend
    size,
    search: getStringParam("search"),
    email: getStringParam("email"),
    sortBy: getStringParam("sortBy", "createdAt"),
    sortDir: requestedSortDir === "asc" ? "asc" : "desc",
    status: getStringParam("status"),
    department: getStringParam("department"),
    industry: getStringParam("industry"),
    countryCode: getStringParam("countryCode"),
    workspaceId: getStringParam("workspaceId"),
    faceRegistered: getBooleanParam("faceRegistered"),
  };

  const setPagination = useCallback(
    (updates: Partial<PaginationState>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Nếu thay đổi bất cứ thứ gì ngoài page (vd: search, sort, filters), reset page về 0
      if (!("page" in updates)) {
        params.delete("page"); 
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  return { state, setPagination };
}
