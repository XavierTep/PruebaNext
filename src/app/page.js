'use client';
import { useState, useEffect } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState(''); // Estado para la URL del PDF
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }, []);

  const handleInterpretClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!pdfUrl) {
        throw new Error('Por favor, ingresa una URL de PDF válida.');
      }

      // 1. Cargar el PDF con pdf.js
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      // 2. Renderizar la página como imagen
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      // 3. Convertir la imagen a Data URL (base64)
      const imageBase64 = canvas.toDataURL('image/png');

      // 4. Enviar la solicitud a la API de OpenAI (formato JSON)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_APIKEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', 
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente que puede interpretar imágenes y texto.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64
                  }
                },
                {
                  type: 'text',
                  text: "En la situación en la que yo te presente esta imagen como ejemplo y mi petición es que 'me interpretes esta imagen y extraigas los datos', tu debes devolverme los datos en formato json. Quiero que respondas únicamente mostrándome el json."
                }
              ]
            }
          ],
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.error?.message || 'Error desconocido en la API de OpenAI');
      }

      const data = await response.json();
      console.log(data);

      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const jsonStartIndex = data.choices[0].message.content.indexOf('{');
        const jsonEndIndex = data.choices[0].message.content.lastIndexOf('}') + 1;

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          const extractedJson = data.choices[0].message.content.substring(jsonStartIndex, jsonEndIndex).trim();
          setApiResponse(JSON.stringify(JSON.parse(extractedJson), null, 2));
        } else {
          setApiResponse(JSON.stringify(data, null, 2)); 
        }
      } else {
        throw new Error('La respuesta de la API no tiene el formato esperado.');
      }
    } catch (error) {
      console.error('Error al interpretar el PDF:', error);
      setError(error.message); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Interpretador de PDFs</h1>

      <input 
        type="text" 
        placeholder="Ingresa la URL del PDF"
        value={pdfUrl}
        onChange={(e) => setPdfUrl(e.target.value)} 
      />

      <button onClick={handleInterpretClick} disabled={isLoading}>
        {isLoading ? 'Interpretando...' : 'Interpretar'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {apiResponse && (
        <div>
          <h2>Respuesta del API:</h2>
          <pre>{apiResponse}</pre>
        </div>
      )}
    </div>
  );
}
