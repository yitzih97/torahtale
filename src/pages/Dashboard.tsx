import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AddChildWizard, type AddChildResult } from "@/components/dashboard/AddChildWizard";
import { EditChildDialog, type EditChildResult } from "@/components/dashboard/EditChildDialog";
import { BookViewerModal } from "@/components/wizard/BookViewerModal";
import { DashboardSettings } from "@/components/dashboard/DashboardSettings";
import { SubscriptionEditDialog } from "@/components/dashboard/SubscriptionEditDialog";
import { KidCard } from "@/components/dashboard/KidCard";
import { BookCard } from "@/components/dashboard/BookCard";
import { BookDetailDialog } from "@/components/dashboard/BookDetailDialog";
import { BookTimeline } from "@/components/dashboard/BookTimeline";
import { UpcomingDeliveries } from "@/components/dashboard/UpcomingDeliveries";
import { UpcomingBookCovers } from "@/components/UpcomingBookCovers";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { BookReviewDialog } from "@/components/dashboard/BookReviewDialog";
import { generateBookZip } from "@/lib/generateBookZip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, BookOpen, CalendarHeart, Plus, Settings, BookMarked,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBooks, type BookRecord } from "@/hooks/useBooks";
import { useChildren, type ChildRecord } from "@/hooks/useChildren";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { SHOPIFY_ACCOUNT_URL } from "@/lib/shopify";
import { toast } from "sonner";

const ease = [0.22, 1, 0.36, 1];


