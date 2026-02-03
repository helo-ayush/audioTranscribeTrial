import { useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('audio', file)

    try {
      // Assuming server runs on port 3000
      const response = await fetch('/api/trial', {
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
              <input id="audio-upload" type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`
              w-full py-3 rounded-md font-medium text-sm
              ${!file || loading
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
