import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Briefcase,
  ListTodo,
  FileText,
  Users,
  Bot,
  Settings,
  Scale,
  ChevronRight,
  TrendingUp,
  DollarSign,
  UserCheck,
  Bell,
  BarChart3,
  Shield,
  Globe,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, labelAr: "لوحة التحكم", labelEn: "Dashboard", path: "/dashboard" },
  { icon: TrendingUp, labelAr: "خط المبيعات", labelEn: "Pipeline", path: "/pipeline" },
  { icon: Briefcase, labelAr: "القضايا", labelEn: "Cases", path: "/cases" },
  { icon: ListTodo, labelAr: "المهام", labelEn: "Tasks", path: "/tasks" },
  { icon: FileText, labelAr: "عروض الأتعاب", labelEn: "Fee Proposals", path: "/fee-proposals" },
  { icon: DollarSign, labelAr: "الفوترة", labelEn: "Billing", path: "/billing" },
  { icon: UserCheck, labelAr: "العملاء", labelEn: "Clients", path: "/clients" },
  { icon: Users, labelAr: "الفريق", labelEn: "Team", path: "/team" },
  { icon: Bell, labelAr: "الإشعارات", labelEn: "Notifications", path: "/notifications" },
  { icon: BarChart3, labelAr: "التقارير", labelEn: "Reports", path: "/reports" },
  { icon: Bot, labelAr: "وكلاء AI", labelEn: "AI Agents", path: "/ai-agents" },
  { icon: Shield, labelAr: "التدقيق والدعم", labelEn: "Audit Agent", path: "/audit-agent" },
  { icon: Settings, labelAr: "الإعدادات", labelEn: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div
        className="flex items-center justify-center min-h-screen relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, oklch(0.13 0.008 260 / 70%), oklch(0.13 0.008 260 / 90%)), url('https://d2xsxph8kpxj0f.cloudfront.net/310419663029978364/kcashUtwk5QvZHT8Tphy8P/kafd_bg_f41ee904.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full glass-card rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <Scale className="h-12 w-12 gold-accent" />
            <h1 className="text-2xl font-bold tracking-tight text-center text-foreground">
              {t("نظام إدارة المكتب", "AGLC Law Firm CRM")}
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">
              {t("الأحمري وقشلان للمحاماة", "Alahmari & Gashlan Law Co.")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {t(
                "سجّل الدخول للوصول إلى لوحة التحكم وإدارة القضايا والأدوات القانونية الذكية",
                "Sign in to access the Executive Office dashboard, case management, and AI-powered legal tools."
              )}
            </p>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              size="lg"
              className="w-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {t("تسجيل الدخول", "Sign In")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60">
            {t("مدعوم بمنصة AGLC الذكية", "Powered by AGLC Intelligence Platform")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t, isArabic } = useLanguage();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarRect = sidebarRef.current?.getBoundingClientRect();
      if (!sidebarRect) return;
      let newWidth: number;
      if (isArabic) {
        // RTL: sidebar is on the right
        newWidth = sidebarRect.right - e.clientX;
      } else {
        // LTR: sidebar is on the left
        newWidth = e.clientX - sidebarRect.left;
      }
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth, isArabic]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          side={isArabic ? "right" : "left"}
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Scale className="h-5 w-5 shrink-0" style={{ color: "var(--accent-gold)" }} />
                  <span className="font-semibold tracking-tight truncate text-sm">
                    {t("AGLC CRM", "AGLC CRM")}
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-2">
            <SidebarMenu className="px-2 py-1 space-y-0.5">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                const label = isArabic ? item.labelAr : item.labelEn;
                const subLabel = isArabic ? item.labelEn : item.labelAr;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={label}
                      className={`h-10 transition-all font-normal ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="text-sm">{label}</span>
                      {!isCollapsed && (
                        <span className="text-[9px] text-muted-foreground/60" style={{ marginInlineStart: "auto" }} dir={isArabic ? "ltr" : "rtl"}>
                          {subLabel}
                        </span>
                      )}
                      {isActive && !isCollapsed && (
                        <ChevronRight className={`h-3 w-3 text-primary ${isArabic ? "rotate-180" : ""}`} style={{ marginInlineStart: "4px" }} />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            {/* Language Toggle */}
            {!isCollapsed && (
              <button
                onClick={() => setLanguage(isArabic ? "en" : "ar")}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-xs text-muted-foreground mb-2"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{isArabic ? "Switch to English" : "التبديل للعربية"}</span>
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={() => setLanguage(isArabic ? "en" : "ar")}
                className="flex items-center justify-center h-8 w-8 mx-auto rounded-lg hover:bg-sidebar-accent/50 transition-colors text-muted-foreground mb-2"
                title={isArabic ? "Switch to English" : "التبديل للعربية"}
              >
                <Globe className="h-3.5 w-3.5" />
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-sidebar-accent/50 transition-colors w-full group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user?.role === "admin"
                        ? t("شريك إداري", "Managing Partner")
                        : t("عضو فريق", "Team Member")}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className={`h-4 w-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                  <span>{t("الإعدادات", "Settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className={`h-4 w-4 ${isArabic ? "ml-2" : "mr-2"}`} />
                  <span>{t("تسجيل الخروج", "Sign out")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 ${isArabic ? "left-0" : "right-0"} w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <span className="tracking-tight text-foreground text-sm font-medium">
                  {isArabic ? activeMenuItem?.labelAr : activeMenuItem?.labelEn ?? "AGLC CRM"}
                </span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
