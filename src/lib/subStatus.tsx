import { PlayCircle, PauseCircle, XCircle } from "lucide-react";

/** Subscription lifecycle, in the order an admin thinks about it. */
export const SUB_STATUSES = ["active", "paused", "canceled"] as const;

export type SubStatus = (typeof SUB_STATUSES)[number];

export const SUB_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  canceled: "Canceled",
};

export const subStatusColor = (s: string) => {
  if (s === "active") return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
  if (s === "paused") return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
  return "text-muted-foreground bg-muted";
};

export const subStatusIcon = (s: string) => {
  if (s === "active") return <PlayCircle className="w-3.5 h-3.5" />;
  if (s === "paused") return <PauseCircle className="w-3.5 h-3.5" />;
  return <XCircle className="w-3.5 h-3.5" />;
};
