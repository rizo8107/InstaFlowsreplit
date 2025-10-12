import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Zap, GitBranch, MessageSquare, Clock, Send, MessageCircle } from "lucide-react";

interface NodePaletteProps {
  onAddNode: (type: string, preConfig?: any) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const basicNodes = [
    { type: "trigger", label: "Trigger", description: "Start point", icon: Zap, color: "text-chart-3" },
    { type: "condition", label: "If/Else", description: "Branch logic", icon: GitBranch, color: "text-chart-2" },
    { type: "action", label: "Action", description: "Perform task", icon: MessageSquare, color: "text-primary" },
  ];

  const quickActions = [
    { 
      type: "action", 
      label: "Time Delay", 
      icon: Clock, 
      color: "text-blue-500",
      preConfig: { actionType: "delay", actionConfig: { duration: "1000" } }
    },
    { 
      type: "action", 
      label: "Send DM", 
      icon: Send, 
      color: "text-purple-500",
      preConfig: { actionType: "send_dm", actionConfig: { message: "" } }
    },
    { 
      type: "action", 
      label: "Reply Comment", 
      icon: MessageCircle, 
      color: "text-green-500",
      preConfig: { actionType: "reply_comment", actionConfig: { message: "" } }
    },
  ];

  return (
    <Card className="w-64">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-sm">Add Nodes</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-2">Basic Nodes</p>
          {basicNodes.map((node) => (
            <Button
              key={node.type + node.label}
              variant="outline"
              className="w-full justify-start gap-2 hover-elevate"
              onClick={() => onAddNode(node.type)}
              data-testid={`button-add-${node.type}`}
            >
              <node.icon className={`w-4 h-4 ${node.color}`} />
              <div className="flex flex-col items-start flex-1">
                <span className="text-sm">{node.label}</span>
                <span className="text-xs text-muted-foreground">{node.description}</span>
              </div>
            </Button>
          ))}
        </div>

        <Separator />

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</p>
          {quickActions.map((node) => (
            <Button
              key={node.type + node.label}
              variant="outline"
              className="w-full justify-start gap-2 hover-elevate"
              onClick={() => onAddNode(node.type, node.preConfig)}
              data-testid={`button-add-${node.label.toLowerCase().replace(' ', '-')}`}
            >
              <node.icon className={`w-4 h-4 ${node.color}`} />
              <span className="text-sm">{node.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
