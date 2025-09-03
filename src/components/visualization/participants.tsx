import React from 'react';
import { motion } from 'framer-motion';

interface ParticipantsProps {
  points: Array<{
    id: number;
    x: number;
    y: number;
    color: string;
  }>;
  onPointClick?: (id: number) => void;
}

export const Participants: React.FC<ParticipantsProps> = ({ points, onPointClick }) => {
  return (
    <>
      {points.map((point, index) => (
        <motion.g
          key={`point-${point.id}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          onClick={() => onPointClick?.(point.id)}
          style={{ cursor: onPointClick ? 'pointer' : 'default' }}
        >
          <circle
            cx={point.x}
            cy={point.y}
            r={6}
            fill={point.color}
            stroke="white"
            strokeWidth={2}
          />
          <text
            x={point.x}
            y={point.y - 10}
            textAnchor="middle"
            fontSize={12}
            fill={point.color}
            fontWeight="bold"
          >
            {point.id}
          </text>
        </motion.g>
      ))}
    </>
  );
}; 