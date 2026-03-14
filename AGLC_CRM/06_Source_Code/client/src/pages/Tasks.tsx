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
import { Plus, ListTodo, Search, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; tag: string }> = {
  pending: { label: "معلق", tag: "tag-review" },
  in_progress: { label: "قيد التنفيذ", tag: "tag-active" },
  blocked: { label: "محظور", tag: "tag-urgent" },
  completed: { label: "مكتمل", tag: "tag-complete" },
  cancelled: { label: "ملغي", tag: "tag-urgent" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "منخفض", color: "var(--accent-navy)" },
  medium: { label: "متوسط", color: "var(--accent-copper)" },
  high: { label: "عالي", color: "var(--accent-gold)" },
  critical: { label: "حرج", color: "var(--accent-alert)" },
};

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery(
    filterStatus !== "all" ? { status: filterStatus } : undefined
  );
  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => { refetch(); setDialogOpen(false); toast.success("تم إنشاء المهمة بنجاح"); },
  });
  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => { refetch(); toast.success("تم تحديث المهمة"); },
  });

  const [form, setForm] = useState({
    title: "", titleAr: "", priority: "medium" as any,
    description: "", dueDate: "", estimatedMinutes: 60,
  });

  const filtered = useMemo(() => {
    if (!tasks) return [];
    if (!searchQuery) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t => t.title.toLowerCase().includes(q) || (t.titleAr && t.titleAr.includes(searchQuery)));
  }, [tasks, searchQuery]);

  const taskStats = useMemo(() => {
    if (!tasks) return { pending: 0, inProgress: 0, completed: 0, total: 0 };
    return {
      pending: tasks.filter(t => t.status === "pending").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
      total: tasks.length,
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">إدارة المهام</h1>
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display">إدارة المهام</h1>
          <p className="text-xs text-muted-foreground mt-1">Task Management</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 ml-1" /> مهمة جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">إنشاء مهمة</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs">العنوان *</Label>
                <Input className="mt-1 h-9 text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} dir="ltr" />
              </div>
              <div>
                <Label className="text-xs">العنوان (عربي)</Label>
                <Input className="mt-1 h-9 text-sm" value={form.titleAr} onChange={e => setForm({...form, titleAr: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">الأولوية</Label>
                  <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">تاريخ الاستحقاق</Label>
                  <Input className="mt-1 h-9 text-sm" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} dir="ltr" />
                </div>
              </div>
              <div>
                <Label className="text-xs">الوصف</Label>
                <Textarea className="mt-1 text-sm" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
              </div>
              <Button onClick={() => { if (form.title) createMutation.mutate(form); }} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء المهمة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-gold)", borderRightWidth: "3px" }}>
          <p className="stat-label">الإجمالي</p><p className="stat-value mt-1">{taskStats.total}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-copper)", borderRightWidth: "3px" }}>
          <p className="stat-label">معلق</p><p className="stat-value mt-1">{taskStats.pending}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-navy)", borderRightWidth: "3px" }}>
          <p className="stat-label">قيد التنفيذ</p><p className="stat-value mt-1">{taskStats.inProgress}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-success)", borderRightWidth: "3px" }}>
          <p className="stat-label">مكتمل</p><p className="stat-value mt-1">{taskStats.completed}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <ListTodo className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد مهام</p>
            </CardContent>
          </Card>
        ) : filtered.map(task => {
          const sc = statusConfig[task.status] || { label: task.status, tag: "tag-review" };
          const pc = priorityConfig[task.priority] || { label: task.priority, color: "var(--accent-copper)" };
          return (
            <Card key={task.id} className="bg-card border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <button className="shrink-0" onClick={() => updateMutation.mutate({ id: task.id, status: task.status === "completed" ? "pending" : "completed" })}>
                    <CheckCircle2 className={`h-5 w-5 ${task.status === "completed" ? "text-[var(--accent-success)]" : "text-muted-foreground/30 hover:text-muted-foreground"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`} dir="ltr">{task.title}</p>
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: pc.color }} />
                    </div>
                    {task.titleAr && <p className="text-[10px] text-muted-foreground">{task.titleAr}</p>}
                  </div>
                  <span className={`tag ${sc.tag}`}>{sc.label}</span>
                  {task.dueDate && <span className="text-[10px] text-muted-foreground numeric">{new Date(task.dueDate).toLocaleDateString("ar-SA")}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
