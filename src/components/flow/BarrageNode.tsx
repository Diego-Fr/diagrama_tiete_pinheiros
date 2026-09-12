import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CENTERED_HANDLE_STYLE } from "@/components/flow/handleStyle";
import { GATE_STATUS_COLORS, gateLabel, gateStatusOf } from "@/lib/gateStatus";

export interface BarrageNodeGate {
  id: string;
  open: boolean;
}

export interface BarrageNodeData extends Record<string, unknown> {
  barrageId: string;
  name: string;
  /** Já resolvidos (dado real da API quando disponível; senão o fallback
   * `gateCount` do posto, todas assumidas abertas — ver `FlowView`). */
  gates: BarrageNodeGate[];
  selected: boolean;
  onSelect: (barrageId: string) => void;
}

export type BarrageNode = Node<BarrageNodeData, "barrage">;

/**
 * Barragem/estrutura de controle — retângulo vertical cruzando o cano
 * (representa a função de barrar a água), com uma listra por comporta,
 * colorida pela situação real (`/sibh/api/v1/dams` — ver `useDamStatus`).
 * Clicável, mas abre uma sidebar diferente da do posto (sem gráfico).
 */
export default function BarrageNode({ data }: NodeProps<BarrageNode>) {
  const { barrageId, name, gates, selected, onSelect } = data;

  return (
    <div className="flow-station-node">
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
      <div
        className={`barrage-node${selected ? " barrage-node--selected" : ""}`}
        title={name}
        onClick={() => onSelect(barrageId)}
        role="button"
        tabIndex={0}
      >
        {gates.map((g) => (
          <span
            key={g.id}
            className="barrage-node__gate"
            title={`${gateLabel(g.id)}: ${g.open ? "aberta" : "fechada"}`}
            style={{ background: GATE_STATUS_COLORS[gateStatusOf(g.open)] }}
          />
        ))}
      </div>
    </div>
  );
}
