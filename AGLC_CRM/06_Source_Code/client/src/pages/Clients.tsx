import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Search, Building2, Mail, Phone, Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  individual: "فرد",
  company: "شركة",
  government: "جهة حكومية",
};

const statusLabels: Record<string, { label: string; tag: string }> = {
  active: { label: "نشط", tag: "tag-active" },
  inactive: { label: "غير نشط", tag: "tag-review" },
  prospect: { label: "محتمل", tag: "tag-review" },
  archived: { label: "مؤرشف", tag: "tag-complete" },
};

export default function Clients() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery(
    filterType !== "all" ? { status: filterType } : undefined
  );

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => { refetch(); setDialogOpen(false); toast.success("تم إنشاء العميل بنجاح"); },
  });

  const [form, setForm] = useState({
    nameEn: "", nameAr: "", clientType: "company" as any,
    email: "", phone: "", industry: "", notes: "",
  });

  const filtered = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c =>
      c.nameEn.toLowerCase().includes(q) ||
      (c.nameAr && c.nameAr.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">العملاء</h1>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display">العملاء</h1>
          <p className="text-xs text-muted-foreground mt-1">Client Management — {clients?.length || 0} عميل</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 ml-1" /> عميل جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">إضافة عميل</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs">الاسم (إنجليزي) *</Label>
                <Input className="mt-1 h-9 text-sm" value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">الاسم (عربي)</Label>
                <Input className="mt-1 h-9 text-sm" value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">النوع *</Label>
                  <Select value={form.clientType} onValueChange={v => setForm({...form, clientType: v})}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">القطاع</Label>
                  <Input className="mt-1 h-9 text-sm" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">البريد الإلكتروني</Label>
                  <Input className="mt-1 h-9 text-sm" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} dir="ltr" />
                </div>
                <div>
                  <Label className="text-xs">الهاتف</Label>
                  <Input className="mt-1 h-9 text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" />
                </div>
              </div>
              <div>
                <Label className="text-xs">ملاحظات</Label>
                <Textarea className="mt-1 text-sm" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
              </div>
              <Button onClick={() => { if (form.nameEn) createMutation.mutate(form); }} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء العميل"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-gold)", borderRightWidth: "3px" }}>
          <p className="stat-label">الإجمالي</p>
          <p className="stat-value mt-1">{clients?.length || 0}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-success)", borderRightWidth: "3px" }}>
          <p className="stat-label">نشط</p>
          <p className="stat-value mt-1">{clients?.filter(c => c.status === "active").length || 0}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-copper)", borderRightWidth: "3px" }}>
          <p className="stat-label">شركات</p>
          <p className="stat-value mt-1">{clients?.filter(c => c.companyName).length || 0}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-navy)", borderRightWidth: "3px" }}>
          <p className="stat-label">أفراد</p>
          <p className="stat-value mt-1">{clients?.filter(c => !c.companyName).length || 0}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في العملاء..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 h-9 text-sm" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full bg-card border-border">
            <CardContent className="p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا يوجد عملاء</p>
            </CardContent>
          </Card>
        ) : filtered.map(client => {
          const sl = statusLabels[client.status] || { label: client.status, tag: "tag-review" };
          return (
            <Card key={client.id} className="bg-card border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded shrink-0" style={{ background: "oklch(0.75 0.15 85 / 0.1)" }}>
                    {client.companyName ? (
                      <Building2 className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
                    ) : (
                      <Users className="h-4 w-4" style={{ color: "var(--accent-copper)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate" dir="ltr">{client.nameEn}</h3>
                      <span className={`tag ${sl.tag}`}>{sl.label}</span>
                    </div>
                    {client.nameAr && <p className="text-xs text-muted-foreground">{client.nameAr}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{client.companyName ? "شركة" : "فرد"}</Badge>
                      {client.industry && <span className="text-[10px] text-muted-foreground">{client.industry}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      {client.email && (
                        <span className="flex items-center gap-1" dir="ltr">
                          <Mail className="h-2.5 w-2.5" />{client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="h-2.5 w-2.5" />{client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
