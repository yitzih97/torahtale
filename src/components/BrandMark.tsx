import { cn } from "@/lib/utils";
import torahTaleIcon from "@/assets/brand/torah-tale-icon.png.asset.json";
import torahTaleWordmark from "@/assets/brand/torah-tale-text-gold.png.asset.json";

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  stacked?: boolean;
}

export const BrandMark = ({ className, iconClassName, wordmarkClassName, stacked = false }: BrandMarkProps) => {
  return (
    <div className={cn("flex items-center", stacked ? "flex-col gap-3" : "gap-3", className)}>
      <img
        src={torahTaleIcon.url}
        alt="Torah Tale icon"
        className={cn("object-contain", stacked ? "h-14 w-14" : "h-10 w-10", iconClassName)}
        loading="eager"
      />
      <img
        src={torahTaleWordmark.url}
        alt="Torah Tale"
        className={cn("object-contain", stacked ? "h-10 w-auto" : "h-8 w-auto", wordmarkClassName)}
        loading="eager"
      />
    </div>
  );
};
