import React, { useState } from 'react';
import { css, cx } from '@emotion/css';

/**
 * Reliability Studio - UI Frame / Design Shell
 * A pure engineering layout for SRE control panels.
 */

const theme = {
  bg: '#0d0e12',
  surface: '#16191d',
  surfaceHeader: '#1c1f24',
  border: '#2a2d33',
  text: '#d1d2d3',
  textMuted: '#8b8e92',
  healthy: '#4caf50',
  warning: '#ff9800',
  critical: '#f44336',
  fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  monoFont: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
};

// --- Structural Components ---

const Header = () => (
  <header className={styles.header}>
    <div className={styles.flexCenter}>
      <span className={styles.brand}>Reliability Studio</span>
      <span className={styles.divider}>|</span>
      <span className={styles.metaItem}>Env: <span className={styles.metaHigh}>Production</span></span>
      <span className={styles.divider}>|</span>
      <span className={styles.metaItem}>Last Update: <span className={styles.metaHigh}>-- : -- UTC</span></span>
    </div>
    <div className={styles.metaItem} style={{ cursor: 'pointer', opacity: 0.6 }}>•••</div>
  </header>
);

const KPIGrid = () => (
  <div className={styles.kpiGrid}>
    <div className={styles.kpiBox}>
      <span className={styles.kpiLabel}>SLO</span>
      <span className={cx(styles.kpiValue, styles.textHealthy)}>--%</span>
    </div>
    <div className={styles.kpiBox}>
      <span className={styles.kpiLabel}>Error Rate</span>
      <span className={cx(styles.kpiValue, styles.textWarning)}>--%</span>
    </div>
    <div className={styles.kpiBox}>
      <span className={styles.kpiLabel}>Failed Pods</span>
      <span className={cx(styles.kpiValue, styles.textCritical)}>--</span>
    </div>
    <div className={styles.kpiBox}>
      <span className={styles.kpiLabel}>Open Incidents</span>
      <span className={cx(styles.kpiValue, styles.textCritical)}>--</span>
    </div>
  </div>
);

const MainBoard = () => (
  <div className={styles.mainBoard}>
    {/* Left Column: List */}
    <div className={styles.panel}>
      <div className={styles.panelHeader}>Active Incidents</div>
      <div className={styles.emptyContent}>
        <span className={styles.textMuted}>Waiting for incident data...</span>
      </div>
    </div>

    {/* Right Column: Details & Timeline */}
    <div className={styles.rightColumn}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>Incident Details</div>
        <div className={styles.emptyContent} style={{ minHeight: '120px' }}>
          <span className={styles.textMuted}>Select an incident to view details</span>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>Incident Timeline</div>
        <div className={styles.emptyContent} style={{ minHeight: '150px' }}>
          <span className={styles.textMuted}>No events recorded</span>
        </div>
      </div>
    </div>
  </div>
);

const TelemetryConsole = () => {
  const [activeTab, setActiveTab] = useState('Metrics');
  const tabs = ['Metrics', 'Logs', 'Traces', 'Kubernetes'];

  return (
    <div className={styles.panel}>
      <div className={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={cx(styles.tabBtn, activeTab === tab && styles.tabActive)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={styles.consoleBody}>
        <div className={styles.consolePlaceholder}>
          <div className={styles.cursor} />
          <span className={styles.textMuted}>No raw {activeTab.toLowerCase()} telemetry detected in the current context.</span>
        </div>
      </div>
    </div>
  );
};

// --- App Entry ---

export const App = () => {
  return (
    <div className={styles.appContainer}>
      <Header />
      <div className={styles.contentWrapper}>
        <KPIGrid />
        <MainBoard />
        <TelemetryConsole />
      </div>
    </div>
  );
};

// --- Stylesheet ---

const styles = {
  appContainer: css`
    background-color: ${theme.bg};
    color: ${theme.text};
    font-family: ${theme.fontFamily};
    min-height: 100vh;
    font-size: 13px;
    letter-spacing: -0.01em;
  `,
  header: css`
    height: 44px;
    background-color: ${theme.surfaceHeader};
    border-bottom: 1px solid ${theme.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  `,
  flexCenter: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  brand: css`
    font-weight: 700;
    color: #fff;
    font-size: 15px;
  `,
  divider: css`
    color: ${theme.border};
    font-weight: 300;
  `,
  metaItem: css`
    font-size: 11px;
    color: ${theme.textMuted};
    text-transform: uppercase;
    font-weight: 500;
  `,
  metaHigh: css`
    color: ${theme.text};
    text-transform: none;
    font-weight: 600;
  `,
  contentWrapper: css`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1400px;
    margin: 0 auto;
  `,
  kpiGrid: css`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  `,
  kpiBox: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    padding: 16px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;
  `,
  kpiLabel: css`
    font-size: 11px;
    font-weight: 600;
    color: ${theme.textMuted};
    text-transform: uppercase;
  `,
  kpiValue: css`
    font-size: 22px;
    font-weight: 700;
    color: ${theme.text};
  `,
  mainBoard: css`
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
    height: 480px;
  `,
  rightColumn: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,
  panel: css`
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,
  panelHeader: css`
    background: ${theme.surfaceHeader};
    padding: 10px 16px;
    border-bottom: 1px solid ${theme.border};
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${theme.textMuted};
    letter-spacing: 0.05em;
  `,
  emptyContent: css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.1);
  `,
  tabBar: css`
    display: flex;
    background: ${theme.surfaceHeader};
    border-bottom: 1px solid ${theme.border};
  `,
  tabBtn: css`
    background: none;
    border: none;
    border-right: 1px solid ${theme.border};
    padding: 12px 24px;
    color: ${theme.textMuted};
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #22252a; color: #fff; }
  `,
  tabActive: css`
    background: ${theme.surface};
    color: #fff;
    border-bottom: 2px solid ${theme.healthy};
  `,
  consoleBody: css`
    padding: 24px;
    background: #090a0d;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  consolePlaceholder: css`
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: ${theme.monoFont};
  `,
  cursor: css`
    width: 6px;
    height: 15px;
    background: ${theme.healthy};
    animation: blink 1s infinite;
    @keyframes blink { 
      0%, 100% { opacity: 1; } 
      50% { opacity: 0; } 
    }
  `,
  textHealthy: css` color: ${theme.healthy}; `,
  textWarning: css` color: ${theme.warning}; `,
  textCritical: css` color: ${theme.critical}; `,
  textMuted: css` color: ${theme.textMuted}; `,
};
