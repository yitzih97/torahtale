import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { GlassIconTile } from "@/components/ui/glass-icon-tile";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Props {
  /** Stable key, e.g. "name", "gender", "age", "style", "photo", "parsha", "details", "review". */
  stepKey: string;
  Icon: LucideIcon;
  defaultTitle: string;
  defaultSubtitle?: string;
}

/**
 * Standard hero header for each creation-wizard step.
 * - Renders a unified GlassIconTile (or admin-uploaded image override)
 * - Title + optional subtitle read from `site_settings` (category: `wizard`)
 *   with fallback to whatever the wizard would have shown before.
 */
export function WizardStepHeader({ stepKey, Icon, defaultTitle, defaultSubtitle }: Props) {
  const { getSetting } = useSiteSettings("wizard");

  const title = getSetting("wizard", `step.${stepKey}.title`, defaultTitle);
  const subtitle = getSetting("wizard", `step.${stepKey}.subtitle`, defaultSubtitle || "");
  const iconUrl = getSetting("wizard", `step.${stepKey}.icon_url`, "");

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
        className="mx-auto mb-4 inline-flex"
      >
        <GlassIconTile Icon={Icon} imageUrl={iconUrl || null} alt={title} size="lg" />
      </motion.div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">{subtitle}</p>
      )}
    </div>
  );
}
