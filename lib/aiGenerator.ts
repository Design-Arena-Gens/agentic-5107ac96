import OpenAI from 'openai'

export interface RankingCriteria {
  popularity: number
  quality: number
  entertainment: number
  relevance: number
}

export interface VideoRanking {
  videoId: string
  title: string
  ranking: number
  score: number
  criteria: RankingCriteria
  reasoning: string
}

export class AIGenerator {
  private openai: OpenAI | null = null

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
  }

  async generateTitle(niche: string, count: number): Promise<string> {
    try {
      if (!this.openai) {
        return `Top ${count} ${niche} You Must See!`
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube title generator. Create catchy, engaging titles that get clicks.',
          },
          {
            role: 'user',
            content: `Generate a catchy YouTube title for a top ${count} ranking video about ${niche}. Keep it under 60 characters.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.8,
      })

      return completion.choices[0]?.message?.content?.trim() || `Top ${count} ${niche}`
    } catch (error) {
      console.error('Error generating title:', error)
      return `Top ${count} ${niche} You Must See!`
    }
  }

  async generateDescription(
    niche: string,
    count: number,
    videoTitles: string[]
  ): Promise<string> {
    try {
      if (!this.openai) {
        return this.getDefaultDescription(niche, count, videoTitles)
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube description writer. Create engaging descriptions with good SEO.',
          },
          {
            role: 'user',
            content: `Write a YouTube description for a top ${count} ranking video about ${niche}. Include the following videos:\n${videoTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nInclude timestamps, hashtags, and a call to action.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      })

      return completion.choices[0]?.message?.content?.trim() || this.getDefaultDescription(niche, count, videoTitles)
    } catch (error) {
      console.error('Error generating description:', error)
      return this.getDefaultDescription(niche, count, videoTitles)
    }
  }

  async generateTags(niche: string, count: number): Promise<string[]> {
    try {
      if (!this.openai) {
        return this.getDefaultTags(niche, count)
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube SEO expert. Generate relevant tags for better discoverability.',
          },
          {
            role: 'user',
            content: `Generate 15 relevant YouTube tags for a top ${count} ranking video about ${niche}. Return only the tags, comma-separated.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      })

      const tagsString = completion.choices[0]?.message?.content?.trim() || ''
      return tagsString.split(',').map(t => t.trim()).slice(0, 15)
    } catch (error) {
      console.error('Error generating tags:', error)
      return this.getDefaultTags(niche, count)
    }
  }

  async rankVideos(videos: any[], niche: string): Promise<VideoRanking[]> {
    // Simple ranking algorithm based on views, likes, and recency
    const rankings: VideoRanking[] = videos.map((video, index) => {
      const popularityScore = Math.min(video.viewCount / 1000000, 10) // Max 10 points
      const qualityScore = video.likeCount / Math.max(video.viewCount * 0.05, 1) * 10 // Like ratio
      const entertainmentScore = Math.random() * 10 // Placeholder
      const relevanceScore = 10 - index // First results are more relevant

      const totalScore = popularityScore + qualityScore + entertainmentScore + relevanceScore

      return {
        videoId: video.id,
        title: video.title,
        ranking: 0, // Will be set after sorting
        score: totalScore,
        criteria: {
          popularity: popularityScore,
          quality: qualityScore,
          entertainment: entertainmentScore,
          relevance: relevanceScore,
        },
        reasoning: `High popularity and engagement metrics`,
      }
    })

    // Sort by score and assign rankings
    rankings.sort((a, b) => b.score - a.score)
    rankings.forEach((r, i) => {
      r.ranking = i + 1
    })

    return rankings
  }

  async generateVoiceover(script: string): Promise<Buffer | null> {
    try {
      if (!this.openai) {
        return null
      }

      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: script,
      })

      const buffer = Buffer.from(await mp3.arrayBuffer())
      return buffer
    } catch (error) {
      console.error('Error generating voiceover:', error)
      return null
    }
  }

  private getDefaultDescription(niche: string, count: number, videoTitles: string[]): string {
    return `🎬 Check out our Top ${count} ${niche} ranking!\n\n` +
      `We've carefully selected and ranked the best ${niche} based on quality, popularity, and entertainment value.\n\n` +
      `📺 Timestamps:\n` +
      videoTitles.map((title, i) => `${i}:${i * 30} - #${i + 1} ${title}`).join('\n') +
      `\n\n💬 Which one is your favorite? Let us know in the comments!\n\n` +
      `👍 Don't forget to like and subscribe for more rankings!\n\n` +
      `#${niche.replace(/\s+/g, '')} #Top${count} #Ranking #Compilation`
  }

  private getDefaultTags(niche: string, count: number): string[] {
    return [
      niche,
      `top ${count}`,
      'ranking',
      'compilation',
      'best of',
      `${niche} compilation`,
      `top ${count} ${niche}`,
      'viral',
      'trending',
      'must watch',
      `${niche} ranking`,
      'countdown',
      `best ${niche}`,
      'entertainment',
      'popular',
    ]
  }
}

export default AIGenerator
