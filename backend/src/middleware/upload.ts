import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer, { MulterError } from "multer";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { _file } from "zod/v4/core";

export const UPLOAD_ROOT = path.resolve(__dirname, "../../uploads");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const ALLOWED_MIME_TYPES = Object.keys(MIME_EXTENSIONS);

function ensureDirExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function createImageUploader(subfolder: string) {
  const destination = path.join(UPLOAD_ROOT, subfolder);
  ensureDirExists(destination);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      const ext = MIME_EXTENSIONS[file.mimetype] ?? "";
      cb(null, `${randomUUID()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req: Request, file, cb) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(
          new Error(
            `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
          ),
        );
        return;
      }

      cb(null, true);
    },
  });
}

export function handleUploadErrors(
  uploadMiddleware: RequestHandler,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err: unknown) => {
      if (!err) {
        return next();
      }

      if (err instanceof MulterError) {
        return res
          .status(400)
          .json({ message: `Upload error: ${err.message}` });
      }

      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }

      return res.status(400).json({ message: "Upload failed" });
    });
  };
}
