import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Bot,
  Brain,
  Target,
  Shield,
  Zap,
  BarChart3,
  Eye,
  Activity,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Agent = {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
  description: string;
  status: "Active" | "Standby" | "Training" | "Offline";
  health: number;
  tasksCompleted: number;
  tasksActive: number;
  accuracy: number;
  lastAction: string;
  capabilities: string[];
};

const agents: Agent[] = [
  {
    id: "planner",
    name: "Planner Agent",
    nameAr: "وكيل المخطط",
    icon: Brain,
    description: "Generates case roadmaps, task sequences, and milestone timelines using AI analysis.",
    status: "Active",
    health: 98,
    tasksCompleted: 156,
    tasksActive: 12,
    accuracy: 94,
    lastAction: "Generated roadmap for PC-2026-047",
    capabilities: ["Case Planning", "Task Sequencing", "Milestone Setting", "Resource Allocation"],
  },
  {
    id: "tracker",
    name: "Tracker Agent",
    nameAr: "وكيل المتتبع",
    icon: Target,
    description: "Monitors task progress, deadline compliance, and sends proactive alerts.",
    status: "Active",
    health: 95,
    tasksCompleted: 312,
    tasksActive: 47,
    accuracy: 97,
    lastAction: "Deadline alert for AG-2026-012",
    capabilities: ["Progress Monitoring", "Deadline Tracking", "Alert System", "SLA Compliance"],
  },
  {
    id: "crisis",
    name: "Crisis Manager",
    nameAr: "وكيل مدير الأزمات",
    icon: Shield,
    description: "Detects risk patterns, escalates critical issues, and triggers emergency protocols.",
    status: "Standby",
    health: 100,
    tasksCompleted: 23,
    tasksActive: 0,
    accuracy: 99,
    lastAction: "Risk assessment completed for portfolio",
    capabilities: ["Risk Detection", "Escalation Protocol", "Emergency Response", "Pattern Analysis"],
  },
  {
    id: "executor",
    name: "Executor Agent",
    nameAr: "وكيل المنفذ",
    icon: Zap,
    description: "Automates routine tasks, document generation, and workflow execution.",
    status: "Active",
    health: 92,
    tasksCompleted: 89,
    tasksActive: 8,
    accuracy: 91,
    lastAction: "Auto-generated fee proposal FP-2026-031",
    capabilities: ["Document Generation", "Workflow Automation", "Template Processing", "Email Drafting"],
  },
  {
    id: "monitor",
    name: "Monitor Agent",
    nameAr: "وكيل المراقب",
    icon: Eye,
    description: "Provides real-time system monitoring, performance tracking, and health checks.",
    status: "Active",
    health: 96,
    tasksCompleted: 1024,
    tasksActive: 5,
    accuracy: 98,
    lastAction: "System health check completed",
    capabilities: ["System Monitoring", "Performance Tracking", "Health Checks", "Usage Analytics"],
  },
  {
    id: "analyzer",
    name: "Analyzer Agent",
    nameAr: "وكيل المحلل",
    icon: BarChart3,
    description: "Generates insights, trends, and predictive analytics from case and financial data.",
    status: "Training",
    health: 85,
    tasksCompleted: 45,
    tasksActive: 3,
    accuracy: 88,
    lastAction: "Monthly revenue analysis generated",
    capabilities: ["Data Analysis", "Trend Detection", "Predictive Analytics", "Report Generation"],
  },
];

const statusColors: Record<string, string> = {
  Active: "border-success/30 text-success bg-success/10",
  Standby: "border-primary/30 text-primary bg-primary/10",
  Training: "border-warning/30 text-warning bg-warning/10",
  Offline: "border-muted-foreground/30 text-muted-foreground bg-muted",
};

export default function AIAgents() {
  const [agentStates, setAgentStates] = useState<Record<string, boolean>>(
    Object.fromEntries(agents.map(a => [a.id, a.status === "Active"]))
  );

  const toggleAgent = (id: string) => {
    setAgentStates(prev => ({ ...prev, [id]: !prev[id] }));
    const agent = agents.find(a => a.id === id);
    toast.success(`${agent?.name} ${agentStates[id] ? "paused" : "activated"}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor, control, and configure the AI agent orchestration system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gold-border gold-accent text-xs">
            <Activity className="h-3 w-3 mr-1" /> Orchestration Engine Active
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Agents", value: agents.filter(a => a.status === "Active").length, icon: Bot, color: "text-success" },
          { label: "Tasks Completed", value: agents.reduce((a, ag) => a + ag.tasksCompleted, 0).toLocaleString(), icon: Target, color: "text-primary" },
          { label: "Active Tasks", value: agents.reduce((a, ag) => a + ag.tasksActive, 0), icon: Zap, color: "gold-accent" },
          { label: "Avg Accuracy", value: `${Math.round(agents.reduce((a, ag) => a + ag.accuracy, 0) / agents.length)}%`, icon: Brain, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-card-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="bg-card border-border hover:border-primary/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-secondary">
                    <agent.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-card-foreground">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.nameAr}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusColors[agent.status]}`}>
                  {agent.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>

              {/* Health Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Health</span>
                  <span className="font-medium text-card-foreground">{agent.health}%</span>
                </div>
                <Progress value={agent.health} className="h-1.5" />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-secondary">
                  <p className="text-sm font-bold text-card-foreground">{agent.tasksCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">Done</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary">
                  <p className="text-sm font-bold text-card-foreground">{agent.tasksActive}</p>
                  <p className="text-[10px] text-muted-foreground">Active</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary">
                  <p className="text-sm font-bold text-card-foreground">{agent.accuracy}%</p>
                  <p className="text-[10px] text-muted-foreground">Accuracy</p>
                </div>
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <Badge key={cap} variant="outline" className="text-[10px] px-1.5 py-0">
                    {cap}
                  </Badge>
                ))}
              </div>

              {/* Last Action */}
              <p className="text-[10px] text-muted-foreground/70 italic">Last: {agent.lastAction}</p>

              {/* Controls */}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={agentStates[agent.id]}
                    onCheckedChange={() => toggleAgent(agent.id)}
                    className="scale-75"
                  />
                  <span className="text-xs text-muted-foreground">
                    {agentStates[agent.id] ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast("Feature coming soon")}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast("Feature coming soon")}>
                    {agentStates[agent.id] ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
