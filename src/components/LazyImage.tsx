import { ImgHTMLAttributes, useState, useEffect } from "react";

/**
 * LazyImage Component
 * 
 * CARA PAKAI (OPSIONAL):
 * Ganti <img src="..." /> dengan <LazyImage src="..." />
 * 
 * Fungsi tetap sama persis, tapi loading-nya lebih cepat
 * 
 * Contoh:
 * Before: <img src="/image.jpg" alt="..." className="..." />
 * After:  <LazyImage src="/image.jpg" alt="..." className="..." />
 */

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
}

export const LazyImage = ({ 
  src, 
  alt, 
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3C/svg%3E",
  className = "",
  ...props 
}: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};