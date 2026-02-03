import { useState, useRef, useEffect } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const recordedFile = new File([blob], "recording.webm", { type: 'audio/webm' })
        setFile(recordedFile)
        setResult(null)
        setError(null)

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 20) {
            stopRecording()
            return 20
          }
          return prev + 1
        })
      }, 1000)

    } catch (err) {
      setError("Microphone access denied or error: " + err.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    clearInterval(timerRef.current)
  }

  // Auto-stop effect
  useEffect(() => {
    if (recordingTime >= 20 && isRecording) {
      stopRecording()
    }
  }, [recordingTime, isRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('audio', file)

    try {
      // Use environment variable for backend URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/trial`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    return `0:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-gray-100 border border-gray-300 rounded-lg p-8 shadow-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            AI Voice Intelligence
          </h1>
          <p className="text-gray-600">Linguistic Intent Extraction Trial</p>
        </div>

        {/* Upload Section */}
        <div className="flex flex-col items-center gap-6 mb-8">

          {/* Recording Area */}
          <div className="w-full flex flex-col items-center gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all
                ${isRecording
                  ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'}
              `}
            >
              {isRecording ? (
                <>
                  <span className="w-3 h-3 bg-white rounded-sm"></span>
                  Stop Recording
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
                  Start Recording
                </>
              )}
            </button>

            {/* Timer */}
            {(isRecording || recordingTime > 0) && (
              <div className="font-mono text-sm text-gray-700">
                {formatTime(recordingTime)} / 0:20
              </div>
            )}

            {/* Auto-stop message */}
            {recordingTime >= 20 && !isRecording && (
              <p className="text-xs text-orange-600 italic">Recording auto-stopped at 20s</p>
            )}
          </div>

          <div className="w-full flex items-center gap-3">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="text-xs text-gray-400 font-bold uppercase">OR Upload</span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>

          <div className="w-full">
            <label
              htmlFor="audio-upload"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white transition-colors
                ${file ? 'border-green-500' : 'border-gray-300 hover:border-gray-400'}
              `}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <p className="text-sm text-green-600 font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Click to upload audio</p>
                    <p className="text-xs text-gray-400 mt-1">MP3, WAV, M4A</p>
                  </>
                )}
              </div>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isRecording}
              />
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading || isRecording}
            className={`
              w-full py-3 rounded-md font-medium text-sm
              ${!file || loading || isRecording
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
              }
            `}
          >
            {loading ? "Processing..." : "Extract Intent"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 mb-6 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
            Error: {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Latency Stats */}
            <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
              <span className="text-sm text-gray-600">Latency:</span>
              <span className="font-bold text-gray-900">{result.latency_ms} ms</span>
            </div>

            {/* Transcription */}
            <div className="bg-white p-4 rounded border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Transcription</h3>
              <p className="text-gray-800 text-sm">"{result.transcription}"</p>
            </div>

            {/* JSON Intent */}
            <div className="bg-white p-4 rounded border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Extracted Intent</h3>
              <pre className="text-xs text-gray-800 overflow-x-auto font-mono bg-gray-50 p-2 rounded">
                {JSON.stringify(result.intent, null, 2)}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
