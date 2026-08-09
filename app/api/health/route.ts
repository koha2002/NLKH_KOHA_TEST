import { NextResponse } from "next/server";

// Render uses this endpoint to determine whether the Node process is ready.
// Keep it independent of Supabase, R2 and all optional configuration so a
// missing integration can never stop the application itself from deploying.
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "nlkh-koha",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
