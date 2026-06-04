import { NextResponse } from 'next/server';
import { fetchStream } from '@/lib/stream';

export const dynamic = 'force-dynamic';

// Live activity feed for the Live Research page. Pulls the Recursiv-backed source
// (or committed snapshot) so an open page can poll for new swarm events.
export async function GET() {
  const events = await fetchStream();
  return NextResponse.json(
    { events },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
