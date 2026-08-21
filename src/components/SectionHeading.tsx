/**
 * The label that opens a section - a small, wide-tracked sans caps line
 * between two fading hairlines. Deliberately quieter than the display serif
 * used for headlines, so it reads as a signpost rather than as a title
 * competing with the page's own h1.
 */
export const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center gap-3 sm:gap-4">
    <span aria-hidden className="hidden h-px w-8 bg-gradient-to-r from-transparent to-gold/40 sm:block sm:w-14" />
    <h2 className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-accent sm:text-[13px]">
      {children}
    </h2>
    <span aria-hidden className="hidden h-px w-8 bg-gradient-to-l from-transparent to-gold/40 sm:block sm:w-14" />
  </div>
);
