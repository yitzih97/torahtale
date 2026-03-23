import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Package, Truck, Wand2 } from "lucide-react";

interface Order {
  id: string;
  customer: string;
  child: string;
  portion: string;
  status: string;
}

const initialOrders: Order[] = [
  { id: "MTT-1042", customer: "Rachel Goldberg", child: "Eli", portion: "Parashat Noach", status: "Generating" },
  { id: "MTT-1043", customer: "David Levi", child: "Miriam", portion: "Parashat Beshalach", status: "Printing" },
  { id: "MTT-1044", customer: "Sarah Cohen", child: "Avi", portion: "Parashat Noach", status: "Shipped" },
  { id: "MTT-1045", customer: "Yossi Katz", child: "Talia", portion: "Parashat Beshalach", status: "Generating" },
];

const statusIcon = (s: string) => {
  if (s === "Generating") return <Wand2 className="w-4 h-4" />;
  if (s === "Printing") return <Package className="w-4 h-4" />;
  return <Truck className="w-4 h-4" />;
};

const statusColor = (s: string) => {
  if (s === "Generating") return "text-gold bg-gold/10";
  if (s === "Printing") return "text-blue-600 bg-blue-50";
  return "text-green-600 bg-green-50";
};

const ease = [0.22, 1, 0.36, 1];

export default function Admin() {
  const [orders, setOrders] = useState(initialOrders);

  const updateStatus = (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
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
            <h1 className="font-display text-3xl font-bold text-primary mb-2">Order Dashboard</h1>
            <p className="text-muted-foreground mb-8">Manage and track all book orders.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="bg-card rounded-book border border-border shadow-soft-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-4 font-mono text-xs tracking-widest uppercase text-muted-foreground">Order ID</th>
                    <th className="text-left p-4 font-mono text-xs tracking-widest uppercase text-muted-foreground">Customer</th>
                    <th className="text-left p-4 font-mono text-xs tracking-widest uppercase text-muted-foreground">Child</th>
                    <th className="text-left p-4 font-mono text-xs tracking-widest uppercase text-muted-foreground">Portion</th>
                    <th className="text-left p-4 font-mono text-xs tracking-widest uppercase text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-mono text-xs tracking-widest uppercase text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + i * 0.07, ease }}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-primary">{order.id}</td>
                      <td className="p-4 text-foreground">{order.customer}</td>
                      <td className="p-4 text-foreground font-medium">{order.child}</td>
                      <td className="p-4 text-muted-foreground">{order.portion}</td>
                      <td className="p-4">
                        <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>
                              {statusIcon(order.status)}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Generating">Generating</SelectItem>
                            <SelectItem value="Printing">Printing</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => alert(`Mock: Opening PDF for ${order.id}`)}>
                          <FileText className="w-3.5 h-3.5" /> View PDF
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
