import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Workflow, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Flow, InstagramAccount } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Flows() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [deleteFlowId, setDeleteFlowId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowAccountId, setNewFlowAccountId] = useState("");

  const { data: flows, isLoading } = useQuery<Flow[]>({
    queryKey: ["/api/flows"],
  });

  const { data: accounts } = useQuery<InstagramAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/flows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      toast({
        title: "Flow deleted",
        description: "The flow has been successfully deleted.",
      });
      setDeleteFlowId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flow.",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/flows/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      toast({
        title: "Flow updated",
        description: "The flow status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update flow status.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/flows", {
        name: newFlowName,
        description: "",
        accountId: newFlowAccountId,
        isActive: false,
        nodes: [],
        edges: [],
      }),
    onSuccess: async (response) => {
      const newFlow = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      toast({
        title: "Flow created",
        description: "Your new flow has been created.",
      });
      setCreateDialogOpen(false);
      setNewFlowName("");
      setNewFlowAccountId("");
      navigate(`/flows/${newFlow.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create flow.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a flow name.",
        variant: "destructive",
      });
      return;
    }
    if (!newFlowAccountId) {
      toast({
        title: "Error",
        description: "Please select an Instagram account.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Flows</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage your automation workflows</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => setCreateDialogOpen(true)} data-testid="button-create-flow">
          <Plus className="w-4 h-4" />
          Create Flow
        </Button>
      </div>

      {/* Flows Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse">
              <div className="p-4 sm:p-6 space-y-3">
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : flows && flows.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {flows.map((flow) => (
            <Card key={flow.id} className="hover-elevate" data-testid={`flow-card-${flow.id}`}>
              <CardHeader className="p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{flow.name}</CardTitle>
                    <CardDescription className="text-xs truncate mt-1">
                      {flow.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant={flow.isActive ? "default" : "secondary"} className="shrink-0">
                    {flow.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Workflow className="w-3 h-3" />
                  <span>{flow.nodes.length} nodes</span>
                  <span className="mx-1">•</span>
                  <span>Updated {new Date(flow.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/flows/${flow.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2" data-testid={`button-edit-flow-${flow.id}`}>
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => toggleMutation.mutate({ id: flow.id, isActive: !flow.isActive })}
                    disabled={toggleMutation.isPending}
                    data-testid={`button-toggle-flow-${flow.id}`}
                  >
                    {flow.isActive ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                  <AlertDialog open={deleteFlowId === flow.id} onOpenChange={(open) => !open && setDeleteFlowId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setDeleteFlowId(flow.id)}
                        data-testid={`button-delete-flow-${flow.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Flow</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{flow.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(flow.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid="button-confirm-delete"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Workflow className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No flows yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first automation workflow to get started
              </p>
              <Button className="gap-2" onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-flow">
                <Plus className="w-4 h-4" />
                Create Flow
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Flow Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          setNewFlowName("");
          setNewFlowAccountId("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Flow</DialogTitle>
            <DialogDescription>
              Enter a name for your flow and select the Instagram account to use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Flow Name</Label>
              <Input
                id="flow-name"
                placeholder="e.g., Auto-reply to comments"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                data-testid="input-flow-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">Instagram Account</Label>
              {accounts && accounts.length > 0 ? (
                <Select value={newFlowAccountId} onValueChange={setNewFlowAccountId}>
                  <SelectTrigger id="account" data-testid="select-account">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-muted bg-muted/50 p-4 text-sm">
                  <p className="text-muted-foreground mb-3">
                    You need to add an Instagram account before creating a flow.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      navigate("/accounts");
                    }}
                    data-testid="button-add-account"
                  >
                    Add Instagram Account
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewFlowName("");
                setNewFlowAccountId("");
              }}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFlow}
              disabled={createMutation.isPending || !newFlowName.trim() || !newFlowAccountId}
              data-testid="button-confirm-create"
            >
              {createMutation.isPending ? "Creating..." : "Create Flow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
