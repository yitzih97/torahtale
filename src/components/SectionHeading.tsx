/**
 * The gold display heading used to open a section, flanked by hairline rules
 * that fade out — the page has no hero any more, so these headings carry the
 * rhythm on their own and need to read as ornament, not as leftover text.
 */
export const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center gap-4">
    <span aria-hidden className="hidden h-px w-10 bg-gradient-to-r from-transparent to-gold/45 sm:block sm:w-20" />
    <h2 className="font-display text-2xl font-bold uppercase tracking-[0.14em] text-accent md:text-3xl">
      {children}
    </h2>
    <span aria-hidden className="hidden h-px w-10 bg-gradient-to-l from-transparent to-gold/45 sm:block sm:w-20" />
  </div>
);
