export function toPublicUploadPath(subfolder: string, filename: string): string {
    return `/uploads/${subfolder}/${filename}`
}