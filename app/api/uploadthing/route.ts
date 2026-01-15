// app/api/uploadthing/route.ts

import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
    config: {
        // Optional: Configure callback URL for production
        // callbackUrl: process.env.UPLOADTHING_CALLBACK_URL,
    },
});