import {
  Scroll, ScrollText, BookOpen, Book, PenLine, Feather, Sparkles, Star, Stars,
  Sun, Moon, Cloud, CloudRain, Waves, Droplet, Droplets, Snowflake, Rainbow,
  Mountain, Tent, Castle, Home, Landmark, Crown, Shield, ShieldCheck, Swords,
  Flame, Heart, HeartHandshake, Handshake, Users, User, Baby, Bird, Fish,
  Rabbit, PawPrint, Wheat, Grape, Leaf, Sprout, TreePine, Trees, Flower2,
  Music, Music2, Megaphone, Bell, Eye, Footprints, Gem, Gift, Hammer, Anchor,
  Compass, MapPin, Map, Coins, KeyRound, Lock, Lightbulb, Zap, Ship, Tractor,
  Palette, Hourglass, Clock, CalendarDays, PartyPopper, Trophy, Medal, Wand2,
  Apple, Carrot, Egg, Drumstick, Utensils, Wind, Tablets,
  type LucideIcon,
} from "lucide-react";

/** Curated palette of lucide icons used for portion / category / option buttons. */
const ICONS: Record<string, LucideIcon> = {
  Scroll, ScrollText, BookOpen, Book, PenLine, Feather, Sparkles, Star, Stars,
  Sun, Moon, Cloud, CloudRain, Waves, Droplet, Droplets, Snowflake, Rainbow,
  Mountain, Tent, Castle, Home, Landmark, Crown, Shield, ShieldCheck, Swords,
  Flame, Heart, HeartHandshake, Handshake, Users, User, Baby, Bird, Fish,
  Rabbit, PawPrint, Wheat, Grape, Leaf, Sprout, TreePine, Trees, Flower2,
  Music, Music2, Megaphone, Bell, Eye, Footprints, Gem, Gift, Hammer, Anchor,
  Compass, MapPin, Map, Coins, KeyRound, Lock, Lightbulb, Zap, Ship, Tractor,
  Palette, Hourglass, Clock, CalendarDays, PartyPopper, Trophy, Medal, Wand2,
  Apple, Carrot, Egg, Drumstick, Utensils, Wind, Tablets,
};

/** Render a lucide icon by name, falling back to BookOpen for any unknown name. */
export const PortionIcon = ({ name, className }: { name?: string; className?: string }) => {
  const Icon = (name && ICONS[name]) || BookOpen;
  return <Icon className={className} strokeWidth={1.75} />;
};

export const hasPortionIcon = (name?: string) => !!(name && ICONS[name]);
