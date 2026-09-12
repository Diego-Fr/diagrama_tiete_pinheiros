import { Handle, Position } from "@xyflow/react";
import { CENTERED_HANDLE_STYLE } from "@/components/flow/handleStyle";

/**
 * Nó invisível — só um ponto de ancoragem pras pipes/leaders (confluências,
 * o ponto de onde saem os leaders da Traição). Não representa um posto.
 */
export default function AnchorNode() {
  return (
    <div style={{ width: 1, height: 1 }}>
      <Handle
        type="target"
        position={Position.Top}
        style={CENTERED_HANDLE_STYLE}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Top}
        style={CENTERED_HANDLE_STYLE}
        isConnectable={false}
      />
    </div>
  );
}
