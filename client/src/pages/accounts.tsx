import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Instagram, Trash2, Power, PowerOff, ExternalLink, Webhook, Copy, Check } from "lucide-react";
import type { InstagramAccount } from "@shared/schema";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Accounts() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [newAccount, setNewAccount] = useState({
    username: "",
    instagramUserId: "",
    accessToken: "",
    profilePicture: "",
  });

  // Get webhook URL from current domain
  const webhookUrl = `${window.location.origin}/api/webhooks/instagram`;

  const { data: accounts, isLoading } = useQuery<InstagramAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/accounts", newAccount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account connected",
        description: "Instagram account has been successfully connected.",
      });
      setAddDialogOpen(false);
      setNewAccount({ username: "", instagramUserId: "", accessToken: "", profilePicture: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to connect Instagram account.",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/accounts/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account updated",
        description: "Account status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update account status.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account disconnected",
        description: "Instagram account has been disconnected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect account.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instagram Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage connected Instagram accounts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => (window.location.href = "/api/auth/instagram/start")}
            data-testid="button-instagram-oauth"
          >
            <Instagram className="w-4 h-4" />
            Login with Instagram
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-account">
                <Plus className="w-4 h-4" />
                Connect Account
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Connect Instagram Account</DialogTitle>
              <DialogDescription>
                Enter your Instagram account details and access token from the Meta for Developers console.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Instagram Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-id">Instagram User ID</Label>
                <Input
                  id="user-id"
                  placeholder="1234567890"
                  value={newAccount.instagramUserId}
                  onChange={(e) => setNewAccount({ ...newAccount, instagramUserId: e.target.value })}
                  data-testid="input-user-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="Enter access token"
                  value={newAccount.accessToken}
                  onChange={(e) => setNewAccount({ ...newAccount, accessToken: e.target.value })}
                  data-testid="input-access-token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-picture">Profile Picture URL (Optional)</Label>
                <Input
                  id="profile-picture"
                  placeholder="https://..."
                  value={newAccount.profilePicture}
                  onChange={(e) => setNewAccount({ ...newAccount, profilePicture: e.target.value })}
                  data-testid="input-profile-picture"
                />
              </div>
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!newAccount.username || !newAccount.instagramUserId || !newAccount.accessToken || addMutation.isPending}
                className="w-full"
                data-testid="button-connect"
              >
                {addMutation.isPending ? "Connecting..." : "Connect Account"}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            <CardTitle>Webhook Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure this webhook URL in Meta for Developers to receive Instagram events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
                data-testid="input-webhook-url"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setCopiedWebhook(true);
                  setTimeout(() => setCopiedWebhook(false), 2000);
                  toast({
                    title: "Copied!",
                    description: "Webhook URL copied to clipboard",
                  });
                }}
                data-testid="button-copy-webhook"
              >
                {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Webhook Verify Token</Label>
            <div className="flex gap-2">
              <Input
                value="zenthra"
                readOnly
                className="font-mono text-sm"
                data-testid="input-webhook-token"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText("zenthra");
                  toast({
                    title: "Copied!",
                    description: "Verify token copied to clipboard",
                  });
                }}
                data-testid="button-copy-token"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this token when configuring webhooks in Meta for Developers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Setup Steps:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Deploy your app (click Publish button)</li>
                <li>Copy the webhook URL above</li>
                <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Meta for Developers</a></li>
                <li>Navigate to your app → Products → Webhooks</li>
                <li>Add webhook callback URL (paste URL above)</li>
                <li>Enter verify token: <code className="text-xs bg-muted px-1 py-0.5 rounded">zenthra</code></li>
                <li>Subscribe to events: comments, messages, mentions</li>
                <li>Set app privacy policy & terms URLs (see below)</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Required for Meta App:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Privacy Policy:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={`${window.location.origin}/privacy`}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/privacy`);
                        toast({ title: "Copied!", description: "Privacy policy URL copied" });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-foreground">Terms of Service:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={`${window.location.origin}/terms`}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/terms`);
                        toast({ title: "Copied!", description: "Terms URL copied" });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline">Comments</Badge>
                <Badge variant="outline">Messages</Badge>
                <Badge variant="outline">Mentions</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="hover-elevate" data-testid={`account-card-${account.id}`}>
              <CardHeader className="p-6">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={account.profilePicture || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {account.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">@{account.username}</CardTitle>
                    <CardDescription className="text-xs">
                      ID: {account.instagramUserId}
                    </CardDescription>
                  </div>
                  <Badge variant={account.isActive ? "default" : "secondary"}>
                    {account.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Connected {new Date(account.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(`https://instagram.com/${account.username}`, "_blank")}
                      data-testid={`button-view-profile-${account.id}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleMutation.mutate({ id: account.id, isActive: !account.isActive })}
                      disabled={toggleMutation.isPending}
                      data-testid={`button-toggle-account-${account.id}`}
                    >
                      {account.isActive ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" data-testid={`button-delete-account-${account.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to disconnect @{account.username}? This will also delete all associated flows and data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete-account">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(account.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete-account"
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Instagram className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Instagram account to start automating workflows
              </p>
              <Button className="gap-2" onClick={() => setAddDialogOpen(true)} data-testid="button-connect-first-account">
                <Plus className="w-4 h-4" />
                Connect Account
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
