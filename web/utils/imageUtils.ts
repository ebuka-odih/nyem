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

/**
 * Creates a cropped image from the source image and crop coordinates
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    fileName: string = 'cropped-avatar.jpg'
): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Set canvas size to the final cropped size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image onto the canvas
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Convert canvas to blob/file
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            resolve(file);
        }, 'image/jpeg', 0.9);
    });
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on some setups
        image.src = url;
    });
}
