import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

async function processImage(file: File, options?: { isAvatar?: boolean }): Promise<File> {
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
    const isAvatar = options?.isAvatar || false;

    const compressionOptions = {
        maxSizeMB: isAvatar ? 0.2 : 0.8, // 200KB for avatars, 800KB for products
        maxWidthOrHeight: isAvatar ? 600 : 1200, // 600px for avatars, 1200px for products
        useWebWorker: true,
        initialQuality: 0.8
    };

    try {
        const compressedFile = await imageCompression(processingFile, compressionOptions);
        return compressedFile;
    } catch (error) {
        console.error('Compression failed:', error);
        return processingFile;
    }
}

export async function compressAndConvertImage(file: File, options?: { isAvatar?: boolean }): Promise<File> {
    return processImage(file, options);
}
