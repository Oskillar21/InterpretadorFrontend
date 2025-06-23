import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Aquí debes integrar con tu backend
    // Por ejemplo, enviando el archivo a tu API de procesamiento

    // Ejemplo de cómo podrías enviar a tu backend:
    /*
    const backendFormData = new FormData()
    backendFormData.append('video', file)
    
    const backendResponse = await fetch('http://tu-backend-url/process-video', {
      method: 'POST',
      body: backendFormData,
    })
    
    const result = await backendResponse.json()
    
    return NextResponse.json({
      fullText: result.fullText,
      summary: result.summary
    })
    */

    // Para demo, devolvemos datos simulados
    return NextResponse.json({
      fullText: `Transcripción completa del video "${file.name}": Este es un ejemplo de cómo aparecería el texto completo transcrito de tu video. Aquí se mostraría toda la conversación, narración o contenido de audio presente en el video subido.`,
      summary: `Resumen del video "${file.name}": Este es un ejemplo del resumen generado automáticamente. Los puntos principales del video serían extraídos y presentados de manera concisa.`,
    })
  } catch (error) {
    console.error("Error processing video:", error)
    return NextResponse.json({ error: "Error processing video" }, { status: 500 })
  }
}
