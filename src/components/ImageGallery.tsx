"use client";

import { useState } from "react";
import { X, Download, ZoomIn } from "lucide-react";

export function ImageGallery({ images, imageClassName = "w-full h-32 object-cover", containerClassName = "grid grid-cols-2 md:grid-cols-3 gap-4" }: { images: { id: string, url: string }[], imageClassName?: string, containerClassName?: string }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className={containerClassName}>
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelectedImage(img.url)}
            className="relative group block w-full text-left rounded-lg overflow-hidden border border-neutral-700 hover:border-indigo-500 transition-all"
          >
            <img src={img.url} alt="Screenshot" className={imageClassName} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white" />
            </div>
          </button>
        ))}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 md:p-12 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-12 right-0 flex gap-4">
              <a
                href={selectedImage}
                download="screenshot.png"
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={selectedImage} 
              alt="Screenshot Expanded" 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border border-neutral-800"
            />
          </div>
        </div>
      )}
    </>
  );
}
