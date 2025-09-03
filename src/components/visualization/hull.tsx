import React from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface HullProps {
  points: Array<[number, number]>;
  color: string;
  opacity?: number;
}

export const Hull: React.FC<HullProps> = ({ points, color, opacity = 0.1 }) => {
  // Use d3.polygonHull to get the border points
  const hullPoints = points.length > 2 ? d3.polygonHull(points) : points;
  const line = d3.line()
    .x((d: [number, number]) => d[0])
    .y((d: [number, number]) => d[1])
    .curve(d3.curveLinearClosed);
  const pathString = hullPoints && line(hullPoints as [number, number][]) ? line(hullPoints as [number, number][])! : '';

  return (
    <motion.path
      d={pathString}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeDasharray="6 4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}; 