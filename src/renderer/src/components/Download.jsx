import React, { useState, useRef } from 'react'
import axios from 'axios'

const DownloadManager = () => {
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [receivedBytes, setReceivedBytes] = useState(0)
  const totalBytes = useRef(0)
  const controller = useRef(null)

  const startDownload = async () => {
    console.log(receivedBytes)
    controller.current = new AbortController()
    try {
      const response = await axios.get('http://localhost:5000/download', {
        responseType: 'blob',
        headers: { Range: `bytes=${receivedBytes}-` },
        onDownloadProgress: (progressEvent) => {
          const { loaded } = progressEvent
          setDownloadProgress(Math.round(((receivedBytes + loaded) / totalBytes.current) * 100))
        },
        signal: controller.current.signal
      })
      console.log("after response function");
      const contentRange = response.headers['content-range']
      if (contentRange) {
        const totalMatch = contentRange.match(/\/(\d+)/)
        if (totalMatch) {
          totalBytes.current = parseInt(totalMatch[1], 10)
        }
      }

      setReceivedBytes(receivedBytes + response.data.size)

      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'large-file.zip'
      a.click()
      window.URL.revokeObjectURL(url)

      setDownloadProgress(100)
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Download paused')
      } else {
        console.error('Download failed', error)
      }
    }
  }

  const pauseDownload = () => {
    if (controller.current) {
      controller.current.abort()
      setIsPaused(true)
    }
  }

  const resumeDownload = () => {
    setIsPaused(false)
    startDownload()
  }

  return (
    <div>
      <h1>File Download with Pause and Resume</h1>
      <p>Download Progress: {downloadProgress}%</p>
      <button onClick={startDownload} disabled={!isPaused && downloadProgress > 0}>
        Start Download
      </button>
      <button onClick={pauseDownload} disabled={isPaused || downloadProgress === 0}>
        Pause
      </button>
      <button onClick={resumeDownload} disabled={!isPaused}>
        Resume
      </button>
    </div>
  )
}

export default DownloadManager
