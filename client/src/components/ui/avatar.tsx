import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

const avatarVariants = cva(
  "flex items-center justify-center rounded-full overflow-hidden bg-muted",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-16 w-16",
        xl: "h-24 w-24",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
}

export function Avatar({
  className,
  size,
  src,
  alt = "Avatar",
  fallback,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={cn(avatarVariants({ size, className }))} {...props}>
      {src && !imageError ? (
        <AvatarImage src={src} alt={alt} onError={handleImageError} />
      ) : (
        fallback || <AvatarFallback />
      )}
    </div>
  );
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onError?: () => void;
}

export function AvatarImage({ className, onError, src, ...props }: AvatarImageProps) {
  // Add cache buster to image URL to prevent caching issues
  const imgSrc = src ? (
    src.includes('?') ? 
      `${src}&_t=${Date.now()}` : 
      `${src}?_t=${Date.now()}`
  ) : undefined;
  
  return (
    <img 
      className={cn("h-full w-full object-cover", className)} 
      onError={onError}
      src={imgSrc}
      {...props} 
    />
  );
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <div 
      className={cn("flex h-full w-full items-center justify-center bg-gray-200 text-gray-600", className)} 
      {...props}
    >
      {children || <User className="h-3/5 w-3/5" />}
    </div>
  );
}