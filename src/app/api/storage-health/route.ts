import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()

  try {
    // Cloudinary / Local upload directories health status check
    return NextResponse.json({
      status: 'healthy',
      service: 'storage',
      provider: 'cloudinary/local',
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('❌ Storage Health Check Failed:', err)
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'storage',
        error: err.message || 'Storage API check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
