import React, { useEffect, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { K8sQuery } from './types';
import { getK8s } from '../../app/api/backend';

export const Panel: React.FC<PanelProps<K8sQuery>> = () => {
  const [cluster, setCluster] = useState<string>("");

  useEffect(() => {
    getK8s().then((res) => {
      setCluster(res.raw);
    });
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <h4>Kubernetes Snapshot</h4>
      <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', maxHeight: 250, overflow: 'auto' }}>
        {cluster.slice(0, 2000)}
      </pre>
    </div>
  );
};
