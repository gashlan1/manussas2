import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot, Brain, Target, Shield, Zap, FileText, Languages, ScanLine,
  Send, MessageSquare, Trash2, Plus, Activity, CheckCircle,
  AlertTriangle, ArrowLeft, Sparkles,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

type AgentDef = {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
  description: string;
  descriptionAr: string;
  color: string;
  suggestions: { ar: string; en: string }[];
};

const AGENTS: AgentDef[] = [
  {
    id: "planner",
    name: "Legal Planner",
    nameAr: "المخطط القانوني",
    icon: Brain,
    description: "Generates case roadmaps, task sequences, and milestone timelines using AI analysis of Saudi legal procedures.",
    descriptionAr: "ينشئ خرائط طريق القضايا وتسلسل المهام والجداول الزمنية باستخدام تحليل الذكاء الاصطناعي للإجراءات القانونية السعودية.",
    color: "text-blue-400",
    suggestions: [
      { ar: "أنشئ خطة عمل لقضية تجارية جديدة", en: "Create a roadmap for a new commercial case" },
      { ar: "ما هي مراحل قضية عمالية في السعودية؟", en: "What are the phases of a labor case in KSA?" },
      { ar: "حدد المهام المطلوبة لتأسيس شركة", en: "List tasks needed for company incorporation" },
      { ar: "اقترح جدول زمني لقضية عقارية", en: "Suggest timeline for a real estate dispute" },
    ],
  },
  {
    id: "tracker",
    name: "Case Tracker",
    nameAr: "متتبع القضايا",
    icon: Target,
    description: "Monitors case progress, deadline compliance, and sends proactive alerts for overdue or at-risk items.",
    descriptionAr: "يراقب تقدم القضايا والتزام المواعيد النهائية ويرسل تنبيهات استباقية للعناصر المتأخرة أو المعرضة للخطر.",
    color: "text-emerald-400",
    suggestions: [
      { ar: "أظهر لي القضايا المتأخرة", en: "Show me overdue cases" },
      { ar: "ما هي المهام المعلقة هذا الأسبوع؟", en: "What tasks are pending this week?" },
      { ar: "حلل معدل إنجاز المهام", en: "Analyze task completion rate" },
      { ar: "هل هناك مواعيد نهائية قريبة؟", en: "Are there any upcoming deadlines?" },
    ],
  },
  {
    id: "crisis",
    name: "Crisis Manager",
    nameAr: "مدير الأزمات",
    icon: Shield,
    description: "Detects risk patterns, escalates critical issues, and triggers emergency protocols for the firm.",
    descriptionAr: "يكتشف أنماط المخاطر ويصعد المشكلات الحرجة ويفعل بروتوكولات الطوارئ للمكتب.",
    color: "text-red-400",
    suggestions: [
      { ar: "حلل المخاطر الحالية في محفظة القضايا", en: "Analyze current risks in the case portfolio" },
      { ar: "هل هناك فواتير متأخرة تحتاج تصعيد؟", en: "Are there overdue invoices needing escalation?" },
      { ar: "قيّم مخاطر الامتثال التنظيمي", en: "Assess regulatory compliance risks" },
      { ar: "أنشئ تقرير تقييم المخاطر", en: "Generate a risk assessment report" },
    ],
  },
  {
    id: "briefing",
    name: "Briefing Wizard",
    nameAr: "معالج الملخصات",
    icon: FileText,
    description: "Generates legal briefs, memos, case summaries, and professional client correspondence.",
    descriptionAr: "ينشئ الملخصات القانونية والمذكرات وملخصات القضايا والمراسلات المهنية للعملاء.",
    color: "text-purple-400",
    suggestions: [
      { ar: "اكتب مذكرة قانونية عن نظام العمل", en: "Write a legal memo on Saudi Labor Law" },
      { ar: "أنشئ ملخص قضية للعميل", en: "Create a case summary for the client" },
      { ar: "صِغ خطاب رسمي للمحكمة", en: "Draft a formal court submission letter" },
      { ar: "اكتب رأي قانوني حول عقد تجاري", en: "Write a legal opinion on a commercial contract" },
    ],
  },
  {
    id: "assistant",
    name: "Legal Assistant",
    nameAr: "المساعد القانوني",
    icon: Bot,
    description: "General-purpose legal AI for Saudi law research, procedure guidance, and client intake assistance.",
    descriptionAr: "مساعد قانوني عام للبحث في القانون السعودي وإرشاد الإجراءات ومساعدة استقبال العملاء.",
    color: "text-amber-400",
    suggestions: [
      { ar: "ما هي إجراءات رفع دعوى تجارية؟", en: "What are the procedures for filing a commercial lawsuit?" },
      { ar: "اشرح نظام الشركات السعودي الجديد", en: "Explain the new Saudi Companies Law" },
      { ar: "ما هي متطلبات تسجيل علامة تجارية؟", en: "What are trademark registration requirements?" },
      { ar: "كيف أستخدم منصة ناجز؟", en: "How do I use the Najiz platform?" },
    ],
  },
  {
    id: "translator",
    name: "Translation Agent",
    nameAr: "وكيل الترجمة",
    icon: Languages,
    description: "Specialized legal translation between Arabic and English with consistent terminology and cultural adaptation.",
    descriptionAr: "ترجمة قانونية متخصصة بين العربية والإنجليزية مع اتساق المصطلحات والتكيف الثقافي.",
    color: "text-cyan-400",
    suggestions: [
      { ar: "ترجم هذا العقد إلى الإنجليزية", en: "Translate this contract to Arabic" },
      { ar: "ما هو المصطلح القانوني الصحيح لـ indemnity؟", en: "What is the correct Arabic term for 'كفالة'?" },
      { ar: "ترجم بنود الإنهاء في العقد", en: "Translate the termination clauses" },
      { ar: "راجع ترجمة هذه الوثيقة القانونية", en: "Review the translation of this legal document" },
    ],
  },
  {
    id: "scanner",
    name: "Document Scanner",
    nameAr: "ماسح المستندات",
    icon: ScanLine,
    description: "Analyzes documents for key information extraction, clause analysis, and compliance verification.",
    descriptionAr: "يحلل المستندات لاستخراج المعلومات الرئيسية وتحليل البنود والتحقق من الامتثال.",
    color: "text-orange-400",
    suggestions: [
      { ar: "حلل بنود هذا العقد", en: "Analyze the clauses of this contract" },
      { ar: "استخرج التواريخ والمبالغ المهمة", en: "Extract important dates and amounts" },
      { ar: "تحقق من امتثال الوثيقة للأنظمة", en: "Verify document compliance with regulations" },
      { ar: "حدد المخاطر في هذا الاتفاق", en: "Identify risks in this agreement" },
    ],
  },
];

