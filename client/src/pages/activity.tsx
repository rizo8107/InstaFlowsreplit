import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, CheckCircle, XCircle, Clock, Search, Filter, Webhook } from "lucide-react";
import type { FlowExecution, Flow, WebhookEvent, InstagramAccount } from "@shared/schema";
import { useState } from "react";

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("executions");

  const { data: executions, isLoading: executionsLoading } = useQuery<FlowExecution[]>({
    queryKey: ["/api/executions"],
  });

  const { data: webhookEvents, isLoading: webhooksLoading } = useQuery<WebhookEvent[]>({
    queryKey: ["/api/webhook-events"],
  });

  const { data: flows } = useQuery<Flow[]>({
    queryKey: ["/api/flows"],
  });

  const { data: accounts } = useQuery<InstagramAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const getFlowName = (flowId: string) => {
    return flows?.find(f => f.id === flowId)?.name || "Unknown Flow";
  };

  const getAccountName = (accountId: string) => {
    return accounts?.find(a => a.id === accountId)?.username || "Unknown Account";
  };

  const filteredExecutions = executions?.filter((execution) => {
    const matchesSearch = searchQuery === "" || 
      execution.triggerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFlowName(execution.flowId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWebhookEvents = webhookEvents?.filter((event) => {
    const matchesSearch = searchQuery === "" || 
      event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getAccountName(event.accountId).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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
        <p className="text-sm text-muted-foreground">Track flow executions and incoming webhook events</p>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-activity"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="executions" data-testid="tab-executions">
            <Activity className="w-4 h-4 mr-2" />
            Flow Executions
          </TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">
            <Webhook className="w-4 h-4 mr-2" />
            Webhook Events
          </TabsTrigger>
        </TabsList>

        {/* Flow Executions Tab */}
        <TabsContent value="executions" className="space-y-3">
          {/* Status Filter */}
          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
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

          {/* Executions List */}
          {executionsLoading ? (
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
                  {(execution.executionPath || execution.errorMessage || execution.triggerData?.media_thumbnail) && (
                    <CardContent className="p-4 pt-0 space-y-3">
                      {/* Media Display */}
                      {execution.triggerData?.media_thumbnail && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Media:</p>
                          <div className="flex gap-3">
                            <a 
                              href={execution.triggerData.media_permalink || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <img 
                                src={execution.triggerData.media_thumbnail} 
                                alt="Media thumbnail" 
                                className="w-20 h-20 object-cover rounded border hover:opacity-80 transition-opacity"
                              />
                            </a>
                            <div className="flex-1 min-w-0 space-y-1">
                              {execution.triggerData.is_reel && (
                                <Badge variant="secondary" className="text-xs">
                                  Reel
                                </Badge>
                              )}
                              {execution.triggerData.media_caption && (
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {execution.triggerData.media_caption}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
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
                    {searchQuery || statusFilter !== "all" ? "No matching executions" : "No executions yet"}
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
        </TabsContent>

        {/* Webhook Events Tab */}
        <TabsContent value="webhooks" className="space-y-3">
          {webhooksLoading ? (
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
          ) : filteredWebhookEvents && filteredWebhookEvents.length > 0 ? (
            <div className="space-y-3">
              {filteredWebhookEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className={`border-l-4 ${event.processed ? "border-l-chart-4" : "border-l-chart-5"} hover-elevate`}
                  data-testid={`webhook-event-card-${event.id}`}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1">
                          <Webhook className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {event.eventType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </CardTitle>
                          <CardDescription className="text-sm mt-1">
                            @{getAccountName(event.accountId)}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(event.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={event.processed ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {event.processed ? "Processed" : "Pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  {event.payload && (
                    <CardContent className="p-4 pt-0 space-y-3">
                      {/* Media Display */}
                      {event.payload.media_thumbnail && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Media:</p>
                          <div className="flex gap-3">
                            <a 
                              href={event.payload.media_permalink || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <img 
                                src={event.payload.media_thumbnail} 
                                alt="Media thumbnail" 
                                className="w-20 h-20 object-cover rounded border hover:opacity-80 transition-opacity"
                              />
                            </a>
                            <div className="flex-1 min-w-0 space-y-1">
                              {event.payload.is_reel && (
                                <Badge variant="secondary" className="text-xs">
                                  Reel
                                </Badge>
                              )}
                              {event.payload.media_caption && (
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {event.payload.media_caption}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1">Payload:</p>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Webhook className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "No matching webhook events" : "No webhook events yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? "Try adjusting your search" 
                      : "Webhook events from Instagram will appear here"}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
