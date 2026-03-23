import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Users, ShoppingBag, CalendarHeart, Plus, Download, RefreshCw,
  Truck, Package, BookOpen, Palette, Pause, Play, X,
} from "lucide-react";
import heroBook from "@/assets/hero-book.png";
import samplePage from "@/assets/sample-page.png";

const ease = [0.22, 1, 0.36, 1];

const MOCK_KIDS = [
  { id: 1, name: "Eli", age: 7, gender: "Boy", artStyle: "Cartoon", initials: "EG", color: "bg-blue-100 text-blue-700" },
  { id: 2, name: "Miriam", age: 5, gender: "Girl", artStyle: "3D Pixar", initials: "MG", color: "bg-pink-100 text-pink-700" },
];

const MOCK_ORDERS = [
  { id: "MTT-1042", child: "Eli", portion: "Parashat Noach", date: "Mar 15, 2026", status: "Delivered", image: heroBook },
  { id: "MTT-1038", child: "Miriam", portion: "Parashat Beshalach", date: "Mar 8, 2026", status: "Printing", image: samplePage },
  { id: "MTT-1031", child: "Eli", portion: "Parashat Bereishit", date: "Mar 1, 2026", status: "Delivered", image: heroBook },
];

const MOCK_SUBS = [
  { id: 1, child: "Eli", nextPortion: "Parashat Vayera", nextDate: "Mar 28, 2026", active: true },
  { id: 2, child: "Miriam", nextPortion: "Parashat Lech Lecha", nextDate: "Mar 28, 2026", active: true },
];

const orderStatusStyle = (s: string) => {
  if (s === "Delivered") return "text-green-700 bg-green-50";
  if (s === "Printing") return "text-blue-600 bg-blue-50";
  return "text-gold bg-gold/10";
};

export default function Dashboard() {
  const [subs, setSubs] = useState(MOCK_SUBS);

  const toggleSub = (id: number) => {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
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
            <p className="text-muted-foreground mb-8">Welcome back! Manage your family's Torah tales.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
          >
            <Tabs defaultValue="kids" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-8 bg-secondary rounded-book h-12">
                <TabsTrigger value="kids" className="gap-2 rounded-book data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <Users className="w-4 h-4" /> My Kids
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2 rounded-book data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <ShoppingBag className="w-4 h-4" /> Order History
                </TabsTrigger>
                <TabsTrigger value="subs" className="gap-2 rounded-book data-[state=active]:bg-card data-[state=active]:shadow-soft-sm">
                  <CalendarHeart className="w-4 h-4" /> Subscriptions
                </TabsTrigger>
              </TabsList>

              {/* TAB A: Kids */}
              <TabsContent value="kids">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_KIDS.map((kid, i) => (
                    <motion.div
                      key={kid.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08, ease }}
                      className="bg-card rounded-book border border-border p-5 shadow-soft-sm hover:shadow-soft-md transition-shadow duration-300"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg ${kid.color}`}>
                          {kid.initials}
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold text-primary">{kid.name}</h3>
                          <p className="text-xs text-muted-foreground">{kid.age} years old · {kid.gender}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Palette className="w-3.5 h-3.5" />
                        <span>Preferred: {kid.artStyle}</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4 text-xs">
                        <BookOpen className="w-3.5 h-3.5" /> Create New Book
                      </Button>
                    </motion.div>
                  ))}

                  {/* Add child card */}
                  <motion.button
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease }}
                    className="rounded-book border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-all duration-300 active:scale-[0.98] min-h-[180px]"
                  >
                    <Plus className="w-8 h-8" />
                    <span className="text-sm font-medium">Add Child</span>
                  </motion.button>
                </div>
              </TabsContent>

              {/* TAB B: Orders */}
              <TabsContent value="orders">
                <div className="space-y-3">
                  {MOCK_ORDERS.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.07, ease }}
                      className="bg-card rounded-book border border-border p-4 flex items-center gap-4 shadow-soft-sm hover:shadow-soft-md transition-shadow duration-300"
                    >
                      <img src={order.image} alt={order.portion} className="w-16 h-16 rounded-book object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-semibold text-primary text-sm truncate">{order.portion}</h4>
                        <p className="text-xs text-muted-foreground">For {order.child} · {order.date}</p>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0 ${orderStatusStyle(order.status)}`}>
                        {order.status === "Delivered" ? <Truck className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                        {order.status}
                      </span>
                      <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">
                        {order.status === "Delivered" ? (
                          <><Download className="w-3.5 h-3.5" /> PDF</>
                        ) : (
                          <><RefreshCw className="w-3.5 h-3.5" /> Reorder</>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* TAB C: Subscriptions */}
              <TabsContent value="subs">
                <div className="bg-card rounded-book border border-border p-6 shadow-soft-sm mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarHeart className="w-5 h-5 text-accent" />
                    <h3 className="font-display text-lg font-semibold text-primary">Parashah Club</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    A new personalized Torah tale, delivered weekly based on the current parashah.
                  </p>

                  <div className="space-y-4">
                    {subs.map((sub, i) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.08, ease }}
                        className={`rounded-book border p-4 flex items-center justify-between transition-all duration-300 ${
                          sub.active ? "border-accent/30 bg-accent/5" : "border-border bg-muted/30"
                        }`}
                      >
                        <div>
                          <h4 className="font-medium text-primary text-sm">{sub.child}'s Weekly Book</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Next: {sub.nextPortion} · {sub.nextDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${sub.active ? "text-accent" : "text-muted-foreground"}`}>
                            {sub.active ? "Active" : "Paused"}
                          </span>
                          <Switch checked={sub.active} onCheckedChange={() => toggleSub(sub.id)} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
