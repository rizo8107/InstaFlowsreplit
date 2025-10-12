import { memo } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  GitBranch, 
  MessageSquare, 
  Mail, 
  Trash2, 
  EyeOff, 
  Heart, 
  Link as LinkIcon, 
  Globe, 
  Clock,
  Bell,
  AtSign,
  Camera,
  X,
  Variable,
  StopCircle
} from "lucide-react";

const iconMap = {
  trigger: Zap,
  condition: GitBranch,
  action: MessageSquare,
};

const actionIconMap = {
  reply_comment: MessageSquare,
  send_dm: Mail,
  delete_comment: Trash2,
  hide_comment: EyeOff,
  like_comment: Heart,
  send_link: LinkIcon,
  api_call: Globe,
  delay: Clock,
  set_variable: Variable,
  stop_flow: StopCircle,
};

const triggerIconMap = {
  comment_received: MessageSquare,
  dm_received: Mail,
  mention_received: AtSign,
  story_reply_received: Camera,
};

export const TriggerNode = memo(({ data, id }: NodeProps) => {
  const { deleteElements } = useReactFlow();
  const TriggerIcon = data.triggerType ? triggerIconMap[data.triggerType as keyof typeof triggerIconMap] || Bell : Bell;
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };
  
  return (
    <Card className="group min-w-[280px] border-l-4 border-l-chart-3 shadow-md hover-elevate">
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-chart-3" />
      <CardHeader className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-chart-3/10 flex items-center justify-center">
              <TriggerIcon className="w-4 h-4 text-chart-3" />
            </div>
            <CardTitle className="text-sm font-semibold">Trigger</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
            onClick={handleDelete}
            data-testid={`button-delete-${id}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {data.triggerType && (
            <Badge variant="secondary" className="text-xs">
              {data.triggerType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Badge>
          )}
          {data.label && <p className="text-xs text-muted-foreground">{data.label}</p>}
        </div>
      </CardContent>
    </Card>
  );
});

TriggerNode.displayName = "TriggerNode";

export const ConditionNode = memo(({ data, id }: NodeProps) => {
  const { deleteElements } = useReactFlow();
  const Icon = iconMap.condition;
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };
  
  return (
    <Card className="group min-w-[280px] border-l-4 border-l-chart-2 shadow-md hover-elevate">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-chart-2" />
      <Handle type="source" position={Position.Bottom} id="true" className="w-3 h-3 bg-chart-2" style={{ left: '33%' }} />
      <Handle type="source" position={Position.Bottom} id="false" className="w-3 h-3 bg-chart-2" style={{ left: '66%' }} />
      <CardHeader className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-chart-2/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-chart-2" />
            </div>
            <CardTitle className="text-sm font-semibold">Condition</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
            onClick={handleDelete}
            data-testid={`button-delete-${id}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {data.logicOperator && (
            <Badge variant="secondary" className="text-xs">
              {data.logicOperator}
            </Badge>
          )}
          {data.conditions && data.conditions.length > 0 && (
            <div className="space-y-1">
              {data.conditions.map((cond: any, idx: number) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  {cond.field} {cond.operator} "{cond.value}"
                </p>
              ))}
            </div>
          )}
          {data.label && <p className="text-xs text-muted-foreground">{data.label}</p>}
        </div>
        
        {/* Branch Labels */}
        <div className="flex justify-between px-2 pt-2 text-[10px] font-medium">
          <span className="text-green-600 dark:text-green-400">TRUE</span>
          <span className="text-red-600 dark:text-red-400">FALSE</span>
        </div>
      </CardContent>
    </Card>
  );
});

ConditionNode.displayName = "ConditionNode";

export const ActionNode = memo(({ data, id }: NodeProps) => {
  const { deleteElements } = useReactFlow();
  const ActionIcon = data.actionType ? actionIconMap[data.actionType as keyof typeof actionIconMap] || MessageSquare : MessageSquare;
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };
  
  return (
    <Card className="group min-w-[280px] border-l-4 border-l-primary shadow-md hover-elevate">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
      <CardHeader className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <ActionIcon className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold">Action</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
            onClick={handleDelete}
            data-testid={`button-delete-${id}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {data.actionType && (
            <Badge variant="secondary" className="text-xs">
              {data.actionType.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Badge>
          )}
          {data.actionConfig?.message && (
            <p className="text-xs text-muted-foreground truncate">{data.actionConfig.message}</p>
          )}
          {data.label && <p className="text-xs text-muted-foreground">{data.label}</p>}
        </div>
      </CardContent>
    </Card>
  );
});

ActionNode.displayName = "ActionNode";

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};
