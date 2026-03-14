import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, Shield, Search } from "lucide-react";
import { useState, useMemo } from "react";

const roleLabels: Record<string, string> = {
  managing_partner: "الشريك الإداري",
  senior_partner: "شريك أول",
  partner: "شريك",
  senior_associate: "محامي أول",
  associate: "محامي",
  junior_associate: "محامي مبتدئ",
  legal_consultant: "مستشار قانوني",
  paralegal: "مساعد قانوني",
  cao: "رئيس العمليات الإدارية",
  office_manager: "مدير المكتب",
  admin: "إداري",
};

export default function Team() {
  const { data: members, isLoading } = trpc.team.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!members) return [];
    if (!searchQuery) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
  }, [members, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">فريق العمل</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display">فريق العمل</h1>
          <p className="text-xs text-muted-foreground mt-1">Team Directory — {members?.length || 0} عضو</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-gold)", borderRightWidth: "3px" }}>
          <p className="stat-label">إجمالي الأعضاء</p>
          <p className="stat-value mt-1">{members?.length || 0}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-navy)", borderRightWidth: "3px" }}>
          <p className="stat-label">المديرون</p>
          <p className="stat-value mt-1">{members?.filter(m => m.role === "admin").length || 0}</p>
        </div>
        <div className="stat-card bg-card border border-border" style={{ borderRightColor: "var(--accent-success)", borderRightWidth: "3px" }}>
          <p className="stat-label">المستخدمون</p>
          <p className="stat-value mt-1">{members?.filter(m => m.role === "user").length || 0}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث في الفريق..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 h-9 text-sm" />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full bg-card border-border">
            <CardContent className="p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا يوجد أعضاء في الفريق</p>
              <p className="text-xs text-muted-foreground/60 mt-1">سيظهر الأعضاء هنا عند تسجيل الدخول</p>
            </CardContent>
          </Card>
        ) : filtered.map(member => (
          <Card key={member.id} className="bg-card border-border hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="text-sm font-semibold" style={{ background: "var(--accent-gold)", color: "var(--surface-primary)" }}>
                    {member.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">{member.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {roleLabels[(member as any).firmRole] || (member as any).firmRole || member.role}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      <Shield className="h-2.5 w-2.5 ml-0.5" />
                      {member.role === "admin" ? "مدير" : "مستخدم"}
                    </Badge>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground truncate" dir="ltr">{member.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
