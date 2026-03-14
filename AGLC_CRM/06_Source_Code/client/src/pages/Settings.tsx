import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCrmTheme, type CrmTheme } from "@/contexts/CrmThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings as SettingsIcon, Bell, Shield, Globe, Palette, Database, Bot,
  Save, Building2, Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const themeOptions: { value: CrmTheme; labelAr: string; labelEn: string; preview: string; desc: string }[] = [
  { value: "classic-normal", labelAr: "الكلاسيكي الداكن", labelEn: "Classic Dark", preview: "#000000", desc: "Black & Gold executive" },
  { value: "classic-light", labelAr: "الكلاسيكي الفاتح", labelEn: "Classic Light", preview: "#FAFAFA", desc: "White & Gold professional" },
  { value: "neon-dark", labelAr: "النيون الداكن", labelEn: "Neon Dark", preview: "#0A0A12", desc: "Void & Neon futuristic" },
  { value: "neon-light", labelAr: "النيون الفاتح", labelEn: "Neon Light", preview: "#F5F3F8", desc: "Lavender & Pink modern" },
  { value: "lawsurface", labelAr: "المحترف الأزرق", labelEn: "LawSurface Blue", preview: "#1976D2", desc: "Clean blue corporate" },
];

const companyTypes = [
  { value: "law_firm", labelAr: "مكتب محاماة", labelEn: "Law Firm" },
  { value: "consulting", labelAr: "استشارات", labelEn: "Consulting" },
  { value: "real_estate", labelAr: "عقارات", labelEn: "Real Estate" },
  { value: "trading", labelAr: "تجارة", labelEn: "Trading" },
  { value: "technology", labelAr: "تقنية", labelEn: "Technology" },
  { value: "healthcare", labelAr: "رعاية صحية", labelEn: "Healthcare" },
  { value: "education", labelAr: "تعليم", labelEn: "Education" },
  { value: "other", labelAr: "أخرى", labelEn: "Other" },
];

