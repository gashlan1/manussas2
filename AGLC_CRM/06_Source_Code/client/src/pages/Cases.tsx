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
import { Plus, Briefcase, Search, Scale, Building2, Shield, Globe, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; tag: string }> = {
  intake: { label: "استقبال", tag: "tag-review" },
  active: { label: "نشط", tag: "tag-active" },
  on_hold: { label: "معلق", tag: "tag-review" },
  completed: { label: "مكتمل", tag: "tag-complete" },
  closed: { label: "مغلق", tag: "tag-complete" },
  archived: { label: "مؤرشف", tag: "tag-review" },
};

const typeConfig: Record<string, { label: string; icon: any }> = {
  retainer: { label: "توكيل", icon: FileText },
  litigation: { label: "تقاضي", icon: Scale },
  corporate: { label: "شركات", icon: Building2 },
  misa: { label: "MISA", icon: Globe },
  advisory: { label: "استشارات", icon: Shield },
  other: { label: "أخرى", icon: Briefcase },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "منخفض", color: "var(--accent-navy)" },
  medium: { label: "متوسط", color: "var(--accent-copper)" },
  high: { label: "عالي", color: "var(--accent-gold)" },
  critical: { label: "حرج", color: "var(--accent-alert)" },
};

export default function Cases() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cases, isLoading, refetch } = trpc.cases.list.useQuery(
    (filterStatus !== "all" || filterType !== "all") ? {
      ...(filterStatus !== "all" ? { status: filterStatus } : {}),
      ...(filterType !== "all" ? { caseType: filterType } : {}),
    } : undefined
  );

  const createMutation = trpc.cases.create.useMutation({
    onSuccess: (data) => {
      refetch(); setDialogOpen(false);
      toast.success(`تم إنشاء القضية ${data.referenceNumber}`);
    },
  });

  const [form, setForm] = useState({
    title: "", titleAr: "", caseType: "retainer" as any,
    priority: "medium" as any, description: "", practiceArea: "",
  });

  const filtered = useMemo(() => {
    if (!cases) return [];
    if (!searchQuery) return cases;
    const q = searchQuery.toLowerCase();
    return cases.filter(c =>
      c.referenceNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.titleAr && c.titleAr.includes(searchQuery))
    );
  }, [cases, searchQuery]);

  const caseStats = useMemo(() => {
    if (!cases) return { active: 0, intake: 0, completed: 0, total: 0 };
    return {
      active: cases.filter(c => c.status === "active").length,
      intake: cases.filter(c => c.status === "intake").length,
      completed: cases.filter(c => ["completed", "closed"].includes(c.status)).length,
      total: cases.length,
    };
  }, [cases]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">إدارة القضايا</h1>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display">إدارة القضايا</h1>
          <p className="text-xs text-muted-foreground mt-1">Case Management — 6 أنواع</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 ml-1" /> قضية جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">إنشاء قضية</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs">العنوان (إنجليزي) *</Label>
                <Input className="mt-1 h-9 text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">العنوان (عربي)</Label>
                <Input className="mt-1 h-9 text-sm" value={form.titleAr} onChange={e => setForm({...form, titleAr: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">نوع القضية *</Label>
                  <Select value={form.caseType} onValueChange={v => setForm({...form, caseType: v})}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">الأولوية</Label>
                  <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">الوصف</Label>
                <Textarea className="mt-1 text-sm" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
              </div>
              <Button onClick={() => { if (form.title) createMutation.mutate(form); }} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء القضية"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-gold)", borderRightWidth: "3px" }}>
          <p className="stat-label">الإجمالي</p>
          <p className="stat-value mt-1">{caseStats.total}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-success)", borderRightWidth: "3px" }}>
          <p className="stat-label">نشط</p>
          <p className="stat-value mt-1">{caseStats.active}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-copper)", borderRightWidth: "3px" }}>
          <p className="stat-label">استقبال</p>
          <p className="stat-value mt-1">{caseStats.intake}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-navy)", borderRightWidth: "3px" }}>
          <p className="stat-label">مكتمل</p>
          <p className="stat-value mt-1">{caseStats.completed}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في القضايا..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(typeConfig).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Cases Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد قضايا</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الرقم المرجعي</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">العنوان</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">النوع</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الأولوية</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const sc = statusConfig[c.status] || { label: c.status, tag: "tag-review" };
                    const tc = typeConfig[c.caseType] || { label: c.caseType, icon: Briefcase };
                    const pc = priorityConfig[c.priority] || { label: c.priority, color: "var(--accent-copper)" };
                    return (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-xs numeric font-medium" style={{ color: "var(--accent-gold)" }}>{c.referenceNumber}</td>
                        <td className="p-3">
                          <p className="text-xs font-medium" dir="ltr">{c.title}</p>
                          {c.titleAr && <p className="text-[10px] text-muted-foreground">{c.titleAr}</p>}
                        </td>
                        <td className="p-3"><Badge variant="outline" className="text-[10px]">{tc.label}</Badge></td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ background: pc.color }} />
                            <span className="text-[10px]">{pc.label}</span>
                          </div>
                        </td>
                        <td className="p-3"><span className={`tag ${sc.tag}`}>{sc.label}</span></td>
                        <td className="p-3 text-xs text-muted-foreground numeric">{new Date(c.createdAt).toLocaleDateString("ar-SA")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
