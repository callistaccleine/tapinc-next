import OrderDetails from "@/components/OrderDetails";

interface Props {
  params: { id: string };  
}

export default function OrderDetailsPage({ params }: Props) {
  return <OrderDetails orderId={params.id} />;
}
