import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath, useReactFlow } from 'reactflow';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    deleteElements({ edges: [{ id }] });
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-background border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive shadow-sm"
            onClick={onEdgeClick}
            data-testid={`button-delete-edge-${id}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
