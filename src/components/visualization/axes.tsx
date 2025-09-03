import React from 'react';
import * as d3 from 'd3';

interface AxesProps {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
}

export const Axes: React.FC<AxesProps> = ({ xScale, yScale, width, height }) => {
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  return (
    <g>
      <g
        transform={`translate(0, ${height - 50})`}
        ref={(node) => {
          if (node) d3.select(node).call(xAxis);
        }}
      />
      <g
        transform="translate(50, 0)"
        ref={(node) => {
          if (node) d3.select(node).call(yAxis);
        }}
      />
    </g>
  );
}; 