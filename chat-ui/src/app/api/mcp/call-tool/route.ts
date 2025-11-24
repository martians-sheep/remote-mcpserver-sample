import { NextRequest, NextResponse } from 'next/server';
import { callMCPTool } from '@/lib/mcp-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolName, arguments: args } = body;

    if (!toolName) {
      return NextResponse.json(
        { success: false, error: 'toolNameが指定されていません' },
        { status: 400 }
      );
    }

    const result = await callMCPTool(toolName, args || {});

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
