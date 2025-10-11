import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Instagram, Activity, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Flow, InstagramAccount, FlowExecution } from "@shared/schema";

export default function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useQuery<InstagramAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: flows, isLoading: flowsLoading } = useQuery<Flow[]>({
    queryKey: ["/api/flows"],
  });

  const { data: executions, isLoading: executionsLoading } = useQuery<FlowExecution[]>({
    queryKey: ["/api/executions/recent"],
  });

  const activeFlows = flows?.filter(f => f.isActive).length || 0;
  const todayExecutions = executions?.filter(e => {
    const today = new Date();
    const exDate = new Date(e.createdAt);
    return exDate.toDateString() === today.toDateString();
  }).length || 0;
  const successRate = executions?.length 
    ? Math.round((executions.filter(e => e.status === "success").length / executions.length) * 100) 
    : 0;

  const stats = [
    { 
      title: "Active Flows", 
      value: activeFlows.toString(), 
      icon: Workflow, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Connected Accounts", 
      value: accounts?.length.toString() || "0", 
      icon: Instagram, 
      color: "text-chart-2",
      bgColor: "bg-chart-2/10"
    },
    { 
      title: "Executions Today", 
      value: todayExecutions.toString(), 
      icon: Activity, 
      color: "text-chart-3",
      bgColor: "bg-chart-3/10"
    },
    { 
      title: "Success Rate", 
      value: `${successRate}%`, 
      icon: TrendingUp, 
      color: "text-chart-4",
      bgColor: "bg-chart-4/10"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor your Instagram automation workflows</p>
        </div>
        <Link href="/flows/new">
          <Button className="gap-2" data-testid="button-create-flow">
            <Plus className="w-4 h-4" />
            Create Flow
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-4 p-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {accountsLoading || flowsLoading || executionsLoading ? "..." : stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-md ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Recent Flows & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Flows */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 p-6">
            <div>
              <CardTitle>Recent Flows</CardTitle>
              <CardDescription>Your latest automation workflows</CardDescription>
            </div>
            <Link href="/flows">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-all-flows">
                View All
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            {flowsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
                ))}
              </div>
            ) : flows && flows.length > 0 ? (
              flows.slice(0, 3).map((flow) => (
                <Link key={flow.id} href={`/flows/${flow.id}`}>
                  <Card className="p-4 hover-elevate cursor-pointer" data-testid={`flow-card-${flow.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{flow.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{flow.description || "No description"}</p>
                      </div>
                      <div className="ml-4">
                        {flow.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-chart-4">
                            <span className="w-2 h-2 rounded-full bg-chart-4" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Inactive</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <Workflow className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No flows yet</p>
                <Link href="/flows/new">
                  <Button size="sm" variant="outline" data-testid="button-create-first-flow">
                    Create Your First Flow
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 p-6">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest flow executions</CardDescription>
            </div>
            <Link href="/activity">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-all-activity">
                View All
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            {executionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
                ))}
              </div>
            ) : executions && executions.length > 0 ? (
              executions.slice(0, 3).map((execution) => (
                <Card 
                  key={execution.id} 
                  className={`p-4 border-l-4 ${
                    execution.status === "success" ? "border-l-chart-4" : 
                    execution.status === "failed" ? "border-l-destructive" : 
                    "border-l-chart-5"
                  }`}
                  data-testid={`execution-card-${execution.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {execution.triggerType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(execution.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className={`text-xs font-medium ${
                        execution.status === "success" ? "text-chart-4" : 
                        execution.status === "failed" ? "text-destructive" : 
                        "text-chart-5"
                      }`}>
                        {execution.status}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No executions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
