import TripDetailsClient from "./TripDetailsClient";

export default async function TripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TripDetailsClient id={id} />;
}