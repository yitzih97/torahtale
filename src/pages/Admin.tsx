import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminBookGenerationModal } from "@/components/admin/AdminBookGenerationModal";
import {
  Package, Wand2, Users, BookOpen, CalendarHeart,
  Settings, ShieldCheck, Mail, Loader2, AlertTriangle, LayoutDashboard,
} from "lucide-react";
import { AdminDashboardTab } from "@/components/admin/AdminDashboardTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminSubsTab } from "@/components/admin/AdminSubsTab";
import { AdminOrderDetailDialog } from "@/components/admin/AdminOrderDetailDialog";
import { AdminOrderEditDialog } from "@/components/admin/AdminOrderEditDialog";
import { AdminMessagesTab } from "@/components/admin/AdminMessagesTab";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminData, fetchBookFull } from "@/hooks/useAdminData";
import { submitBatchToPrintify, submitBookToPrintify } from "@/lib/submitToPrintify";
import { bookLanguageCode, isBookRtl } from "@/components/wizard/TorahPortions";
import { generateBookZip } from "@/lib/generateBookZip";
import { toast } from "sonner";
import { AdminCMS } from "@/components/admin/AdminCMS";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const ease = [0.22, 1, 0.36, 1];

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const {
    isAdmin, isCheckingAdmin,
    books, booksLoading,
    profiles, profilesLoading,
    children,
    subscriptions, subscriptionsLoading,
    updateBookStatus, markBookPaid, updateBookOrderDetails, updateSubscriptionStatus,
  } = useAdminData();

  const [generatingBook, setGeneratingBook] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  // The full book row is fetched on demand (the list omits the image columns),
  // so a row click has a real wait — surface it instead of looking dead.
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

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
    setOpeningBookId(book.id);
    try {
      const full = await fetchBookFull(book.id);
      // Keep the list-only flags (has_pages, story_options) that the full row
      // doesn't carry, so the modal and its actions behave the same either way.
      setGeneratingBook(full ? { ...book, ...full } : book);
    } catch {
      toast.error("Couldn't load the book — please retry.");
    } finally {
      setOpeningBookId(null);
    }
  };

  const handleTriggerGeneration = (book: any) => {
    openGenerationModal(book);
  };

  // Whether the "Generate" action applies to this order's current state.
  const canGenerate = (book: any) =>
    book.status === "paid" || book.status === "generating" || book.status === "draft" ||
    ((book.status === "ordered" || book.status === "pending_review") && !book.has_pages);

  /* Build the render input for one book — the same shape whether it goes out on
     its own or as part of a batch. Returns null when the book has no pages yet. */
  const printInputFor = async (book: any) => {
    const full = await fetchBookFull(book.id);
    const pages = (full?.pages_data as any[]) || [];
    if (!pages.length) return null;
    const pt = (full as any)?.shipping_data?.bookOptions?.productType || (book as any)?.shipping_data?.bookOptions?.productType;
    const bookFormat = pt === "board" ? "board-6x6" : pt === "hardcover" ? "hardcover-8x8" : pt === "coloring" ? "coloring-8.5x11" : "softcover-8x8";
    // The book's OWN language drives the print layout, not the admin's UI.
    const bookLang = (full as any)?.language || (book as any)?.language;
    return {
      bookId: book.id,
      pages: pages as any,
      childName: book.child_name || (full?.child_name as string) || "",
      coverChildName: ((full as any)?.story_data || (book as any)?.story_data)?.coverChildName,
      torahPortion: book.torah_portion || (full?.torah_portion as string) || "",
      bookFormat,
      lang: bookLanguageCode(bookLang),
      rtl: isBookRtl(bookLang),
      story: (full as any)?.story_data || (book as any)?.story_data,
    };
  };

  /**
   * Approve a whole subscription batch and send it as ONE Printify order.
   *
   * A Parsha Series charge mints four books sharing a shipmentBatchId, sold as a
   * single monthly delivery. Approving them one at a time produced four orders
   * and four parcels, so when a book belongs to a batch this gathers its
   * siblings and submits the set together. Every book must be renderable — a
   * partial batch would ship part of the month and quietly drop the rest.
   */
  const approveBatchAndSubmit = async (book: any, batchId: string) => {
    const siblings = (books || []).filter(
      (b: any) => String(b?.shipment_batch_id ?? "") === batchId && !b.printify_order_id,
    );
    const ordered = siblings.length ? siblings : [book];
    const toastId = toast.loading(`Rendering ${ordered.length} books for print…`);
    try {
      const inputs = [];
      for (const b of ordered) {
        const input = await printInputFor(b);
        if (!input) {
          toast.error(`${b.child_name || "A book"} in this batch has no pages yet — nothing was sent.`, { id: toastId, duration: 10000 });
          return;
        }
        inputs.push(input);
      }
      const result = await submitBatchToPrintify({
        books: inputs,
        onProgress: (i, n, done, total) =>
          toast.loading(`Book ${i + 1}/${n} — uploading print images ${done}/${total}`, { id: toastId }),
      });
      if (!result.success) {
        toast.error(`Printify submit failed: ${result.error}`, { id: toastId, duration: 12000 });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast.success(`Sent ${result.books ?? ordered.length} books to Printify as one order.`, { id: toastId });
    } catch (e: any) {
      console.error("Printify batch error:", e);
      toast.error(`Printify submit failed: ${e?.message || "unexpected error"}`, { id: toastId, duration: 12000 });
    }
  };

  // Approve a reviewed book and auto-submit it to Printify.
  const approveAndSubmit = async (book: any) => {
    // A book minted as part of a subscription batch ships with its siblings —
    // one order, one parcel — so hand it to the batch path instead.
    // `shipment_batch_id` is the admin list's JSON-path projection of
    // story_data->>shipmentBatchId (the full story_data is far too heavy to
    // select for a list) — see BOOK_LIST_COLS.
    const batchId = (book as any)?.shipment_batch_id;
    if (batchId) return approveBatchAndSubmit(book, String(batchId));
    // Do NOT optimistically flip the status to "approved". Printify submission is
    // what actually matters — the edge function itself sets the book to "printing"
    // on success. Marking "approved" before that made failed submissions look done
    // (a book stuck at "approved" with no Printify order). Only commit on success;
    // on failure surface the REAL error and leave the status untouched.
    const toastId = toast.loading(`Rendering ${book.child_name || "book"} for print…`);
    try {
      const full = await fetchBookFull(book.id);
      const pages = (full?.pages_data as any[]) || [];
      if (!pages.length) {
        toast.error("This book has no pages to print yet.", { id: toastId, duration: 8000 });
        return;
      }
      const pt = (full as any)?.shipping_data?.bookOptions?.productType || (book as any)?.shipping_data?.bookOptions?.productType;
      const bookFormat = pt === "board" ? "board-6x6" : pt === "hardcover" ? "hardcover-8x8" : pt === "coloring" ? "coloring-8.5x11" : "softcover-8x8";
      // The book's OWN language drives the print layout (RTL + localized text) —
      // NOT the admin's UI language. A Hebrew/Yiddish book must print RTL even
      // when an English-speaking admin approves it.
      const bookLang = (full as any)?.language || (book as any)?.language;
      // Render the print-ready images (cover wrap + each page WITH its caption
      // text) and upload them to Printify, then place the order.
      const result = await submitBookToPrintify({
        bookId: book.id,
        pages: pages as any,
        childName: book.child_name || (full?.child_name as string) || "",
        coverChildName: ((full as any)?.story_data || (book as any)?.story_data)?.coverChildName,
        torahPortion: book.torah_portion || (full?.torah_portion as string) || "",
        bookFormat,
        lang: bookLanguageCode(bookLang),
        rtl: isBookRtl(bookLang),
        onProgress: (done, total) => toast.loading(`Uploading print images… ${done}/${total}`, { id: toastId }),
      });
      if (!result.success) {
        // Not marked approved — the admin sees exactly why and can retry.
        toast.error(`Printify submit failed: ${result.error}`, { id: toastId, duration: 12000 });
        return;
      }
      // Success: the function set status → "printing" + saved the Printify order id.
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast.success(
        result.duplicate ? "Already in Printify — order confirmed." : "Approved & sent to Printify!",
        { id: toastId },
      );
    } catch (e: any) {
      console.error("Printify error:", e);
      toast.error(`Printify submit failed: ${e?.message || "unexpected error"}`, { id: toastId, duration: 12000 });
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
              <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6 mb-6 bg-secondary rounded-2xl h-auto sm:h-12">
                <TabsTrigger value="dashboard" className="gap-2 rounded-2xl data-[state=active]:bg-card data-[state=active]:shadow-soft-sm text-xs sm:text-sm">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </TabsTrigger>
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

              {/* ═══ TAB: DASHBOARD (main screen) ═══ */}
              <TabsContent value="dashboard">
                <AdminDashboardTab books={books} profiles={profiles} children={children} subscriptions={subscriptions} />
              </TabsContent>

              {/* ═══ TAB: ORDERS ═══ */}
              <TabsContent value="orders">
                <AdminOrdersTab
                  books={books}
                  booksLoading={booksLoading}
                  profiles={profiles}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  updateBookStatus={updateBookStatus}
                  markBookPaid={markBookPaid}
                  downloadingZip={downloadingZip}
                  openingBookId={openingBookId}
                  canGenerate={canGenerate}
                  onOpenDetail={(book) => setSelectedOrder(book)}
                  onOpenBookEditor={(book) => openGenerationModal(book)}
                  onGenerate={(book) => handleTriggerGeneration(book)}
                  onDownloadZip={(book) => handleDownloadZip(book)}
                  onApprove={(book) => approveAndSubmit(book)}
                  onEditOrder={(book) => setEditingOrder(book)}
                  onSelectUser={(userId) => openCustomerFromOrder(userId)}
                />
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
                  // The list rows carry no pages_data/story_data, so handing a row
                  // straight to the modal opened an empty book. Go through the
                  // full-row fetch, same as the orders tab.
                  setGeneratingBook={openGenerationModal}
                  handleDownloadZip={handleDownloadZip}
                  downloadingZip={downloadingZip}
                  onOpenOrderDetail={(book) => setSelectedOrder(book)}
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
                <AdminSubsTab
                  subscriptions={subscriptions}
                  subscriptionsLoading={subscriptionsLoading}
                  profiles={profiles}
                  books={books}
                  children={children}
                  updateSubscriptionStatus={updateSubscriptionStatus}
                  onSelectUser={(userId) => openCustomerFromOrder(userId)}
                  onOpenOrderDetail={(book) => setSelectedOrder(book)}
                  onOpenBookEditor={(book) => openGenerationModal(book)}
                />
              </TabsContent>

              {/* ═══ TAB: MESSAGES ═══ */}
              <TabsContent value="messages">
                <AdminMessagesTab onSelectUser={(userId) => openCustomerFromOrder(userId)} />
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
          onEditOrder={() => { setEditingOrder(selectedOrder); setSelectedOrder(null); }}
        />
      )}

      {/* Edit an order's book format, shipping address and shipping speed */}
      {editingOrder && (
        <AdminOrderEditDialog
          book={editingOrder}
          open={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          saving={updateBookOrderDetails.isPending}
          onSave={(shipping_data) =>
            updateBookOrderDetails.mutateAsync({ id: editingOrder.id, shipping_data })
          }
        />
      )}

      {/* Admin Book Generation & Editing Modal */}
      {generatingBook && (
        <AdminBookGenerationModal
          open={!!generatingBook}
          onClose={() => setGeneratingBook(null)}
          book={generatingBook}
          onBookUpdated={() => {
            // Soft-refresh the list — a full window.location.reload() here wiped
            // the Printify success/error toast before the admin could read it
            // (approve calls this on BOTH success and failure), making a failed
            // submit look like "nothing happened / no order".
            queryClient.invalidateQueries({ queryKey: ["admin-books"] });
          }}
        />
      )}
    </div>
  );
}
