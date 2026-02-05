import { NextRequest, NextResponse } from 'next/server'
import { jobs } from '@/lib/data/jobStore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const job = jobs.get(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: job.status,
      message: job.message,
      videoUrl: job.videoUrl,
      createdAt: job.createdAt,
    })
  } catch (error: any) {
    console.error('Error in job-status:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
