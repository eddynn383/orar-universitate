// lib/uploadthing.ts

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define a route for teacher profile images
    teacherImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async () => {
            // Check if user is authenticated
            const session = await auth();

            if (!session?.user) {
                throw new UploadThingError("Unauthorized");
            }

            // Only ADMIN and SECRETAR can upload
            if (!["ADMIN", "SECRETAR"].includes(session.user.role)) {
                throw new UploadThingError("Nu aveți permisiunea de a încărca imagini");
            }

            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("File URL:", file.ufsUrl);

            // Return the file URL to be used in the form
            return { url: file.ufsUrl };
        }),

    // Define a route for user profile images
    userImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async () => {
            const session = await auth();

            if (!session?.user) {
                throw new UploadThingError("Unauthorized");
            }

            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.ufsUrl };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;