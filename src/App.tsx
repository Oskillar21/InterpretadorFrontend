"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, FileText, Download, Video, Loader2, AlertCircle } from "lucide-react"

interface TranscriptionResult {
  message: string
  transcription: string
  resume: string
  video_path: string
  audio_path: string
}

interface ErrorResult {
  error: string
}

function App() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("video/")) {
        setUploadedFile(file)
        processVideo(file)
      } else {
        setError("Por favor, sube solo archivos de video")
      }
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith("video/")) {
        setUploadedFile(file)
        processVideo(file)
      } else {
        setError("Por favor, sube solo archivos de video")
      }
    }
  }

  const processVideo = async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Reemplaza esta URL con la URL de tu backend
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })

      const data: TranscriptionResult | ErrorResult = await response.json()

      if ("error" in data) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError("Error al conectar con el servidor. Verifica que tu backend esté ejecutándose.")
      console.error("Error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetApp = () => {
    setUploadedFile(null)
    setResult(null)
    setError(null)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Transcriptor de Videos</h1>
          <p className="text-gray-600">Sube tu video y obtén la transcripción completa y un resumen automático</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadedFile ? (
                <div className="space-y-4">
                  <Video className="mx-auto h-12 w-12 text-green-500" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={resetApp}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Subir otro video
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">Arrastra tu video aquí</p>
                    <p className="text-sm text-gray-500">o haz clic para seleccionar un archivo</p>
                  </div>
                  <input type="file" accept="video/*" onChange={handleFileInput} className="hidden" id="video-upload" />
                  <label htmlFor="video-upload">
                    <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                      Seleccionar Video
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p className="text-lg font-medium text-gray-900">Procesando video...</p>
              <p className="text-sm text-gray-500">Esto puede tomar unos minutos dependiendo del tamaño del archivo</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isProcessing && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-medium">{result.message}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Transcription */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <FileText className="h-5 w-5" />
                    Transcripción Completa
                  </h2>
                  <button
                    onClick={() => downloadText(result.transcription, "transcripcion-completa.txt")}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </button>
                </div>
                <div className="p-4">
                  <textarea
                    value={result.transcription}
                    readOnly
                    className="w-full h-80 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="La transcripción aparecerá aquí..."
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <FileText className="h-5 w-5" />
                    Resumen
                  </h2>
                  <button
                    onClick={() => downloadText(result.resume, "resumen.txt")}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </button>
                </div>
                <div className="p-4">
                  <textarea
                    value={result.resume}
                    readOnly
                    className="w-full h-80 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="El resumen aparecerá aquí..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
