import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, Users, FileText, TrendingUp, Clock,
  AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Bot, Activity, DollarSign,
} from "lucide-react";

function StatCard({ label, labelAr, value, icon: Icon, accent = "gold", trend, trendValue }: {
  label: string; labelAr: string; value: string | number; icon: any; accent?: string;
  trend?: "up" | "down"; trendValue?: string;
}) {
  const borderColor = accent === "gold" ? "var(--accent-gold)" : accent === "navy" ? "var(--accent-navy)" : accent === "copper" ? "var(--accent-copper)" : "var(--accent-alert)";
  return (
    <div className="stat-card bg-card border border-border" style={{ borderRightColor: borderColor, borderRightWidth: "3px" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{labelAr}</p>
          <p className="text-[10px] text-muted-foreground/60">{label}</p>
          <p className="stat-value mt-2">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === "up" ? "text-[var(--accent-success)]" : "text-[var(--accent-alert)]"}`}>
              {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span className="numeric">{trendValue}</span>
            </div>
          )}
        </div>
        <div className="p-2" style={{ background: `${borderColor}15` }}>
          <Icon className="h-5 w-5" style={{ color: borderColor }} />
        </div>
      </div>
    </div>
  );
}

function PipelineFunnel({ stats }: { stats: any }) {
  const stages = [
    { key: "initial_contact", label: "اتصال أولي", labelEn: "Initial Contact" },
    { key: "qualification", label: "تأهيل", labelEn: "Qualification" },
    { key: "proposal_sent", label: "عرض مرسل", labelEn: "Proposal Sent" },
    { key: "negotiation", label: "تفاوض", labelEn: "Negotiation" },
    { key: "signed", label: "موقّع", labelEn: "Signed" },
  ];
  const maxCount = Math.max(...stages.map(s => stats.byStage?.[s.key] || 0), 1);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-heading">قمع خط الأنابيب</CardTitle>
        <p className="text-xs text-muted-foreground">Pipeline Funnel</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage) => {
            const count = stats.byStage?.[stage.key] || 0;
            const width = Math.max((count / maxCount) * 100, 8);
            return (
              <div key={stage.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{stage.label}</span>
                  <span className="numeric font-semibold">{count}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">الإجمالي</span>
            <span className="numeric font-bold" style={{ color: "var(--accent-gold)" }}>{stats.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityFeed({ activities }: { activities: any[] }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-heading">النشاط الأخير</CardTitle>
        <p className="text-xs text-muted-foreground">Recent Activity</p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا يوجد نشاط حتى الآن</p>
            <p className="text-[10px] text-muted-foreground/60">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pr-3 py-1" style={{ borderRight: "2px solid var(--accent-gold)" }}>
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-success)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{activity.description || activity.action}</p>
                  <p className="text-[10px] text-muted-foreground numeric mt-0.5">
                    {new Date(activity.createdAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const aiAgentStatus = [
  { name: "وكيل التخطيط", nameEn: "Planner Agent", status: "نشط", tasks: 0, health: 98 },
  { name: "وكيل المتابعة", nameEn: "Tracker Agent", status: "نشط", tasks: 0, health: 95 },
  { name: "مدير الأزمات", nameEn: "Crisis Manager", status: "استعداد", tasks: 0, health: 100 },
  { name: "وكيل التنفيذ", nameEn: "Executor Agent", status: "نشط", tasks: 0, health: 92 },
  { name: "وكيل الإحاطة", nameEn: "Briefing Agent", status: "نشط", tasks: 0, health: 96 },
  { name: "وكيل التوقيع", nameEn: "DocuSign Agent", status: "استعداد", tasks: 0, health: 100 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: pipelineStats, isLoading: pipelineLoading } = trpc.pipeline.stats.useQuery();
  const { data: recentActivity } = trpc.dashboard.recentActivity.useQuery();

  const formatSar = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display">لوحة التحكم التنفيذية</h1>
          <p className="text-xs text-muted-foreground mt-1">Executive Dashboard</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">لوحة التحكم التنفيذية</h1>
          <p className="text-xs text-muted-foreground mt-1">
            مرحباً، {user?.name || "الشريك الإداري"} — Executive Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5" style={{ borderColor: "var(--accent-success)", color: "var(--accent-success)" }}>
            <Activity className="h-3 w-3 ml-1" /> مباشر
          </Badge>
          <p className="text-xs text-muted-foreground numeric">
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard labelAr="القضايا النشطة" label="Active Cases" value={stats?.activeCases || 0} icon={Briefcase} accent="gold" trend="up" trendValue="+12%" />
        <StatCard labelAr="إجمالي العملاء" label="Total Clients" value={stats?.totalClients || 0} icon={Users} accent="navy" />
        <StatCard labelAr="عروض الأسعار" label="Fee Proposals" value={stats?.totalProposals || 0} icon={FileText} accent="copper" />
        <StatCard labelAr="الإيرادات" label="Revenue (SAR)" value={`${formatSar(stats?.totalInvoiced || 0)} ر.س`} icon={DollarSign} accent="gold" trend="up" trendValue={`${formatSar(stats?.totalPaid || 0)} محصّل`} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard labelAr="قيمة خط الأنابيب" label="Pipeline Value" value={`${formatSar(stats?.pipelineValue || 0)} ر.س`} icon={TrendingUp} accent="gold" />
        <StatCard labelAr="المهام المعلقة" label="Pending Tasks" value={stats?.pendingTasks || 0} icon={Clock} accent="copper" />
        <StatCard labelAr="إجمالي القضايا" label="Total Cases" value={stats?.totalCases || 0} icon={Briefcase} accent="navy" />
        <StatCard labelAr="المستحقات" label="Outstanding" value={`${formatSar((stats?.totalInvoiced || 0) - (stats?.totalPaid || 0))} ر.س`} icon={AlertTriangle} accent="alert" />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineFunnel stats={pipelineStats || { total: 0, byStage: {}, totalValue: 0 }} />
        <RecentActivityFeed activities={recentActivity || []} />
      </div>

      {/* AI Agents Status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-heading">حالة وكلاء الذكاء الاصطناعي</CardTitle>
              <p className="text-xs text-muted-foreground">AI Agents Status</p>
            </div>
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}>
              6 وكلاء
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiAgentStatus.map((agent, i) => (
              <div key={i} className="p-3 border border-border space-y-2" style={{ borderRight: `3px solid ${agent.status === "نشط" ? "var(--accent-success)" : "var(--accent-copper)"}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-3.5 w-3.5" style={{ color: "var(--accent-gold)" }} />
                    <span className="text-xs font-medium">{agent.name}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${agent.status === "نشط" ? "border-[var(--accent-success)]/30 text-[var(--accent-success)]" : "border-muted-foreground/30 text-muted-foreground"}`}>
                    {agent.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{agent.nameEn}</p>
                <div className="flex items-center gap-2">
                  <Progress value={agent.health} className="h-1 flex-1" />
                  <span className="text-[10px] text-muted-foreground numeric">{agent.health}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className="ai-card p-5 bg-card">
        <div className="flex items-start gap-3">
          <div className="p-2" style={{ background: "var(--glow-primary-subtle)" }}>
            <TrendingUp className="h-5 w-5" style={{ color: "var(--accent-gold)" }} />
          </div>
          <div>
            <h3 className="text-sm font-heading">رؤى الذكاء الاصطناعي</h3>
            <p className="text-xs text-muted-foreground mt-1">AI Insights — Powered by AGLC Intelligence Platform</p>
            <p className="text-xs text-muted-foreground mt-3">
              سيتم تفعيل التحليلات الذكية تلقائياً عند توفر بيانات كافية في النظام.
              يشمل ذلك توقعات الإيرادات، وتحليل أداء الفريق، واقتراحات تحسين خط الأنابيب.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
