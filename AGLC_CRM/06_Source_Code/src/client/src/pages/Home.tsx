import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Scale, ArrowRight, Shield, Brain, BarChart3, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Scale className="h-12 w-12 text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Brain, title: "AI-Powered Agents", desc: "7 specialized AI agents for planning, tracking, and crisis management" },
    { icon: Shield, title: "Executive Control", desc: "Full-flow visibility with real-time dashboards and analytics" },
    { icon: BarChart3, title: "Smart Analytics", desc: "Performance insights, revenue tracking, and predictive analytics" },
    { icon: Users, title: "Team Collaboration", desc: "Task assignment, gamification, and wellness features" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="relative flex-1 flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(135deg, oklch(0.13 0.008 260 / 85%), oklch(0.13 0.008 260 / 75%)), url('https://d2xsxph8kpxj0f.cloudfront.net/310419663029978364/kcashUtwk5QvZHT8Tphy8P/kafd_bg_f41ee904.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <Scale className="h-10 w-10" style={{ color: "oklch(0.795 0.155 85)" }} />
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">AGLC</h2>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase">Alahmari & Gashlan Law Co.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                  Intelligent Legal
                  <br />
                  <span style={{ color: "oklch(0.795 0.155 85)" }}>Practice Management</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  A comprehensive CRM platform powered by advanced AI agents, designed for modern law firms in the Kingdom of Saudi Arabia.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => { window.location.href = getLoginUrl(); }}
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all font-semibold text-base px-8"
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="glass-card rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-all duration-300"
                >
                  <f.icon className="h-8 w-8" style={{ color: "oklch(0.795 0.155 85)" }} />
                  <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
