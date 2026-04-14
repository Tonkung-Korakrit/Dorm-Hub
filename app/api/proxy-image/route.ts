// api/proxy-image/route.ts

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) return new Response('Missing URL', { status: 400 });

  try {
    const response = await fetch(imageUrl); // Server คุยกับ Omise จะไม่ติด CORS
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response('Fetch Error', { status: 500 });
  }
}