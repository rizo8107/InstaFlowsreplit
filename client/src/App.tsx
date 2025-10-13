import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Flows from "@/pages/flows";
import FlowBuilder from "@/pages/flow-builder";
import Accounts from "@/pages/accounts";
import ActivityPage from "@/pages/activity";
import Templates from "@/pages/templates";
import WebhookSetup from "@/pages/webhook-setup";
import Contacts from "@/pages/contacts";
import AgentsPage from "@/pages/agents";
import AgentChatPage from "@/pages/agent-chat";
import AuthPage from "@/pages/auth";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/flows">
        <ProtectedRoute>
          <Flows />
        </ProtectedRoute>
      </Route>
      <Route path="/flows/:id">
        <ProtectedRoute>
          <FlowBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/accounts">
        <ProtectedRoute>
          <Accounts />
        </ProtectedRoute>
      </Route>
      <Route path="/templates">
        <ProtectedRoute>
          <Templates />
        </ProtectedRoute>
      </Route>
      <Route path="/webhook-setup">
        <ProtectedRoute>
          <WebhookSetup />
        </ProtectedRoute>
      </Route>
      <Route path="/activity">
        <ProtectedRoute>
          <ActivityPage />
        </ProtectedRoute>
      </Route>
      <Route path="/contacts">
        <ProtectedRoute>
          <Contacts />
        </ProtectedRoute>
      </Route>
      <Route path="/agents">
        <ProtectedRoute>
          <AgentsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/agents/:id/chat">
        <ProtectedRoute>
          <AgentChatPage />
        </ProtectedRoute>
      </Route>
      <Route path="/terms">
        <Terms />
      </Route>
      <Route path="/privacy">
        <Privacy />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between p-4 border-b bg-card">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
