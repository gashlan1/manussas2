import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Phone, Mail, Building2, Globe, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const stageConfig = {
  initial_contact: { label: "اتصال أولي", labelEn: "Initial Contact", color: "var(--accent-navy)" },
  qualification: { label: "تأهيل", labelEn: "Qualification", color: "var(--accent-copper)" },
  proposal_sent: { label: "عرض مرسل", labelEn: "Proposal Sent", color: "var(--accent-gold)" },
  negotiation: { label: "تفاوض", labelEn: "Negotiation", color: "var(--accent-gold)" },
  signed: { label: "موقّع", labelEn: "Signed", color: "var(--accent-success)" },
  lost: { label: "خسارة", labelEn: "Lost", color: "var(--accent-alert)" },
};

const sourceLabels: Record<string, string> = {
  website: "الموقع", referral: "إحالة", misa_platform: "منصة MISA",
  walk_in: "زيارة مباشرة", conference: "مؤتمر", whatsapp: "واتساب",
  email: "بريد إلكتروني", other: "أخرى",
};

const stageOrder = ["initial_contact", "qualification", "proposal_sent", "negotiation", "signed"] as const;

export default function Pipeline() {

  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterSource, setFilterSource] = useState<string>("all");
  const { data: prospects, isLoading, refetch } = trpc.pipeline.list.useQuery();
  const { data: stats } = trpc.pipeline.stats.useQuery();
  const createMutation = trpc.pipeline.create.useMutation({
    onSuccess: () => { refetch(); setDialogOpen(false); toast.success("تم إنشاء العميل المحتمل بنجاح"); },
  });
  const updateStageMutation = trpc.pipeline.updateStage.useMutation({
    onSuccess: () => { refetch(); toast.success("تم تحديث المرحلة"); },
  });

  const [form, setForm] = useState({
    contactName: "", companyName: "", email: "", phone: "",
    source: "other" as any, isMisa: false, industry: "", estimatedValue: 0,
    serviceInterest: "", notes: "",
  });

  const filteredProspects = useMemo(() => {
    if (!prospects) return [];
    if (filterSource === "all") return prospects;
    return prospects.filter(p => p.source === filterSource);
  }, [prospects, filterSource]);

  const groupedByStage = useMemo(() => {
    const groups: Record<string, typeof filteredProspects> = {};
    stageOrder.forEach(s => { groups[s] = []; });
    filteredProspects.forEach(p => {
      if (groups[p.stage]) groups[p.stage].push(p);
    });
    return groups;
  }, [filteredProspects]);

  const handleCreate = () => {
    if (!form.contactName) return;
    createMutation.mutate(form);
  };

  const moveStage = (id: number, currentStage: string, direction: "next" | "prev") => {
    const idx = stageOrder.indexOf(currentStage as any);
    const newIdx = direction === "next" ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= stageOrder.length) return;
    updateStageMutation.mutate({ id, stage: stageOrder[newIdx] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">خط الأنابيب</h1>
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">خط الأنابيب</h1>
          <p className="text-xs text-muted-foreground mt-1">Prospective Client Pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="المصدر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المصادر</SelectItem>
              {Object.entries(sourceLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 ml-1" /> عميل محتمل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">إضافة عميل محتمل</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">اسم جهة الاتصال *</Label>
                    <Input className="mt-1 h-9 text-sm" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} placeholder="الاسم الكامل" />
                  </div>
                  <div>
                    <Label className="text-xs">اسم الشركة</Label>
                    <Input className="mt-1 h-9 text-sm" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="اسم الشركة" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">البريد الإلكتروني</Label>
                    <Input className="mt-1 h-9 text-sm" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-xs">الهاتف</Label>
                    <Input className="mt-1 h-9 text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">المصدر</Label>
                    <Select value={form.source} onValueChange={v => setForm({...form, source: v})}>
                      <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(sourceLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">القيمة المقدرة (ر.س)</Label>
                    <Input className="mt-1 h-9 text-sm" type="number" value={form.estimatedValue} onChange={e => setForm({...form, estimatedValue: parseInt(e.target.value) || 0})} dir="ltr" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">ملاحظات</Label>
                  <Textarea className="mt-1 text-sm" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-gold)", borderRightWidth: "3px" }}>
          <p className="stat-label">الإجمالي</p>
          <p className="stat-value mt-1">{stats?.total || 0}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-navy)", borderRightWidth: "3px" }}>
          <p className="stat-label">القيمة الإجمالية</p>
          <p className="stat-value mt-1 text-lg">{((stats?.totalValue || 0) / 1000).toFixed(0)}K ر.س</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-success)", borderRightWidth: "3px" }}>
          <p className="stat-label">موقّع</p>
          <p className="stat-value mt-1">{stats?.byStage?.signed || 0}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-copper)", borderRightWidth: "3px" }}>
          <p className="stat-label">في التفاوض</p>
          <p className="stat-value mt-1">{stats?.byStage?.negotiation || 0}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
        {stageOrder.map(stage => {
          const config = stageConfig[stage];
          const items = groupedByStage[stage] || [];
          return (
            <div key={stage} className="min-w-[240px]">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: config.color }}>
                <span className="text-xs font-semibold">{config.label}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 numeric">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="p-4 border border-dashed border-border text-center">
                    <p className="text-[10px] text-muted-foreground">لا يوجد عملاء</p>
                  </div>
                ) : items.map(pc => (
                  <Card key={pc.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold">{pc.contactName}</p>
                          {pc.companyName && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground">{pc.companyName}</p>
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] numeric text-muted-foreground">{pc.referenceNumber}</span>
                      </div>
                      {pc.estimatedValue && pc.estimatedValue > 0 && (
                        <p className="text-xs numeric font-semibold" style={{ color: "var(--accent-gold)" }}>
                          {(pc.estimatedValue / 1000).toFixed(0)}K ر.س
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{sourceLabels[pc.source] || pc.source}</Badge>
                        {pc.isMisa && <Badge className="text-[9px] px-1 py-0 bg-[var(--accent-navy)] text-white">MISA</Badge>}
                      </div>
                      <div className="flex items-center gap-1 pt-1 border-t border-border">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveStage(pc.id, pc.stage, "next")} disabled={stage === "signed"}>
                          <ArrowLeft className="h-3 w-3" />
                        </Button>
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveStage(pc.id, pc.stage, "prev")} disabled={stage === "initial_contact"}>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
