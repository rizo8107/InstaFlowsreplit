import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InstagramAccount } from "@shared/schema";

interface NodeConfigPanelProps {
  selectedNode: any;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
  selectedAccount?: InstagramAccount;
}

export function NodeConfigPanel({ selectedNode, onClose, onUpdate, selectedAccount }: NodeConfigPanelProps) {
  if (!selectedNode) return null;

  const handleUpdate = (updates: any) => {
    onUpdate(selectedNode.id, { ...selectedNode.data, ...updates });
  };

  const addCondition = () => {
    const conditions = selectedNode.data.conditions || [];
    handleUpdate({
      conditions: [...conditions, { field: "", operator: "contains", value: "" }],
    });
  };

  const updateCondition = (index: number, updates: any) => {
    const conditions = [...(selectedNode.data.conditions || [])];
    conditions[index] = { ...conditions[index], ...updates };
    handleUpdate({ conditions });
  };

  const removeCondition = (index: number) => {
    const conditions = selectedNode.data.conditions.filter((_: any, i: number) => i !== index);
    handleUpdate({ conditions });
  };

  return (
    <Card className="w-80 h-full border-l shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 border-b">
        <div>
          <CardTitle className="text-base">Node Configuration</CardTitle>
          <CardDescription className="text-xs">
            {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Node
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-config">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4 overflow-auto">
        {/* Trigger Configuration */}
        {selectedNode.type === "trigger" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="trigger-type">Trigger Type</Label>
              <Select
                value={selectedNode.data.triggerType || ""}
                onValueChange={(value) => handleUpdate({ triggerType: value })}
              >
                <SelectTrigger id="trigger-type" data-testid="select-trigger-type">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comment_received">Comment Received</SelectItem>
                  <SelectItem value="dm_received">DM Received</SelectItem>
                  <SelectItem value="mention_received">Mention Received</SelectItem>
                  <SelectItem value="story_reply_received">Story Reply Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trigger-label">Label (Optional)</Label>
              <Input
                id="trigger-label"
                placeholder="Add a description..."
                value={selectedNode.data.label || ""}
                onChange={(e) => handleUpdate({ label: e.target.value })}
                data-testid="input-trigger-label"
              />
            </div>

            {/* Trigger Validation Status */}
            {selectedNode.data.triggerType ? (
              selectedAccount?.isActive ? (
                <Alert className="border-chart-4 bg-chart-4/10" data-testid="alert-trigger-configured">
                  <CheckCircle className="h-4 w-4 text-chart-4" />
                  <AlertDescription className="text-sm ml-2">
                    Trigger configured correctly. Ready to receive <strong>{selectedNode.data.triggerType.replace(/_/g, " ")}</strong> events from <strong>@{selectedAccount.username}</strong>.
                  </AlertDescription>
                </Alert>
              ) : selectedAccount ? (
                <Alert variant="destructive" data-testid="alert-account-inactive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm ml-2">
                    Account is inactive. Go to Flow Settings and activate the account to start receiving events.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive" data-testid="alert-no-account">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm ml-2">
                    No Instagram account selected. Go to Flow Settings to select an account.
                  </AlertDescription>
                </Alert>
              )
            ) : (
              <Alert data-testid="alert-no-trigger-type">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm ml-2">
                  Select a trigger type to activate this trigger node.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Condition Configuration */}
        {selectedNode.type === "condition" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="logic-operator">Logic Operator</Label>
              <Select
                value={selectedNode.data.logicOperator || "AND"}
                onValueChange={(value) => handleUpdate({ logicOperator: value })}
              >
                <SelectTrigger id="logic-operator" data-testid="select-logic-operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                <Button size="sm" variant="outline" onClick={addCondition} data-testid="button-add-condition">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {(selectedNode.data.conditions || []).map((condition: any, index: number) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="Field (e.g., message_text)"
                        value={condition.field}
                        onChange={(e) => updateCondition(index, { field: e.target.value })}
                        data-testid={`input-condition-field-${index}`}
                      />
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(index, { operator: value })}
                      >
                        <SelectTrigger data-testid={`select-condition-operator-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="regex">Regex</SelectItem>
                          <SelectItem value="not_contains">Not Contains</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Value"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          className="flex-1"
                          data-testid={`input-condition-value-${index}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCondition(index)}
                          data-testid={`button-remove-condition-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition-label">Label (Optional)</Label>
              <Input
                id="condition-label"
                placeholder="Add a description..."
                value={selectedNode.data.label || ""}
                onChange={(e) => handleUpdate({ label: e.target.value })}
                data-testid="input-condition-label"
              />
            </div>
          </>
        )}

        {/* Action Configuration */}
        {selectedNode.type === "action" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="action-type">Action Type</Label>
              <Select
                value={selectedNode.data.actionType || ""}
                onValueChange={(value) => handleUpdate({ actionType: value, actionConfig: {} })}
              >
                <SelectTrigger id="action-type" data-testid="select-action-type">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reply_comment">Reply to Comment</SelectItem>
                  <SelectItem value="send_dm">Send DM</SelectItem>
                  <SelectItem value="delete_comment">Delete Comment</SelectItem>
                  <SelectItem value="hide_comment">Hide Comment</SelectItem>
                  <SelectItem value="like_comment">Like Comment</SelectItem>
                  <SelectItem value="send_link">Send Link</SelectItem>
                  <SelectItem value="api_call">API Call</SelectItem>
                  <SelectItem value="delay">Delay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action-specific fields */}
            {(selectedNode.data.actionType === "reply_comment" || selectedNode.data.actionType === "send_dm") && (
              <div className="space-y-2">
                <Label htmlFor="action-message">Message</Label>
                <Textarea
                  id="action-message"
                  placeholder="Enter your message..."
                  value={selectedNode.data.actionConfig?.message || ""}
                  onChange={(e) => handleUpdate({ 
                    actionConfig: { ...selectedNode.data.actionConfig, message: e.target.value }
                  })}
                  data-testid="input-action-message"
                />
                <p className="text-xs text-muted-foreground">
                  Use variables: {"{username}"}, {"{message_text}"}
                </p>
              </div>
            )}

            {selectedNode.data.actionType === "send_link" && (
              <div className="space-y-2">
                <Label htmlFor="action-url">URL</Label>
                <Input
                  id="action-url"
                  type="url"
                  placeholder="https://example.com"
                  value={selectedNode.data.actionConfig?.url || ""}
                  onChange={(e) => handleUpdate({ 
                    actionConfig: { ...selectedNode.data.actionConfig, url: e.target.value }
                  })}
                  data-testid="input-action-url"
                />
              </div>
            )}

            {selectedNode.data.actionType === "delay" && (
              <div className="space-y-2">
                <Label htmlFor="action-delay">Delay (seconds)</Label>
                <Input
                  id="action-delay"
                  type="number"
                  placeholder="60"
                  value={selectedNode.data.actionConfig?.seconds || ""}
                  onChange={(e) => handleUpdate({ 
                    actionConfig: { ...selectedNode.data.actionConfig, seconds: e.target.value }
                  })}
                  data-testid="input-action-delay"
                />
              </div>
            )}

            {selectedNode.data.actionType === "api_call" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="action-endpoint">Endpoint URL</Label>
                  <Input
                    id="action-endpoint"
                    type="url"
                    placeholder="https://api.example.com/endpoint"
                    value={selectedNode.data.actionConfig?.endpoint || ""}
                    onChange={(e) => handleUpdate({ 
                      actionConfig: { ...selectedNode.data.actionConfig, endpoint: e.target.value }
                    })}
                    data-testid="input-action-endpoint"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action-method">HTTP Method</Label>
                  <Select
                    value={selectedNode.data.actionConfig?.method || "POST"}
                    onValueChange={(value) => handleUpdate({ 
                      actionConfig: { ...selectedNode.data.actionConfig, method: value }
                    })}
                  >
                    <SelectTrigger id="action-method" data-testid="select-action-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="action-label">Label (Optional)</Label>
              <Input
                id="action-label"
                placeholder="Add a description..."
                value={selectedNode.data.label || ""}
                onChange={(e) => handleUpdate({ label: e.target.value })}
                data-testid="input-action-label"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
