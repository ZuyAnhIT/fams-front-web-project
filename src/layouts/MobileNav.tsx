"use client";

import { Drawer } from "antd";
import Sidebar from "./Sidebar";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      size="min(320px, 88vw)"
      closable={false}
      styles={{ body: { padding: 0 }, wrapper: { boxShadow: "none" } }}
      className="lg:hidden"
      aria-label="Điều hướng chính"
    >
      <Sidebar variant="mobile" onNavigate={onClose} />
    </Drawer>
  );
}
