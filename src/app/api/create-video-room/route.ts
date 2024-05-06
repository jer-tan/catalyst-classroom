import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  //   const token = req.nextUrl.searchParams.get("token");
  //   if (!token) {
  //     return NextResponse.json(
  //       { error: 'Missing "token" query parameter' },
  //       { status: 400 }
  //     );
  //   }

  const authToken = process.env.VIDEOSDK_TOKEN;

  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: "POST",
    headers: {
      authorization: `${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const { roomId }: { roomId: string } = await res.json();

  return NextResponse.json({ room_id: roomId });
}
