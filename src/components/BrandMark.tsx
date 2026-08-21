import { cn } from "@/lib/utils";
import torahTaleIcon from "@/assets/brand/torah-tale-icon.png";
import torahTaleWordmark from "@/assets/brand/torah-tale-text-gold.png";
import torahTaleLogoFull from "@/assets/brand/torah-tale-logo-full.png";

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  stacked?: boolean;
  /** Use the single original logo file — book above, wordmark beneath —
   *  instead of composing the icon and the wordmark as two images. */
  full?: boolean;
}

export const BrandMark = ({ className, iconClassName, wordmarkClassName, stacked = false, full = false }: BrandMarkProps) => {
  if (full) {
    return (
      <img
        src={torahTaleLogoFull}
        alt="Torah Tale"
        className={cn("h-auto w-auto object-contain", className)}
        loading="eager"
      />
    );
  }

  return (
    <div className={cn("flex items-center", stacked ? "flex-col gap-3" : "gap-3", className)}>
      <img
        src={torahTaleIcon}
        alt="Torah Tale icon"
        className={cn("object-contain", stacked ? "h-14 w-14" : "h-10 w-10", iconClassName)}
        loading="eager"
      />
      <img
        src={torahTaleWordmark}
        alt="Torah Tale"
        className={cn("object-contain", stacked ? "h-10 w-auto" : "h-8 w-auto", wordmarkClassName)}
        loading="eager"
      />
    </div>
  );
};
