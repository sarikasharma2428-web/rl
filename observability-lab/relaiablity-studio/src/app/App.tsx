import React from 'react';
import { css } from '@emotion/css';
import { Overview } from './pages/Overview';
import { Incidents } from './pages/Incidents';
import { SLO } from './pages/SLO';

export const App = () => {
  return (
    <div className={container}>
      <h2>Reliability Studio</h2>
      <Overview />
      <Incidents />
      <SLO />
    </div>
  );
};

const container = css`
  padding: 24px;
  color: #e5e7eb;
  background: #0f1115;
`;
