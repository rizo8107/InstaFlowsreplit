import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, CheckCircle2, AlertCircle } from "lucide-react";

export default function WebhookSetup() {
  const webhookUrl = `${window.location.origin}/api/webhooks/instagram`;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Webhook className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Webhook Setup Guide</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure Instagram webhooks to receive real-time events and trigger your automation flows
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Your Instagram automation platform uses webhooks to receive real-time events from Instagram and automatically trigger your flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Webhook Endpoint:</h4>
              <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                {webhookUrl}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Deploy Your Application</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Before configuring webhooks, deploy your app so Instagram can reach it
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click the <strong>Publish</strong> button in Replit</li>
                  <li>• Note your published URL (e.g., https://your-app.replit.app)</li>
                  <li>• Your webhook will be at: [your-url]/api/webhooks/instagram</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Configure in Meta for Developers</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Add your webhook URL to your Instagram app
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to Meta for Developers console</li>
                  <li>Select your Instagram app</li>
                  <li>Navigate to Products → Webhooks</li>
                  <li>Click Configure next to Instagram</li>
                  <li>Click Add Callback URL</li>
                </ol>
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Enter these values:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Callback URL:</strong> {webhookUrl}</li>
                    <li>• <strong>Verify Token:</strong> Your INSTAGRAM_WEBHOOK_VERIFY_TOKEN secret</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click <strong>Verify and Save</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Subscribe to Webhook Fields</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  After verification, subscribe to these event types:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">comments</Badge>
                  <Badge variant="outline">messages</Badge>
                  <Badge variant="outline">mentions</Badge>
                  <Badge variant="outline">story_insights</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click <strong>Subscribe</strong> for each field you want to monitor
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Test Your Webhook</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Verify everything is working correctly:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Create and activate a flow in your app</li>
                  <li>Perform the trigger action on Instagram (e.g., post a comment)</li>
                  <li>Check the Activity page to see if the flow executed</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Event Flow:</h4>
              <ol className="space-y-2">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    User interacts with your Instagram (comment, DM, mention, etc.)
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Instagram sends webhook event → Your /api/webhooks/instagram endpoint
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    System finds active flows matching the event type and account
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Flow engine executes the flow (evaluates conditions, executes actions)
                  </span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    Execution logged in Activity page with success/failure status
                  </span>
                </li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">Supported Events:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-md">
                  <Badge className="mb-1">comment_received</Badge>
                  <p className="text-xs text-muted-foreground">New comment on your posts</p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <Badge className="mb-1">dm_received</Badge>
                  <p className="text-xs text-muted-foreground">New direct message</p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <Badge className="mb-1">mention_received</Badge>
                  <p className="text-xs text-muted-foreground">Mentioned in a post/story</p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <Badge className="mb-1">story_reply_received</Badge>
                  <p className="text-xs text-muted-foreground">Reply to your story</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h4 className="font-medium">Webhook not receiving events?</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Check your app is deployed and publicly accessible</li>
                <li>• Verify callback URL matches exactly (including https://)</li>
                <li>• Ensure verify token matches your environment secret</li>
                <li>• Check webhook subscriptions are active in Meta dashboard</li>
                <li>• Verify Instagram account is connected and active</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h4 className="font-medium">Flows not executing?</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Ensure flow is Active (toggle on in Flows page)</li>
                <li>• Check trigger type matches the event (e.g., comment flow for comments)</li>
                <li>• Verify account is active and has valid access token</li>
                <li>• Check Activity page for execution errors</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h4 className="font-medium">Actions not working?</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Verify Instagram access token has required permissions</li>
                <li>• Check Instagram API rate limits</li>
                <li>• Review execution error messages in Activity page</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Required secrets for webhooks:
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-md">
              <code className="text-sm font-mono">INSTAGRAM_APP_ID</code>
              <p className="text-xs text-muted-foreground mt-1">Your Facebook App ID</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <code className="text-sm font-mono">INSTAGRAM_APP_SECRET</code>
              <p className="text-xs text-muted-foreground mt-1">Your App Secret</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <code className="text-sm font-mono">INSTAGRAM_WEBHOOK_VERIFY_TOKEN</code>
              <p className="text-xs text-muted-foreground mt-1">Custom token for verification (set this yourself)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Local Development */}
      <Card>
        <CardHeader>
          <CardTitle>Local Development</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            For local development, use ngrok to expose your local server:
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Install ngrok:</p>
              <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                npm install -g ngrok
              </code>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Expose port 5000:</p>
              <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                ngrok http 5000
              </code>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Use the ngrok URL as your callback URL (e.g., https://abc123.ngrok.io/api/webhooks/instagram)
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Note:</strong> Remember to update the callback URL in Meta dashboard when switching between local/deployed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
