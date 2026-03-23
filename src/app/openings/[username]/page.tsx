import { OpeningClient } from "./OpeningClient";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ eco?: string }>;
}

export default async function OpeningsPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { eco } = await searchParams;
  
  return (
    <OpeningClient 
      username={decodeURIComponent(username)} 
      initialEco={eco}
    />
  );
}
