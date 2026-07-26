# Báo cáo hoàn thiện Workspace Management UI

Ngày thực hiện: 26/07/2026  
Phạm vi: `fams-front-web-project`  
Tài liệu nguồn:

- Backend: `docs/api/workspace-management-api.md`
- Backend UI guide: `docs/api/workspace-ui-permissions-guide.md`

## 1. Kết luận

Nhóm tính năng Workspace Management trên Web đã được hoàn thiện theo API backend hiện tại:

| Tính năng | Trước kiểm tra | Kết quả sau hoàn thiện |
|---|---|---|
| Tạo workspace | Đã có form/API cơ bản | Giữ lại, sửa validation tên tối đa 100 ký tự, quyền dựa trên permission |
| Danh sách workspace | Chỉ có cây, thiếu bảng phân trang/type filter | Bổ sung chuyển đổi Cây/Danh sách, search, status, type, sort và pagination server-side |
| Cập nhật workspace | Đã có form | Xác nhận gửi `clearParent=true` khi bỏ workspace cha; HR_MANAGER được dùng theo permission |
| Gán nhân viên | Đã có | Chỉ lấy nhân viên active; khóa thao tác khi workspace inactive |
| Chuyển workspace | Đã có | Chỉ hiện khi có đồng thời quyền create/delete membership; loại workspace nguồn và inactive khỏi đích |
| Gỡ nhân viên | Service có nhưng UI/hook thiếu | Bổ sung mutation, xác nhận và thông báo rõ không xóa hồ sơ nhân viên |
| Xóa workspace | Chưa có FE | Bổ sung DELETE; chỉ hiện theo `workspaces:delete`; disable và tooltip khi còn nhân viên/đơn vị con |
| Số lượng tham chiếu | Chưa dùng field backend mới | Hiển thị `activeMemberCount` và `childWorkspaceCount` ở cây, bảng và chi tiết |
| Workspace inactive | Hiển thị mờ nhưng vẫn cho thêm người | Hiển thị cảnh báo, không cho thêm/chuyển vào; vẫn cho chuyển người ra |
| Phòng ban trên hồ sơ nhân viên | Nhập text tự do | Đổi sang `GET /workspaces?type=department&status=active`, gửi `departmentId` |
| Route/menu | Menu hardcode role | Đổi sang permission; route trực tiếp có guard 403 |

Không thay đổi Mobile App vì tài liệu xác định toàn bộ thao tác quản trị Workspace là Web-only. App chỉ đọc workspace của chính nhân viên qua dữ liệu hồ sơ.

## 2. Nghiệp vụ và liên kết giữa các màn hình

Luồng vận hành được triển khai thống nhất:

```text
Tạo phòng ban/đội nhóm
  → xuất hiện trong cây và danh sách
  → dùng làm nguồn chọn Phòng ban khi tạo/sửa nhân viên
  → gán nhân viên với vai trò member/lead/manager
  → chuyển nguyên tử sang workspace active khác
  → gỡ/chuyển hết thành viên và xử lý hết đơn vị con
  → Tenant Admin mới có thể xóa mềm workspace
```

Các nguyên tắc nghiệp vụ:

1. Workspace là cơ cấu toàn tenant, không áp dụng site scope.
2. `department` và `team` dùng chung mô hình phân cấp nhưng được gắn nhãn rõ trên UI.
3. Inactive bảo toàn lịch sử: vẫn nhìn thấy và vẫn chuyển người ra, nhưng không nhận thêm người.
4. Xóa là thao tác có rủi ro cao hơn tạo/sửa: chỉ Tenant Admin có permission delete; HR Manager không thấy nút.
5. Không xóa thực thể đang được tham chiếu: `activeMemberCount > 0` hoặc `childWorkspaceCount > 0` sẽ khóa nút và giải thích cách xử lý.
6. Chuyển người yêu cầu đồng thời `workspace_members:create` và `workspace_members:delete`, đúng contract backend.
7. Bỏ workspace cha phải gửi tín hiệu tường minh `clearParent=true`; không dùng `parentId=null` đơn lẻ.

Thiết kế Cây + Danh sách dựa trên cách HRIS thực tế tách nhu cầu “hiểu quan hệ báo cáo” và “quản trị dữ liệu lớn”. BambooHR mô tả org chart dùng để làm rõ vai trò, trách nhiệm và quan hệ giữa các nhóm; SAP yêu cầu chuyển hết nhân viên và xử lý các đơn vị con trước khi ngừng một đơn vị tổ chức:

