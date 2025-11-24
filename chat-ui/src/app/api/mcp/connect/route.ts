import { NextRequest, NextResponse } from 'next/server';
import { connectToMCP } from '@/lib/mcp-client';

export async function POST(request: NextRequest) {
  const serverUrl =
    process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3000/sse';
  const apiKey = process.env.MCP_API_KEY;

  const result = await connectToMCP(serverUrl, apiKey);

  return NextResponse.json(result);
}
