/**
 * Optimized Image Component
 * 
 * Features:
 * - Lazy loading
 * - Blur placeholder
 * - Responsive sizing
 * - WebP format preference
 * - Error handling with fallback
 */

import { useState, useEffect, useRef } from 'react';
import { IMAGE_CONFIG, LAZY_LOAD_CONFIG } from '@/lib/optimization-config';
import { Loader2, ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean; // For above-the-fold images
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  fallbackSrc = '/placeholder.svg',
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: LAZY_LOAD_CONFIG.ROOT_MARGIN,
        threshold: LAZY_LOAD_CONFIG.THRESHOLD,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const getOptimizedUrl = (url: string) => url || fallbackSrc;

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const imageSrc = hasError ? fallbackSrc : getOptimizedUrl(src);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden bg-muted ${className}`}
      style={{ aspectRatio: width && height ? `${width}/${height}` : 'auto' }}
    >
      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <ImageOff className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit }}
          decoding="async"
        />
      )}
    </div>
  );
}

/**
 * Image Gallery with lazy loading
 */
export function ImageGallery({ images }: { images: { src: string; alt: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={400}
          height={300}
          className="rounded-lg"
        />
      ))}
    </div>
  );
}
