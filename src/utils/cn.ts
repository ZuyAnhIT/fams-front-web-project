import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Kết hợp clsx và tailwind-merge để xử lý class Tailwind một cách thông minh.
 * - clsx: Cho phép truyền class dạng chuỗi, mảng, object có điều kiện.
 * - twMerge: Tự động ghi đè các class Tailwind bị xung đột (ví dụ: p-2 và p-4 → p-4).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
