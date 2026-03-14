import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, DollarSign, Users, Briefcase, FileText, Download } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">التقارير</h1>
        <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}</div>
      </div>
    );
  }

  const formatSar = (n: number) => new Intl.NumberFormat("ar-SA").format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">التقارير</h1>
          <p className="text-xs text-muted-foreground mt-1">Reports & Analytics</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => toast("قريبًا — تصدير PDF")}>
          <Download className="h-3.5 w-3.5 ml-1" /> تصدير
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-gold)", borderRightWidth: "3px" }}>
          <div className="flex items-center gap-3">
            <Briefcase className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
            <div>
              <p className="stat-label">القضايا النشطة</p>
              <p className="stat-value text-lg">{stats?.activeCases || 0}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-copper)", borderRightWidth: "3px" }}>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4" style={{ color: "var(--accent-copper)" }} />
            <div>
              <p className="stat-label">العملاء المحتملين</p>
              <p className="stat-value text-lg">{stats?.totalClients || 0}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-success)", borderRightWidth: "3px" }}>
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4" style={{ color: "var(--accent-success)" }} />
            <div>
              <p className="stat-label">الإيرادات</p>
              <p className="stat-value text-lg numeric">{formatSar(stats?.totalPaid || 0)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-navy)", borderRightWidth: "3px" }}>
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4" style={{ color: "var(--accent-navy)" }} />
            <div>
              <p className="stat-label">العروض المعلقة</p>
              <p className="stat-value text-lg">{stats?.totalProposals || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "تقرير القضايا", titleEn: "Cases Report", desc: "ملخص شامل لجميع القضايا حسب النوع والحالة", icon: Briefcase, color: "var(--accent-gold)" },
          { title: "تقرير الإيرادات", titleEn: "Revenue Report", desc: "تحليل الإيرادات والفواتير والمدفوعات", icon: DollarSign, color: "var(--accent-success)" },
          { title: "تقرير الفريق", titleEn: "Team Report", desc: "أداء الفريق وتوزيع المهام والإنتاجية", icon: Users, color: "var(--accent-copper)" },
          { title: "تقرير العملاء", titleEn: "Client Report", desc: "تحليل قاعدة العملاء والاحتفاظ بهم", icon: Users, color: "var(--accent-navy)" },
          { title: "تقرير المبيعات", titleEn: "Pipeline Report", desc: "تحليل خط المبيعات ومعدلات التحويل", icon: TrendingUp, color: "var(--accent-gold)" },
          { title: "تقرير الامتثال", titleEn: "Compliance Report", desc: "مراقبة الامتثال والمواعيد النهائية", icon: BarChart3, color: "var(--accent-alert)" },
        ].map((report, i) => (
          <Card key={i} className="bg-card border-border hover:border-primary/20 transition-colors cursor-pointer" onClick={() => toast("قريبًا — تقرير مفصل")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded shrink-0" style={{ background: `${report.color}15` }}>
                  <report.icon className="h-5 w-5" style={{ color: report.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{report.title}</h3>
                  <p className="text-[10px] text-muted-foreground" dir="ltr">{report.titleEn}</p>
                  <p className="text-xs text-muted-foreground mt-1">{report.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading">ملخص سريع</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground">المؤشر</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground">القيمة</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "إجمالي القضايا", value: `${stats?.totalCases || 0}`, status: "tag-active" },
                { label: "القضايا النشطة", value: `${stats?.activeCases || 0}`, status: "tag-complete" },
                { label: "المهام المعلقة", value: `${stats?.pendingTasks || 0}`, status: stats?.pendingTasks && stats.pendingTasks > 10 ? "tag-urgent" : "tag-review" },
                { label: "إجمالي الفواتير", value: formatSar(stats?.totalInvoiced || 0), status: "tag-active" },
                { label: "قيمة خط المبيعات", value: formatSar(stats?.pipelineValue || 0), status: "tag-active" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-3 text-xs">{row.label}</td>
                  <td className="p-3 text-xs numeric font-semibold">{row.value}</td>
                  <td className="p-3"><span className={`tag ${row.status}`}>●</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
