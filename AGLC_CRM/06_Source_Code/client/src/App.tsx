import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CrmThemeProvider } from "./contexts/CrmThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Cases from "./pages/Cases";
import Tasks from "./pages/Tasks";
import FeeProposals from "./pages/FeeProposals";
import Billing from "./pages/Billing";
import Clients from "./pages/Clients";
import Team from "./pages/Team";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import AIAgents from "./pages/AIAgents";
import Settings from "./pages/Settings";
import AuditAgent from "./pages/AuditAgent";
import DashboardLayout from "./components/DashboardLayout";

function DashboardRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">{() => <DashboardRoute component={Dashboard} />}</Route>
      <Route path="/pipeline">{() => <DashboardRoute component={Pipeline} />}</Route>
      <Route path="/cases">{() => <DashboardRoute component={Cases} />}</Route>
      <Route path="/tasks">{() => <DashboardRoute component={Tasks} />}</Route>
      <Route path="/fee-proposals">{() => <DashboardRoute component={FeeProposals} />}</Route>
      <Route path="/billing">{() => <DashboardRoute component={Billing} />}</Route>
      <Route path="/clients">{() => <DashboardRoute component={Clients} />}</Route>
      <Route path="/team">{() => <DashboardRoute component={Team} />}</Route>
      <Route path="/notifications">{() => <DashboardRoute component={Notifications} />}</Route>
      <Route path="/reports">{() => <DashboardRoute component={Reports} />}</Route>
      <Route path="/ai-agents">{() => <DashboardRoute component={AIAgents} />}</Route>
      <Route path="/audit-agent">{() => <DashboardRoute component={AuditAgent} />}</Route>
      <Route path="/settings">{() => <DashboardRoute component={Settings} />}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <CrmThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CrmThemeProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