export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { books, isLoading: booksLoading } = useBooks();
  const { children, isLoading: childrenLoading, addChild, updateChild, deleteChild } = useChildren();
  const { subscriptions, isLoading: subsLoading, cancelSubscription, updateSubscription } = useSubscriptions();
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  
  const [editingSub, setEditingSub] = useState<typeof subscriptions[number] | null>(null);
  const [viewingBook, setViewingBook] = useState<BookRecord | null>(null);
  const [openBook, setOpenBook] = useState<BookRecord | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reviewingBook, setReviewingBook] = useState<BookRecord | null>(null);
  const [activeTab, setActiveTab] = useState(
    () => new URLSearchParams(window.location.search).get("tab") || "kids",
  );

  // Merge kids: select two or more, choose one to keep, then decide what to do
  // with the others' books & subscriptions.
  const queryClient = useQueryClient();
  const [selectedKidIds, setSelectedKidIds] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeKeepId, setMergeKeepId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);

  const toggleKidSelect = (id: string) =>
    setSelectedKidIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const openMerge = () => {
    const ids = [...selectedKidIds];
    if (ids.length < 2) return;
    setMergeKeepId(ids[0]);
    setMergeOpen(true);
  };

  // reassign=true → move the other kids' books & subscriptions onto the kept
  // child; reassign=false → just combine the profile and leave books where they
  // are (their child link clears via ON DELETE SET NULL). Either way the kept
  // child is enriched with any details it's missing, and the extras are removed.
  const handleMerge = async (reassign: boolean) => {
    const keep = children.find((c) => c.id === mergeKeepId);
    const others = [...selectedKidIds].filter((id) => id !== mergeKeepId);
    if (!keep || others.length === 0) { setMergeOpen(false); return; }
    setMerging(true);
    try {
      if (reassign) {
        for (const otherId of others) {
          await supabase.from("books").update({ child_id: keep.id } as any).eq("child_id", otherId);
          await supabase.from("subscriptions").update({ child_id: keep.id } as any).eq("child_id", otherId);
        }
      }
      // Fill any blank fields on the kept child from the others.
      const donors = children.filter((c) => others.includes(c.id));
      const patch: Record<string, unknown> = {};
      if (!keep.photo_url) { const d = donors.find((c) => c.photo_url); if (d) patch.photo_url = d.photo_url; }
      if (!keep.description) { const d = donors.find((c) => c.description); if (d) patch.description = d.description; }
      if (keep.age == null) { const d = donors.find((c) => c.age != null); if (d) patch.age = d.age; }
      if (!keep.gender) { const d = donors.find((c) => c.gender); if (d) patch.gender = d.gender; }
      if (!keep.art_style) { const d = donors.find((c) => c.art_style); if (d) patch.art_style = d.art_style; }
      if (Object.keys(patch).length) await supabase.from("children").update(patch as any).eq("id", keep.id);
      // Remove the merged-away kids (books/subscriptions survive via SET NULL).
      const { error: delErr } = await supabase.from("children").delete().in("id", others);
      if (delErr) throw delErr;

      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success(`Merged into ${keep.name}.`);
    } catch (e) {
      console.error("merge kids failed", e);
      toast.error("Merge failed — please try again.");
    } finally {
      setMerging(false);
      setMergeOpen(false);
      setSelectedKidIds(new Set());
    }
  };

  // Track which books the current user has already reviewed
  const { data: reviewedBookIds } = useQuery({
    queryKey: ["my-reviewed-books", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_reviews")
        .select("book_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data || []).map((r) => r.book_id as string));
    },
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Skeleton className="w-48 h-8 mx-auto" />
          <Skeleton className="w-64 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const draftBooks = books.filter((b) => b.status === "draft");
  const orderedBooks = books.filter((b) => b.status !== "draft");
  const activeSubs = subscriptions.filter((s) => s.status === "active");
  // Kids' names for the "starring your kids" upcoming-book previews.
  const kidNames = children.map((c) => c.name).filter(Boolean).join(" & ");

  const handleAddChild = async (child: AddChildResult) => {
    await addChild.mutateAsync(child);
    setAddChildOpen(false);
    toast.success(t.dash.childAdded);
  };

  const handleEditChild = async (child: EditChildResult) => {
    if (!editingChild) return;
    await updateChild.mutateAsync({ id: editingChild.id, ...child });
    setEditingChild(null);
    toast.success(t.dash.childUpdated);
  };

  const handleDownloadBook = async (book: BookRecord) => {
    const pages = (book.pages_data as any[]) || [];
    if (!pages.length) { toast.error("No pages to download"); return; }
    setDownloadingId(book.id);
    try {
      const blob = await generateBookZip(pages, book.child_name || "book", book.order_number || book.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.child_name || "book"}-${book.torah_portion || "tale"}.zip`.replace(/\s+/g, "-").toLowerCase();
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download ready!");
    } catch { toast.error("Download failed"); }
    finally { setDownloadingId(null); }
  };



  const rawBookPages = viewingBook?.pages_data as any[] || [];
  // Filter out pages that are still loading (imageLoading: true with no image)
  const bookPages = rawBookPages.map((p: any) => ({
    ...p,
    imageLoading: false, // never show loading in dashboard viewer
  }));
  const bookStillGenerating = rawBookPages.length > 0 && rawBookPages.every((p: any) => !p.image);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparentHero={false} />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease }}
          >
            <h1 className="font-display text-3xl font-bold text-primary mb-1">{t.dash.title}</h1>
            <p className="text-muted-foreground mb-4">{t.dash.subtitle}</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: t.dash.children, value: children.length, icon: Users },
                { label: t.dash.booksCreated, value: books.length, icon: BookMarked },
                { label: t.dash.draftBooks, value: draftBooks.length, icon: BookOpen },
                { label: t.dash.activeSubs, value: activeSubs.length, icon: CalendarHeart },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-soft-sm">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary font-display">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Draft books banner */}
            {draftBooks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-accent/10 border border-accent/20 rounded-2xl p-4 mb-8 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-display font-semibold text-primary">{t.dash.continueTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {draftBooks.length} {t.dash.continueDesc}
                  </p>
                </div>
                <Button variant="gold" size="sm" onClick={() => setActiveTab("books")}>
                  {t.dash.reviewBooks}
                </Button>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-8 bg-secondary rounded-2xl h-12">
                <TabsTrigger value="kids" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <Users className="w-4 h-4" /> <span className="hidden sm:inline">{t.dash.myKids}</span>
                </TabsTrigger>
                <TabsTrigger value="books" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">{t.dash.myBooks}</span>
                </TabsTrigger>
                <TabsTrigger value="subs" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <CalendarHeart className="w-4 h-4" /> <span className="hidden sm:inline">{t.dash.subscriptions}</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <Settings className="w-4 h-4" /> <span className="hidden sm:inline">{t.dash.settings}</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB: Kids */}
              <TabsContent value="kids">
                {childrenLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <>
                    {selectedKidIds.size >= 1 && (
                      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card/70 backdrop-blur px-4 py-2.5">
                        <span className="text-sm text-muted-foreground">
                          {selectedKidIds.size} selected
                          {selectedKidIds.size < 2 && " · pick another to merge"}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedKidIds(new Set())}>Clear</Button>
                          <Button variant="gold" size="sm" disabled={selectedKidIds.size < 2} onClick={openMerge}>
                            Merge selected
                          </Button>
                        </div>
                      </div>
                    )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {children.map((kid, i) => {
                      const kidSub = subscriptions.find(
                        (s) => s.child_id === kid.id && s.status !== "canceled",
                      );
                      const kidBooks = books.filter((b) => b.child_id === kid.id).length;
                      const selected = selectedKidIds.has(kid.id);
                      return (
                        <div key={kid.id} className="relative">
                        {/* Selection checkbox for merging duplicate kids. */}
                        <button
                          type="button"
                          onClick={() => toggleKidSelect(kid.id)}
                          aria-label={selected ? "Deselect" : "Select to merge"}
                          className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selected ? "bg-accent border-accent text-white" : "bg-white/80 border-border/60 text-transparent hover:border-accent"}`}
                        >
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </button>
                        <KidCard
                          index={i}
                          kid={kid}
                          subscription={kidSub}
                          bookCount={kidBooks}
                          onEdit={() => setEditingChild(kid)}
                          onViewBooks={() => setActiveTab("books")}
                          onManageSubscription={() => {
                            if (kidSub) setEditingSub(kidSub);
                            else setActiveTab("subs");
                          }}
                          onToggleSubscription={async () => {
                            if (!kidSub) return;
                            const next = kidSub.status === "active" ? "paused" : "active";
                            await updateSubscription.mutateAsync({ id: kidSub.id, status: next });
                            toast.success(next === "paused" ? "Subscription paused" : "Subscription resumed!");
                          }}
                        />
                        </div>
                      );
                    })}

                    <motion.button
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2, ease }}
                      onClick={() => setAddChildOpen(true)}
                      className="rounded-3xl border-2 border-dashed border-border/60 p-5 flex flex-col items-center justify-center gap-3
                        text-muted-foreground hover:border-foreground/40 hover:text-foreground
                        transition-all duration-300 active:scale-[0.98] min-h-[260px]
                        bg-white/40 backdrop-blur-md"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/70 border border-white/70 ring-1 ring-black/5 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]">
                        <Plus className="w-6 h-6" strokeWidth={1.75} />
                      </div>
                      <span className="text-sm font-medium">{t.dash.addChild}</span>
                    </motion.button>
                  </div>
                  </>
                )}
              </TabsContent>



              {/* TAB: Books */}
              <TabsContent value="books">
                {booksLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
                  </div>
                ) : books.length === 0 ? (
                  <div className="wizard-glass rounded-3xl border border-white/70 ring-1 ring-black/5 bg-white/70 backdrop-blur-xl p-10 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(15,23,42,0.18)]">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-lg font-semibold text-primary mb-2">{t.dash.noBooks}</h3>
                    <p className="text-muted-foreground text-sm mb-6">{t.dash.noBooksDesc}</p>
                    <Button variant="gold" onClick={() => navigate("/")}>{t.dash.createSefer}</Button>
                  </div>
                ) : (
                  <>
                    <BookTimeline books={books} subscriptions={subscriptions} weeksAhead={2} />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {books.map((book, i) => (
                        <BookCard
                          key={book.id}
                          book={book}
                          index={i}
                          onOpen={() => setOpenBook(book)}
                          onView={() => setViewingBook(book)}
                          onDownload={() => handleDownloadBook(book)}
                          onReorder={() => navigate("/?start=1")}
                          onReview={() => setReviewingBook(book)}
                          hasReview={reviewedBookIds?.has(book.id)}
                          downloading={downloadingId === book.id}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>


              {/* TAB: Subscriptions */}
              <TabsContent value="subs">
                {subsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 rounded-2xl" />
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="wizard-glass relative rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl backdrop-saturate-150 border border-white/70 ring-1 ring-black/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_40px_-20px_rgba(15,23,42,0.18)] p-6">
                    <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-70 bg-gradient-to-br from-violet-200/60 to-fuchsia-200/40" />
                    <div className="relative flex items-center gap-3 mb-2">
                      <CalendarHeart className="w-5 h-5 text-accent" />
                      <h3 className="font-display text-lg font-semibold text-primary">{t.dash.parashahClub}</h3>
                    </div>
                    <p className="relative text-sm text-muted-foreground mb-6">{t.dash.parashahDesc}</p>
                    <Button variant="gold" onClick={() => navigate("/?start=1")} className="relative">
                      {t.dash.createAndSubscribe}
                    </Button>

                    {/* Sales driver: a preview of the next 4 weekly books, each
                        starring the user's own kids. */}
                    <div className="relative mt-8 pt-6 border-t border-border/40">
                      <UpcomingBookCovers
                        childNames={kidNames}
                        heading={`The next 4 books ${kidNames || "your kids"} could receive`}
                        subtext="A brand-new personalized Parsha book every week — starring your kids as the heroes."
                        ctaLabel={t.dash.createAndSubscribe}
                        onCta={() => navigate("/?start=1")}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Weekly subscribers: the next 4 parshiyos coming up, as
                        covers starring their kids. */}
                    <div className="mb-6">
                      <UpcomingBookCovers
                        childNames={kidNames}
                        heading="Your next books"
                        subtext="Coming up in your weekly Parsha Club — starring your kids."
                      />
                    </div>
                    <UpcomingDeliveries subscriptions={subscriptions} />
                    <div className="grid sm:grid-cols-2 gap-5">
                    {subscriptions.map((sub, i) => (
                      <SubscriptionCard
                        key={sub.id}
                        sub={sub}
                        index={i}
                        onEdit={() => setEditingSub(sub)}
                        onPayment={() => window.open(SHOPIFY_ACCOUNT_URL, "_blank", "noopener,noreferrer")}
                        onToggle={async () => {
                          if (sub.status === "canceled") return;
                          const next = sub.status === "active" ? "paused" : "active";
                          await updateSubscription.mutateAsync({ id: sub.id, status: next });
                          toast.success(next === "paused" ? "Subscription paused" : "Subscription resumed!");
                        }}
                        onCancel={async () => {
                          await cancelSubscription.mutateAsync(sub.id);
                          toast.success("Subscription canceled");
                        }}
                        onReactivate={async () => {
                          await updateSubscription.mutateAsync({ id: sub.id, status: "active", canceled_at: null as any });
                          toast.success("Subscription reactivated!");
                        }}
                      />
                    ))}

                    {/* Add another subscription */}
                    <motion.button
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2, ease }}
                      onClick={() => navigate("/")}
                      className="rounded-3xl border-2 border-dashed border-border/60 p-5 flex flex-col items-center justify-center gap-3
                        text-muted-foreground hover:border-foreground/40 hover:text-foreground
                        transition-all duration-300 active:scale-[0.98] min-h-[260px]
                        bg-white/40 backdrop-blur-md"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/70 border border-white/70 ring-1 ring-black/5 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]">
                        <Plus className="w-6 h-6" strokeWidth={1.75} />
                      </div>
                      <span className="text-sm font-medium">Subscribe Another Child</span>
                    </motion.button>
                    </div>
                  </>
                )}
              </TabsContent>


              {/* TAB: Settings */}
              <TabsContent value="settings">
                <DashboardSettings user={user} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      <Footer />

      {/* Add Child Wizard */}
      <AddChildWizard
        open={addChildOpen}
        onClose={() => setAddChildOpen(false)}
        onSubmit={handleAddChild}
        isPending={addChild.isPending}
      />

      {/* Merge kids dialog: choose which child to keep, then pick what to do
          with the others' books & subscriptions. */}
      <Dialog open={mergeOpen} onOpenChange={(o) => { if (!o && !merging) setMergeOpen(false); }}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <div className="space-y-4">
            <div>
              <p className="font-display font-semibold text-base text-foreground">Merge kids</p>
              <p className="text-sm text-muted-foreground mt-1">
                Keep one profile and combine the rest into it. First choose which child to keep:
              </p>
            </div>
            <div className="space-y-2">
              {[...selectedKidIds].map((id) => {
                const kid = children.find((c) => c.id === id);
                if (!kid) return null;
                const isKeep = mergeKeepId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMergeKeepId(id)}
                    className={`w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${isKeep ? "border-accent bg-accent/10" : "border-border/50 hover:border-accent/50"}`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isKeep ? "border-accent bg-accent text-white" : "border-border/60 text-transparent"}`}>
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground truncate">{kid.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {[kid.age != null ? `${kid.age} yrs` : null, kid.gender].filter(Boolean).join(" · ") || "—"}
                        {isKeep && " · keep this one"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pt-1 space-y-2">
              <p className="text-xs text-muted-foreground">What about the other kids' books &amp; subscriptions?</p>
              <Button variant="gold" className="w-full rounded-xl h-11" disabled={merging || !mergeKeepId} onClick={() => handleMerge(true)}>
                {merging ? "Merging…" : "Move their books & subscriptions to the kept child"}
              </Button>
              <Button variant="outline" className="w-full rounded-xl h-11 border-border/50" disabled={merging || !mergeKeepId} onClick={() => handleMerge(false)}>
                Just combine the profile (leave books where they are)
              </Button>
              <Button variant="ghost" className="w-full rounded-xl h-9 text-muted-foreground" disabled={merging} onClick={() => setMergeOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Child Dialog (single-page) */}
      <EditChildDialog
        open={!!editingChild}
        onClose={() => setEditingChild(null)}
        onSubmit={handleEditChild}
        isPending={updateChild.isPending}
        initialData={editingChild ? {
          name: editingChild.name,
          age: editingChild.age,
          gender: editingChild.gender,
          art_style: editingChild.art_style,
          photo_url: editingChild.photo_url,
          description: editingChild.description,
        } : null}
      />


      {/* Book Viewer Modal */}
      {viewingBook && (
        <BookViewerModal
          open={!!viewingBook}
          onClose={() => setViewingBook(null)}
          childName={viewingBook.child_name || ""}
          torahPortion={viewingBook.torah_portion || ""}
          artStyle={viewingBook.art_style || "3d-pixar"}
          pages={bookPages}
          bookFormat={(() => {
            const pt = (viewingBook.shipping_data as any)?.bookOptions?.productType;
            return pt === "board" ? "board-6x6" : pt === "hardcover" ? "hardcover-8x8" : pt === "coloring" ? "coloring-8.5x11" : "softcover-8x8";
          })()}
          onReorder={() => {
            setViewingBook(null);
            navigate("/?start=1");
          }}
        />
      )}

      {/* Subscription Edit Dialog */}
      <SubscriptionEditDialog
        open={!!editingSub}
        onClose={() => setEditingSub(null)}
        subscription={editingSub}
        children={children}
        onSave={async (updates) => {
          await updateSubscription.mutateAsync(updates);
          toast.success("Subscription updated");
        }}
        isSaving={updateSubscription.isPending}
      />

      {/* Book Detail Dialog */}
      <BookDetailDialog
        book={openBook}
        open={!!openBook}
        onClose={() => setOpenBook(null)}
        onView={() => { if (openBook) { setViewingBook(openBook); setOpenBook(null); } }}
        onDownload={() => openBook && handleDownloadBook(openBook)}
        onReorder={() => navigate("/?start=1")}
        downloading={!!openBook && downloadingId === openBook.id}
      />

      {/* Book Review Dialog */}
      <BookReviewDialog
        book={reviewingBook}
        open={!!reviewingBook}
        onClose={() => setReviewingBook(null)}
      />
    </div>
  );
}
