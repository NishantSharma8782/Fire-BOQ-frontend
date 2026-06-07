"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Line, Circle, Rect, Text, Group } from "react-konva";
import type { LayoutData, LayoutCoordinate } from "@/lib/types";
import { ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";

interface Props {
  layoutData: LayoutData;
}

const ICON_COLORS: Record<string, string> = {
  smoke: "#3b82f6",
  heat: "#f59e0b",
  mcp: "#ef4444",
  hooter: "#8b5cf6",
  sprinkler: "#06b6d4",
  hydrant: "#10b981",
  extinguisher: "#f97316",
};

// Legend items
const LEGEND = [
  { label: "Smoke Detector", color: ICON_COLORS.smoke, shape: "circle" },
  { label: "Heat Detector", color: ICON_COLORS.heat, shape: "diamond" },
  { label: "MCP", color: ICON_COLORS.mcp, shape: "square" },
  { label: "Hooter", color: ICON_COLORS.hooter, shape: "triangle" },
  { label: "Sprinkler", color: ICON_COLORS.sprinkler, shape: "star" },
  { label: "Hydrant", color: ICON_COLORS.hydrant, shape: "circle" },
  { label: "Extinguisher", color: ICON_COLORS.extinguisher, shape: "square" },
];

function DetectorIcon({ x, y, color, type, label }: {
  x: number; y: number; color: string; type: string; label?: string;
}) {
  const r = 8;
  switch (type) {
    case "square":
      return (
        <Group>
          <Rect x={x - r} y={y - r} width={r * 2} height={r * 2}
            fill={color} opacity={0.85} cornerRadius={2}
            shadowBlur={6} shadowColor={color} shadowOpacity={0.5} />
          {label && <Text x={x - 20} y={y + 10} text={label} fontSize={8} fill="rgba(255,255,255,0.6)" />}
        </Group>
      );
    case "diamond":
      return (
        <Group>
          <Line
            points={[x, y - r, x + r, y, x, y + r, x - r, y, x, y - r]}
            fill={color} opacity={0.85} closed
            shadowBlur={6} shadowColor={color} shadowOpacity={0.5} />
          {label && <Text x={x - 20} y={y + 11} text={label} fontSize={8} fill="rgba(255,255,255,0.6)" />}
        </Group>
      );
    default:
      return (
        <Group>
          <Circle x={x} y={y} radius={r} fill={color} opacity={0.85}
            shadowBlur={8} shadowColor={color} shadowOpacity={0.6} />
          {label && <Text x={x - 20} y={y + 11} text={label} fontSize={8} fill="rgba(255,255,255,0.6)" />}
        </Group>
      );
  }
}

export default function KonvaCanvas({ layoutData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0
      ? Math.min(scale * scaleBy, 5)
      : Math.max(scale / scaleBy, 0.3);
    setScale(newScale);
  }, [scale]);

  const zoomIn = () => setScale(s => Math.min(s * 1.25, 5));
  const zoomOut = () => setScale(s => Math.max(s / 1.25, 0.3));
  const reset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const outline = layoutData.building_outline || [];
  const outlineFlat = outline.flatMap(p => [p.x, p.y]);

  // Center the content
  const offsetX = (stageSize.width - layoutData.canvas_width * scale) / 2;
  const offsetY = (stageSize.height - layoutData.canvas_height * scale) / 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Fire System Layout</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" style={{ padding: "7px 12px" }} onClick={zoomIn}>
            <ZoomIn size={15} />
          </button>
          <button className="btn-secondary" style={{ padding: "7px 12px" }} onClick={zoomOut}>
            <ZoomOut size={15} />
          </button>
          <button className="btn-secondary" style={{ padding: "7px 12px" }} onClick={reset}>
            <RotateCcw size={15} />
          </button>
          <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center", marginLeft: 4 }}>
            Scroll to zoom • Drag to pan
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="canvas-container" style={{ height: 550, position: "relative" }}>
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          scaleX={scale}
          scaleY={scale}
          x={position.x + offsetX * (1 - scale)}
          y={position.y + offsetY * (1 - scale)}
          draggable
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(e) => {
            setIsDragging(false);
            setPosition({ x: e.target.x() - offsetX * (1 - scale), y: e.target.y() - offsetY * (1 - scale) });
          }}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <Layer>
            {/* Grid */}
            {Array.from({ length: 20 }).map((_, i) => (
              <Line key={`vg${i}`} points={[i * 50, 0, i * 50, 650]}
                stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
            ))}
            {Array.from({ length: 15 }).map((_, i) => (
              <Line key={`hg${i}`} points={[0, i * 50, 1000, i * 50]}
                stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
            ))}

            {/* Building Outline */}
            {outlineFlat.length > 0 && (
              <Line
                points={outlineFlat}
                stroke="#ef4444"
                strokeWidth={2}
                fill="rgba(239,68,68,0.04)"
                closed
                shadowBlur={10}
                shadowColor="#ef4444"
                shadowOpacity={0.3}
              />
            )}

            {/* Smoke Detectors */}
            {layoutData.smoke_detectors.map((pt, i) => (
              <DetectorIcon key={`sd${i}`} x={pt.x} y={pt.y}
                color={ICON_COLORS.smoke} type="circle" label={pt.label} />
            ))}

            {/* Heat Detectors */}
            {layoutData.heat_detectors.map((pt, i) => (
              <DetectorIcon key={`hd${i}`} x={pt.x} y={pt.y}
                color={ICON_COLORS.heat} type="diamond" label={pt.label} />
            ))}

            {/* MCP */}
            {layoutData.mcp.map((pt, i) => (
              <DetectorIcon key={`mcp${i}`} x={pt.x} y={pt.y}
                color={ICON_COLORS.mcp} type="square" label={pt.label} />
            ))}

            {/* Hooters */}
            {layoutData.hooters.map((pt, i) => (
              <DetectorIcon key={`ht${i}`} x={pt.x} y={pt.y}
                color={ICON_COLORS.hooter} type="circle" label={pt.label} />
            ))}

            {/* Sprinklers */}
            {layoutData.sprinklers.map((pt, i) => (
              <DetectorIcon key={`sp${i}`} x={pt.x} y={pt.y}
                color={ICON_COLORS.sprinkler} type="circle" label={pt.label} />
            ))}

            {/* Hydrants */}
            {layoutData.hydrants.map((pt, i) => (
              <DetectorIcon key={`hy${i}`} x={pt.x} y={pt.y}
                color={ICON_COLORS.hydrant} type="square" label={pt.label} />
            ))}

            {/* Extinguishers */}
            {layoutData.fire_extinguishers.map((pt, i) => (
              <DetectorIcon key={`ex${i}`} x={pt.x} y={pt.y}
                color={ICON_COLORS.extinguisher} type="diamond" label={pt.label} />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Legend */}
      <div className="glass-card" style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Legend:
        </span>
        {[
          { label: "Smoke Detector", color: ICON_COLORS.smoke },
          { label: "Heat Detector", color: ICON_COLORS.heat },
          { label: "MCP", color: ICON_COLORS.mcp },
          { label: "Hooter", color: ICON_COLORS.hooter },
          { label: "Sprinkler", color: ICON_COLORS.sprinkler },
          { label: "Hydrant", color: ICON_COLORS.hydrant },
          { label: "Extinguisher", color: ICON_COLORS.extinguisher },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, boxShadow: `0 0 6px ${item.color}80` }} />
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
