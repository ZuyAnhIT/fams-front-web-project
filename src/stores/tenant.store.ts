import { create } from "zustand";
import type { Tenant } from "@/features/admin/tenant/types/tenant.type";

interface TenantState {
  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  activeTenant: null,
  setActiveTenant: (tenant) => set({ activeTenant: tenant }),
}));
