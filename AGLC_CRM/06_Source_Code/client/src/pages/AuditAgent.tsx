import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Send, MessageSquare, Trash2, Plus, Activity,
  AlertTriangle, CheckCircle, Clock,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function AuditAgent() {
  const { t, isArabic } = useLanguage();
  const [message, setMessage] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchConversations } = trpc.audit.listConversations.useQuery();
  const { data: conversationData, refetch: refetchMessages } = trpc.audit.getConversation.useQuery(
    { conversationId: activeConversationId },
    { enabled: activeConversationId !== undefined }
  );
  const { data: auditSummary } = trpc.audit.getAuditSummary.useQuery();

  const chatMutation = trpc.audit.chat.useMutation({
    onSuccess: (data) => {
      setActiveConversationId(data.conversationId);
      refetchMessages();
      refetchConversations();
      setMessage("");
    },
    onError: () => {
      toast.error(t("حدث خطأ أثناء المعالجة", "An error occurred while processing"));
    },
  });

  const deleteMutation = trpc.audit.deleteConversation.useMutation({
    onSuccess: () => {
      setActiveConversationId(undefined);
      refetchConversations();
      toast.success(t("تم حذف المحادثة", "Conversation deleted"));
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    chatMutation.mutate({
      conversationId: activeConversationId,
      message: message.trim(),
      context: "audit",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display flex items-center gap-2">
          <Shield className="h-6 w-6" style={{ color: "var(--accent-gold)" }} />
          {t("وكيل التدقيق والدعم", "Audit & Support Agent")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {t("مساعد ذكاء اصطناعي للتدقيق والمراقبة والدعم", "AI-powered audit, monitoring, and support assistant")}
        </p>
      </div>

      {/* Audit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded" style={{ background: "var(--tag-active-bg)" }}>
              <Activity className="h-4 w-4" style={{ color: "var(--tag-active-text)" }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("إجمالي الإجراءات", "Total Actions")}</p>
              <p className="text-lg font-bold numeric" dir="ltr">{auditSummary?.totalActions || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded" style={{ background: "var(--tag-complete-bg)" }}>
              <CheckCircle className="h-4 w-4" style={{ color: "var(--tag-complete-text)" }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("أنواع الإجراءات", "Action Types")}</p>
              <p className="text-lg font-bold numeric" dir="ltr">
                {auditSummary?.actionBreakdown ? Object.keys(auditSummary.actionBreakdown).length : 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded" style={{ background: "var(--tag-review-bg)" }}>
              <MessageSquare className="h-4 w-4" style={{ color: "var(--tag-review-text)" }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("المحادثات", "Conversations")}</p>
              <p className="text-lg font-bold numeric" dir="ltr">{conversations?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded" style={{ background: "var(--tag-urgent-bg)" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "var(--tag-urgent-text)" }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("التنبيهات", "Alerts")}</p>
              <p className="text-lg font-bold numeric" dir="ltr">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: "calc(100vh - 340px)" }}>
        {/* Conversation List */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-heading">{t("المحادثات", "Conversations")}</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setActiveConversationId(undefined)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {conversations?.map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-right p-2 rounded text-xs transition-colors ${
                      activeConversationId === conv.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <span className="truncate">{conv.title || t("محادثة جديدة", "New conversation")}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      <span className="numeric" dir="ltr">
                        {new Date(conv.updatedAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US")}
                      </span>
                    </div>
                  </button>
                ))}
                {(!conversations || conversations.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center p-4">
                    {t("لا توجد محادثات سابقة", "No previous conversations")}
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="bg-card border-border lg:col-span-3 flex flex-col">
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
                <CardTitle className="text-sm font-heading">
                  {t("وكيل التدقيق الذكي", "AI Audit Agent")}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {t("متصل", "Online")}
                </Badge>
              </div>
              {activeConversationId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive"
                  onClick={() => deleteMutation.mutate({ conversationId: activeConversationId })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {!activeConversationId && (!conversationData?.messages || conversationData.messages.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Shield className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-sm font-semibold mb-2">
                  {t("مرحباً بك في وكيل التدقيق", "Welcome to the Audit Agent")}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  {t(
                    "يمكنني مساعدتك في مراجعة سجلات النشاط، تحليل الأداء، مراقبة الامتثال، واستكشاف أخطاء النظام. اسألني أي شيء!",
                    "I can help you review activity logs, analyze performance, monitor compliance, and troubleshoot system issues. Ask me anything!"
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4 max-w-md">
                  {[
                    { ar: "أظهر لي ملخص النشاط الأخير", en: "Show me recent activity summary" },
                    { ar: "هل هناك أي مخاطر امتثال؟", en: "Are there any compliance risks?" },
                    { ar: "حلل أداء الفريق هذا الأسبوع", en: "Analyze team performance this week" },
                    { ar: "راجع سجل التدقيق للقضايا", en: "Review audit trail for cases" },
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMessage(isArabic ? suggestion.ar : suggestion.en);
                      }}
                      className="text-xs p-2 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
                    >
                      {isArabic ? suggestion.ar : suggestion.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {conversationData?.messages?.map((msg: any, i: number) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? (isArabic ? "flex-row-reverse" : "flex-row") : ""}`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-primary/10"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Shield className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="text-xs font-bold">U</span>
                  )}
                </div>
                <div
                  className={`flex-1 text-sm ${
                    msg.role === "user"
                      ? "bg-muted p-3 rounded-lg"
                      : ""
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                  <Shield className="h-3.5 w-3.5 text-primary animate-pulse" />
                </div>
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("اكتب سؤالك هنا...", "Type your question here...")}
                className="min-h-[44px] max-h-[120px] text-sm resize-none"
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || chatMutation.isPending}
                className="h-11 w-11 p-0 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
