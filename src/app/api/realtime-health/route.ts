import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()
  const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:5001'

  try {
    // Ping Express API to verify node and socket.io initialization
    const res = await fetch(`${expressUrl}/health`, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Express gateway returned HTTP ${res.status}`)
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'realtime',
      provider: 'socket.io',
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('❌ Realtime Health Check Failed:', err)
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'realtime',
        error: err.message || 'Realtime gateway connection timed out',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
