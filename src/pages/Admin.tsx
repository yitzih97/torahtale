import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminBookGenerationModal } from "@/components/admin/AdminBookGenerationModal";
import { Input } from "@/components/ui/input";
import {
  Package, Truck, Wand2, Users, BookOpen, CalendarHeart,
  Settings, Eye, Download, Search, ShieldCheck, Mail, MapPin,
  Clock, Loader2, AlertTriangle, CheckCircle2, Play, Maximize2,
} from "lucide-react";
import { AdminOrderDetailDialog } from "@/components/admin/AdminOrderDetailDialog";
import { AdminMessagesTab } from "@/components/admin/AdminMessagesTab";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminData, fetchBookFull } from "@/hooks/useAdminData";
import { getPortionDisplay } from "@/components/wizard/TorahPortions";
import { renderPrintCoverFront } from "@/lib/renderPrintCover";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateBookZip } from "@/lib/generateBookZip";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminCMS } from "@/components/admin/AdminCMS";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const ease = [0.22, 1, 0.36, 1];

const orderStatusColor = (s: string) => {
  if (s === "draft") return "text-muted-foreground bg-muted";
  if (s === "generating") return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
  if (s === "ordered" || s === "printing") return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
  if (s === "approved") return "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950";
  if (s === "shipped" || s === "delivered") return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
  return "text-accent bg-accent/10";
};

const orderStatusIcon = (s: string) => {
  if (s === "draft") return <Wand2 className="w-3.5 h-3.5" />;
  if (s === "generating") return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
  if (s === "ordered" || s === "printing") return <Package className="w-3.5 h-3.5" />;
  if (s === "approved") return <CheckCircle2 className="w-3.5 h-3.5" />;
  return <Truck className="w-3.5 h-3.5" />;
};

