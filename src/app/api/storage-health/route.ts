import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createClient()
  const start = Date.now()

  try {
    // 1. Verify connection by listing active storage buckets
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
    if (listErr) {
      throw listErr
    }

    // 2. Test signed URL generation flow to verify key traversal
    const testPath = 'health-check-probe.txt'
    const { data: signedData, error: signErr } = await supabase.storage
      .from('temp-files')
      .createSignedUrl(testPath, 60)

    // A signed URL generation request checks parameters and signatures, and should succeed
    if (signErr && !signErr.message.includes('Object not found')) {
      throw signErr
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'storage',
      bucketsCount: buckets?.length || 0,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('❌ Storage Health Check Failed:', err)
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'storage',
        error: err.message || 'Storage API validation failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
