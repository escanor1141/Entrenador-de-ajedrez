import { DrillClient } from "./DrillClient";

export default function DrillPage({
  params,
  searchParams,
}: {
  params: Promise<{ repertoireId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <DrillClient params={params} searchParams={searchParams} />;
}