const subStatusColor = (s: string) => {
  if (s === "active") return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
  if (s === "paused") return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950";
  return "text-muted-foreground bg-muted";
};

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const {
    isAdmin, isCheckingAdmin,
    books, booksLoading,
    profiles, profilesLoading,
    children,
    subscriptions, subscriptionsLoading,
    updateBookStatus, updateSubscriptionStatus,
  } = useAdminData();

  const [generatingBook, setGeneratingBook] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("orders");

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
        <Navbar transparentHero={false} />
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

  const handleDownloadZip = async (book: any) => {
    setDownloadingZip(book.id);
    try {
      // pages_data is excluded from the list payload (too heavy) — fetch it now.
      const full = await fetchBookFull(book.id);
      const pages = (full?.pages_data as any[]) || [];
      if (!pages.length) { toast.error("No pages to export"); return; }
      const blob = await generateBookZip(pages, book.child_name || "book", book.order_number || book.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.order_number || book.id}-${book.child_name || "book"}-images.zip`.replace(/\s+/g, "-").toLowerCase();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("ZIP ready for Printify!");
    } catch { toast.error("ZIP generation failed"); }
    finally { setDownloadingZip(null); }
  };

  // The list rows carry metadata only (no pages_data/story_data/cover). Fetch the
  // full book before opening the generation modal, which reads those heavy fields.
  const openGenerationModal = async (book: any) => {
    try {
      const full = await fetchBookFull(book.id);
      setGeneratingBook(full || book);
    } catch {
      toast.error("Couldn't load the book — please retry.");
    }
  };

  const handleTriggerGeneration = (book: any) => {
    openGenerationModal(book);
  };

  // Whether the "Generate" action applies to this order's current state.
  const canGenerate = (book: any) =>
    book.status === "paid" || book.status === "generating" || book.status === "draft" ||
    ((book.status === "ordered" || book.status === "pending_review") && !book.has_pages);

  // Approve a reviewed book and auto-submit it to Printify.
  const approveAndSubmit = async (book: any) => {
    updateBookStatus.mutate({ id: book.id, status: "approved" });
    try {
      // Bake the cover text (Parasha big, kids small) onto the front-cover image
      // that Printify prints — the stored cover stays text-free for the viewer.
      let coverImage: string | undefined;
      try {
        const full = await fetchBookFull(book.id);
        const pages = (full?.pages_data as any[]) || [];
        const coverSrc = pages.find((p) => p?.type === "cover")?.image || (full?.cover_image_url as string | undefined);
        if (coverSrc) {
          const parasha = getPortionDisplay(book.torah_portion || (full?.torah_portion as string) || "", lang) || book.torah_portion || "";
          coverImage = await renderPrintCoverFront(coverSrc, parasha, book.child_name || (full?.child_name as string) || "");
        }
      } catch (e) {
        console.error("cover text bake failed — submitting without it:", e);
      }
      const { data: pfResult, error: pfErr } = await supabase.functions.invoke("printify-submit", {
        body: { action: "submit-order", bookId: book.id, coverImage },
      });
      if (pfErr) throw pfErr;
      if (pfResult?.success) {
        toast.success("Approved & sent to Printify!");
      } else {
        toast.warning(`Approved but Printify failed: ${pfResult?.error || "Unknown"}`);
      }
    } catch (e: any) {
      console.error("Printify error:", e);
      toast.warning("Approved but Printify auto-submit failed.");
    }
  };

  // Open the customer's full card from an order (switches to the Users tab).
  const openCustomerFromOrder = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab("users");
    setSelectedOrder(null);
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
      (b.shopify_order_name || "").toLowerCase().includes(q) ||
      (b.status || "").toLowerCase().includes(q)
    );
  });




  

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparentHero={false} />
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-5 mb-6 bg-secondary rounded-2xl h-12">
                <TabsTrigger value="orders" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <Package className="w-4 h-4" /> Orders
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <Users className="w-4 h-4" /> Users
                </TabsTrigger>
                <TabsTrigger value="subs" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <CalendarHeart className="w-4 h-4" /> Subs
                </TabsTrigger>
                <TabsTrigger value="messages" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <Mail className="w-4 h-4" /> Messages
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
                              {["Order", "Customer", "Child", "Portion", "Style", "Placed", "Status", "Actions"].map((h) => (
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
                                  <td className="p-3 font-mono text-xs text-primary">{book.order_number || book.shopify_order_name || "—"}</td>
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
                                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(book.paid_at || book.created_at), "MMM d, yy · h:mm a")}
                                  </td>
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
                                        <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="generating">Generating</SelectItem>
                                        <SelectItem value="pending_review">Pending review</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="printing">Printing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[11px] h-7 px-2 text-accent"
                                        onClick={() => setSelectedOrder(book)}
                                        title="Open order details"
                                      >
                                        <Maximize2 className="w-3 h-3" />
                                      </Button>
                                      {canGenerate(book) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-[11px] h-7 px-2 text-accent"
                                          onClick={() => handleTriggerGeneration(book)}
                                          title="Generate book content"
                                        >
                                          <Play className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {book.has_pages && (
                                        <Button variant="ghost" size="sm" className="text-[11px] h-7 px-2" onClick={() => openGenerationModal(book)} title="View & edit book">
                                          <Eye className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {book.has_pages && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-[11px] h-7 px-2"
                                          disabled={downloadingZip === book.id}
                                          onClick={() => handleDownloadZip(book)}
                                          title="Download images (ZIP)"
                                        >
                                          {downloadingZip === book.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                        </Button>
                                      )}
                                      {book.has_pages && (book.status === "pending_review" || book.status === "ordered") && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-[11px] h-7 px-2 text-green-600"
                                          onClick={() => approveAndSubmit(book)}
                                          title="Approve for printing"
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
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
                <AdminUsersTab
                  profiles={profiles}
                  books={books}
                  children={children}
                  subscriptions={subscriptions}
                  profilesLoading={profilesLoading}
                  selectedUserId={selectedUserId}
                  setSelectedUserId={setSelectedUserId}
                  setGeneratingBook={setGeneratingBook}
                  handleDownloadZip={handleDownloadZip}
                  updateBookStatus={updateBookStatus}
                  updateSubscriptionStatus={updateSubscriptionStatus}
                  refetchAll={() => {
                    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
                    queryClient.invalidateQueries({ queryKey: ["admin-books"] });
                    queryClient.invalidateQueries({ queryKey: ["admin-children"] });
                    queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
                    toast.success("Refreshed");
                  }}
                />
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

              {/* ═══ TAB: MESSAGES ═══ */}
              <TabsContent value="messages">
                <AdminMessagesTab />
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

      {/* Order detail dialog */}
      {selectedOrder && (
        <AdminOrderDetailDialog
          book={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          profile={profiles.find((p: any) => p.id === selectedOrder.user_id) || null}
          kids={children.filter((c: any) => c.user_id === selectedOrder.user_id)}
          canGenerate={canGenerate(selectedOrder)}
          downloading={downloadingZip === selectedOrder.id}
          onGenerate={() => { handleTriggerGeneration(selectedOrder); setSelectedOrder(null); }}
          onViewEdit={() => { openGenerationModal(selectedOrder); setSelectedOrder(null); }}
          onDownload={() => handleDownloadZip(selectedOrder)}
          onApprove={() => approveAndSubmit(selectedOrder)}
          onViewCustomer={() => openCustomerFromOrder(selectedOrder.user_id)}
        />
      )}

      {/* Admin Book Generation & Editing Modal */}
      {generatingBook && (
        <AdminBookGenerationModal
          open={!!generatingBook}
          onClose={() => setGeneratingBook(null)}
          book={generatingBook}
          onBookUpdated={() => {
            // Refresh book list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
