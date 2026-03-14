import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, DollarSign, Clock, Receipt, Send, CreditCard } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const invoiceStatusConfig: Record<string, { label: string; tag: string }> = {
  draft: { label: "مسودة", tag: "tag-review" },
  sent: { label: "مرسل", tag: "tag-active" },
  paid: { label: "مدفوع", tag: "tag-complete" },
  partial: { label: "جزئي", tag: "tag-review" },
  overdue: { label: "متأخر", tag: "tag-urgent" },
  void: { label: "ملغي", tag: "tag-urgent" },
};

const timesheetStatusConfig: Record<string, { label: string; tag: string }> = {
  draft: { label: "مسودة", tag: "tag-review" },
  submitted: { label: "مقدم", tag: "tag-active" },
  approved: { label: "معتمد", tag: "tag-complete" },
  rejected: { label: "مرفوض", tag: "tag-urgent" },
  billed: { label: "مفوتر", tag: "tag-complete" },
};

export default function Billing() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [timesheetDialogOpen, setTimesheetDialogOpen] = useState(false);

  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = trpc.billing.invoices.list.useQuery();
  const { data: timesheets, isLoading: timesheetsLoading, refetch: refetchTimesheets } = trpc.billing.timesheets.list.useQuery();

  const createInvoiceMutation = trpc.billing.invoices.create.useMutation({
    onSuccess: (data) => {
      refetchInvoices(); setInvoiceDialogOpen(false);
      toast.success(`تم إنشاء الفاتورة ${data.referenceNumber}`);
    },
  });
  const createTimesheetMutation = trpc.billing.timesheets.create.useMutation({
    onSuccess: () => {
      refetchTimesheets(); setTimesheetDialogOpen(false);
      toast.success("تم إنشاء سجل الوقت");
    },
  });
  const updateInvoiceStatus = trpc.billing.invoices.updateStatus.useMutation({
    onSuccess: () => { refetchInvoices(); toast.success("تم تحديث حالة الفاتورة"); },
  });

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: 0, subtotalSar: 0, vatPercent: 15, notes: "", dueDate: "",
  });
  const [timesheetForm, setTimesheetForm] = useState({
    clientId: 0, date: new Date().toISOString().split("T")[0],
    durationMinutes: 60, description: "", role: "associate", ratePerHour: 500, isBillable: true,
  });

  const invoiceStats = useMemo(() => {
    if (!invoices) return { total: 0, paid: 0, outstanding: 0, overdue: 0 };
    return {
      total: invoices.reduce((s, i) => s + (i.totalSar || 0), 0),
      paid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.totalSar || 0), 0),
      outstanding: invoices.filter(i => ["sent", "partial"].includes(i.status)).reduce((s, i) => s + (i.balanceDue || 0), 0),
      overdue: invoices.filter(i => i.status === "overdue").length,
    };
  }, [invoices]);

  const formatSar = (n: number) => new Intl.NumberFormat("ar-SA").format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">الفوترة والمحاسبة</h1>
          <p className="text-xs text-muted-foreground mt-1">Billing & Accounting — Timesheets, Invoices, Payments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-gold)", borderRightWidth: "3px" }}>
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
            <div>
              <p className="stat-label">إجمالي الفواتير</p>
              <p className="stat-value text-lg numeric">{formatSar(invoiceStats.total)} ر.س</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-success)", borderRightWidth: "3px" }}>
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4" style={{ color: "var(--accent-success)" }} />
            <div>
              <p className="stat-label">المدفوع</p>
              <p className="stat-value text-lg numeric">{formatSar(invoiceStats.paid)} ر.س</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-copper)", borderRightWidth: "3px" }}>
          <div className="flex items-center gap-3">
            <Receipt className="h-4 w-4" style={{ color: "var(--accent-copper)" }} />
            <div>
              <p className="stat-label">المستحق</p>
              <p className="stat-value text-lg numeric">{formatSar(invoiceStats.outstanding)} ر.س</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-alert)", borderRightWidth: "3px" }}>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4" style={{ color: "var(--accent-alert)" }} />
            <div>
              <p className="stat-label">متأخر</p>
              <p className="stat-value text-lg numeric">{invoiceStats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="invoices" className="text-xs">الفواتير</TabsTrigger>
            <TabsTrigger value="timesheets" className="text-xs">سجل الوقت</TabsTrigger>
            <TabsTrigger value="retainers" className="text-xs">التوكيلات</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {activeTab === "invoices" && (
              <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 ml-1" /> فاتورة جديدة</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-heading">إنشاء فاتورة</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-xs">رقم العميل *</Label>
                      <Input className="mt-1 h-9 text-sm" type="number" value={invoiceForm.clientId} onChange={e => setInvoiceForm({...invoiceForm, clientId: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">المبلغ قبل الضريبة (ر.س)</Label>
                        <Input className="mt-1 h-9 text-sm" type="number" value={invoiceForm.subtotalSar} onChange={e => setInvoiceForm({...invoiceForm, subtotalSar: parseInt(e.target.value) || 0})} dir="ltr" />
                      </div>
                      <div>
                        <Label className="text-xs">نسبة الضريبة %</Label>
                        <Input className="mt-1 h-9 text-sm" type="number" value={invoiceForm.vatPercent} onChange={e => setInvoiceForm({...invoiceForm, vatPercent: parseInt(e.target.value) || 15})} dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">تاريخ الاستحقاق</Label>
                      <Input className="mt-1 h-9 text-sm" type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} dir="ltr" />
                    </div>
                    <div>
                      <Label className="text-xs">ملاحظات</Label>
                      <Textarea className="mt-1 text-sm" value={invoiceForm.notes} onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})} rows={2} />
                    </div>
                    <Button onClick={() => { if (invoiceForm.clientId > 0) createInvoiceMutation.mutate(invoiceForm); }} disabled={createInvoiceMutation.isPending} className="w-full">
                      {createInvoiceMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء الفاتورة"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {activeTab === "timesheets" && (
              <Dialog open={timesheetDialogOpen} onOpenChange={setTimesheetDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 ml-1" /> سجل وقت جديد</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-heading">تسجيل وقت</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">رقم العميل *</Label>
                        <Input className="mt-1 h-9 text-sm" type="number" value={timesheetForm.clientId} onChange={e => setTimesheetForm({...timesheetForm, clientId: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <Label className="text-xs">التاريخ</Label>
                        <Input className="mt-1 h-9 text-sm" type="date" value={timesheetForm.date} onChange={e => setTimesheetForm({...timesheetForm, date: e.target.value})} dir="ltr" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">المدة (دقائق)</Label>
                        <Input className="mt-1 h-9 text-sm" type="number" value={timesheetForm.durationMinutes} onChange={e => setTimesheetForm({...timesheetForm, durationMinutes: parseInt(e.target.value) || 60})} dir="ltr" />
                      </div>
                      <div>
                        <Label className="text-xs">السعر/ساعة (ر.س)</Label>
                        <Input className="mt-1 h-9 text-sm" type="number" value={timesheetForm.ratePerHour} onChange={e => setTimesheetForm({...timesheetForm, ratePerHour: parseInt(e.target.value) || 500})} dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">الوصف *</Label>
                      <Textarea className="mt-1 text-sm" value={timesheetForm.description} onChange={e => setTimesheetForm({...timesheetForm, description: e.target.value})} rows={2} />
                    </div>
                    <Button onClick={() => { if (timesheetForm.clientId > 0 && timesheetForm.description) createTimesheetMutation.mutate(timesheetForm); }} disabled={createTimesheetMutation.isPending} className="w-full">
                      {createTimesheetMutation.isPending ? "جارٍ التسجيل..." : "تسجيل الوقت"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {invoicesLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : !invoices || invoices.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد فواتير</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الرقم</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">المبلغ</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الضريبة</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الإجمالي</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => {
                        const sc = invoiceStatusConfig[inv.status] || { label: inv.status, tag: "tag-review" };
                        return (
                          <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3 text-xs numeric font-medium" style={{ color: "var(--accent-gold)" }}>{inv.referenceNumber}</td>
                            <td className="p-3 text-xs numeric">{formatSar(inv.subtotalSar || 0)} ر.س</td>
                            <td className="p-3 text-xs numeric">{formatSar(inv.vatAmount || 0)} ر.س</td>
                            <td className="p-3 text-xs numeric font-semibold">{formatSar(inv.totalSar || 0)} ر.س</td>
                            <td className="p-3"><span className={`tag ${sc.tag}`}>{sc.label}</span></td>
                            <td className="p-3">
                              {inv.status === "draft" && (
                                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => updateInvoiceStatus.mutate({ id: inv.id, status: "sent" })}>
                                  <Send className="h-3 w-3 ml-1" /> إرسال
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
        </TabsContent>

        {/* Timesheets Tab */}
        <TabsContent value="timesheets" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {timesheetsLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : !timesheets || timesheets.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد سجلات وقت</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">التاريخ</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الوصف</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">المدة</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">المبلغ</th>
                        <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timesheets.map(ts => {
                        const sc = timesheetStatusConfig[ts.status] || { label: ts.status, tag: "tag-review" };
                        return (
                          <tr key={ts.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3 text-xs numeric">{new Date(ts.date).toLocaleDateString("ar-SA")}</td>
                            <td className="p-3 text-xs max-w-[200px] truncate">{ts.description}</td>
                            <td className="p-3 text-xs numeric">{ts.durationMinutes} د</td>
                            <td className="p-3 text-xs numeric font-semibold">{formatSar(ts.billableAmount || 0)} ر.س</td>
                            <td className="p-3"><span className={`tag ${sc.tag}`}>{sc.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retainers Tab */}
        <TabsContent value="retainers" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">تتبع التوكيلات</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Retainer tracking will be available when retainer proposals are accepted</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
