import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { SEO } from "@/components/SEO";
import { ARTICLES } from "@/content/blog.mjs";

const Blog = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Torah Tale Blog",
    url: "https://torahtale.com/blog",
    description:
      "Guides and ideas for creating personalized Torah storybooks for Jewish children — parsha tips, gift guides, and step-by-step how-tos.",
    blogPost: ARTICLES.map((a) => ({
      "@type": "BlogPosting",
      headline: a.title,
      description: a.description,
      datePublished: a.dateISO,
      url: `https://torahtale.com/blog/${a.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Torah Tale Blog — Guides to Personalized Torah Storybooks"
        description="Step-by-step guides and ideas for making personalized Torah storybooks for Jewish kids — choosing the weekly parsha, gift ideas, and how it works."
        path="/blog"
        jsonLd={jsonLd}
      />
      <Navbar transparentHero={false} />

      <section className="pt-36 pb-10 md:pt-44">
        <div className="container max-w-3xl mx-auto px-6 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
            <BookOpen className="w-4 h-4" /> Torah Tale Blog
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-5xl font-bold">
            Guides to personalized Torah storybooks
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            How to turn your child into the hero of the weekly parsha — step-by-step guides, parsha tips, and gift ideas for every simcha.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container max-w-3xl mx-auto px-6 space-y-5">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              to={`/blog/${a.slug}`}
              className="block rounded-2xl border border-border/50 bg-card/50 p-6 transition-all hover:border-accent/40 hover:shadow-md"
            >
              <p className="text-xs text-muted-foreground">
                {a.date} · {a.readingMins} min read
              </p>
              <h2 className="mt-1.5 font-display text-xl md:text-2xl font-bold text-foreground">
                {a.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{a.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                Read the guide <ArrowRight className="w-4 h-4 rtl:rotate-180" />
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
