import { SiteDetailResponse } from "../features/customer/site/types/site.type";

export const MOCK_SITES: SiteDetailResponse[] = [
  {
    id: "site-1",
    tenantId: "tenant-1",
    name: "Tòa nhà Landmark 81",
    code: "LM81",
    description: "Văn phòng chi nhánh Miền Nam",
    address: "720A Điện Biên Phủ, Vinhomes Tân Cảng, Bình Thạnh, HCM",
    latitude: 10.795,
    longitude: 106.721,
    timezone: "Asia/Ho_Chi_Minh",
    status: "active",
    createdAt: "2023-02-01T00:00:00Z",
    updatedAt: "2023-02-01T00:00:00Z",
    geofence: {
      id: "geo-1",
      siteId: "site-1",
      tenantId: "tenant-1",
      coordinates: [[106.72, 10.79], [106.73, 10.79], [106.73, 10.80], [106.72, 10.80]],
      bufferMeters: 50,
      status: "active",
      createdBy: "admin",
      createdAt: "2023-02-01T00:00:00Z",
      updatedAt: "2023-02-01T00:00:00Z",
    },
    shifts: [],
    activeAssignmentCount: 15
  },
  {
    id: "site-2",
    tenantId: "tenant-1",
    name: "Nhà máy Bắc Ninh",
    code: "BN-01",
    description: "Nhà máy sản xuất linh kiện điện tử",
    address: "KCN Yên Phong, Huyện Yên Phong, Tỉnh Bắc Ninh",
    latitude: 21.205,
    longitude: 105.970,
    timezone: "Asia/Ho_Chi_Minh",
    status: "active",
    createdAt: "2023-03-01T00:00:00Z",
    updatedAt: "2023-03-01T00:00:00Z",
    geofence: null, // Chưa thiết lập toạ độ chấm công
    shifts: [],
    activeAssignmentCount: 42
  }
];
