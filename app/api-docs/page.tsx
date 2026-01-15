'use client';

import { useEffect } from 'react';

export default function ApiDocsPage() {
  useEffect(() => {
    // Dynamically load Swagger UI CSS and JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      // @ts-ignore - SwaggerUIBundle is loaded from CDN
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          // @ts-ignore
          SwaggerUIBundle.presets.apis,
          // @ts-ignore
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'list',
        filter: true,
        tryItOutEnabled: true,
      });
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Documentație API - Orar Universitate</h1>
          <p className="text-muted-foreground">
            Explorează și testează endpoint-urile API pentru sistemul de management al orarului universitar
          </p>
        </div>
        <div id="swagger-ui" className="swagger-ui-container"></div>
      </div>
      <style jsx global>{`
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
      `}</style>
    </div>
  );
}
