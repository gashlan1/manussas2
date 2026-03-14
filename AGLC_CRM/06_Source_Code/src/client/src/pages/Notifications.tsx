import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";

const channelLabels: Record<string, string> = {
  in_app: "داخل التطبيق",
  email: "بريد إلكتروني",
  whatsapp: "واتساب",
};

const priorityColors: Record<string, string> = {
  low: "var(--accent-navy)",
  normal: "var(--accent-copper)",
  high: "var(--accent-gold)",
  urgent: "var(--accent-alert)",
};

export default function Notifications() {
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery();
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => { refetch(); },
  });

  const unreadCount = notifications?.filter(n => n.status !== "read" && n.status !== "acknowledged").length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display">الإشعارات</h1>
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">الإشعارات</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "لا توجد إشعارات جديدة"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {(!notifications || notifications.length === 0) ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
            </CardContent>
          </Card>
        ) : notifications.map(notif => {
          const isUnread = notif.status !== "read" && notif.status !== "acknowledged";
          const pColor = priorityColors[notif.priority] || "var(--accent-navy)";
          return (
            <Card
              key={notif.id}
              className={`bg-card border-border transition-colors ${isUnread ? "border-r-2" : ""}`}
              style={isUnread ? { borderRightColor: pColor } : undefined}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded shrink-0 mt-0.5" style={{ background: `${pColor}15` }}>
                    <Bell className="h-3.5 w-3.5" style={{ color: pColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="tag" style={{ background: `${pColor}15`, color: pColor, fontSize: "9px" }}>
                        {channelLabels[notif.channel] || notif.channel}
                      </span>
                      {isUnread && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <h3 className={`text-sm mt-1 ${isUnread ? "font-semibold" : "text-muted-foreground"}`}>
                      {notif.titleAr || notif.titleEn}
                    </h3>
                    {notif.bodyAr && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.bodyAr}</p>}
                    {!notif.bodyAr && notif.bodyEn && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" dir="ltr">{notif.bodyEn}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-1 numeric">
                      {new Date(notif.createdAt).toLocaleString("ar-SA")}
                    </p>
                  </div>
                  {isUnread && (
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => markReadMutation.mutate({ id: notif.id })}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
