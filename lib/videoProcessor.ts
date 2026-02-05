import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs'

const execAsync = promisify(exec)

export interface VideoClip {
  id: string
  title: string
  url: string
  startTime: number
  duration: number
  ranking: number
}

export class VideoProcessor {
  private outputDir: string

  constructor(outputDir: string = '/tmp/videos') {
    this.outputDir = outputDir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
  }

  async downloadVideo(url: string, outputPath: string): Promise<string> {
    try {
      // Use yt-dlp to download video
      const command = `yt-dlp -f "best[height<=720]" -o "${outputPath}" "${url}"`
      await execAsync(command)
      return outputPath
    } catch (error) {
      console.error('Error downloading video:', error)
      throw new Error('Failed to download video')
    }
  }

  async extractClip(
    videoPath: string,
    startTime: number,
    duration: number,
    outputPath: string
  ): Promise<string> {
    try {
      // Use ffmpeg to extract clip
      const command = `ffmpeg -i "${videoPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}"`
      await execAsync(command)
      return outputPath
    } catch (error) {
      console.error('Error extracting clip:', error)
      throw new Error('Failed to extract video clip')
    }
  }

  async addTextOverlay(
    videoPath: string,
    text: string,
    position: string,
    outputPath: string
  ): Promise<string> {
    try {
      // Add text overlay using ffmpeg
      const fontfile = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
      const command = `ffmpeg -i "${videoPath}" -vf "drawtext=text='${text}':fontfile=${fontfile}:fontsize=48:fontcolor=white:bordercolor=black:borderw=3:x=(w-text_w)/2:y=50" -codec:a copy "${outputPath}"`
      await execAsync(command)
      return outputPath
    } catch (error) {
      console.error('Error adding text overlay:', error)
      // Fallback without text overlay if font not available
      fs.copyFileSync(videoPath, outputPath)
      return outputPath
    }
  }

  async createRankingVideo(clips: VideoClip[], outputPath: string): Promise<string> {
    try {
      const tempDir = path.join(this.outputDir, 'temp_' + Date.now())
      fs.mkdirSync(tempDir, { recursive: true })

      const processedClips: string[] = []

      // Process each clip with ranking overlay
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i]
        const clipPath = path.join(tempDir, `clip_${i}.mp4`)
        const overlayPath = path.join(tempDir, `overlay_${i}.mp4`)

        // Download video (in production)
        // For demo, we'll simulate with placeholder
        console.log(`Processing clip ${i + 1}: ${clip.title}`)

        // Add ranking number overlay
        const rankingText = `#${clip.ranking} - ${clip.title}`
        // await this.addTextOverlay(clipPath, rankingText, 'top', overlayPath)

        // For now, just add to list
        // processedClips.push(overlayPath)
      }

      // Concatenate all clips
      // const concatFile = path.join(tempDir, 'concat.txt')
      // const concatContent = processedClips.map(p => `file '${p}'`).join('\n')
      // fs.writeFileSync(concatFile, concatContent)

      // const command = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}"`
      // await execAsync(command)

      // Cleanup temp files
      // fs.rmSync(tempDir, { recursive: true, force: true })

      return outputPath
    } catch (error) {
      console.error('Error creating ranking video:', error)
      throw new Error('Failed to create ranking video')
    }
  }

  async addIntroOutro(
    videoPath: string,
    introText: string,
    outroText: string,
    outputPath: string
  ): Promise<string> {
    try {
      // Create intro and outro clips
      const tempDir = path.dirname(videoPath)
      const introPath = path.join(tempDir, 'intro.mp4')
      const outroPath = path.join(tempDir, 'outro.mp4')

      // Generate intro (5 seconds)
      const introCommand = `ffmpeg -f lavfi -i color=c=black:s=1280x720:d=5 -vf "drawtext=text='${introText}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" "${introPath}"`
      // await execAsync(introCommand)

      // Generate outro (5 seconds)
      const outroCommand = `ffmpeg -f lavfi -i color=c=black:s=1280x720:d=5 -vf "drawtext=text='${outroText}':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" "${outroPath}"`
      // await execAsync(outroCommand)

      // Concatenate intro + video + outro
      // const concatFile = path.join(tempDir, 'final_concat.txt')
      // fs.writeFileSync(concatFile, `file '${introPath}'\nfile '${videoPath}'\nfile '${outroPath}'`)

      // const command = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}"`
      // await execAsync(command)

      return outputPath
    } catch (error) {
      console.error('Error adding intro/outro:', error)
      throw new Error('Failed to add intro/outro')
    }
  }

  async compressVideo(inputPath: string, outputPath: string): Promise<string> {
    try {
      // Compress video for faster upload
      const command = `ffmpeg -i "${inputPath}" -vcodec libx264 -crf 23 -preset medium -acodec aac -b:a 128k "${outputPath}"`
      await execAsync(command)
      return outputPath
    } catch (error) {
      console.error('Error compressing video:', error)
      throw new Error('Failed to compress video')
    }
  }
}

export default VideoProcessor
