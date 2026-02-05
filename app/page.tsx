'use client'

import { useState } from 'react'

interface VideoJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  niche: string
  message: string
  videoUrl?: string
  createdAt: string
}

export default function Home() {
  const [niche, setNiche] = useState('')
  const [videoCount, setVideoCount] = useState(5)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<VideoJob[]>([])
  const [autoPublish, setAutoPublish] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/generate-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche,
          videoCount,
          title,
          description,
          autoPublish,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const newJob: VideoJob = {
          id: data.jobId,
          status: 'processing',
          niche,
          message: 'Video generation started',
          createdAt: new Date().toISOString(),
        }
        setJobs([newJob, ...jobs])

        // Poll for status
        pollJobStatus(data.jobId)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start video generation')
    } finally {
      setLoading(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/job-status?jobId=${jobId}`)
        const data = await response.json()

        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: data.status,
                  message: data.message,
                  videoUrl: data.videoUrl,
                }
              : job
          )
        )

        if (data.status === 'completed' || data.status === 'error') {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Error polling status:', error)
        clearInterval(interval)
      }
    }, 5000)
  }

  const handleSchedule = async () => {
    try {
      const response = await fetch('/api/schedule-autopilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: true,
          interval: 'daily',
          niche,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Autopilot scheduled successfully!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to schedule autopilot')
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🎬 YouTube Ranking Video Autopilot</h1>
        <p>Generate Top 5 Ranking Videos Automatically</p>
      </div>

      <div className="card">
        <h2>Create Ranking Video</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="niche">Video Niche / Topic</label>
            <input
              type="text"
              id="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g., Gaming moments, Tech reviews, Food recipes"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="videoCount">Number of Items to Rank</label>
            <select
              id="videoCount"
              value={videoCount}
              onChange={(e) => setVideoCount(Number(e.target.value))}
            >
              <option value={3}>Top 3</option>
              <option value={5}>Top 5</option>
              <option value={10}>top 10</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Video Title (Optional)</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-generated if left empty"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Video Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Auto-generated if left empty"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                style={{ width: 'auto', marginRight: '0.5rem' }}
              />
              Auto-publish to YouTube
            </label>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Ranking Video'}
          </button>
        </form>

        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={handleSchedule}
            className="btn"
            style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
          >
            🤖 Enable Autopilot Mode
          </button>
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="card">
          <h2>Video Generation Jobs</h2>
          <div className="status-section">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`status-item ${job.status}`}
              >
                <h4>
                  {job.niche} - Top {videoCount}
                </h4>
                <p>
                  <strong>Status:</strong> {job.status}
                </p>
                <p>
                  <strong>Message:</strong> {job.message}
                </p>
                {job.videoUrl && (
                  <p>
                    <strong>Video URL:</strong>{' '}
                    <a
                      href={job.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#667eea' }}
                    >
                      View on YouTube
                    </a>
                  </p>
                )}
                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                  Started: {new Date(job.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>How It Works</h2>
        <div className="grid-2">
          <div className="info-box">
            <h4>1. Search & Collect</h4>
            <p>Finds trending videos in your niche using YouTube API</p>
          </div>
          <div className="info-box">
            <h4>2. AI Analysis</h4>
            <p>Uses AI to select the best clips and rank them</p>
          </div>
          <div className="info-box">
            <h4>3. Video Compilation</h4>
            <p>Automatically edits clips together with rankings</p>
          </div>
          <div className="info-box">
            <h4>4. Auto-Upload</h4>
            <p>Publishes to YouTube with optimized metadata</p>
          </div>
        </div>
      </div>
    </div>
  )
}
