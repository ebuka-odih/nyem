import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

export async function compressAndConvertImage(file: File): Promise<File> {
    let processingFile = file;

    // 1. Convert HEIC to JPEG if needed
    if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
        try {
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });

            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            processingFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
            });
        } catch (error) {
            console.error('HEIC conversion failed:', error);
            // Fallback to original file if conversion fails
        }
    }

    // 2. Compress the image
    const options = {
        maxSizeMB: 0.8, // Target size under 800KB
        maxWidthOrHeight: 1200, // Reasonable resolution for profile photo
        useWebWorker: true,
        initialQuality: 0.8
    };

    try {
        const compressedFile = await imageCompression(processingFile, options);
        return compressedFile;
    } catch (error) {
        console.error('Compression failed:', error);
        return processingFile;
    }
}
