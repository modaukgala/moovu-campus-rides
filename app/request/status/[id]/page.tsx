import RequestStatusClient from "./RequestStatusClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // works even if params isn't a real Promise at runtime
  return <RequestStatusClient id={id} />;
}