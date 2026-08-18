import c_bechukotai from "@/assets/story-covers/bechukotai.jpg";
import c_behar from "@/assets/story-covers/behar.jpg";
import c_bereishit from "@/assets/story-covers/bereishit.jpg";
import c_beshalach from "@/assets/story-covers/beshalach.jpg";
import c_bo from "@/assets/story-covers/bo.jpg";
import c_chayei_sarah from "@/assets/story-covers/chayei-sarah.jpg";
import c_emor from "@/assets/story-covers/emor.jpg";
import c_ki_tisa from "@/assets/story-covers/ki-tisa.jpg";
import c_lech_lecha from "@/assets/story-covers/lech-lecha.jpg";
import c_metzora from "@/assets/story-covers/metzora.jpg";
import c_miketz from "@/assets/story-covers/miketz.jpg";
import c_noach from "@/assets/story-covers/noach.jpg";
import c_pekudei from "@/assets/story-covers/pekudei.jpg";
import c_shemini from "@/assets/story-covers/shemini.jpg";
import c_shemot from "@/assets/story-covers/shemot.jpg";
import c_tazria from "@/assets/story-covers/tazria.jpg";
import c_tazria_metzora from "@/assets/story-covers/tazria-metzora.jpg";
import c_terumah from "@/assets/story-covers/terumah.jpg";
import c_tetzaveh from "@/assets/story-covers/tetzaveh.jpg";
import c_toldot from "@/assets/story-covers/toldot.jpg";
import c_vaera from "@/assets/story-covers/vaera.jpg";
import c_vayakhel from "@/assets/story-covers/vayakhel.jpg";
import c_vayakhel_pekudei from "@/assets/story-covers/vayakhel-pekudei.jpg";
import c_vayera from "@/assets/story-covers/vayera.jpg";
import c_vayeshev from "@/assets/story-covers/vayeshev.jpg";
import c_vayetzei from "@/assets/story-covers/vayetzei.jpg";
import c_vayigash from "@/assets/story-covers/vayigash.jpg";
import c_vayikra from "@/assets/story-covers/vayikra.jpg";
import c_vayishlach from "@/assets/story-covers/vayishlach.jpg";
import c_yitro from "@/assets/story-covers/yitro.jpg";

/**
 * Cover art per story, shown on the story picker.
 *
 * Each is a children's-storybook front cover for that specific story, starring
 * the same two children as the homepage hero — so a customer browsing sees the
 * book they would actually receive rather than a generic icon.
 *
 * The art is deliberately TEXT-FREE. One image therefore serves English, Hebrew
 * and Yiddish, and the story's name is set beneath the tile as ordinary text.
 *
 * The set is being filled in story by story (30 of 138 so far); anything
 * without its own cover falls back to the category art, so the picker is never
 * missing an image.
 */
const STORY_COVERS: Record<string, string> = {
  "bechukotai": c_bechukotai,
  "behar": c_behar,
  "bereishit": c_bereishit,
  "beshalach": c_beshalach,
  "bo": c_bo,
  "chayei-sarah": c_chayei_sarah,
  "emor": c_emor,
  "ki-tisa": c_ki_tisa,
  "lech-lecha": c_lech_lecha,
  "metzora": c_metzora,
  "miketz": c_miketz,
  "noach": c_noach,
  "pekudei": c_pekudei,
  "shemini": c_shemini,
  "shemot": c_shemot,
  "tazria": c_tazria,
  "tazria-metzora": c_tazria_metzora,
  "terumah": c_terumah,
  "tetzaveh": c_tetzaveh,
  "toldot": c_toldot,
  "vaera": c_vaera,
  "vayakhel": c_vayakhel,
  "vayakhel-pekudei": c_vayakhel_pekudei,
  "vayera": c_vayera,
  "vayeshev": c_vayeshev,
  "vayetzei": c_vayetzei,
  "vayigash": c_vayigash,
  "vayikra": c_vayikra,
  "vayishlach": c_vayishlach,
  "yitro": c_yitro,
};

export const storyCover = (portion?: string | null): string | undefined =>
  portion ? STORY_COVERS[portion] : undefined;

export const storyCoverCount = 30;
