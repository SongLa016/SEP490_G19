import { Button } from "../../../../../../shared/components/ui";

export default function LightboxModal({ isOpen, images, currentIndex, onClose, onPrevious, onNext }) {
     if (!isOpen || !images || images.length === 0) return null;

     return (
          <div
               role="dialog"
               aria-modal="true"
               className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90"
               onClick={onClose}
          >
               <div className="relative max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
                    <img
                         src={images[currentIndex]}
                         alt={`preview-${currentIndex}`}
                         className="max-h-[85vh] max-w-[90vw] w-auto mx-auto object-contain rounded-2xl shadow-2xl"
                    />
                    <Button
                         type="button"
                         aria-label="Close"
                         onClick={onClose}
                         className="absolute top-2 right-2 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 h-auto"
                    >
                         ✕
                    </Button>
                    {images.length > 1 && (
                         <>
                              <Button
                                   type="button"
                                   aria-label="Previous"
                                   onClick={onPrevious}
                                   className="absolute left-3 top-1/2 -translate-y-1/2 text-white/95 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-4 h-auto text-xl"
                              >
                                   ‹
                              </Button>
                              <Button
                                   type="button"
                                   aria-label="Next"
                                   onClick={onNext}
                                   className="absolute right-3 top-1/2 -translate-y-1/2 text-white/95 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-4 h-auto text-xl"
                              >
                                   ›
                              </Button>
                         </>
                    )}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/95 text-sm bg-black/50 px-3 py-1 rounded-full">
                         {currentIndex + 1} / {images.length}
                    </div>
               </div>
          </div>
     );
}

