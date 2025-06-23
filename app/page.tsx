"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, Download, Video, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function VideoTranscriptionApp() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fullText, setFullText] = useState("")
  const [summary, setSummary] = useState("")

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
        alert("Por favor, sube solo archivos de video")
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
        alert("Por favor, sube solo archivos de video")
      }
    }
  }

  const processVideo = async (file: File) => {
    setIsProcessing(true)
    setFullText("")
    setSummary("")

    try {
      const formData = new FormData()
      formData.append("video", file)

      // Aquí debes reemplazar con la URL de tu backend
      const response = await fetch("/api/process-video", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFullText(data.fullText || "Texto completo generado aquí...")
        setSummary(data.summary || "Resumen generado aquí...")
      } else {
        throw new Error("Error al procesar el video")
      }
    } catch (error) {
      console.error("Error:", error)
      // Para demo, simulamos datos
      setTimeout(() => {
        setFullText(
          "Este es un ejemplo del texto completo transcrito del video. Aquí aparecería toda la transcripción completa del contenido de audio del video subido por el usuario.",
        )
        setSummary(
          "Este es un ejemplo del resumen generado. Aquí aparecería un resumen conciso de los puntos principales del video.",
        )
      }, 2000)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" })
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
    setFullText("")
    setSummary("")
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
        <Card className="mb-8">
          <CardContent className="p-8">
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
                  <Button onClick={resetApp} variant="outline">
                    Subir otro video
                  </Button>
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
                    <Button asChild className="cursor-pointer">
                      <span>Seleccionar Video</span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Processing Indicator */}
        {isProcessing && (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p className="text-lg font-medium text-gray-900">Procesando video...</p>
              <p className="text-sm text-gray-500">Esto puede tomar unos minutos dependiendo del tamaño del archivo</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {(fullText || summary) && !isProcessing && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Full Text */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Texto Completo
                </CardTitle>
                <Button
                  onClick={() => downloadText(fullText, "transcripcion-completa.txt")}
                  size="sm"
                  variant="outline"
                  className="bg-white text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={fullText}
                  readOnly
                  className="min-h-[300px] resize-none"
                  placeholder="El texto completo aparecerá aquí..."
                />
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumen
                </CardTitle>
                <Button
                  onClick={() => downloadText(summary, "resumen.txt")}
                  size="sm"
                  variant="outline"
                  className="bg-white text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={summary}
                  readOnly
                  className="min-h-[300px] resize-none"
                  placeholder="El resumen aparecerá aquí..."
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