export default function AIAgents() {
  const { t, isArabic } = useLanguage();
  const [activeAgent, setActiveAgent] = useState<AgentDef | null>(null);
  const [message, setMessage] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: healthData, isLoading: healthLoading } = trpc.aiAgents.systemHealthCheck.useQuery(
    undefined,
    { refetchInterval: 60000 }
  );

  const { data: conversations, refetch: refetchConversations } = trpc.aiAgents.listConversations.useQuery(
    { agentType: activeAgent?.id },
    { enabled: !!activeAgent }
  );

  const { data: conversationData, refetch: refetchMessages } = trpc.aiAgents.getConversation.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );

  const chatMutation = trpc.aiAgents.chat.useMutation({
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

  const deleteMutation = trpc.aiAgents.deleteConversation.useMutation({
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
  }, [conversationData?.messages, chatMutation.isPending]);

  const handleSend = () => {
    if (!message.trim() || !activeAgent) return;
    chatMutation.mutate({
      agentType: activeAgent.id as any,
      conversationId: activeConversationId,
      message: message.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAgentStatus = (agentId: string) => {
    if (!healthData?.agents) return "unknown";
    const agent = healthData.agents.find((a: any) => a.id === agentId);
    return agent?.status || "unknown";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; labelAr: string; cls: string }> = {
      operational: { label: "Online", labelAr: "متصل", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
      degraded: { label: "Degraded", labelAr: "متدهور", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
      offline: { label: "Offline", labelAr: "غير متصل", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
      unknown: { label: "Checking", labelAr: "جاري الفحص", cls: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
    };
    const s = map[status] || map.unknown;
    return <Badge variant="outline" className={`text-[10px] ${s.cls}`}>{t(s.labelAr, s.label)}</Badge>;
  };

  // ─── Agent Chat View ─────────────────────────────────────────────
  if (activeAgent) {
    const AgentIcon = activeAgent.icon;
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setActiveAgent(null); setActiveConversationId(undefined); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-2 rounded-lg bg-secondary">
            <AgentIcon className={`h-5 w-5 ${activeAgent.color}`} />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-display flex items-center gap-2">
              {t(activeAgent.nameAr, activeAgent.name)}
              {statusBadge(getAgentStatus(activeAgent.id))}
            </h1>
            <p className="text-xs text-muted-foreground">{t(activeAgent.descriptionAr, activeAgent.description)}</p>
          </div>
        </div>

        {/* Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: "calc(100vh - 200px)" }}>
          {/* Conversation Sidebar */}
          <Card className="bg-card border-border lg:col-span-1 flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{t("المحادثات", "Conversations")}</CardTitle>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setActiveConversationId(undefined)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {conversations?.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full p-2 rounded text-xs transition-colors text-start ${
                        activeConversationId === conv.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span className="truncate">{conv.title || t("محادثة جديدة", "New conversation")}</span>
                      </div>
                    </button>
                  ))}
                  {(!conversations || conversations.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center p-4">{t("لا توجد محادثات", "No conversations")}</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="bg-card border-border lg:col-span-3 flex flex-col">
            <CardHeader className="pb-2 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AgentIcon className={`h-4 w-4 ${activeAgent.color}`} />
                  <CardTitle className="text-sm">{t(activeAgent.nameAr, activeAgent.name)}</CardTitle>
                </div>
                {activeConversationId && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => deleteMutation.mutate({ conversationId: activeConversationId })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {!activeConversationId && (!conversationData?.messages || conversationData.messages.length === 0) && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <AgentIcon className={`h-12 w-12 mb-4 opacity-20 ${activeAgent.color}`} />
                  <h3 className="text-sm font-semibold mb-2">{t(`مرحباً بك في ${activeAgent.nameAr}`, `Welcome to ${activeAgent.name}`)}</h3>
                  <p className="text-xs text-muted-foreground max-w-md mb-4">{t(activeAgent.descriptionAr, activeAgent.description)}</p>
                  <div className="grid grid-cols-2 gap-2 max-w-lg">
                    {activeAgent.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setMessage(isArabic ? s.ar : s.en)}
                        className="text-xs p-2.5 rounded border border-border hover:bg-muted transition-colors text-muted-foreground text-start"
                      >
                        <Sparkles className="h-3 w-3 mb-1 opacity-50" />
                        {isArabic ? s.ar : s.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {conversationData?.messages?.map((msg: any, i: number) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? (isArabic ? "flex-row-reverse" : "flex-row") : ""}`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary/10" : "bg-muted"}`}>
                    {msg.role === "assistant" ? <AgentIcon className={`h-3.5 w-3.5 ${activeAgent.color}`} /> : <span className="text-xs font-bold">U</span>}
                  </div>
                  <div className={`flex-1 text-sm ${msg.role === "user" ? "bg-muted p-3 rounded-lg" : ""}`}>
                    {msg.role === "assistant" ? <Streamdown>{msg.content}</Streamdown> : <p>{msg.content}</p>}
                  </div>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                    <AgentIcon className={`h-3.5 w-3.5 animate-pulse ${activeAgent.color}`} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border shrink-0">
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("اكتب رسالتك هنا...", "Type your message here...")}
                  className="min-h-[44px] max-h-[120px] text-sm resize-none"
                  disabled={chatMutation.isPending}
                />
                <Button onClick={handleSend} disabled={!message.trim() || chatMutation.isPending} className="h-11 w-11 p-0 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Agent Grid View ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display">{t("وكلاء الذكاء الاصطناعي", "AI Agents")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("وكلاء ذكاء اصطناعي متخصصون لإدارة الممارسة القانونية", "Specialized AI agents for legal practice management")}
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          <Activity className="h-3 w-3 me-1" />
          {healthData?.status === "healthy"
            ? t("جميع الأنظمة تعمل", "All Systems Operational")
            : t("جاري الفحص...", "Checking...")}
        </Badge>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><Bot className="h-4 w-4 text-emerald-400" /></div>
            <div>
              <p className="text-lg font-bold numeric" dir="ltr">{AGENTS.length}</p>
              <p className="text-xs text-muted-foreground">{t("وكلاء نشطون", "Active Agents")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><CheckCircle className="h-4 w-4 text-blue-400" /></div>
            <div>
              <p className="text-lg font-bold numeric" dir="ltr">{healthData?.llm === "operational" ? "OK" : "..."}</p>
              <p className="text-xs text-muted-foreground">{t("حالة LLM", "LLM Status")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10"><MessageSquare className="h-4 w-4 text-purple-400" /></div>
            <div>
              <p className="text-lg font-bold numeric" dir="ltr">{healthData?.metrics?.aiConversations ?? "..."}</p>
              <p className="text-xs text-muted-foreground">{t("المحادثات", "Conversations")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="h-4 w-4 text-amber-400" /></div>
            <div>
              <p className="text-lg font-bold numeric" dir="ltr">{healthData?.database === "operational" ? "OK" : "..."}</p>
              <p className="text-xs text-muted-foreground">{t("قاعدة البيانات", "Database")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {AGENTS.map((agent) => {
          const AgentIcon = agent.icon;
          const status = getAgentStatus(agent.id);
          return (
            <Card
              key={agent.id}
              className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => setActiveAgent(agent)}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                      <AgentIcon className={`h-5 w-5 ${agent.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{t(agent.nameAr, agent.name)}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{isArabic ? agent.name : agent.nameAr}</p>
                    </div>
                  </div>
                  {statusBadge(status)}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(agent.descriptionAr, agent.description)}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {agent.suggestions.slice(0, 2).map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                      {isArabic ? s.ar.slice(0, 25) + "..." : s.en.slice(0, 25) + "..."}
                    </Badge>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <MessageSquare className="h-3 w-3 me-1.5" />
                  {t("بدء محادثة", "Start Chat")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
