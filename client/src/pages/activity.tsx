import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import type { FlowExecution, Flow } from "@shared/schema";
import { useState } from "react";

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: executions, isLoading } = useQuery<FlowExecution[]>({
    queryKey: ["/api/executions"],
  });

  const { data: flows } = useQuery<Flow[]>({
    queryKey: ["/api/flows"],
  });

  const getFlowName = (flowId: string) => {
    return flows?.find(f => f.id === flowId)?.name || "Unknown Flow";
  };

  const filteredExecutions = executions?.filter((execution) => {
    const matchesSearch = searchQuery === "" || 
      execution.triggerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFlowName(execution.flowId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-chart-4" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "running":
        return <Clock className="w-4 h-4 text-chart-5" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-l-chart-4";
      case "failed":
        return "border-l-destructive";
      case "running":
        return "border-l-chart-5";
      default:
        return "border-l-border";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground">Track all flow executions and their results</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search executions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-executions"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Executions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredExecutions && filteredExecutions.length > 0 ? (
        <div className="space-y-3">
          {filteredExecutions.map((execution) => (
            <Card 
              key={execution.id} 
              className={`border-l-4 ${getStatusColor(execution.status)} hover-elevate`}
              data-testid={`execution-card-${execution.id}`}
            >
              <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1">
                      {getStatusIcon(execution.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {getFlowName(execution.flowId)}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {execution.triggerType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(execution.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      execution.status === "success" ? "default" : 
                      execution.status === "failed" ? "destructive" : 
                      "secondary"
                    }
                    className="shrink-0"
                  >
                    {execution.status}
                  </Badge>
                </div>
              </CardHeader>
              {(execution.executionPath || execution.errorMessage) && (
                <CardContent className="p-4 pt-0 space-y-2">
                  {execution.executionPath && execution.executionPath.length > 0 && (
                    <div className="text-xs">
                      <p className="text-muted-foreground mb-1">Execution Path:</p>
                      <div className="flex flex-wrap gap-1">
                        {execution.executionPath.map((nodeId, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {nodeId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {execution.errorMessage && (
                    <div className="text-xs">
                      <p className="text-muted-foreground mb-1">Error:</p>
                      <p className="text-destructive">{execution.errorMessage}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Activity className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || statusFilter !== "all" ? "No matching executions" : "No activity yet"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Flow executions will appear here once they run"}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
