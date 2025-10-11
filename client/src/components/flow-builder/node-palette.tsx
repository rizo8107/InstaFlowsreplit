import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, GitBranch, MessageSquare } from "lucide-react";

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const nodeTypes = [
    { type: "trigger", label: "Trigger", icon: Zap, color: "text-chart-3" },
    { type: "condition", label: "Condition", icon: GitBranch, color: "text-chart-2" },
    { type: "action", label: "Action", icon: MessageSquare, color: "text-primary" },
  ];

  return (
    <Card className="w-64">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-sm">Add Nodes</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {nodeTypes.map((node) => (
          <Button
            key={node.type}
            variant="outline"
            className="w-full justify-start gap-2 hover-elevate"
            onClick={() => onAddNode(node.type)}
            data-testid={`button-add-${node.type}`}
          >
            <node.icon className={`w-4 h-4 ${node.color}`} />
            <span>{node.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
