/**
 * Bỏ dấu tiếng Việt để so khớp tìm kiếm không phân biệt dấu — người dùng Việt thường gõ tắt
 * không dấu khi tìm nhanh (VD "cong ty rong vang" thay vì "Công ty CP Rồng Vàng"). Antd
 * Select's mặc định `optionFilterProp` chỉ so khớp chuỗi con nguyên văn, không tự bỏ dấu, nên
 * gõ không dấu sẽ ra 0 kết quả dù công ty/role/nhân viên đó thực sự tồn tại.
 */
export function stripVietnameseDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** True if `haystack` contains `needle` ignoring Vietnamese diacritics and case. */
export function matchesVietnameseSearch(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return stripVietnameseDiacritics(haystack).includes(stripVietnameseDiacritics(needle));
}
