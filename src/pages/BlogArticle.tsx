import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { getArticle, localizeArticle, ARTICLES } from "@/content/blog.mjs";
import { useLanguage } from "@/contexts/LanguageContext";

const BlogArticle = () => {
  const { slug } = useParams();
  const { lang, dir } = useLanguage();
  const isHe = lang === "he" || lang === "yi";
  const raw = getArticle(slug || "");
  const article = raw ? localizeArticle(raw, lang) : undefined;

  const copy = isHe
    ? {
        notFoundTitle: "המאמר לא נמצא",
        notFoundDesc: "המאמר שחיפשתם אינו קיים.",
        backToBlog: "חזרה לבלוג",
        allGuides: "כל המדריכים",
        minRead: "דקות קריאה",
        ctaTitle: "הפכו את הילד שלכם לגיבור הפרשה",
        ctaSub: "צרו ספר תורה מותאם אישית בכחמש דקות.",
        ctaButton: "צרו את הספר שלכם",
        keepReading: "המשיכו לקרוא",
      }
    : {
        notFoundTitle: "Article not found",
        notFoundDesc: "The article you're looking for doesn't exist.",
        backToBlog: "Back to the blog",
        allGuides: "All guides",
        minRead: "min read",
        ctaTitle: "Make your child the star of the parsha",
        ctaSub: "Create a personalized Torah storybook in about five minutes.",
        ctaButton: "Create your book",
        keepReading: "Keep reading",
      };

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground" dir={dir}>
        <SEO title="Article not found — Torah Tale" description="This article could not be found." path={`/blog/${slug || ""}`} />
        <Navbar transparentHero={false} />
        <div className="container max-w-3xl mx-auto px-6 pt-40 pb-24 text-center">
          <h1 className="font-display text-3xl font-bold">{copy.notFoundTitle}</h1>
          <p className="mt-3 text-muted-foreground">{copy.notFoundDesc}</p>
          <Link to="/blog" className="mt-6 inline-block">
            <Button variant="outline" className="rounded-full">{copy.backToBlog}</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const others = ARTICLES.filter((a) => a.slug !== article.slug)
    .slice(0, 2)
    .map((a) => localizeArticle(a, lang));

  // SEO/structured data stays in English (the canonical indexed version).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: raw!.title,
    description: raw!.description,
    datePublished: raw!.dateISO,
    dateModified: raw!.dateISO,
    image: "https://torahtale.com/og-image.jpg",
    url: `https://torahtale.com/blog/${article.slug}`,
    author: { "@type": "Organization", name: "Torah Tale" },
    publisher: {
      "@type": "Organization",
      name: "Torah Tale",
      logo: { "@type": "ImageObject", url: "https://torahtale.com/apple-touch-icon.png" },
    },
    mainEntityOfPage: `https://torahtale.com/blog/${article.slug}`,
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <SEO title={`${raw!.title} — Torah Tale`} description={raw!.description} path={`/blog/${article.slug}`} ogType="article" jsonLd={jsonLd} />
      <Navbar transparentHero={false} />

      <article className="pt-32 pb-16 md:pt-40">
        <div className="container max-w-2xl mx-auto px-6">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {copy.allGuides}
          </Link>
          <p className="mt-6 text-xs text-muted-foreground">{article.date} · {article.readingMins} {copy.minRead}</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold leading-tight">{article.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>

          <div className="blog-prose mt-8" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />

          <div className="mt-10 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
            <p className="font-display text-lg font-bold">{copy.ctaTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.ctaSub}</p>
            <Link to="/create" className="mt-4 inline-block">
              <Button className="rounded-full">{copy.ctaButton} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></Button>
            </Link>
          </div>
        </div>
      </article>

      {others.length > 0 && (
        <section className="pb-24">
          <div className="container max-w-2xl mx-auto px-6">
            <h2 className="font-display text-xl font-bold">{copy.keepReading}</h2>
            <div className="mt-4 space-y-3">
              {others.map((a) => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="block rounded-xl border border-border/50 bg-card/50 p-4 hover:border-accent/40">
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default BlogArticle;
