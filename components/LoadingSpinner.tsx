interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ 
  text = "Loading...", 
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-3 text-gray-600 ${className}`}>
      <span className={`${sizeClasses[size]} rounded-full border-2 border-gray-300 border-t-transparent animate-spin`} />
      <span className={textSizeClasses[size]}>{text}</span>
    </div>
  );
}
