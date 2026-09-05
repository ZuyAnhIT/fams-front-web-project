import BillingResultPage from "@/features/shared/billing/components/BillingResultPage";

export const metadata = { title: "Kết quả thanh toán | FAMS" };

export default async function PaymentResultRoute({
  searchParams,
}: {
  searchParams: Promise<{ billingOrderId?: string }>;
}) {
  const { billingOrderId } = await searchParams;
  return <BillingResultPage orderId={billingOrderId} />;
}
