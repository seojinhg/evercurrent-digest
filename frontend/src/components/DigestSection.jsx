import { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const PRIORITY_STYLES = {
  critical: {
    color: 'var(--color-critical)',
    bg: 'var(--color-critical-bg)',
    border: 'var(--color-critical-border)',
    label: 'Critical'
  },
  high: {
    color: 'var(--color-high)',
    bg: 'var(--color-high-bg)',
    border: 'var(--color-high-border)',
    label: 'High'
  },
  medium: {
    color: 'var(--color-medium)',
    bg: 'var(--color-medium-bg)',
    border: 'var(--color-medium-border)',
    label: 'Medium'
  },
  low: {
    color: 'var(--color-low)',
    bg: 'var(--color-low-bg)',
    border: 'var(--color-low-border)',
    label: 'Low'
  }
};

function DigestSection({ section, index }) {
  const [expanded, setExpanded] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [reviewed, setReviewed] = useLocalStorage(
    `reviewed_${section.title}`, false
  );
  const [feedback, setFeedback] = useLocalStorage(
    `feedback_${section.title}`, null
  );
  const style = PRIORITY_STYLES[section.priority] || PRIORITY_STYLES.medium;

  return (
    <div style={{
      background: reviewed
        ? 'var(--color-bg)'
        : 'var(--color-surface)',
      border: reviewed
        ? '1px solid var(--color-border)'
        : '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      animation: `fadeInUp 0.3s ease ${index * 0.08}s both`,
      opacity: reviewed ? 0.75 : 1,
      transition: 'opacity 0.3s ease'
    }}>
      <div style={{
        padding: '10px 14px',
        background: style.bg,
        borderBottom: `1px solid ${style.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--color-text)',
          lineHeight: 1.4
        }}>
          {section.title}
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: style.color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: 'white',
          padding: '2px 7px',
          borderRadius: '20px',
          border: `1px solid ${style.border}`,
          flexShrink: 0,
          marginLeft: '8px'
        }}>
          {style.label}
        </span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <p style={{
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden'
        }}>
          {section.body}
        </p>

        {!expanded && section.body?.length > 120 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              fontSize: '12px',
              color: style.color,
              cursor: 'pointer',
              marginBottom: '10px',
              fontWeight: 500
            }}
          >
            Read more
          </button>
        )}

        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              fontSize: '12px',
              color: style.color,
              cursor: 'pointer',
              marginBottom: '10px',
              fontWeight: 500
            }}
          >
            Show less
          </button>
        )}

        {section.related_messages && section.related_messages.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={() => setShowMessages(!showMessages)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0',
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                fontWeight: 500,
                marginBottom: showMessages ? '8px' : '0'
              }}
            >
              {showMessages
                ? 'Hide Slack source'
                : `View Slack source (${section.related_messages.length})`
              }
            </button>

            {showMessages && (
              <div style={{
                padding: '8px 10px',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)'
              }}>
                {section.related_messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '12px',
                      padding: '6px 0',
                      borderBottom: i < section.related_messages.length - 1
                        ? '1px solid var(--color-border)'
                        : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '2px' }}>
                        <span style={{
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          marginRight: '6px'
                        }}>
                          {msg.sender}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--color-text-tertiary)'
                        }}>
                          {msg.channel}
                        </span>
                      </div>
                      <p style={{
                        margin: 0,
                        lineHeight: 1.4,
                        color: 'var(--color-text-secondary)'
                      }}>
                        {msg.content}
                      </p>
                    </div>

                    <a href={msg.slack_url || '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--color-medium)', textDecoration: 'none', flexShrink: 0, padding: '2px 6px', border: '1px solid var(--color-medium-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-medium-bg)' }}>View</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mark as reviewed */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <button
            onClick={() => {
              if (reviewed) return;
              setReviewed(true);

              const profile = localStorage.getItem('user_profile')
                ? JSON.parse(localStorage.getItem('user_profile'))
                : {};

              fetch('http://localhost:3001/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: profile.name || 'anonymous',
                  role: profile.role || 'unknown',
                  phase: profile.current_phase || 'Validation',
                  section_title: section.title,
                  ticket_id: section.related_messages?.[0]?.ticket_id || null
                })
              });
            }}
            style={{
              background: reviewed ? 'var(--color-low-bg)' : 'transparent',
              border: reviewed
                ? '1px solid var(--color-low-border)'
                : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 10px',
              fontSize: '11px',
              cursor: reviewed ? 'default' : 'pointer',
              color: reviewed ? 'var(--color-low)' : 'var(--color-text-tertiary)',
              fontWeight: reviewed ? 500 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {reviewed ? '✓ Reviewed' : 'Mark as reviewed'}
          </button>
          {reviewed && (
            <span style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)'
            }}>
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
        {/* Feedback buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px'
        }}>
          <span style={{
            fontSize: '11px',
            color: 'var(--color-text-tertiary)'
          }}>
            Was this useful?
          </span>
          <button
            onClick={() => {
              setFeedback('useful');
              fetch('http://localhost:3001/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  role: localStorage.getItem('user_profile')
                    ? JSON.parse(localStorage.getItem('user_profile')).role
                    : 'unknown',
                  phase: localStorage.getItem('user_profile')
                    ? JSON.parse(localStorage.getItem('user_profile')).current_phase
                    : 'Validation',
                  section_title: section.title,
                  is_useful: true
                })
              });
            }}
            style={{
              background: feedback === 'useful'
                ? 'var(--color-success-bg, #f0fdf4)'
                : 'transparent',
              border: feedback === 'useful'
                ? '1px solid var(--color-low-border)'
                : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              color: feedback === 'useful'
                ? 'var(--color-low)'
                : 'var(--color-text-tertiary)'
            }}
          >
            👍 Yes
          </button>
          <button
            onClick={() => {
              setFeedback('not_useful');
              fetch('http://localhost:3001/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  role: localStorage.getItem('user_profile')
                    ? JSON.parse(localStorage.getItem('user_profile')).role
                    : 'unknown',
                  phase: localStorage.getItem('user_profile')
                    ? JSON.parse(localStorage.getItem('user_profile')).current_phase
                    : 'Validation',
                  section_title: section.title,
                  is_useful: false
                })
              });
            }}
            style={{
              background: feedback === 'not_useful'
                ? 'var(--color-critical-bg)'
                : 'transparent',
              border: feedback === 'not_useful'
                ? '1px solid var(--color-critical-border)'
                : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              color: feedback === 'not_useful'
                ? 'var(--color-critical)'
                : 'var(--color-text-tertiary)'
            }}
          >
            👎 No
          </button>
          {feedback && (
            <span style={{
              fontSize: '11px',
              color: feedback === 'useful'
                ? 'var(--color-low)'
                : 'var(--color-critical)'
            }}>
              {feedback === 'useful'
                ? 'Got it — will prioritize similar content'
                : 'Got it — will show less of this'}
            </span>
          )}
        </div>

        {section.actions && section.actions.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            {section.actions.map((action, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '7px',
                  fontSize: '12px',
                  color: 'var(--color-text)',
                  padding: '5px 8px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  lineHeight: 1.45
                }}
              >
                <span style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  background: style.color,
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>
                  {i + 1}
                </span>
                {action}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default DigestSection;