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
import { Plus, FileText, Send, DollarSign, Clock, CheckCircle2, XCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; tag: string }> = {
  draft: { label: "مسودة", tag: "tag-review" },
  internal_review: { label: "مراجعة داخلية", tag: "tag-review" },
  cao_review: { label: "مراجعة CAO", tag: "tag-review" },
  mp_approval: { label: "موافقة MP", tag: "tag-review" },
  approved: { label: "معتمد", tag: "tag-active" },
  sent: { label: "مرسل", tag: "tag-active" },
  client_review: { label: "مراجعة العميل", tag: "tag-review" },
  accepted: { label: "مقبول", tag: "tag-complete" },
  rejected: { label: "مرفوض", tag: "tag-urgent" },
  expired: { label: "منتهي", tag: "tag-urgent" },
  withdrawn: { label: "مسحوب", tag: "tag-urgent" },
};

const categoryLabels: Record<string, string> = {
  standard_retainer: "توكيل قياسي",
  framework_retainer: "توكيل إطاري",
  fixed_fee: "رسوم ثابتة",
  contingency: "رسوم مشروطة",
  hybrid: "هجين",
  misa_services: "خدمات MISA",
  litigation: "تقاضي",
};

export default function FeeProposals() {

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: proposals, isLoading, refetch } = trpc.proposals.list.useQuery(
    filterStatus !== "all" ? { status: filterStatus } : undefined
  );
  const createMutation = trpc.proposals.create.useMutation({
    onSuccess: (data) => {
      refetch(); setDialogOpen(false);
      toast.success(`تم إنشاء عرض الأسعار ${data.referenceNumber}`);
    },
  });
  const updateStatusMutation = trpc.proposals.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("تم تحديث الحالة"); },
  });

  const [form, setForm] = useState({
    category: "standard_retainer" as any,
    titleEn: "", titleAr: "", totalValueSar: 0,
    notes: "", proposalData: {},
  });

  const filtered = useMemo(() => {
    if (!proposals) return [];
    if (!searchQuery) return proposals;
    const q = searchQuery.toLowerCase();
    return proposals.filter(p =>
      p.referenceNumber.toLowerCase().includes(q) ||
      p.titleEn.toLowerCase().includes(q) ||
      (p.titleAr && p.titleAr.includes(searchQuery))
    );
  }, [proposals, searchQuery]);

  const handleCreate = () => {
    if (!form.titleEn) return;
    createMutation.mutate(form);
  };

  const totalByStatus = useMemo(() => {
    if (!proposals) return { draft: 0, sent: 0, accepted: 0, total: 0 };
    return {
      draft: proposals.filter(p => p.status === "draft").length,
      sent: proposals.filter(p => ["sent", "client_review"].includes(p.status)).length,
      accepted: proposals.filter(p => p.status === "accepted").length,
      total: proposals.length,
    };
  }, [proposals]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">عروض الأسعار</h1>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display">عروض الأسعار</h1>
          <p className="text-xs text-muted-foreground mt-1">Fee Proposals — 7 فئات، 11 مرحلة</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 ml-1" /> عرض جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">إنشاء عرض أسعار</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs">الفئة *</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">العنوان (إنجليزي) *</Label>
                <Input className="mt-1 h-9 text-sm" value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">العنوان (عربي)</Label>
                <Input className="mt-1 h-9 text-sm" value={form.titleAr} onChange={e => setForm({...form, titleAr: e.target.value})} />
              </div>
              <div>
                <Label className="text-xs">القيمة الإجمالية (ر.س)</Label>
                <Input className="mt-1 h-9 text-sm" type="number" value={form.totalValueSar} onChange={e => setForm({...form, totalValueSar: parseInt(e.target.value) || 0})} dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">ملاحظات</Label>
                <Textarea className="mt-1 text-sm" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء عرض الأسعار"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "الإجمالي", value: totalByStatus.total, icon: FileText, accent: "var(--accent-gold)" },
          { label: "مسودات", value: totalByStatus.draft, icon: Clock, accent: "var(--accent-copper)" },
          { label: "مرسل", value: totalByStatus.sent, icon: Send, accent: "var(--accent-navy)" },
          { label: "مقبول", value: totalByStatus.accepted, icon: DollarSign, accent: "var(--accent-success)" },
        ].map((s, i) => (
          <div key={i} className="stat-card bg-card border border-border" style={{ borderRightColor: s.accent, borderRightWidth: "3px" }}>
            <div className="flex items-center gap-3">
              <div className="p-2" style={{ background: `${s.accent}15` }}>
                <s.icon className="h-4 w-4" style={{ color: s.accent }} />
              </div>
              <div>
                <p className="stat-value text-lg">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في العروض..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Proposals Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد عروض أسعار</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الرقم المرجعي</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">العنوان</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الفئة</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">القيمة</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                    <th className="text-right p-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const sc = statusConfig[p.status] || { label: p.status, tag: "tag-review" };
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <span className="text-xs numeric font-medium" style={{ color: "var(--accent-gold)" }}>{p.referenceNumber}</span>
                        </td>
                        <td className="p-3">
                          <p className="text-xs font-medium" dir="ltr">{p.titleEn}</p>
                          {p.titleAr && <p className="text-[10px] text-muted-foreground">{p.titleAr}</p>}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">{categoryLabels[p.category] || p.category}</Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-xs numeric font-semibold">
                            {p.totalValueSar ? `${(p.totalValueSar / 1000).toFixed(0)}K ر.س` : "—"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`tag ${sc.tag}`}>{sc.label}</span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground numeric">
                          {new Date(p.createdAt).toLocaleDateString("ar-SA")}
                        </td>
                        <td className="p-3">
                          {p.status === "draft" && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                              onClick={() => updateStatusMutation.mutate({ id: p.id, status: "internal_review" })}>
                              <Send className="h-3 w-3 ml-1" /> إرسال
                            </Button>
                          )}
                          {p.status === "approved" && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                              onClick={() => updateStatusMutation.mutate({ id: p.id, status: "sent" })}>
                              <Send className="h-3 w-3 ml-1" /> إرسال للعميل
                            </Button>
                          )}
                        </td>
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
