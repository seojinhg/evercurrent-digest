import { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

function SilenceBanner({ alerts }) {
  const [dismissedAlerts, setDismissedAlerts] = useLocalStorage('dismissed_alerts', []);
  const [minimized, setMinimized] = useState(false);

  const today = new Date().toDateString();

  const visibleAlerts = alerts.filter(alert => {
    const isDismissed = dismissedAlerts.some(
      d => d.ticket_id === alert.ticket_id && d.date === today
    );
    return !isDismissed;
  });

  const handleDismiss = (ticketId) => {
    const updated = [
      ...dismissedAlerts.filter(d => d.date === today),
      { ticket_id: ticketId, date: today }
    ];
    setDismissedAlerts(updated);
  };

  if (visibleAlerts.length === 0) return null;

  const criticalAlerts = visibleAlerts.filter(a => a.severity === 'Critical');
  const otherAlerts = visibleAlerts.filter(a => a.severity !== 'Critical');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '1.5rem'
    }}>
      {criticalAlerts.map(alert => (
        <div
          key={alert.ticket_id}
          style={{
            background: 'var(--color-critical-bg)',
            border: '1px solid var(--color-critical-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>
            🚨
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-critical)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Silence Alert · Critical
              </span>
              <span style={{
                fontSize: '11px',
                color: 'var(--color-text-tertiary)'
              }}>
                {alert.ticket_id}
              </span>
            </div>
            <p style={{
              fontSize: '13px',
              color: 'var(--color-text)',
              lineHeight: 1.5
            }}>
              {alert.message}
            </p>
          </div>
          <button
            onClick={() => handleDismiss(alert.ticket_id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: '16px',
              padding: '0',
              flexShrink: 0,
              lineHeight: 1
            }}
            title="Dismiss for today"
          >
            ×
          </button>
        </div>
      ))}

      {otherAlerts.length > 0 && (
        <div style={{
          background: 'var(--color-high-bg)',
          border: '1px solid var(--color-high-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setMinimized(!minimized)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-high)'
            }}
          >
            <span>⚠ {otherAlerts.length} high priority silence alert{otherAlerts.length > 1 ? 's' : ''}</span>
            <span>{minimized ? '▼' : '▲'}</span>
          </button>

          {!minimized && otherAlerts.map(alert => (
            <div
              key={alert.ticket_id}
              style={{
                padding: '8px 16px 10px',
                borderTop: '1px solid var(--color-high-border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--color-text)',
                  lineHeight: 1.5
                }}>
                  {alert.message}
                </p>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)'
                }}>
                  {alert.ticket_id}
                </span>
              </div>
              <button
                onClick={() => handleDismiss(alert.ticket_id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '16px',
                  padding: '0',
                  flexShrink: 0
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SilenceBanner;