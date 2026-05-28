import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Apple liquid-glass icon tile.
 * Used in the creation wizard, dashboard quick-actions, and edit-child popup
 * to give every icon a single unified look — frosted white surface, subtle
 * inner highlight, graphite-ink icon. Replaces the old gold gradient tiles.
 *
 * Pass either:
 *   - `Icon` (a lucide-react component), or
 *   - `imageUrl` (an admin-uploaded override image), or
 *   - `children` for fully custom content.
 */
export interface GlassIconTileProps {
  Icon?: LucideIcon;
  imageUrl?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
}

const sizeClasses: Record<NonNullable<GlassIconTileProps["size"]>, string> = {
  sm: "w-9 h-9 rounded-xl",
  md: "w-12 h-12 rounded-2xl",
  lg: "w-14 h-14 rounded-2xl",
};

const iconSizeClasses: Record<NonNullable<GlassIconTileProps["size"]>, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export function GlassIconTile({
  Icon,
  imageUrl,
  alt = "",
  size = "lg",
  className,
  iconClassName,
  children,
}: GlassIconTileProps) {
  return (
    <div
      className={cn(
        // Frosted liquid-glass surface
        "relative flex items-center justify-center overflow-hidden",
        "bg-white/55 backdrop-blur-xl backdrop-saturate-150",
        "border border-white/70 ring-1 ring-black/5",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_8px_24px_-12px_rgba(15,23,42,0.18)]",
        sizeClasses[size],
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : Icon ? (
        <Icon
          className={cn("text-foreground/85", iconSizeClasses[size], iconClassName)}
          strokeWidth={1.75}
        />
      ) : (
        children
      )}
    </div>
  );
}
