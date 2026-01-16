import React, { useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw } from 'lucide-react';
import { getCroppedImg } from '../utils/imageUtils';

interface ImageCropperModalProps {
    image: string;
    onCropComplete: (croppedImage: File) => void;
    onCancel: () => void;
    aspect?: number;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
    image,
    onCropComplete,
    onCancel,
    aspect = 1
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: { x: number, y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropAreaComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleDone = async () => {
        if (!croppedAreaPixels) return;

        try {
            setIsProcessing(true);
            const croppedFile = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedFile);
        } catch (e) {
            console.error('Error cropping image:', e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md z-10">
                <button
                    onClick={onCancel}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
                <h3 className="text-white font-bold tracking-tight uppercase italic">Crop Profile Photo</h3>
                <button
                    onClick={handleDone}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-[#830e4c] text-white px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                >
                    {isProcessing ? '...' : (
                        <>
                            <Check size={18} />
                            Done
                        </>
                    )}
                </button>
            </div>

            {/* Cropper Container */}
            <div className="relative flex-1">
                <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={onCropChange}
                    onCropComplete={onCropAreaComplete}
                    onZoomChange={onZoomChange}
                />
            </div>

            {/* Footer / Controls */}
            <div className="p-8 bg-black/80 backdrop-blur-xl z-10">
                <div className="max-w-xs mx-auto space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-black text-white/50 uppercase tracking-widest">
                            <span>Zoom</span>
                            <span className="text-white">{(zoom * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#830e4c]"
                        />
                    </div>
                    <p className="text-center text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium leading-relaxed">
                        Drag to reposition • Pinch or scroll to zoom
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
