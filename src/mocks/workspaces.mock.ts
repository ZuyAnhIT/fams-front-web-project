import { WorkspaceTreeResponse } from "../features/customer/workspace/types/workspace.type";

export const MOCK_WORKSPACES: WorkspaceTreeResponse[] = [
  {
    id: "ws-1",
    tenantId: "tenant-1",
    name: "Khối Công Nghệ (IT)",
    description: "Bộ phận phát triển sản phẩm phần mềm",
    type: "department",
    parentId: null,
    status: "active",
    createdBy: "admin",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
    children: [
      {
        id: "ws-1-1",
        tenantId: "tenant-1",
        name: "Team Frontend",
        description: "Team phát triển UI/UX",
        type: "team",
        parentId: "ws-1",
        status: "active",
        createdBy: "admin",
        createdAt: "2023-01-02T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z",
        children: []
      },
      {
        id: "ws-1-2",
        tenantId: "tenant-1",
        name: "Team Backend",
        description: "Team phát triển API Core",
        type: "team",
        parentId: "ws-1",
        status: "active",
        createdBy: "admin",
        createdAt: "2023-01-02T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z",
        children: []
      }
    ]
  },
  {
    id: "ws-2",
    tenantId: "tenant-1",
    name: "Khối Vận Hành",
    description: "Quản lý toà nhà và an ninh",
    type: "department",
    parentId: null,
    status: "active",
    createdBy: "admin",
    createdAt: "2023-02-01T00:00:00Z",
    updatedAt: "2023-02-01T00:00:00Z",
    children: []
  }
];
