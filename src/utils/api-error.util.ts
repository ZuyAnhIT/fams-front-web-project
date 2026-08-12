import { isAxiosError } from "axios";

interface ApiErrorBody {
  message?: string;
  userMessage?: string;
  errorCode?: string;
  details?: unknown;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  return error.response?.data?.userMessage
    || error.response?.data?.message
    || (error.response?.data?.details ? JSON.stringify(error.response.data.details) : undefined)
    || error.message
    || fallback;
}

export function getApiErrorBody(error: unknown): ApiErrorBody | undefined {
  return isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined;
}
