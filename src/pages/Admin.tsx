import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookViewerModal } from "@/components/wizard/BookViewerModal";
import { Input } from "@/components/ui/input";
import {
  FileText, Package, Truck, Wand2, Users, BookOpen, CalendarHeart,
  Settings, Eye, Download, Search, ShieldCheck, Mail, MapPin,
  CreditCard, Clock, Loader2, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminData } from "@/hooks/useAdminData";
import { generateBookPdf } from "@/lib/generateBookPdf";
import { format } from "date-fns";
import { toast } from "sonner";

const ease = [0.22, 1, 0.36, 1];

const orderStatusColor = (s: string) => {
  if (s === "draft") return "text-muted-foreground bg-muted";
  if (s === "ordered" || s === "printing") return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
  if (s === "shipped" || s === "delivered") return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
  return "text-accent bg-accent/10";
};

const orderStatusIcon = (s: string) => {
  if (s === "draft") return <Wand2 className="w-3.5 h-3.5" />;
  if (s === "ordered" || s === "printing") return <Package className="w-3.5 h-3.5" />;
  return <Truck className="w-3.5 h-3.5" />;
};

const subStatusColor = (s: string) => {
  if (s === "active") return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
  if (s === "paused") return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
  return "text-muted-foreground bg-muted";
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    isAdmin, isCheckingAdmin,
    books, booksLoading,
    profiles, profilesLoading,
    children,
    subscriptions, subscriptionsLoading,
    updateBookStatus, updateSubscriptionStatus,
  } = useAdminData();

  const [viewingBook, setViewingBook] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="text-muted-foreground text-sm">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="font-display text-2xl font-bold text-primary">Access Denied</h1>
            <p className="text-muted-foreground">You don't have admin privileges.</p>
            <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
          </div>
        </main>
      </div>
    );
  }

  const handleDownloadPdf = async (book: any) => {
    const pages = book.pages_data as any[] || [];
    if (!pages.length) { toast.error("No pages to export"); return; }
    setDownloadingPdf(book.id);
    try {
      const blob = await generateBookPdf(pages, book.child_name || "", book.torah_portion || "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.order_number || book.id}-${book.child_name || "book"}.pdf`.replace(/\s+/g, "-").toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF ready for Printify!");
    } catch { toast.error("PDF generation failed"); }
    finally { setDownloadingPdf(null); }
  };

  // Stats
  const totalOrders = books.filter((b: any) => b.status !== "draft").length;
  const totalDrafts = books.filter((b: any) => b.status === "draft").length;
  const activeSubs = subscriptions.filter((s: any) => s.status === "active").length;

  // Filter books by search
  const filteredBooks = books.filter((b: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.child_name || "").toLowerCase().includes(q) ||
      (b.torah_portion || "").toLowerCase().includes(q) ||
      (b.order_number || "").toLowerCase().includes(q) ||
      (b.status || "").toLowerCase().includes(q)
    );
  });

  // User detail view
  const selectedUser = selectedUserId ? profiles.find((p: any) => p.id === selectedUserId) : null;
  const userBooks = selectedUserId ? books.filter((b: any) => b.user_id === selectedUserId) : [];
  const userChildren = selectedUserId ? children.filter((c: any) => c.user_id === selectedUserId) : [];
  const userSubs = selectedUserId ? subscriptions.filter((s: any) => s.user_id === selectedUserId) : [];

  const bookPages = viewingBook?.pages_data as any[] || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease }}
          >
            <div className="flex items-center gap-3 mb-1">
              <ShieldCheck className="w-7 h-7 text-accent" />
              <h1 className="font-display text-3xl font-bold text-primary">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground mb-6">Manage orders, users, subscriptions, and books.</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              {[
                { label: "Total Users", value: profiles.length, icon: Users },
                { label: "Total Books", value: books.length, icon: BookOpen },
                { label: "Orders", value: totalOrders, icon: Package },
                { label: "Drafts", value: totalDrafts, icon: Wand2 },
                { label: "Active Subs", value: activeSubs, icon: CalendarHeart },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-soft-sm">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary font-display">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-6 bg-secondary rounded-2xl h-12">
                <TabsTrigger value="orders" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <Package className="w-4 h-4" /> Orders
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <Users className="w-4 h-4" /> Users
                </TabsTrigger>
                <TabsTrigger value="subs" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <CalendarHeart className="w-4 h-4" /> Subs
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <Settings className="w-4 h-4" /> Settings
                </TabsTrigger>
              </TabsList>

              {/* ═══ TAB: ORDERS ═══ */}
              <TabsContent value="orders">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by child, portion, order #, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>

                  {booksLoading ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
                  ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No books found.</div>
                  ) : (
                    <div className="bg-card rounded-2xl border border-border shadow-soft-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-secondary/50">
                              {["Order", "Customer", "Child", "Portion", "Style", "Date", "Status", "Actions"].map((h) => (
                                <th key={h} className="text-left p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBooks.map((book: any, i: number) => {
                              const profile = profiles.find((p: any) => p.id === book.user_id);
                              return (
                                <motion.tr
                                  key={book.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: i * 0.03 }}
                                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                                >
                                  <td className="p-3 font-mono text-xs text-primary">{book.order_number || "—"}</td>
                                  <td className="p-3">
                                    <button
                                      onClick={() => setSelectedUserId(book.user_id)}
                                      className="text-xs text-accent hover:underline"
                                    >
                                      {profile?.full_name || profile?.email || book.user_id.slice(0, 8)}
                                    </button>
                                  </td>
                                  <td className="p-3 text-xs font-medium text-foreground">{book.child_name || "—"}</td>
                                  <td className="p-3 text-xs text-muted-foreground">{book.torah_portion || "—"}</td>
                                  <td className="p-3 text-xs text-muted-foreground capitalize">{book.art_style || "—"}</td>
                                  <td className="p-3 text-xs text-muted-foreground">{format(new Date(book.created_at), "MMM d, yy")}</td>
                                  <td className="p-3">
                                    <Select
                                      value={book.status}
                                      onValueChange={(v) => {
                                        updateBookStatus.mutate({ id: book.id, status: v });
                                        toast.success(`Status updated to ${v}`);
                                      }}
                                    >
                                      <SelectTrigger className="w-[130px] h-7 text-[11px]">
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${orderStatusColor(book.status)}`}>
                                          {orderStatusIcon(book.status)}
                                          <SelectValue />
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="ordered">Ordered</SelectItem>
                                        <SelectItem value="printing">Printing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1">
                                      {book.pages_data && (
                                        <Button variant="ghost" size="sm" className="text-[11px] h-7 px-2" onClick={() => setViewingBook(book)}>
                                          <Eye className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {book.pages_data && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-[11px] h-7 px-2"
                                          disabled={downloadingPdf === book.id}
                                          onClick={() => handleDownloadPdf(book)}
                                        >
                                          {downloadingPdf === book.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ═══ TAB: USERS ═══ */}
              <TabsContent value="users">
                {selectedUser ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)} className="text-xs gap-1 mb-2">
                      ← Back to all users
                    </Button>
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-bold text-primary">{selectedUser.full_name || "No Name"}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> {selectedUser.email || "No email"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" /> Joined {format(new Date(selectedUser.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      {/* User's children */}
                      <div className="mb-6">
                        <h4 className="font-display font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-accent" /> Children ({userChildren.length})
                        </h4>
                        {userChildren.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {userChildren.map((kid: any) => (
                              <div key={kid.id} className="bg-muted/30 rounded-xl p-3 flex items-center gap-2">
                                {kid.photo_url ? (
                                  <img src={kid.photo_url} alt={kid.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                    {kid.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-semibold text-primary">{kid.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {kid.age ? `${kid.age}yo` : ""}{kid.gender ? ` · ${kid.gender}` : ""}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-muted-foreground">No children added</p>}
                      </div>

                      {/* User's orders */}
                      <div className="mb-6">
                        <h4 className="font-display font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-accent" /> Order History ({userBooks.length})
                        </h4>
                        {userBooks.length > 0 ? (
                          <div className="space-y-2">
                            {userBooks.map((book: any) => (
                              <div key={book.id} className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {book.cover_image_url ? (
                                    <img src={book.cover_image_url} className="w-10 h-10 rounded-lg object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                      <BookOpen className="w-4 h-4 text-accent" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs font-semibold text-primary">{book.torah_portion || "Torah Tale"}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      For {book.child_name || "—"} · {format(new Date(book.created_at), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${orderStatusColor(book.status)}`}>
                                    {book.status}
                                  </span>
                                  {book.pages_data && (
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setViewingBook(book)}>
                                        <Eye className="w-3 h-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDownloadPdf(book)}>
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-muted-foreground">No orders yet</p>}
                      </div>

                      {/* User's subscriptions */}
                      <div className="mb-6">
                        <h4 className="font-display font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                          <CalendarHeart className="w-4 h-4 text-accent" /> Subscriptions ({userSubs.length})
                        </h4>
                        {userSubs.length > 0 ? (
                          <div className="space-y-2">
                            {userSubs.map((sub: any) => (
                              <div key={sub.id} className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-primary">Parashah Club — {sub.child_name || "Child"}</p>
                                  <p className="text-[10px] text-muted-foreground">${sub.price_per_week}/week · {sub.art_style}</p>
                                </div>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${subStatusColor(sub.status)}`}>
                                  {sub.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-muted-foreground">No subscriptions</p>}
                      </div>

                      {/* Shipping addresses from orders */}
                      <div>
                        <h4 className="font-display font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-accent" /> Shipping Addresses
                        </h4>
                        {(() => {
                          const addresses = userBooks
                            .filter((b: any) => b.shipping_data)
                            .map((b: any) => b.shipping_data);
                          const unique = addresses.filter((a: any, i: number, arr: any[]) =>
                            i === arr.findIndex((x: any) => x.street === a.street && x.city === a.city)
                          );
                          return unique.length > 0 ? (
                            <div className="space-y-2">
                              {unique.map((addr: any, i: number) => (
                                <div key={i} className="bg-muted/30 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-primary">{addr.fullName}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {addr.street}{addr.apt ? `, ${addr.apt}` : ""}, {addr.city}, {addr.state} {addr.zip}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : <p className="text-xs text-muted-foreground">No shipping addresses</p>;
                        })()}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {profilesLoading ? (
                      <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
                    ) : profiles.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No users yet.</div>
                    ) : (
                      <div className="bg-card rounded-2xl border border-border shadow-soft-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-secondary/50">
                                {["Name", "Email", "Joined", "Books", "Subs", ""].map((h) => (
                                  <th key={h} className="text-left p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {profiles.map((profile: any) => {
                                const uBooks = books.filter((b: any) => b.user_id === profile.id).length;
                                const uSubs = subscriptions.filter((s: any) => s.user_id === profile.id).length;
                                return (
                                  <tr key={profile.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                                    <td className="p-3 text-xs font-medium text-foreground">{profile.full_name || "—"}</td>
                                    <td className="p-3 text-xs text-muted-foreground">{profile.email || "—"}</td>
                                    <td className="p-3 text-xs text-muted-foreground">{format(new Date(profile.created_at), "MMM d, yyyy")}</td>
                                    <td className="p-3 text-xs text-foreground font-semibold">{uBooks}</td>
                                    <td className="p-3 text-xs text-foreground font-semibold">{uSubs}</td>
                                    <td className="p-3">
                                      <Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => setSelectedUserId(profile.id)}>
                                        <Eye className="w-3 h-3 mr-1" /> View
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* ═══ TAB: SUBSCRIPTIONS ═══ */}
              <TabsContent value="subs">
                {subscriptionsLoading ? (
                  <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No subscriptions yet.</div>
                ) : (
                  <div className="bg-card rounded-2xl border border-border shadow-soft-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            {["Customer", "Child", "Style", "Price", "Frequency", "Next Delivery", "Status", "Action"].map((h) => (
                              <th key={h} className="text-left p-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {subscriptions.map((sub: any) => {
                            const profile = profiles.find((p: any) => p.id === sub.user_id);
                            return (
                              <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                                <td className="p-3">
                                  <button onClick={() => setSelectedUserId(sub.user_id)} className="text-xs text-accent hover:underline">
                                    {profile?.full_name || profile?.email || sub.user_id.slice(0, 8)}
                                  </button>
                                </td>
                                <td className="p-3 text-xs font-medium text-foreground">{sub.child_name || "—"}</td>
                                <td className="p-3 text-xs text-muted-foreground capitalize">{sub.art_style || "—"}</td>
                                <td className="p-3 text-xs text-foreground">${sub.price_per_week}</td>
                                <td className="p-3 text-xs text-muted-foreground capitalize">{sub.frequency}</td>
                                <td className="p-3 text-xs text-muted-foreground">
                                  {sub.next_delivery_date ? format(new Date(sub.next_delivery_date), "MMM d, yyyy") : "—"}
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={sub.status}
                                    onValueChange={(v) => {
                                      updateSubscriptionStatus.mutate({ id: sub.id, status: v });
                                      toast.success(`Subscription ${v}`);
                                    }}
                                  >
                                    <SelectTrigger className="w-[110px] h-7 text-[11px]">
                                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${subStatusColor(sub.status)}`}>
                                        <SelectValue />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="paused">Paused</SelectItem>
                                      <SelectItem value="canceled">Canceled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-3">
                                  <Button variant="ghost" size="sm" className="text-[11px] h-7" onClick={() => setSelectedUserId(sub.user_id)}>
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ═══ TAB: SETTINGS ═══ */}
              <TabsContent value="settings">
                <AdminCMS />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      <Footer />

      {/* Book Viewer Modal */}
      {viewingBook && (
        <BookViewerModal
          open={!!viewingBook}
          onClose={() => setViewingBook(null)}
          childName={viewingBook.child_name || ""}
          torahPortion={viewingBook.torah_portion || ""}
          artStyle={viewingBook.art_style || "cartoon"}
          pages={bookPages}
        />
      )}
    </div>
  );
}
