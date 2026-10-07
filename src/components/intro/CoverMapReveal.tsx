import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "./LoadingScreen";

interface Node {
  id: string;
  label: string;
  href: string;
  color: string;
  x: number;
  y: number;
  description: string;
  icon: string;
  status: string;
}

const nodes: Node[] = [
  {
    id: "office",
    label: "Dr. Verma's Office",
    href: "/game",
    color: "#DC143C",
    x: 0,
    y: -180,
    description: "Crime scene - Last known location",
    icon: "🔴",
    status: "INVESTIGATED",
  },
  {
    id: "research",
    label: "Research Lab",
    href: "/game",
    color: "#FFD700",
    x: 180,
    y: 0,
    description: "Evidence found - Requires analysis",
    icon: "⚠️",
    status: "PENDING",
  },
  {
    id: "archive",
    label: "Archive Room",
    href: "/game",
    color: "#9370DB",
    x: 0,
    y: 180,
    description: "Sealed records - High priority",
    icon: "🔒",
    status: "LOCKED",
  },
  {
    id: "server",
    label: "Server Room",
    href: "/game",
    color: "#00CED1",
    x: -180,
    y: 0,
    description: "Digital footprints detected",
    icon: "💾",
    status: "ACTIVE",
  },
];

export const CoverMapReveal = () => {
  const navigate = useNavigate();
  const linesRef = useRef<(SVGLineElement | null)[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState<Node | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleNodeClick = (node: Node) => {
    setLoadingLocation(node);
    setIsLoading(true);
  };

  const idToRoom = (id: string) => {
    switch (id) {
      case 'office': return 'verma';
      case 'research': return 'research';
      case 'archive': return 'archive';
      case 'server': return 'server';
      default: return undefined;
    }
  };

  if (isLoading && loadingLocation) {
    return <LoadingScreen locationName={loadingLocation.label} locationColor={loadingLocation.color} roomId={idToRoom(loadingLocation.id)} />;
  }

  const safeWindowWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1;
  const safeWindowHeight = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1;

  const parallaxX = (mousePos.x / safeWindowWidth - 0.5) * 20;
  const parallaxY = (mousePos.y / safeWindowHeight - 0.5) * 20;

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a0a] to-[#000000] flex items-center justify-center relative overflow-hidden">
      {/* Custom Cursor */}
      <div
        className="fixed w-6 h-6 pointer-events-none z-50"
        style={{
          left: mousePos.x - 12,
          top: mousePos.y - 12,
        }}
      >
        <div className="w-full h-full rounded-full border-2 border-red-500/60 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-6 bg-red-500/60" />
          <div className="absolute w-6 h-0.5 bg-red-500/60" />
        </div>
      </div>

      {/* Title */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 text-center w-full px-4">
        <div className="mb-2 text-red-400 text-xs font-bold tracking-[0.3em] opacity-90">
          ⚠️ ACTIVE INVESTIGATION ⚠️
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-red-600 tracking-widest drop-shadow-2xl mb-2 font-serif">
          CODE OF SILENCE
        </h1>
        <p className="text-red-200/70 text-xs md:text-sm font-light tracking-[0.2em] opacity-90">
          CASE FILE #2847 • DR. VERMA
        </p>
        <div className="mt-1 text-amber-400/60 text-[10px] tracking-widest">
          TIME: 03:47:22
        </div>
      </div>

      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          transform: `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px)`,
        }}
      >
        <div className="w-full h-full bg-[linear-gradient(rgba(220,20,60,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(220,20,60,0.15)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Floating Particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="particle absolute rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '2px',
            height: '2px',
            backgroundColor: ['#DC143C', '#FFD700', '#FF6347'][Math.floor(Math.random() * 3)],
          }}
        />
      ))}

      {/* Map Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* SVG Lines */}
        <svg className="absolute w-full h-full pointer-events-none">
          <line
            ref={(el) => (linesRef.current[0] = el)}
            x1="50%" y1="50%" x2="50%" y2="calc(50% - 180px)"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          <line
            ref={(el) => (linesRef.current[1] = el)}
            x1="50%" y1="50%" x2="calc(50% + 180px)" y2="50%"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          <line
            ref={(el) => (linesRef.current[2] = el)}
            x1="50%" y1="50%" x2="50%" y2="calc(50% + 180px)"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          <line
            ref={(el) => (linesRef.current[3] = el)}
            x1="50%" y1="50%" x2="calc(50% - 180px)" y2="50%"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC143C" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#FF6347" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#DC143C" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Central Hub */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-32 h-32 border-2 border-red-500/20 rounded-full animate-ping" />
            <div className="absolute w-24 h-24 border border-amber-500/30 rounded-full animate-spin-slow" />

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 via-red-800 to-black flex items-center justify-center shadow-2xl shadow-red-600/50 backdrop-blur-sm border-2 border-red-500/60">
              <div className="text-white font-bold text-xl">🔍</div>
            </div>

            <div className="absolute w-full h-full animate-spin-slow">
              {[0, 90, 180, 270].map((angle, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-amber-400 opacity-60"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${angle}deg) translate(50px) translate(-50%, -50%)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Investigation Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="node absolute z-20 cursor-pointer"
            style={{
              left: `calc(50% + ${node.x}px)`,
              top: `calc(50% + ${node.y}px)`,
              transform: `translate(-50%, -50%)`,
            }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => handleNodeClick(node)}
          >
            <div className="relative flex flex-col items-center">
              {/* Glow Effect */}
              <div
                className="absolute rounded-full transition-all duration-500 pointer-events-none"
                style={{
                  width: '120px',
                  height: '120px',
                  background: `radial-gradient(circle, ${node.color}50, transparent 70%)`,
                  boxShadow: `0 0 50px ${node.color}60`,
                  opacity: hoveredNode === node.id ? 1 : 0.4,
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                }}
              />

              {/* Main Node */}
              <div
                className="relative flex flex-col items-center justify-center rounded-full w-20 h-20 transition-all duration-500 hover:scale-110 backdrop-blur-md border-2"
                style={{
                  background: `linear-gradient(135deg, ${node.color}20, ${node.color}05)`,
                  boxShadow: `
                    0 0 30px ${node.color}80,
                    inset 0 2px 15px rgba(0,0,0,0.5),
                    inset 0 -2px 15px ${node.color}30
                  `,
                  borderColor: node.color,
                }}
              >
                <div className="text-2xl transition-transform hover:scale-110">
                  {node.icon}
                </div>

                {/* Status Dot */}
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 animate-pulse"
                  style={{
                    borderColor: node.color,
                    boxShadow: `0 0 15px ${node.color}`,
                  }}
                />
              </div>

              {/* Label */}
              <div
                className="mt-3 transition-all duration-300"
                style={{
                  transform: hoveredNode === node.id ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div
                  className="bg-black/90 backdrop-blur-xl rounded-lg px-3 py-1.5 border text-center shadow-xl whitespace-nowrap"
                  style={{
                    borderColor: `${node.color}60`,
                    boxShadow: `0 4px 20px ${node.color}30`
                  }}
                >
                  <div className="text-white text-xs font-bold">
                    {node.label}
                  </div>
                  <div className="text-amber-400/80 text-[9px] font-mono mt-0.5">
                    {node.status}
                  </div>
                </div>
              </div>

              {/* Hover Tooltip */}
              {hoveredNode === node.id && (
                <div
                  className="absolute z-50 pointer-events-none"
                  style={{
                    top: node.y < 0 ? 'calc(100% + 20px)' : 'auto',
                    bottom: node.y >= 0 ? 'calc(100% + 20px)' : 'auto',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '200px',
                  }}
                >
                  <div className="bg-gradient-to-br from-black via-red-950/50 to-black backdrop-blur-xl rounded-xl p-3 border-2 border-red-500/40 shadow-2xl">
                    <p className="text-red-200 text-[11px] text-center leading-relaxed mb-2 font-medium">
                      {node.description}
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-amber-400 text-[10px] font-bold">
                      <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                      <span>INVESTIGATE</span>
                      <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-black/70 backdrop-blur-xl rounded-full px-5 py-2.5 border border-red-500/30 shadow-2xl">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-semibold">ACTIVE</span>
            </div>

            <div className="w-px h-3 bg-red-500/30" />

            <div className="flex items-center space-x-1.5">
              <span className="text-amber-400/80">📋</span>
              <span className="text-amber-300 font-medium">{nodes.length} Sites</span>
            </div>

            <div className="w-px h-3 bg-red-500/30" />

            <div className="flex items-center space-x-1.5">
              <span className="text-red-300/80">⏱️</span>
              <span className="text-red-200 font-mono">
                {new Date().toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Right - Detective Info */}
      <div className="absolute top-8 right-8 flex flex-col items-end space-y-2 z-30">
        <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-amber-500/40">
          <span className="text-lg">🕵️</span>
          <div className="text-left">
            <div className="text-amber-400 text-[10px] font-bold">DETECTIVE</div>
            <div className="text-red-300/80 text-[8px] font-mono">ALPHA</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 border border-red-500/30">
          <span className="text-red-400 text-[10px] font-semibold">CLUES:</span>
          <span className="text-amber-400 text-[10px] font-bold">0/12</span>
        </div>
      </div>

      {/* Top Left - Case Notes */}
      <div className="absolute top-8 left-8 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-red-500/30 z-30">
        <div className="flex items-center space-x-2">
          <span className="text-base">📝</span>
          <div>
            <div className="text-red-400 text-[10px] font-bold">CASE NOTES</div>
            <div className="text-amber-400/80 text-[8px] font-mono">PRESS [N]</div>
          </div>
        </div>
      </div>

      {/* Crime Scene Tape */}
      <div className="absolute top-0 left-0 w-full h-12 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-2 left-0 w-full h-8 bg-gradient-to-r from-transparent via-amber-500/15 to-transparent transform -rotate-1">
          <div className="flex items-center justify-center h-full">
            <span className="text-amber-400/50 text-[9px] font-bold tracking-[0.4em]">
              ⚠️ CRIME SCENE • DO NOT CROSS • CRIME SCENE ⚠️
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
