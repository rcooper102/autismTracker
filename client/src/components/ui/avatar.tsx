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
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
      ) : (
        fallback || (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <User className="h-1/2 w-1/2" />
          </div>
        )
      )}
    </div>
  );
}