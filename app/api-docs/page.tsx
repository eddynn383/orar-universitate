'use client';

import { H1, P } from '@/components/Typography';
import { Suspense, useEffect } from 'react';
import { Skeleton } from '@/components/Skeleton';

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
        <div className="content grid grid-rows-[auto_1fr] h-full overflow-hidden">
            <div className="flex flex-col items-center border-b bg-primary-200 border-primary-300 padding-l p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end w-full max-w-7xl">
                    <div className="flex flex-col gap-2">
                        <H1 className="text-left text-2xl">Documentație API - Orar Universitate</H1>
                        <P className="text-base [&:not(:first-child)]:mt-0">Explorează și testează endpoint-urile API pentru sistemul de management al orarului universitar</P>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center border-b border-primary-200 padding-l py-8 px-6 overflow-auto">
                <div className="flex flex-col gap-1 w-full max-w-7xl h-full">
                    <div className="flex flex-col gap-8 w-full pb-8">
                        <Suspense fallback={
                            <div className="space-y-4 w-full">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-64 w-full" />
                                <Skeleton className="h-48 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        }>
                            <div id="swagger-ui" className="swagger-ui-container"></div>
                        </Suspense>
                    </div>
                </div>
            </div>
            <style jsx global>
                {`
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
            `}
            </style>
        </div>
    );
}