export default function Settings() {
  const { user } = useAuth();
  const { t, language, setLanguage, isArabic } = useLanguage();
  const { crmTheme, setCrmTheme } = useCrmTheme();
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  const { data: companies, isLoading: companiesLoading, refetch: refetchCompanies } = trpc.companies.list.useQuery();
  const createCompanyMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      refetchCompanies();
      setCompanyDialogOpen(false);
      toast.success(t("تم إنشاء الشركة بنجاح", "Company created successfully"));
    },
  });

  const [companyForm, setCompanyForm] = useState({
    code: "", nameEn: "", nameAr: "", companyType: "law_firm" as any,
    logoUrl: "", primaryColor: "",
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display">{t("الإعدادات", "Settings")}</h1>
        <p className="text-xs text-muted-foreground mt-1">{t("الإعدادات والتكوين", "Settings & Configuration")}</p>
      </div>

      <Tabs defaultValue="theme">
        <TabsList>
          <TabsTrigger value="theme" className="text-xs"><Palette className="h-3.5 w-3.5 mx-1" /> {t("المظهر", "Theme")}</TabsTrigger>
          <TabsTrigger value="language" className="text-xs"><Globe className="h-3.5 w-3.5 mx-1" /> {t("اللغة", "Language")}</TabsTrigger>
          <TabsTrigger value="companies" className="text-xs"><Building2 className="h-3.5 w-3.5 mx-1" /> {t("الشركات", "Companies")}</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs"><Shield className="h-3.5 w-3.5 mx-1" /> {t("الملف الشخصي", "Profile")}</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs"><Bell className="h-3.5 w-3.5 mx-1" /> {t("الإشعارات", "Notifications")}</TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs"><Globe className="h-3.5 w-3.5 mx-1" /> {t("التكاملات", "Integrations")}</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs"><Bot className="h-3.5 w-3.5 mx-1" /> {t("الذكاء الاصطناعي", "AI")}</TabsTrigger>
        </TabsList>

        {/* Theme Tab */}
        <TabsContent value="theme" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">{t("اختيار المظهر", "Choose Theme")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {themeOptions.map(theme => (
                  <button
                    key={theme.value}
                    onClick={() => setCrmTheme(theme.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      crmTheme === theme.value
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg border border-border shrink-0"
                        style={{ background: theme.preview }}
                      />
                      <div className={isArabic ? "text-right" : "text-left"}>
                        <p className="text-sm font-semibold">{isArabic ? theme.labelAr : theme.labelEn}</p>
                        <p className="text-[10px] text-muted-foreground">{theme.desc}</p>
                      </div>
                    </div>
                    {crmTheme === theme.value && (
                      <Badge className="mt-2 text-[10px]" variant="default">{t("مُفعّل", "Active")}</Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">{t("إعدادات اللغة", "Language Settings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLanguage("ar")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isArabic ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="text-lg font-bold">العربية</p>
                  <p className="text-xs text-muted-foreground mt-1">Arabic (RTL)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">الواجهة من اليمين لليسار</p>
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    !isArabic ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="text-lg font-bold">English</p>
                  <p className="text-xs text-muted-foreground mt-1">English (LTR)</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Left-to-right interface</p>
                </button>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">{t("ملاحظة", "Note")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    "تغيير اللغة سيؤثر على اتجاه الواجهة (RTL/LTR) وجميع النصوص في النظام. الخطوط العربية ستبقى كما هي.",
                    "Changing the language will affect the interface direction (RTL/LTR) and all system text. Arabic fonts will remain the same."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading">{t("إدارة الشركات", "Manage Companies")}</h2>
            <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 mx-1" /> {t("شركة جديدة", "New Company")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-heading">{t("إضافة شركة", "Add Company")}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto px-1">
                  <div>
                    <Label className="text-xs">{t("رمز الشركة (مختصر)", "Company Code")} *</Label>
                    <Input className="mt-1 h-9 text-sm" value={companyForm.code} onChange={e => setCompanyForm({...companyForm, code: e.target.value})} dir="ltr" placeholder="AGLC" />
                  </div>
                  <div>
                    <Label className="text-xs">{t("اسم الشركة (إنجليزي)", "Company Name (English)")} *</Label>
                    <Input className="mt-1 h-9 text-sm" value={companyForm.nameEn} onChange={e => setCompanyForm({...companyForm, nameEn: e.target.value})} dir="ltr" />
                  </div>
                  <div>
                    <Label className="text-xs">{t("اسم الشركة (عربي)", "Company Name (Arabic)")}</Label>
                    <Input className="mt-1 h-9 text-sm" value={companyForm.nameAr} onChange={e => setCompanyForm({...companyForm, nameAr: e.target.value})} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("نوع الشركة", "Company Type")} *</Label>
                    <Select value={companyForm.companyType} onValueChange={v => setCompanyForm({...companyForm, companyType: v})}>
                      <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {companyTypes.map(ct => (
                          <SelectItem key={ct.value} value={ct.value}>{isArabic ? ct.labelAr : ct.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => { if (companyForm.code && companyForm.nameEn) createCompanyMutation.mutate(companyForm); }}
                    disabled={createCompanyMutation.isPending}
                    className="w-full"
                  >
                    {createCompanyMutation.isPending ? t("جارٍ الإنشاء...", "Creating...") : t("إنشاء الشركة", "Create Company")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {companiesLoading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : (!companies || companies.length === 0) ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("لا توجد شركات مسجلة", "No companies registered")}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t("أضف شركتك الأولى لبدء استخدام النظام", "Add your first company to start using the system")}</p>
              </CardContent>
            </Card>
          ) : companies.map((company: any) => (
            <Card key={company.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded shrink-0" style={{ background: "var(--glow-primary-subtle)" }}>
                    <Building2 className="h-5 w-5" style={{ color: "var(--accent-gold)" }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold" dir="ltr">{company.nameEn}</h3>
                    {company.nameAr && <p className="text-xs text-muted-foreground">{company.nameAr}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                      {company.companyType && (
                        <span className="tag tag-review">
                          {companyTypes.find(ct => ct.value === company.companyType)?.[isArabic ? "labelAr" : "labelEn"] || company.companyType}
                        </span>
                      )}
                      <span className="numeric" dir="ltr">{company.code}</span>
                    </div>
                  </div>
                  <span className={`tag ${company.isActive ? "tag-active" : "tag-review"}`}>
                    {company.isActive ? t("نشط", "Active") : t("غير نشط", "Inactive")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
                {t("الملف الشخصي", "Profile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">{t("الاسم", "Name")}</Label>
                      <Input defaultValue={user.name || ""} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{t("البريد الإلكتروني", "Email")}</Label>
                      <Input defaultValue={user.email || ""} type="email" className="h-9 text-sm" dir="ltr" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">{t("الدور", "Role")}</Label>
                      <Input defaultValue={user.role === "admin" ? t("مدير النظام", "Admin") : t("مستخدم", "User")} disabled className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{t("اللغة", "Language")}</Label>
                      <Input defaultValue={isArabic ? "العربية" : "English"} disabled className="h-9 text-sm" />
                    </div>
                  </div>
                  <Button size="sm" onClick={() => toast.success(t("تم حفظ التغييرات", "Changes saved"))}>
                    <Save className="h-4 w-4 mx-1.5" /> {t("حفظ التغييرات", "Save Changes")}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("يرجى تسجيل الدخول", "Please sign in")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Bell className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
                {t("تفضيلات الإشعارات", "Notification Preferences")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { ar: "إشعارات البريد الإلكتروني", en: "Email Notifications", descAr: "تلقي تحديثات القضايا عبر البريد", descEn: "Receive case updates via email", default: true },
                { ar: "إشعارات واتساب", en: "WhatsApp Notifications", descAr: "إشعارات فورية عبر واتساب", descEn: "Instant notifications via WhatsApp", default: false },
                { ar: "الإشعارات داخل التطبيق", en: "In-App Notifications", descAr: "شارات وتنبيهات في النظام", descEn: "Badges and alerts in the system", default: true },
                { ar: "تنبيهات الذكاء الاصطناعي", en: "AI Alerts", descAr: "تنبيهات من وكلاء الذكاء الاصطناعي", descEn: "Alerts from AI agents", default: true },
                { ar: "الملخص اليومي", en: "Daily Summary", descAr: "ملخص يومي لجميع الأنشطة", descEn: "Daily summary of all activities", default: false },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{isArabic ? n.ar : n.en}</p>
                    <p className="text-xs text-muted-foreground">{isArabic ? n.descAr : n.descEn}</p>
                  </div>
                  <Switch defaultChecked={n.default} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Globe className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
                {t("التكاملات", "Integrations")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { nameAr: "واتساب للأعمال", nameEn: "WhatsApp Business", connected: false },
                { nameAr: "DocuSign", nameEn: "DocuSign", connected: true },
                { nameAr: "منصة MISA", nameEn: "MISA Platform", connected: true },
                { nameAr: "البريد الإلكتروني", nameEn: "Email", connected: true },
                { nameAr: "Calendly", nameEn: "Calendly", connected: false },
              ].map((int, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{isArabic ? int.nameAr : int.nameEn}</p>
                    <p className="text-xs text-muted-foreground">
                      {int.connected ? t("متصل", "Connected") : t("غير متصل", "Not connected")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toast(t("قريبًا", "Coming soon"))}>
                    {int.connected ? t("إعداد", "Configure") : t("ربط", "Connect")}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Bot className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
                {t("إعدادات الذكاء الاصطناعي", "AI Settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("التعيين التلقائي", "Auto Assignment")}</p>
                  <p className="text-xs text-muted-foreground">{t("تعيين المهام تلقائيًا بناءً على قدرة الفريق", "Auto-assign tasks based on team capacity")}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("التحليلات التنبؤية", "Predictive Analytics")}</p>
                  <p className="text-xs text-muted-foreground">{t("توقعات نتائج القضايا بالذكاء الاصطناعي", "AI-powered case outcome predictions")}</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("حساسية كشف الأزمات", "Crisis Detection Sensitivity")}</p>
                  <p className="text-xs text-muted-foreground">{t("مستوى حساسية مدير الأزمات", "Crisis manager sensitivity level")}</p>
                </div>
                <Badge variant="outline" className="text-xs">{t("متوسط", "Medium")}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Database className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
                {t("معلومات النظام", "System Info")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">{t("الإصدار", "Version")}</p>
                  <p className="font-medium numeric" dir="ltr">AGLC CRM v2.0.0</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("البيئة", "Environment")}</p>
                  <p className="font-medium">{t("إنتاج", "Production")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("قاعدة البيانات", "Database")}</p>
                  <p className="font-medium" dir="ltr">MySQL (TiDB)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("آخر تحديث", "Last Update")}</p>
                  <p className="font-medium numeric" dir="ltr">2026-03-14</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
