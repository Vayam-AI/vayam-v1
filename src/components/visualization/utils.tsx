export interface ClusterData {
  'base-clusters': {
    x: number[];
    y: number[];
    id: number[];
  };
  'group-clusters': Array<{
    id: number;
    members: number[];
  }>;
}


export function processClusterData(data: ClusterData) {
  const { 'base-clusters': baseClusters, 'group-clusters': groupClusters } = data;
  
  // Convert string values to numbers
  const processedBaseClusters = {
    x: baseClusters.x.map(Number),
    y: baseClusters.y.map(Number),
    id: baseClusters.id.map(Number)
  };

  return {
    'base-clusters': processedBaseClusters,
    'group-clusters': groupClusters
  };
} 