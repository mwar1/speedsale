import Image from 'next/image';

interface ShoeImageProps {
  imageUrl: string | null;
  brand: string | null;
  model: string | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function ShoeImage({ 
  imageUrl, 
  brand, 
  model, 
  size = 'medium',
  className = ''
}: ShoeImageProps) {
  const sizeClasses = {
    small: 'h-15 w-15',
    medium: 'h-20 w-20', 
    large: 'h-96 w-full'
  };

  const sizeDimensions = {
    small: { width: 60, height: 60 },
    medium: { width: 80, height: 80 },
    large: { width: 400, height: 400 }
  };

  const placeholderSizes = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-6xl'
  };

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={`${brand || 'Unknown'} ${model || 'Shoe'}`}
        {...sizeDimensions[size]}
        className={`${sizeClasses[size]} rounded-lg object-cover ${className}`}
      />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-gray-100 flex items-center justify-center ${className}`}>
      <span className={placeholderSizes[size]}>👟</span>
    </div>
  );
}
