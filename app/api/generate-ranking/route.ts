import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { jobs } from '@/lib/data/jobStore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { niche, videoCount, title, description, autoPublish } = body

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      )
    }

    const jobId = uuidv4()

    // Create job entry
    jobs.set(jobId, {
      id: jobId,
      status: 'processing',
      niche,
      videoCount: videoCount || 5,
      title,
      description,
      autoPublish,
      message: 'Initializing video generation...',
      createdAt: new Date().toISOString(),
    })

    // Start background processing (async)
    processVideoGeneration(jobId, niche, videoCount, title, description, autoPublish)
      .catch(error => {
        console.error('Background processing error:', error)
        const job = jobs.get(jobId)
        if (job) {
          job.status = 'error'
          job.message = `Error: ${error.message}`
        }
      })

    return NextResponse.json({
      jobId,
      message: 'Video generation started',
    })
  } catch (error: any) {
    console.error('Error in generate-ranking:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processVideoGeneration(
  jobId: string,
  niche: string,
  videoCount: number,
  title: string,
  description: string,
  autoPublish: boolean
) {
  const job = jobs.get(jobId)

  try {
    // Step 1: Search for videos
    job.message = 'Searching for videos in niche...'
    const videos = await searchVideos(niche, videoCount)

    // Step 2: Download and process clips
    job.message = 'Processing video clips...'
    const clips = await processClips(videos)

    // Step 3: Generate ranking video
    job.message = 'Compiling ranking video...'
    const videoPath = await compileRankingVideo(clips, videoCount)

    // Step 4: Generate metadata
    job.message = 'Generating metadata...'
    const metadata = await generateMetadata(niche, title, description, videoCount)

    // Step 5: Upload to YouTube (if enabled)
    if (autoPublish) {
      job.message = 'Uploading to YouTube...'
      const videoUrl = await uploadToYouTube(videoPath, metadata)
      job.videoUrl = videoUrl
      job.message = 'Successfully published to YouTube!'
    } else {
      job.message = 'Video generated successfully (not published)'
      job.videoUrl = `/download/${videoPath}`
    }

    job.status = 'completed'
  } catch (error: any) {
    job.status = 'error'
    job.message = `Error: ${error.message}`
    throw error
  }
}

async function searchVideos(niche: string, count: number) {
  // Simulate YouTube API search
  // In production, use actual YouTube Data API v3
  const mockVideos = Array.from({ length: count }, (_, i) => ({
    id: `video_${i + 1}`,
    title: `${niche} - Example ${i + 1}`,
    url: `https://youtube.com/watch?v=example${i + 1}`,
    duration: Math.floor(Math.random() * 300) + 60,
    views: Math.floor(Math.random() * 1000000),
    thumbnail: `https://i.ytimg.com/vi/example${i + 1}/hqdefault.jpg`,
  }))

  return mockVideos
}

async function processClips(videos: any[]) {
  // Simulate clip extraction
  // In production, use ffmpeg or video processing service
  return videos.map((video, i) => ({
    ...video,
    clipPath: `/clips/clip_${i + 1}.mp4`,
    ranking: i + 1,
  }))
}

async function compileRankingVideo(clips: any[], count: number) {
  // Simulate video compilation
  // In production, use ffmpeg to combine clips with overlays
  await new Promise(resolve => setTimeout(resolve, 2000))
  return `ranking_top${count}_${Date.now()}.mp4`
}

async function generateMetadata(
  niche: string,
  title: string,
  description: string,
  count: number
) {
  // Use AI to generate title and description if not provided
  const generatedTitle = title || `Top ${count} ${niche} You Need to See!`
  const generatedDescription = description ||
    `Check out these amazing ${niche}! We've ranked the top ${count} based on quality, popularity, and entertainment value. Which one is your favorite? Let us know in the comments!\n\n#${niche.replace(/\s+/g, '')} #Top${count} #Ranking`

  return {
    title: generatedTitle,
    description: generatedDescription,
    tags: [niche, `top${count}`, 'ranking', 'compilation'],
    categoryId: '24', // Entertainment
  }
}

async function uploadToYouTube(videoPath: string, metadata: any) {
  // Simulate YouTube upload
  // In production, use Google YouTube Data API v3
  await new Promise(resolve => setTimeout(resolve, 3000))
  const mockVideoId = `yt_${Date.now()}`
  return `https://www.youtube.com/watch?v=${mockVideoId}`
}
