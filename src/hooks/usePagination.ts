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
  industry?: string;
  countryCode?: string;
}

export function usePagination(defaultSize = 20) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getNumberParam = (key: string, defaultVal: number) => {
    const val = searchParams.get(key);
    return val ? parseInt(val, 10) : defaultVal;
  };

  const getStringParam = (key: string, defaultVal?: string) => {
    return searchParams.get(key) || defaultVal;
  };

  const state: PaginationState = {
    page: getNumberParam("page", 0), // Default 0 for backend
    size: getNumberParam("size", defaultSize),
    search: getStringParam("search"),
    email: getStringParam("email"),
    sortBy: getStringParam("sortBy", "createdAt"),
    sortDir: getStringParam("sortDir", "desc") as "asc" | "desc",
    status: getStringParam("status"),
    industry: getStringParam("industry"),
    countryCode: getStringParam("countryCode"),
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

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return { state, setPagination };
}
