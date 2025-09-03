'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Hull } from './hull';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Info, ChevronRight } from 'lucide-react';

interface ClusterVisualizationProps {
  onClusterSelect?: (clusterId: number | null) => void;
  groupClusters: any[];
  baseClusters: {
    x: number[];
    y: number[];
    id: number[];
  };
  currentUserId?: number | null;
}

interface GroupCluster {
  id: number;
  members: number[];
}

interface HullData {
  points: [number, number][];
  color: string;
}

const ClusterVisualization: React.FC<ClusterVisualizationProps> = ({ onClusterSelect, groupClusters, baseClusters, currentUserId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Validate base clusters
  if (!baseClusters.x || !baseClusters.y || !baseClusters.id) {
    return <div>Missing base cluster data</div>;
  }

  // Ensure all arrays have the same length
  if (!(baseClusters.x.length === baseClusters.y.length && baseClusters.y.length === baseClusters.id.length)) {
    return <div>Inconsistent data lengths</div>;
  }

  // Create scales with safe fallbacks
  const xValues: number[] = baseClusters.x.map(Number).filter((x: number) => !isNaN(x));
  const yValues: number[] = baseClusters.y.map(Number).filter((y: number) => !isNaN(y));

  if (xValues.length === 0 || yValues.length === 0) {
    return <div>No valid numeric data</div>;
  }

  const xScale = d3.scaleLinear()
    .domain([d3.min(xValues) || 0, d3.max(xValues) || 0])
    .range([50, dimensions.width - 50]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(yValues) || 0, d3.max(yValues) || 0])
    .range([dimensions.height - 50, 50]);

  // Generate hulls for each cluster with validation
  const hulls = groupClusters
    .filter((cluster: any) => Array.isArray(cluster.members))
    .map((cluster: any, index: number) => {
      const points: [number, number][] = cluster.members
        .map((memberId: number) => {
          const idx = baseClusters.id.indexOf(memberId);
          if (idx === -1) return null;
          const x: number = Number(baseClusters.x[idx]);
          const y: number = Number(baseClusters.y[idx]);
          if (isNaN(x) || isNaN(y)) return null;
          return [xScale(x), yScale(y)] as [number, number];
        })
        .filter((point: [number, number] | null): point is [number, number] => point !== null);
      return {
        points,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      };
    })
    .filter((hull: HullData) => hull.points.length > 0);

  const handleClusterClick = (index: number) => {
    setSelectedCluster(index);
    setShowDetails(true);
    onClusterSelect?.(index);
  };

  return (
    <div className="w-full h-full min-h-[600px] relative">
      <div className="absolute top-4 right-4 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-help bg-white/80 backdrop-blur-sm">
                <Info className="h-4 w-4 mr-1" />
                Hover over clusters to see details
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click on a cluster to view detailed information</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl shadow-2xl p-8 flex items-center justify-center relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Secondary Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #94a3b8 1px, transparent 1px),
              linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
            `,
            backgroundSize: '200px 200px'
          }} />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50" />

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="overflow-visible rounded-lg relative z-10"
          style={{ overflow: 'visible' }}
        >
          {/* Draw grid lines */}
          <g className="grid-lines">
            {Array.from({ length: Math.ceil(dimensions.width / 40) }).map((_, i) => (
              <line
                key={`vertical-${i}`}
                x1={i * 40}
                y1={0}
                x2={i * 40}
                y2={dimensions.height}
                stroke="#e2e8f0"
                strokeWidth="0.5"
                strokeOpacity="0.2"
              />
            ))}
            {Array.from({ length: Math.ceil(dimensions.height / 40) }).map((_, i) => (
              <line
                key={`horizontal-${i}`}
                x1={0}
                y1={i * 40}
                x2={dimensions.width}
                y2={i * 40}
                stroke="#e2e8f0"
                strokeWidth="0.5"
                strokeOpacity="0.2"
              />
            ))}
          </g>

          {/* Draw hulls */}
          {hulls.map((hull: HullData, index: number) => {
            const cluster = groupClusters[index];
            const points = hull.points;
            const center = points.length > 0 ? points.reduce((acc, p) => [acc[0]+p[0], acc[1]+p[1]], [0,0]).map(v => v/points.length) : [0,0];
            const hullPolygon = points.length > 2 ? d3.polygonHull(points) : points;
            
            return (
              <g key={`hull-group-${index}`}
                className="group cursor-pointer"
                onClick={() => handleClusterClick(index)}
              >
                {/* Transparent polygon for hover area */}
                {hullPolygon && (
                  <polygon
                    points={hullPolygon.map((p: [number, number]) => p.join(",")).join(" ")}
                    fill="transparent"
                    style={{ pointerEvents: 'all' }}
                    onMouseEnter={e => {
                      setHoveredCluster(index);
                      setTooltipPos({ x: center[0], y: center[1] });
                    }}
                    onMouseLeave={() => setHoveredCluster(null)}
                  />
                )}
                <Hull
                  points={hull.points}
                  color={hull.color}
                />
                {/* Animate border on hover */}
                <motion.path
                  d={(() => {
                    const line = d3.line()
                      .x((d: [number, number]) => d[0])
                      .y((d: [number, number]) => d[1])
                      .curve(d3.curveLinearClosed);
                    const dVal = hull.points.length > 2 ? line(d3.polygonHull(hull.points) as [number, number][]) : '';
                    return dVal || '';
                  })()}
                  fill="none"
                  stroke={hull.color}
                  strokeWidth={8}
                  strokeOpacity={0.1}
                  className="group-hover:stroke-opacity-40 transition-all duration-300"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.2, type: 'spring' }}
                />
                {/* Inner glow effect */}
                <motion.path
                  d={(() => {
                    const line = d3.line()
                      .x((d: [number, number]) => d[0])
                      .y((d: [number, number]) => d[1])
                      .curve(d3.curveLinearClosed);
                    const dVal = hull.points.length > 2 ? line(d3.polygonHull(hull.points) as [number, number][]) : '';
                    return dVal || '';
                  })()}
                  fill="none"
                  stroke={hull.color}
                  strokeWidth={4}
                  strokeOpacity={0.2}
                  className="group-hover:stroke-opacity-60 transition-all duration-300"
                  filter="url(#glow)"
                />
              </g>
            );
          })}

          {/* Draw points */}
          {baseClusters.id.map((id: number, index: number) => {
            const x = Number(baseClusters.x[index]);
            const y = Number(baseClusters.y[index]);
            if (isNaN(x) || isNaN(y)) return null;
            const cluster = groupClusters.find((c: any) => c.members.includes(id));
            const color = cluster
              ? `hsl(${(groupClusters.indexOf(cluster) * 137.5) % 360}, 70%, 50%)`
              : '#666';

            const isCurrentUser = currentUserId === id;

            return (
              <motion.g
                key={`point-${id}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {isCurrentUser && (
                  <motion.circle
                    cx={xScale(x)}
                    cy={yScale(y)}
                    r={24}
                    fill="#FFD700"
                    stroke="#FFD700"
                    strokeWidth={2}
                    style={{ filter: 'drop-shadow(0 0 20px #FFD700)' }}
                    animate={{
                      opacity: [0.7, 0.2, 0.7],
                      scale: [1, 1.25, 1],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                <circle
                  cx={xScale(x)}
                  cy={yScale(y)}
                  r={isCurrentUser ? 14 : 8}
                  fill={isCurrentUser ? '#FFD700' : color}
                  stroke={isCurrentUser ? '#222' : 'white'}
                  strokeWidth={isCurrentUser ? 4 : 2}
                  style={{ 
                    filter: isCurrentUser 
                      ? 'drop-shadow(0 0 12px #FFD700)' 
                      : 'drop-shadow(0 0 8px rgba(0,0,0,0.1))'
                  }}
                />
                {isCurrentUser && (
                  <text
                    x={xScale(x)}
                    y={yScale(y) - 24}
                    textAnchor="middle"
                    fontSize={18}
                    fill="#222"
                    fontWeight="bold"
                    style={{ 
                      textShadow: '0 0 12px #FFD700',
                      filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.2))'
                    }}
                  >
                    {id}
                  </text>
                )}
              </motion.g>
            );
          })}

          {/* Tooltip for hovered cluster */}
          <AnimatePresence>
            {hoveredCluster !== null && tooltipPos && (
              (() => {
                // Tooltip size
                const tooltipWidth = 180;
                const tooltipHeight = 60;
                const margin = 12;
                let x = tooltipPos.x - tooltipWidth / 2;
                let y = tooltipPos.y - tooltipHeight - 18;
                // Auto-flip below if too close to top
                if (y < margin) y = tooltipPos.y + 18;
                // Clamp to left/right edges
                if (x < margin) x = margin;
                if (x + tooltipWidth > dimensions.width - margin) x = dimensions.width - tooltipWidth - margin;
                // Clamp to bottom edge
                if (y + tooltipHeight > dimensions.height - margin) y = dimensions.height - tooltipHeight - margin;
                return (
                  <foreignObject
                    x={x}
                    y={y}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    style={{ pointerEvents: 'none', overflow: 'visible' }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl shadow-lg px-6 py-4 text-base text-blue-800 font-semibold text-center flex flex-col items-center justify-center"
                      style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)' }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span className="font-bold text-xs text-blue-700">{groupClusters[hoveredCluster]?.members.length} users in this cluster</span>
                      </div>
                    </motion.div>
                  </foreignObject>
                );
              })()
            )}
          </AnimatePresence>

          {/* SVG Filters for Glow Effects */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Cluster Details Panel */}
      <AnimatePresence>
        {showDetails && selectedCluster !== null && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-sm shadow-2xl rounded-l-2xl overflow-hidden border-l border-blue-100"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Cluster Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">
                    {groupClusters[selectedCluster]?.members.length} Members
                  </span>
                </div>
                
                <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                  <div className="space-y-2">
                    {groupClusters[selectedCluster]?.members.map((memberId: number) => (
                      <motion.div
                        key={memberId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 font-semibold">
                          {memberId}
                        </div>
                        <span className="text-sm font-medium">User {memberId}</span>
                        {memberId === currentUserId && (
                          <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600">
                            You
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClusterVisualization; 