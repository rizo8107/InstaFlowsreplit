import { useCallback, useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Play, Settings as SettingsIcon, ChevronUp, ChevronDown, Activity, Pin, PlayCircle } from "lucide-react";
import { nodeTypes } from "@/components/flow-builder/custom-nodes";
import { NodePalette } from "@/components/flow-builder/node-palette";
import { NodeConfigPanel } from "@/components/flow-builder/node-config-panel";
import type { Flow, InstagramAccount } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function FlowBuilder() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNewFlow = id === "new";

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [flowName, setFlowName] = useState("");
  const [flowDescription, setFlowDescription] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [executionsPanelOpen, setExecutionsPanelOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);
  const [pinnedExecution, setPinnedExecution] = useState<any | null>(null);

  const { data: flow, isLoading: flowLoading } = useQuery<Flow>({
    queryKey: [`/api/flows/${id}`],
    enabled: !isNewFlow,
  });

  const { data: accounts } = useQuery<InstagramAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: executions, refetch: refetchExecutions } = useQuery<any[]>({
    queryKey: [`/api/flows/${id}/executions`],
    enabled: !isNewFlow && executionsPanelOpen,
    refetchInterval: executionsPanelOpen ? 5000 : false, // Auto-refresh every 5s when open
  });

  useEffect(() => {
    if (flow) {
      setFlowName(flow.name);
      setFlowDescription(flow.description || "");
      setSelectedAccountId(flow.accountId);
      setIsActive(flow.isActive);
      setNodes(flow.nodes as Node[]);
      setEdges(flow.edges as Edge[]);
    }
  }, [flow, setNodes, setEdges]);

  const testMutation = useMutation({
    mutationFn: async (triggerData: any) => {
      return apiRequest("POST", `/api/flows/${id}/test`, { triggerData });
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/flows/${id}/executions`] });
      refetchExecutions();
      toast({
        title: result.success ? "Test successful" : "Test failed",
        description: result.success 
          ? "Flow executed successfully with pinned data" 
          : `Error: ${result.error}`,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test failed",
        description: error.message || "Failed to test flow",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: flowName,
        description: flowDescription,
        accountId: selectedAccountId,
        isActive,
        nodes,
        edges,
      };

      if (isNewFlow) {
        return apiRequest("POST", "/api/flows", data);
      } else {
        return apiRequest("PATCH", `/api/flows/${id}`, data);
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      toast({
        title: "Flow saved",
        description: "Your flow has been saved successfully.",
      });
      if (isNewFlow && data?.id) {
        navigate(`/flows/${data.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save flow.",
        variant: "destructive",
      });
    },
  });

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#DBDBDB",
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `New ${type}` },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNodeData = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
    
    // Update selectedNode to reflect changes in real-time
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { ...selectedNode.data, ...data }
      });
    }
  };

  const handleSave = () => {
    if (!flowName.trim()) {
      toast({
        title: "Validation Error",
        description: "Flow name is required.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedAccountId) {
      toast({
        title: "Validation Error",
        description: "Please select an Instagram account.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  if (flowLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading flow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/flows")}
            data-testid="button-back-to-flows"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate" data-testid="text-flow-name">
              {flowName || "Untitled Flow"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {nodes.length} nodes • {edges.length} connections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-flow-settings">
                <SettingsIcon className="w-4 h-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Flow Settings</DialogTitle>
                <DialogDescription>
                  Configure your flow details and settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="flow-name">Flow Name</Label>
                  <Input
                    id="flow-name"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="Enter flow name"
                    data-testid="input-flow-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flow-description">Description</Label>
                  <Textarea
                    id="flow-description"
                    value={flowDescription}
                    onChange={(e) => setFlowDescription(e.target.value)}
                    placeholder="Enter flow description"
                    data-testid="input-flow-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-select">Instagram Account</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger id="account-select" data-testid="select-account">
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          @{account.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Flow Status</Label>
                    <p className="text-xs text-muted-foreground">
                      {isActive ? "Flow is active and will execute" : "Flow is inactive"}
                    </p>
                  </div>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsActive(!isActive)}
                    data-testid="button-toggle-active"
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="gap-2"
            data-testid="button-save-flow"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Flow Builder */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          {/* Left Palette */}
          <div className="p-4 border-r">
            <NodePalette onAddNode={addNode} />
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-[#FAFAFA] dark:bg-background relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background color="#DBDBDB" gap={16} />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === "trigger") return "#2196F3";
                  if (node.type === "condition") return "#833AB4";
                  if (node.type === "action") return "#E4405F";
                  return "#666";
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
            </ReactFlow>

            {/* Execution Panel Toggle Button */}
            {!isNewFlow && (
              <div className="absolute bottom-4 left-4 z-10">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setExecutionsPanelOpen(!executionsPanelOpen);
                    if (!executionsPanelOpen) {
                      refetchExecutions();
                    }
                  }}
                  className="gap-2"
                  data-testid="button-toggle-executions"
                >
                  <Activity className="w-4 h-4" />
                  Executions
                  {executionsPanelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>

          {/* Right Config Panel */}
          {selectedNode && (
            <div className="w-80 border-l">
              <NodeConfigPanel
                selectedNode={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={updateNodeData}
                selectedAccount={accounts?.find(a => a.id === selectedAccountId)}
              />
            </div>
          )}
        </div>

        {/* Execution History Panel */}
        {executionsPanelOpen && !isNewFlow && (
          <div className="border-t bg-card">
            <div className="flex h-64">
              {/* Execution List */}
              <div className="w-80 border-r p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">Recent Executions</h3>
                    {pinnedExecution && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Pinned for testing
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {pinnedExecution && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => testMutation.mutate(pinnedExecution.triggerData)}
                        disabled={testMutation.isPending}
                        className="gap-1"
                        data-testid="button-test-flow"
                      >
                        <PlayCircle className="w-3 h-3" />
                        {testMutation.isPending ? "Testing..." : "Test"}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => refetchExecutions()}
                      data-testid="button-refresh-executions"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {executions && executions.length > 0 ? (
                    executions.map((exec: any) => (
                      <Card
                        key={exec.id}
                        className={`cursor-pointer hover-elevate ${
                          selectedExecution?.id === exec.id ? "ring-2 ring-primary" : ""
                        } ${pinnedExecution?.id === exec.id ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() => setSelectedExecution(exec)}
                        data-testid={`execution-${exec.id}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={exec.status === "success" ? "default" : "destructive"}>
                                {exec.status}
                              </Badge>
                              {pinnedExecution?.id === exec.id && (
                                <Pin className="w-3 h-3 text-blue-500 fill-blue-500" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPinnedExecution(pinnedExecution?.id === exec.id ? null : exec);
                                toast({
                                  title: pinnedExecution?.id === exec.id ? "Unpinned" : "Pinned for testing",
                                  description: pinnedExecution?.id === exec.id 
                                    ? "Execution unpinned" 
                                    : "Click Test button to run flow with this data",
                                });
                              }}
                              data-testid={`button-pin-${exec.id}`}
                            >
                              <Pin className={`w-3 h-3 ${pinnedExecution?.id === exec.id ? "fill-blue-500 text-blue-500" : ""}`} />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {exec.triggerType}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(exec.executedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No executions yet. Trigger this flow to see executions here.
                    </p>
                  )}
                </div>
              </div>

              {/* Execution Details */}
              <div className="flex-1 p-4 overflow-y-auto">
                {selectedExecution ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Execution Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          <Badge variant={selectedExecution.status === "success" ? "default" : "destructive"}>
                            {selectedExecution.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trigger:</span>{" "}
                          {selectedExecution.triggerType}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Executed:</span>{" "}
                          {new Date(selectedExecution.executedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Trigger Data</h4>
                      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                        {JSON.stringify(selectedExecution.triggerData, null, 2)}
                      </pre>
                    </div>

                    {selectedExecution.executionPath && selectedExecution.executionPath.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Execution Path</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedExecution.executionPath.map((nodeId: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {nodeId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedExecution.errorMessage && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-destructive">Error</h4>
                        <pre className="bg-destructive/10 text-destructive p-3 rounded-md text-xs overflow-x-auto">
                          {selectedExecution.errorMessage}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select an execution to view details
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
