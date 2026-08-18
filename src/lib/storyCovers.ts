import c_balak from "@/assets/story-covers/balak.jpg";
import c_bamidbar from "@/assets/story-covers/bamidbar.jpg";
import c_bechukotai from "@/assets/story-covers/bechukotai.jpg";
import c_behaalotecha from "@/assets/story-covers/behaalotecha.jpg";
import c_behar from "@/assets/story-covers/behar.jpg";
import c_behar_bechukotai from "@/assets/story-covers/behar-bechukotai.jpg";
import c_bereishit from "@/assets/story-covers/bereishit.jpg";
import c_beshalach from "@/assets/story-covers/beshalach.jpg";
import c_bo from "@/assets/story-covers/bo.jpg";
import c_chayei_sarah from "@/assets/story-covers/chayei-sarah.jpg";
import c_chukat from "@/assets/story-covers/chukat.jpg";
import c_devarim from "@/assets/story-covers/devarim.jpg";
import c_eikev from "@/assets/story-covers/eikev.jpg";
import c_emor from "@/assets/story-covers/emor.jpg";
import c_haazinu from "@/assets/story-covers/haazinu.jpg";
import c_ki_tavo from "@/assets/story-covers/ki-tavo.jpg";
import c_ki_teitzei from "@/assets/story-covers/ki-teitzei.jpg";
import c_ki_tisa from "@/assets/story-covers/ki-tisa.jpg";
import c_korach from "@/assets/story-covers/korach.jpg";
import c_lech_lecha from "@/assets/story-covers/lech-lecha.jpg";
import c_masei from "@/assets/story-covers/masei.jpg";
import c_matot_masei from "@/assets/story-covers/matot-masei.jpg";
import c_metzora from "@/assets/story-covers/metzora.jpg";
import c_miketz from "@/assets/story-covers/miketz.jpg";
import c_naso from "@/assets/story-covers/naso.jpg";
import c_nitzavim from "@/assets/story-covers/nitzavim.jpg";
import c_nitzavim_vayelech from "@/assets/story-covers/nitzavim-vayelech.jpg";
import c_noach from "@/assets/story-covers/noach.jpg";
import c_pekudei from "@/assets/story-covers/pekudei.jpg";
import c_pinchas from "@/assets/story-covers/pinchas.jpg";
import c_reeh from "@/assets/story-covers/reeh.jpg";
import c_shelach from "@/assets/story-covers/shelach.jpg";
import c_shemini from "@/assets/story-covers/shemini.jpg";
import c_shemot from "@/assets/story-covers/shemot.jpg";
import c_shoftim from "@/assets/story-covers/shoftim.jpg";
import c_tazria from "@/assets/story-covers/tazria.jpg";
import c_tazria_metzora from "@/assets/story-covers/tazria-metzora.jpg";
import c_terumah from "@/assets/story-covers/terumah.jpg";
import c_tetzaveh from "@/assets/story-covers/tetzaveh.jpg";
import c_toldot from "@/assets/story-covers/toldot.jpg";
import c_vaera from "@/assets/story-covers/vaera.jpg";
import c_vaetchanan from "@/assets/story-covers/vaetchanan.jpg";
import c_vayakhel from "@/assets/story-covers/vayakhel.jpg";
import c_vayakhel_pekudei from "@/assets/story-covers/vayakhel-pekudei.jpg";
import c_vayelech from "@/assets/story-covers/vayelech.jpg";
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
 * The set is being filled in story by story (52 of 138 so far); anything
 * without its own cover falls back to the category art, so the picker is never
 * missing an image.
 */
const STORY_COVERS: Record<string, string> = {
  "balak": c_balak,
  "bamidbar": c_bamidbar,
  "bechukotai": c_bechukotai,
  "behaalotecha": c_behaalotecha,
  "behar": c_behar,
  "behar-bechukotai": c_behar_bechukotai,
  "bereishit": c_bereishit,
  "beshalach": c_beshalach,
  "bo": c_bo,
  "chayei-sarah": c_chayei_sarah,
  "chukat": c_chukat,
  "devarim": c_devarim,
  "eikev": c_eikev,
  "emor": c_emor,
  "haazinu": c_haazinu,
  "ki-tavo": c_ki_tavo,
  "ki-teitzei": c_ki_teitzei,
  "ki-tisa": c_ki_tisa,
  "korach": c_korach,
  "lech-lecha": c_lech_lecha,
  "masei": c_masei,
  "matot-masei": c_matot_masei,
  "metzora": c_metzora,
  "miketz": c_miketz,
  "naso": c_naso,
  "nitzavim": c_nitzavim,
  "nitzavim-vayelech": c_nitzavim_vayelech,
  "noach": c_noach,
  "pekudei": c_pekudei,
  "pinchas": c_pinchas,
  "reeh": c_reeh,
  "shelach": c_shelach,
  "shemini": c_shemini,
  "shemot": c_shemot,
  "shoftim": c_shoftim,
  "tazria": c_tazria,
  "tazria-metzora": c_tazria_metzora,
  "terumah": c_terumah,
  "tetzaveh": c_tetzaveh,
  "toldot": c_toldot,
  "vaera": c_vaera,
  "vaetchanan": c_vaetchanan,
  "vayakhel": c_vayakhel,
  "vayakhel-pekudei": c_vayakhel_pekudei,
  "vayelech": c_vayelech,
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

export const storyCoverCount = 52;
