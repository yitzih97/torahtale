import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { SEO } from "@/components/SEO";
import {
  ARTICLES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  localizeArticle,
} from "@/content/blog/index.mjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBlogLocale } from "@/hooks/useBlogLocale";

const Blog = () => {
  const { lang, dir } = useLanguage();
  const { isHe, blogPath } = useBlogLocale();
  const [filter, setFilter] = useState<string>("all");

  const articles = useMemo(
    () => ARTICLES.map((a) => ({ ...localizeArticle(a, isHe ? "he" : lang), category: a.category })),
    [lang, isHe]
  );

  // Only offer a chip for a category that actually has articles - the archive
  // fills in category by category as the daily agent works through the collections.
  const categories = useMemo(
    () => CATEGORY_ORDER.filter((c: string) => articles.some((a) => a.category === c)),
    [articles]
  );

  const visible = filter === "all" ? articles : articles.filter((a) => a.category === filter);

  // The Hebrew index is its own page at its own URL, listing the Hebrew
  // articles - which are written in Hebrew, not translated from the English.
  const paths = { en: "/blog", he: "/he/blog" };
  const indexUrl = `https://torahtale.com${isHe ? paths.he : paths.en}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: isHe ? "הבלוג של טורה־טייל" : "Torah Tale Blog",
        url: indexUrl,
        inLanguage: isHe ? "he" : "en",
        description: isHe
          ? "מדריכים ורעיונות ליצירת ספרי תורה מותאמים אישית לילדים - סיפורי פרשה, טיפים ורעיונות למתנה."
          : "Guides and ideas for creating personalized Torah storybooks for Jewish children - parsha tips, gift guides, and step-by-step how-tos.",
        publisher: { "@type": "Organization", name: "Torah Tale", url: "https://torahtale.com" },
        blogPost: ARTICLES.map((a) => ({
          "@type": "BlogPosting",
          headline: isHe ? a.he?.title || a.title : a.title,
          description: isHe ? a.he?.description || a.description : a.description,
          datePublished: a.dateISO,
          dateModified: a.updatedISO || a.dateISO,
          url: `https://torahtale.com${isHe ? "/he" : ""}/blog/${a.slug}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isHe ? "דף הבית" : "Home", item: "https://torahtale.com/" },
          { "@type": "ListItem", position: 2, name: isHe ? "בלוג" : "Blog", item: indexUrl },
        ],
      },
    ],
  };

  const copy = isHe
    ? {
        kicker: "הבלוג של טורה־טייל",
        heading: "מדריכים לספרי תורה מותאמים אישית",
        sub: "איך הופכים את הילד שלכם לגיבור של פרשת השבוע - מדריכים שלב אחרי שלב, טיפים לבחירת פרשה ורעיונות למתנה לכל שמחה.",
        minRead: "דקות קריאה",
        readGuide: "לקריאת המדריך",
        all: "הכל",
      }
    : {
        kicker: "Torah Tale Blog",
        heading: "Guides to personalized Torah storybooks",
        sub: "How to turn your child into the star of the weekly parsha - step-by-step guides, parsha tips, and gift ideas for every simcha.",
        minRead: "min read",
        readGuide: "Read the guide",
        all: "All",
      };

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? "border-accent bg-accent/10 text-accent"
        : "border-border/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <SEO
        title={
          isHe
            ? "הבלוג של טורה־טייל - מדריכים לספרי תורה מותאמים אישית"
            : "Torah Tale Blog - Guides to Personalized Torah Storybooks"
        }
        description={
          isHe
            ? "מדריכים ורעיונות ליצירת ספרי תורה מותאמים אישית לילדים - סיפורי פרשה לפי שבוע, איך בוחרים סיפור, ורעיונות למתנה לכל שמחה."
            : "Step-by-step guides and ideas for making personalized Torah storybooks for Jewish kids - choosing the weekly parsha, gift ideas, and how it works."
        }
        path={isHe ? paths.he : paths.en}
        locale={isHe ? "he" : "en"}
        alternates={paths}
        jsonLd={jsonLd}
      />
      <Navbar transparentHero={false} />

      <section className="pt-36 pb-8 md:pt-44">
        <div className="container max-w-3xl mx-auto px-6 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
            <BookOpen className="w-4 h-4" /> {copy.kicker}
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-5xl font-bold">
            {copy.heading}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {copy.sub}
          </p>
        </div>
      </section>

      {categories.length > 1 && (
        <section className="pb-6">
          <div className="container max-w-3xl mx-auto px-6 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setFilter("all")} className={chip(filter === "all")}>
              {copy.all}
            </button>
            {categories.map((c: string) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={chip(filter === c)}
              >
                {isHe ? CATEGORY_LABELS[c]?.he : CATEGORY_LABELS[c]?.en}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="container max-w-3xl mx-auto px-6 space-y-5">
          {visible.map((a) => (
            <Link
              key={a.slug}
              to={blogPath(a.slug)}
              className="block rounded-2xl border border-border/50 bg-card/50 p-6 transition-all hover:border-accent/40 hover:shadow-md"
            >
              <p className="text-xs text-muted-foreground">
                {a.date} · {a.readingMins} {copy.minRead}
                {a.category && CATEGORY_LABELS[a.category] ? (
                  <> · {isHe ? CATEGORY_LABELS[a.category].he : CATEGORY_LABELS[a.category].en}</>
                ) : null}
              </p>
              <h2 className="mt-1.5 font-display text-xl md:text-2xl font-bold text-foreground">
                {a.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{a.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                {copy.readGuide} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