- https://www.bamboohr.com/resources/hr-glossary/org-chart
- https://help.sap.com/docs/SAP_SUCCESSFACTORS_EMPLOYEE_CENTRAL/8d17bfe4103e84d059a35136c778ecdd/deactivate-organization-object
- https://help.sap.com/docs/ABAP_PLATFORM_NEW/121e5b11c7a54942bd1cbbc8ec242a53/4ef2f6cc7fdc5f86e10000000a42189b.html

## 3. Phân quyền đã xác minh

| Hành động | Permission FE kiểm tra | TENANT_ADMIN | HR_MANAGER | SITE_SUPERVISOR/EMPLOYEE |
|---|---|---:|---:|---:|
| Xem route/menu | `workspaces:list` hoặc `workspaces:read` | Có | Có | Ẩn/403 |
| Tạo | `workspaces:create` | Có | Có | Không |
| Sửa | `workspaces:update` | Có | Có | Không |
| Xóa | `workspaces:delete` | Có | Không | Không |
| Xem thành viên | `workspace_members:list` | Có | Có | Không |
| Gán | `workspace_members:create` | Có | Có | Không |
| Gỡ | `workspace_members:delete` | Có | Có | Không |
| Chuyển | create **và** delete membership | Có | Có | Không |

FE không hardcode nút Tạo/Sửa theo tên `TENANT_ADMIN`, vì migration backend đã cấp các permission tương ứng cho `HR_MANAGER`.

## 4. API contract đã kiểm tra

- `GET /tenants/{tenantId}/workspaces`: gửi `search`, `status`, `type`, `sortBy=name`, `sortDir=asc`, `page`, `size`.
- `GET /tenants/{tenantId}/workspaces/tree`: giữ node inactive và dùng counts ngay trong response.
- `POST /tenants/{tenantId}/workspaces`: form create.
- `PUT /tenants/{tenantId}/workspaces/{id}`: update và `clearParent`.
- `DELETE /tenants/{tenantId}/workspaces/{id}`: xóa mềm có điều kiện.
- `GET/POST /tenants/{tenantId}/workspaces/{id}/members`: list/gán thành viên.
- `DELETE /tenants/{tenantId}/workspaces/{id}/members/{memberId}`: gỡ membership.
- `POST /tenants/{tenantId}/workspaces/{sourceId}/members/{memberId}/transfer`: chuyển workspace và giữ role mặc định.
- `GET /tenants/{tenantId}/workspaces?type=department&status=active`: nguồn dropdown phòng ban trên form nhân viên.

Không còn lời gọi `/departments` trong mã nguồn Web.

## 5. Test và bằng chứng

File test: `tests/e2e/workspace-management.spec.ts`

| Kịch bản | Kết quả |
|---|---:|
| Cây + danh sách, search/filter/type/sort/pagination, counts, inactive warning và delete tooltip | PASS |
| Chuyển/gỡ nhân sự và xóa workspace gọi đúng endpoint/body | PASS |
| Form nhân viên lấy department active từ Workspace và gửi `departmentId` | PASS |
| HR Manager có Tạo/Sửa, không có Xóa; bỏ cha gửi `clearParent=true` | PASS |

Kết quả kiểm tra kỹ thuật:

- `npm run typecheck`: PASS
- `npm run lint`: PASS, không có error; còn warning cũ toàn dự án
- `npm run build -- --webpack`: PASS
- Workspace E2E trên bản production cuối: **4/4 PASS**
- Toàn bộ regression E2E trên bản production cuối: **37/37 PASS**

Bằng chứng ảnh:

- `docs/test-evidence/workspace-management/01-list-filter-inactive.png`
- `docs/test-evidence/workspace-management/02-member-and-delete-actions.png`
- `docs/test-evidence/workspace-management/03-employee-department-workspace.png`
- `docs/test-evidence/workspace-management/04-hr-permission-clear-parent.png`

## 6. Giới hạn backend đã biết

Backend hiện cache tên phòng ban ở `Employee.department`. Khi đổi tên một Workspace loại `department`, text cache này có thể chưa đổi cho tới lần hồ sơ nhân viên được cập nhật. FE không tự đồng bộ vì không có API bulk-sync và tài liệu backend xác định đây là hành vi đã biết.

Giới hạn này không chặn bàn giao nhóm tính năng hiện tại. Nếu cần tên phòng ban luôn nhất quán tức thời ở mọi báo cáo/danh sách, backend nên trả tên bằng join theo `departmentId` hoặc cung cấp cơ chế đồng bộ cache khi đổi tên workspace.

## 7. Trạng thái bàn giao

Web: hoàn thành và sẵn sàng test happy-path với backend thật.  
Backend: không cần chỉnh thêm để dùng các tính năng trong phạm vi tài liệu hiện tại.  
Mobile App: không cần thay đổi cho các thao tác quản trị Workspace.
