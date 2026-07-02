import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { getArticle, ARTICLES } from "@/content/blog.mjs";

const BlogArticle = () => {
  const { slug } = useParams();
  const article = getArticle(slug || "");

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO title="Article not found — Torah Tale" description="This article could not be found." path={`/blog/${slug || ""}`} />
        <Navbar transparentHero={false} />
        <div className="container max-w-3xl mx-auto px-6 pt-40 pb-24 text-center">
          <h1 className="font-display text-3xl font-bold">Article not found</h1>
          <p className="mt-3 text-muted-foreground">The article you're looking for doesn't exist.</p>
          <Link to="/blog" className="mt-6 inline-block">
            <Button variant="outline" className="rounded-full">Back to the blog</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const others = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.dateISO,
    dateModified: article.dateISO,
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
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`${article.title} — Torah Tale`} description={article.description} path={`/blog/${article.slug}`} ogType="article" jsonLd={jsonLd} />
      <Navbar transparentHero={false} />

      <article className="pt-32 pb-16 md:pt-40">
        <div className="container max-w-2xl mx-auto px-6">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> All guides
          </Link>
          <p className="mt-6 text-xs text-muted-foreground">{article.date} · {article.readingMins} min read</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold leading-tight">{article.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>

          <div className="blog-prose mt-8" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />

          <div className="mt-10 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
            <p className="font-display text-lg font-bold">Make your child the hero of the parsha</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a personalized Torah storybook in about five minutes.</p>
            <Link to="/create" className="mt-4 inline-block">
              <Button className="rounded-full">Create your book <ArrowRight className="w-4 h-4 rtl:rotate-180" /></Button>
            </Link>
          </div>
        </div>
      </article>

      {others.length > 0 && (
        <section className="pb-24">
          <div className="container max-w-2xl mx-auto px-6">
            <h2 className="font-display text-xl font-bold">Keep reading</h2>
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
