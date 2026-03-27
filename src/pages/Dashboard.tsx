import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AddChildWizard, type AddChildResult } from "@/components/dashboard/AddChildWizard";
import { BookViewerModal } from "@/components/wizard/BookViewerModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, BookOpen, CalendarHeart, Plus,
  Truck, Package, Palette, Eye, Trash2, BookMarked, Pencil,
  Pause, Play, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks, type BookRecord } from "@/hooks/useBooks";
import { useChildren, type ChildRecord } from "@/hooks/useChildren";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { toast } from "sonner";
import { format } from "date-fns";

const ease = [0.22, 1, 0.36, 1];

const statusStyle = (s: string) => {
  if (s === "delivered") return "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950";
  if (s === "printing" || s === "ordered") return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
  return "text-accent bg-accent/10";
};

const statusIcon = (s: string) => (s === "delivered" ? Truck : Package);

const subStatusStyle = (s: string) => {
  if (s === "active") return "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950";
  if (s === "paused") return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
  return "text-muted-foreground bg-muted";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { books, isLoading: booksLoading } = useBooks();
  const { children, isLoading: childrenLoading, addChild, updateChild, deleteChild } = useChildren();
  const { subscriptions, isLoading: subsLoading, cancelSubscription, updateSubscription } = useSubscriptions();
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [viewingBook, setViewingBook] = useState<BookRecord | null>(null);

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

  const handleAddChild = async (child: AddChildResult) => {
    await addChild.mutateAsync(child);
    setAddChildOpen(false);
    toast.success("Child profile added!");
  };

  const handleEditChild = async (child: AddChildResult) => {
    if (!editingChild) return;
    await updateChild.mutateAsync({ id: editingChild.id, ...child });
    setEditingChild(null);
    toast.success("Child profile updated!");
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
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease }}
          >
            <h1 className="font-display text-3xl font-bold text-primary mb-1">My Dashboard</h1>
            <p className="text-muted-foreground mb-4">Welcome back! Manage your mishpacha's seforim.</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Children", value: children.length, icon: Users },
                { label: "Books Created", value: books.length, icon: BookMarked },
                { label: "Draft Books", value: draftBooks.length, icon: BookOpen },
                { label: "Active Subs", value: activeSubs.length, icon: CalendarHeart },
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
                  <h3 className="font-display font-semibold text-primary">Continue where you left off</h3>
                  <p className="text-sm text-muted-foreground">
                    You have {draftBooks.length} draft book{draftBooks.length > 1 ? "s" : ""} waiting to be ordered.
                  </p>
                </div>
                <Button variant="gold" size="sm" onClick={() => navigate("/")}>
                  View Books
                </Button>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            <Tabs defaultValue="kids" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-8 bg-secondary rounded-2xl h-12">
                <TabsTrigger value="kids" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <Users className="w-4 h-4" /> My Kids
                </TabsTrigger>
                <TabsTrigger value="books" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <BookOpen className="w-4 h-4" /> My Books
                </TabsTrigger>
                <TabsTrigger value="subs" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <CalendarHeart className="w-4 h-4" /> Subscriptions
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
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((kid, i) => {
                      const initials = kid.name.slice(0, 2).toUpperCase();
                      const colors = ["bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300", "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"];
                      return (
                        <motion.div
                          key={kid.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.08, ease }}
                          className="bg-card rounded-2xl border border-border p-5 shadow-soft-sm hover:shadow-soft-md transition-shadow duration-300"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            {kid.photo_url ? (
                              <img src={kid.photo_url} alt={kid.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg flex-shrink-0 ${colors[i % colors.length]}`}>
                                {initials}
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-display text-lg font-semibold text-primary">{kid.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {kid.age ? `${kid.age} years old` : "Age not set"} · {kid.gender || "Not set"}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingChild(kid)}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  deleteChild.mutate(kid.id);
                                  toast.success("Child removed");
                                }}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {kid.art_style && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Palette className="w-3.5 h-3.5" />
                              <span>Preferred: {kid.art_style}</span>
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="w-full mt-4 text-xs" onClick={() => navigate("/?start=1")}>
                            <BookOpen className="w-3.5 h-3.5" /> Create New Book
                          </Button>
                        </motion.div>
                      );
                    })}

                    <motion.button
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2, ease }}
                      onClick={() => setAddChildOpen(true)}
                      className="rounded-2xl border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-all duration-300 active:scale-[0.98] min-h-[180px]"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-medium">Add Child</span>
                    </motion.button>
                  </div>
                )}
              </TabsContent>

              {/* TAB: Books */}
              <TabsContent value="books">
                {booksLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-lg font-semibold text-primary mb-2">No books yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">Create your first personalized Torah tale!</p>
                    <Button variant="gold" onClick={() => navigate("/")}>
                      Create a Story
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {books.map((book, i) => {
                      const StatusIcon = statusIcon(book.status);
                      return (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.07, ease }}
                          className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 shadow-soft-sm hover:shadow-soft-md transition-shadow duration-300"
                        >
                          {book.cover_image_url ? (
                            <img src={book.cover_image_url} alt={book.torah_portion || ""} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-6 h-6 text-accent" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-semibold text-primary text-sm truncate">
                              {book.torah_portion || "Torah Tale"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              For {book.child_name || "Unknown"} · {format(new Date(book.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0 capitalize ${statusStyle(book.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {book.status}
                          </span>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {book.pages_data && (
                              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setViewingBook(book)}>
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* TAB: Subscriptions */}
              <TabsContent value="subs">
                {subsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 rounded-2xl" />
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <CalendarHeart className="w-5 h-5 text-accent" />
                      <h3 className="font-display text-lg font-semibold text-primary">Parashah Club</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      A new personalized Torah tale, delivered weekly based on the current parashah. Subscribe during checkout when ordering your next book!
                    </p>
                    <Button variant="gold" onClick={() => navigate("/?start=1")}>
                      Create a Book & Subscribe
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub, i) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.07, ease }}
                        className="bg-card rounded-2xl border border-border p-5 shadow-soft-sm"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                              <CalendarHeart className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <h4 className="font-display font-semibold text-primary">Parashah Club</h4>
                              <p className="text-xs text-muted-foreground">
                                For {sub.child_name || "your child"} · ${sub.price_per_week}/week
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${subStatusStyle(sub.status)}`}>
                            {sub.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                          <div className="bg-muted/30 rounded-xl p-3">
                            <p className="text-muted-foreground">Art Style</p>
                            <p className="font-medium text-primary capitalize mt-0.5">{sub.art_style === "3d-pixar" ? "3D Pixar" : sub.art_style || "Cartoon"}</p>
                          </div>
                          <div className="bg-muted/30 rounded-xl p-3">
                            <p className="text-muted-foreground">Next Delivery</p>
                            <p className="font-medium text-primary mt-0.5">
                              {sub.next_delivery_date ? format(new Date(sub.next_delivery_date), "MMM d, yyyy") : "TBD"}
                            </p>
                          </div>
                          <div className="bg-muted/30 rounded-xl p-3">
                            <p className="text-muted-foreground">Language</p>
                            <p className="font-medium text-primary capitalize mt-0.5">{sub.language || "English"}</p>
                          </div>
                          <div className="bg-muted/30 rounded-xl p-3">
                            <p className="text-muted-foreground">Since</p>
                            <p className="font-medium text-primary mt-0.5">{format(new Date(sub.created_at), "MMM d, yyyy")}</p>
                          </div>
                        </div>

                        {sub.status !== "canceled" && (
                          <div className="flex gap-2">
                            {sub.status === "active" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs rounded-xl gap-1.5"
                                onClick={async () => {
                                  await updateSubscription.mutateAsync({ id: sub.id, status: "paused" });
                                  toast.success("Subscription paused");
                                }}
                              >
                                <Pause className="w-3.5 h-3.5" /> Pause
                              </Button>
                            ) : sub.status === "paused" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs rounded-xl gap-1.5"
                                onClick={async () => {
                                  await updateSubscription.mutateAsync({ id: sub.id, status: "active" });
                                  toast.success("Subscription resumed!");
                                }}
                              >
                                <Play className="w-3.5 h-3.5" /> Resume
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs rounded-xl gap-1.5 text-destructive hover:text-destructive"
                              onClick={async () => {
                                await cancelSubscription.mutateAsync(sub.id);
                                toast.success("Subscription canceled");
                              }}
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Add another subscription */}
                    <Button variant="outline" className="w-full rounded-xl border-dashed border-2 h-12" onClick={() => navigate("/")}>
                      <Plus className="w-4 h-4" /> Subscribe Another Child
                    </Button>
                  </div>
                )}
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

      {/* Edit Child Wizard */}
      <AddChildWizard
        open={!!editingChild}
        onClose={() => setEditingChild(null)}
        onSubmit={handleEditChild}
        isPending={updateChild.isPending}
        mode="edit"
        initialData={editingChild ? {
          name: editingChild.name,
          age: editingChild.age,
          gender: editingChild.gender,
          art_style: editingChild.art_style,
          photo_url: editingChild.photo_url,
          description: editingChild.description,
        } : undefined}
      />

      {/* Book Viewer Modal */}
      {viewingBook && (
        <BookViewerModal
          open={!!viewingBook}
          onClose={() => setViewingBook(null)}
          childName={viewingBook.child_name || ""}
          torahPortion={viewingBook.torah_portion || ""}
          artStyle={viewingBook.art_style || "cartoon"}
          pages={bookPages}
          onReorder={() => {
            setViewingBook(null);
            navigate("/?start=1");
          }}
        />
      )}
    </div>
  );
}
