import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Workflow, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { Link } from "wouter";
import type { Flow } from "@shared/schema";
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
import { useState } from "react";

export default function Flows() {
  const { toast } = useToast();
  const [deleteFlowId, setDeleteFlowId] = useState<string | null>(null);

  const { data: flows, isLoading } = useQuery<Flow[]>({
    queryKey: ["/api/flows"],
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flows</h1>
          <p className="text-sm text-muted-foreground">Manage your automation workflows</p>
        </div>
        <Link href="/flows/new">
          <Button className="gap-2" data-testid="button-create-flow">
            <Plus className="w-4 h-4" />
            Create Flow
          </Button>
        </Link>
      </div>

      {/* Flows Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse">
              <div className="p-6 space-y-3">
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : flows && flows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Link href="/flows/new">
                <Button className="gap-2" data-testid="button-create-first-flow">
                  <Plus className="w-4 h-4" />
                  Create Flow
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
