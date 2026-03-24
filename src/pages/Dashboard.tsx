import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, BookOpen, CalendarHeart, Plus, Download,
  Truck, Package, Palette, Eye, Trash2, BookMarked,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBooks, type BookRecord } from "@/hooks/useBooks";
import { useChildren } from "@/hooks/useChildren";
import { toast } from "sonner";
import { format } from "date-fns";

const ease = [0.22, 1, 0.36, 1];

const statusStyle = (s: string) => {
  if (s === "delivered") return "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950";
  if (s === "printing" || s === "ordered") return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
  return "text-accent bg-accent/10";
};

const statusIcon = (s: string) => (s === "delivered" ? Truck : Package);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { books, isLoading: booksLoading } = useBooks();
  const { children, isLoading: childrenLoading, addChild, deleteChild } = useChildren();
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [newChild, setNewChild] = useState({ name: "", age: "", gender: "", art_style: "" });

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

  const handleAddChild = async () => {
    if (!newChild.name) return;
    await addChild.mutateAsync({
      name: newChild.name,
      age: newChild.age ? parseInt(newChild.age) : null,
      gender: newChild.gender || null,
      photo_url: null,
      art_style: newChild.art_style || null,
    });
    setNewChild({ name: "", age: "", gender: "", art_style: "" });
    setAddChildOpen(false);
    toast.success("Child profile added!");
  };

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
            <p className="text-muted-foreground mb-4">Welcome back! Manage your family's Torah tales.</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Children", value: children.length, icon: Users },
                { label: "Books Created", value: books.length, icon: BookMarked },
                { label: "Draft Books", value: draftBooks.length, icon: BookOpen },
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
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg ${colors[i % colors.length]}`}>
                              {initials}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-display text-lg font-semibold text-primary">{kid.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {kid.age ? `${kid.age} years old` : "Age not set"} · {kid.gender || "Not set"}
                              </p>
                            </div>
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
                          {kid.art_style && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Palette className="w-3.5 h-3.5" />
                              <span>Preferred: {kid.art_style}</span>
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="w-full mt-4 text-xs" onClick={() => navigate("/")}>
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
                          <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* TAB: Subscriptions */}
              <TabsContent value="subs">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarHeart className="w-5 h-5 text-accent" />
                    <h3 className="font-display text-lg font-semibold text-primary">Parashah Club</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    A new personalized Torah tale, delivered weekly based on the current parashah. Coming soon!
                  </p>
                  <Button variant="gold-outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      <Footer />

      {/* Add Child Dialog */}
      <Dialog open={addChildOpen} onOpenChange={setAddChildOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Add Child Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newChild.name} onChange={(e) => setNewChild((p) => ({ ...p, name: e.target.value }))} placeholder="Child's name" className="mt-1.5" />
            </div>
            <div>
              <Label>Age</Label>
              <Input type="number" min="1" max="18" value={newChild.age} onChange={(e) => setNewChild((p) => ({ ...p, age: e.target.value }))} placeholder="Age" className="mt-1.5" />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={newChild.gender} onValueChange={(v) => setNewChild((p) => ({ ...p, gender: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boy">Boy</SelectItem>
                  <SelectItem value="girl">Girl</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Art Style</Label>
              <Select value={newChild.art_style} onValueChange={(v) => setNewChild((p) => ({ ...p, art_style: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cartoon">Cartoon</SelectItem>
                  <SelectItem value="3d-pixar">3D Pixar</SelectItem>
                  <SelectItem value="graphic-novel">Graphic Novel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="gold" onClick={handleAddChild} disabled={!newChild.name || addChild.isPending}>
              {addChild.isPending ? "Adding..." : "Add Child"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
