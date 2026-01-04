import React, { useEffect, useState } from 'react';
import { getIncidents } from '../app/api/backend';
import { Incident } from '../models/Incident';
import { IncidentTimeline } from './IncidentTimeline';
import { RootCausePanel } from './RootCausePanel';
import { ImpactSummary } from './ImpactSummary';

export const IncidentBoard = () => {
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getIncidents();
      setIncident(data);
    };
    load();
  }, []);

  if (!incident) return <div>Loading incident...</div>;

  return (
    <div>
      <h3>{incident.service} Incident</h3>
      <RootCausePanel cause={incident.rootCause} />
      <ImpactSummary impact={incident.impact} />
      <IncidentTimeline events={incident.timeline} />
    </div>
  );
};
