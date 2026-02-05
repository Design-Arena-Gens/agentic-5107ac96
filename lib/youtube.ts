import { google } from 'googleapis'

const youtube = google.youtube('v3')

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  viewCount: number
  likeCount: number
  commentCount: number
}

export class YouTubeService {
  private apiKey: string
  private oauth2Client: any

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || ''

    if (process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET) {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        'http://localhost:3000/api/auth/callback'
      )

      if (process.env.YOUTUBE_REFRESH_TOKEN) {
        this.oauth2Client.setCredentials({
          refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
        })
      }
    }
  }

  async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      const response = await youtube.search.list({
        key: this.apiKey,
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults,
        order: 'viewCount',
        videoDuration: 'medium', // 4-20 minutes
        relevanceLanguage: 'en',
      })

      const videoIds = response.data.items?.map(item => item.id?.videoId).filter((id): id is string => Boolean(id)) || []

      if (videoIds.length === 0) {
        return []
      }

      // Get detailed video information
      const videosResponse = await youtube.videos.list({
        key: this.apiKey,
        part: ['snippet', 'contentDetails', 'statistics'],
        id: videoIds,
      })

      const videos: YouTubeVideo[] = videosResponse.data.items?.map(item => ({
        id: item.id || '',
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        channelTitle: item.snippet?.channelTitle || '',
        publishedAt: item.snippet?.publishedAt || '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url || '',
        duration: item.contentDetails?.duration || '',
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        likeCount: parseInt(item.statistics?.likeCount || '0'),
        commentCount: parseInt(item.statistics?.commentCount || '0'),
      })) || []

      return videos
    } catch (error) {
      console.error('Error searching YouTube videos:', error)
      throw new Error('Failed to search YouTube videos')
    }
  }

  async uploadVideo(
    filePath: string,
    title: string,
    description: string,
    tags: string[],
    categoryId: string = '24'
  ): Promise<string> {
    try {
      if (!this.oauth2Client) {
        throw new Error('OAuth2 client not configured')
      }

      const fs = require('fs')
      const youtubeAuth = google.youtube({
        version: 'v3',
        auth: this.oauth2Client,
      })

      const response = await youtubeAuth.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
            tags,
            categoryId,
          },
          status: {
            privacyStatus: 'public',
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      })

      const videoId = response.data.id
      return `https://www.youtube.com/watch?v=${videoId}`
    } catch (error) {
      console.error('Error uploading video to YouTube:', error)
      throw new Error('Failed to upload video to YouTube')
    }
  }

  parseDuration(duration: string): number {
    // Parse ISO 8601 duration format (PT1H2M10S) to seconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    return hours * 3600 + minutes * 60 + seconds
  }
}

export default YouTubeService
