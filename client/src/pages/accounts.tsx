import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Instagram, Trash2, Power, PowerOff, ExternalLink, Webhook, Copy, Check, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Accounts() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [webhookToken, setWebhookToken] = useState<string>("");
  const [copiedToken, setCopiedToken] = useState(false);

  // Handle OAuth callback messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success === "true") {
      toast({
        title: "Success!",
        description: "Instagram account connected successfully via OAuth",
      });
      // Clear URL params
      window.history.replaceState({}, '', '/accounts');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: "OAuth authorization was cancelled.",
        not_logged_in: "You must be logged in to connect Instagram.",
        no_code: "No authorization code received from Instagram.",
        config_missing: "Instagram app credentials not configured.",
        token_exchange_failed: "Failed to exchange authorization code for access token.",
        profile_fetch_failed: "Failed to fetch Instagram profile information.",
        connection_failed: "Failed to connect Instagram account. Please try again.",
      };
      toast({
        title: "Connection Failed",
        description: errorMessages[error] || "An unknown error occurred.",
        variant: "destructive",
      });
      // Clear URL params
      window.history.replaceState({}, '', '/accounts');
    }
  }, [location, toast]);
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

  const testWebhookMutation = useMutation({
    mutationFn: async () => {
      setWebhookStatus(null);
      const response = await fetch("/api/webhook-status");
      if (!response.ok) throw new Error("Failed to check webhook status");
      return response.json();
    },
    onSuccess: (data) => {
      setWebhookStatus(data);
      toast({
        title: "Webhook Status Checked",
        description: data.configured 
          ? "Webhooks are properly configured!" 
          : "Webhook setup incomplete - check details below",
        variant: data.configured ? "default" : "destructive",
      });
    },
    onError: () => {
      setWebhookStatus(null);
      toast({
        title: "Error",
        description: "Failed to check webhook status.",
        variant: "destructive",
      });
    },
  });

  const { data: tokenData } = useQuery({
    queryKey: ["/api/webhook-token"],
  });

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/webhook-token/generate", { method: "POST" });
      if (!response.ok) throw new Error("Failed to generate token");
      return response.json();
    },
    onSuccess: (data) => {
      setWebhookToken(data.token);
      toast({
        title: "Token Generated",
        description: "New webhook verify token generated. Click 'Save' to store it.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate token.",
        variant: "destructive",
      });
    },
  });

  const saveTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/webhook-token/set", { token });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhook-token"] });
      toast({
        title: "Token Saved",
        description: "Webhook verify token saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save token.",
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
                Connect your Instagram Business account with one click using OAuth
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* OAuth Button - Primary Method */}
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    window.location.href = "/api/auth/instagram";
                  }}
                  className="w-full gap-2 bg-gradient-to-r from-[#E4405F] to-[#833AB4] hover:from-[#C13584] hover:to-[#6A2C91]"
                  size="lg"
                  data-testid="button-oauth-connect"
                >
                  <Instagram className="w-5 h-5" />
                  Connect with Instagram
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Requires Instagram Business or Creator account linked to a Facebook Page
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or connect manually
                  </span>
                </div>
              </div>

              {/* Manual Form - Advanced Option */}
              <details className="space-y-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Advanced: Manual Configuration
                </summary>
                <div className="space-y-4 pt-2">
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
              </details>
            </div>
          </DialogContent>
        </Dialog>
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
                value={webhookToken || tokenData?.token || ""}
                onChange={(e) => setWebhookToken(e.target.value)}
                type="password"
                placeholder="Enter or generate webhook token"
                className="font-mono text-sm"
                data-testid="input-webhook-token"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const token = webhookToken || tokenData?.token || "";
                  if (token) {
                    navigator.clipboard.writeText(token);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                    toast({
                      title: "Copied!",
                      description: "Webhook token copied to clipboard",
                    });
                  }
                }}
                disabled={!webhookToken && !tokenData?.token}
                data-testid="button-copy-token"
              >
                {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => generateTokenMutation.mutate()}
                disabled={generateTokenMutation.isPending}
                data-testid="button-generate-token"
              >
                <RefreshCw className={`w-4 h-4 ${generateTokenMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => saveTokenMutation.mutate(webhookToken || tokenData?.token || "")}
                disabled={!webhookToken && !tokenData?.token || saveTokenMutation.isPending}
                data-testid="button-save-token"
              >
                {saveTokenMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
            {tokenData?.source && (
              <p className="text-xs text-muted-foreground">
                Current source: {tokenData.source}
                {tokenData.source === 'environment' && ' (from Replit Secrets)'}
                {tokenData.source === 'database' && ' (saved in app)'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Setup Steps:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Deploy your app (click Publish button)</li>
                <li>Copy the webhook URL above</li>
                <li>Go to Meta for Developers console</li>
                <li>Add webhook with verification token</li>
                <li>Subscribe to events (comments, messages, etc.)</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Webhook Events:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Comments</Badge>
                <Badge variant="outline">Messages</Badge>
                <Badge variant="outline">Mentions</Badge>
                <Badge variant="outline">Story Replies</Badge>
              </div>
              <a
                href="/webhook-setup"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                data-testid="link-webhook-guide"
              >
                View detailed setup guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Webhook Status Test */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Connection Status</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testWebhookMutation.mutate()}
                disabled={testWebhookMutation.isPending}
                className="gap-2"
                data-testid="button-test-webhook"
              >
                <RefreshCw className={`w-4 h-4 ${testWebhookMutation.isPending ? 'animate-spin' : ''}`} />
                {testWebhookMutation.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>

            {webhookStatus && (
              <div className="space-y-3" data-testid="webhook-status-results">
                {/* Overall Status */}
                <div 
                  className={`p-3 rounded-lg border ${
                    webhookStatus.configured 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                      : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
                  }`}
                  data-testid={webhookStatus.configured ? "status-configured" : "status-not-configured"}
                >
                  <div className="flex items-start gap-3">
                    {webhookStatus.configured ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground" data-testid="text-webhook-status">
                        {webhookStatus.configured 
                          ? '✓ Webhooks Configured' 
                          : 'Webhook Setup Required'}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid="text-webhook-message">
                        {webhookStatus.message || webhookStatus.note || 'Webhook configuration checked'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Subscriptions */}
                {webhookStatus.accountSubscriptions && webhookStatus.accountSubscriptions.length > 0 && (
                  <div className="space-y-2" data-testid="account-subscriptions">
                    <p className="text-xs font-medium text-muted-foreground">Account-Level Subscriptions:</p>
                    <div className="flex flex-wrap gap-1">
                      {webhookStatus.accountSubscriptions.map((field: string) => (
                        <Badge key={field} variant="secondary" className="text-xs" data-testid={`badge-account-${field}`}>
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* App Subscriptions */}
                {webhookStatus.appSubscriptions && (
                  <div className="space-y-2" data-testid="app-subscriptions">
                    <p className="text-xs font-medium text-muted-foreground">App-Level Subscriptions:</p>
                    <div className="flex flex-wrap gap-1">
                      {webhookStatus.appSubscriptions.fields?.map((field: string) => (
                        <Badge key={field} variant="outline" className="text-xs" data-testid={`badge-app-${field}`}>
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscriptions Array (fallback) */}
                {webhookStatus.subscriptions && webhookStatus.subscriptions.length > 0 && (
                  <div className="space-y-2" data-testid="active-subscriptions">
                    <p className="text-xs font-medium text-muted-foreground">Active Subscriptions:</p>
                    <div className="flex flex-wrap gap-1">
                      {webhookStatus.subscriptions.map((field: string) => (
                        <Badge key={field} variant="default" className="text-xs" data-testid={`badge-subscription-${field}`}>
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {webhookStatus.error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900" data-testid="webhook-error">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400" data-testid="text-error-message">{webhookStatus.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
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
