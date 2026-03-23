import { DashboardClient } from "./DashboardClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { username } = await params;
  
  return <DashboardClient username={decodeURIComponent(username)} />;
}
