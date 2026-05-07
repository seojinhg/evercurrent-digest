import { useState, useEffect } from 'react';
import { generateDigest } from '../services/api';
import DigestSection from '../components/DigestSection';
import SilenceBanner from '../components/SilenceBanner';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import useLocalStorage from '../hooks/useLocalStorage';

function DigestPage({ profile, onResetProfile }) {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedDigest, setCachedDigest] = useLocalStorage('today_digest', null);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [phaseTransition, setPhaseTransition] = useState(null);
  const [transitionDismissed, setTransitionDismissed] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDate, setFilterDate] = useState('today');


  useEffect(() => {
    if (cachedDigest) {
      const cachedDate = new Date(cachedDigest.generated_at).toDateString();
      const today = new Date().toDateString();
      if (cachedDate === today) {
        setDigest(cachedDigest);
        return;
      }
    }
    handleGenerate();
  }, []);

  useEffect(() => {
    if (!profile?.current_phase) return;

    fetch(`http://localhost:3001/api/phase/detect?current_phase=${encodeURIComponent(profile.current_phase)
      }&project=${encodeURIComponent(profile.project || 'Atlas Arm v2')}`)
      .then(res => res.json())
      .then(data => {
        if (data.transition_detected) {
          setPhaseTransition(data);
        }
      })
      .catch(err => console.error('Phase detect failed:', err));
  }, [profile]);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await generateDigest({
        role: profile.role,
        current_phase: profile.current_phase,
        project: profile.project,
        priorities: profile.priorities || []
      });

      setDigest(res);
      setCachedDigest(res);
    } catch (err) {
      setError(err.message || 'Failed to generate digest');
    } finally {
      setLoading(false);
    }
  };

  const silenceAlerts = digest?.digest?.silence_alerts || [];
  const sections = digest?.digest?.sections || [];
  const greeting = digest?.digest?.greeting || '';
  const summary = digest?.digest?.summary || '';

  const filteredSections = sections.filter(section => {
    const matchesKeyword = searchKeyword
      ? section.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      section.body.toLowerCase().includes(searchKeyword.toLowerCase())
      : true;

    const matchesPriority = filterPriority === 'all'
      ? true
      : section.priority === filterPriority;

    return matchesKeyword && matchesPriority;
  });

  const criticalSections = filteredSections.filter(
    s => s.priority === 'critical' &&
      !s.title.toLowerCase().includes('silence')
  );
  const highSections = filteredSections.filter(s => s.priority === 'high');
  const mediumSections = filteredSections.filter(s => s.priority === 'medium');
  const lowSections = filteredSections.filter(s => s.priority === 'low');
  const rightSections = [...highSections];
  const bottomSections = [...mediumSections, ...lowSections];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
    }}>
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 1.5rem',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            background: 'var(--color-accent)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '13px'
          }}>⚡</div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>EverCurrent</span>
          <span style={{
            fontSize: '12px',
            color: 'var(--color-text-tertiary)',
            marginLeft: '4px'
          }}>
            Daily Digest
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}>
              {profile.role}
            </span>
            <span style={{
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'var(--color-medium-bg)',
              border: '1px solid var(--color-medium-border)',
              color: 'var(--color-medium)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              {profile.current_phase} phase
              {profile.project && (
                <span style={{
                  color: 'var(--color-text-tertiary)',
                  fontSize: '11px'
                }}>
                  · {profile.project}
                </span>
              )}
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: loading ? 'var(--color-border)' : 'var(--color-surface)',
              color: loading ? 'var(--color-text-tertiary)' : 'var(--color-text)',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'all 0.15s'
            }}
          >
            {loading ? 'Generating...' : '↻ Refresh'}
          </button>

          <button
            onClick={onResetProfile}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: '12px'
            }}
          >
            Switch role
          </button>
        </div>
      </header>

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(1rem, 3vw, 1.5rem)'
      }}>
        {/* Filter Bar */}
        {digest && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                width: '200px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)'
              }}
            />
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)'
              }}
            >
              <option value="all">All priorities</option>
              <option value="critical">Critical only</option>
              <option value="high">High only</option>
              <option value="medium">Medium only</option>
            </select>
            <select
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)'
              }}
            >
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="all">All time</option>
            </select>
            {(searchKeyword || filterPriority !== 'all' || filterDate !== 'today') && (
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setFilterPriority('all');
                  setFilterDate('today');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Clear filters
              </button>
            )}
            {searchKeyword && (
              <span style={{
                fontSize: '12px',
                color: 'var(--color-text-tertiary)'
              }}>
                {filteredSections.length} result{filteredSections.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
        {loading && !digest && <LoadingState />}
        {error && !digest && (
          <ErrorState message={error} onRetry={handleGenerate} />
        )}

        {digest && (
          <div>
            <div style={{
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <h1 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '8px'
                }}>
                  {greeting}
                </h1>
                {summary && (
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.65,
                    padding: '10px 14px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    {summary}
                  </p>
                )}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                flexShrink: 0,
                paddingTop: '4px'
              }}>
                {new Date(digest.generated_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
            {phaseTransition && !transitionDismissed && (
              <div style={{
                background: 'var(--color-medium-bg)',
                border: '1px solid var(--color-medium-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-medium)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px'
                  }}>
                    Phase Transition Detected
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--color-text)',
                    marginBottom: '10px'
                  }}>
                    {phaseTransition.message}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const updated = {
                          ...profile,
                          current_phase: phaseTransition.detected_phase
                        };
                        localStorage.setItem('user_profile', JSON.stringify(updated));
                        window.location.reload();
                      }}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'var(--color-medium)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Update to {phaseTransition.detected_phase}
                    </button>
                    <button
                      onClick={() => setTransitionDismissed(true)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Keep current phase
                    </button>
                  </div>
                </div>
              </div>
            )}
            {silenceAlerts.length > 0 && (
              <SilenceBanner alerts={silenceAlerts} />
            )}

            {sections.length === 0 && !loading && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--color-text-tertiary)',
                fontSize: '14px'
              }}>
                No updates for your role today.
              </div>
            )}

            {sections.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                alignItems: 'start'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 0'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--color-critical)',
                      flexShrink: 0
                    }} />
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-critical)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      Critical — Act Now
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)'
                    }}>
                      {criticalSections.length} item{criticalSections.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {criticalSections.length === 0 ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '13px',
                      color: 'var(--color-text-tertiary)'
                    }}>
                      No critical items today 🎉
                    </div>
                  ) : (
                    criticalSections.map((section, i) => (
                      <DigestSection key={i} section={section} index={i} />
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 0'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--color-high)',
                      flexShrink: 0
                    }} />
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-high)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      High — Review Today
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)'
                    }}>
                      {rightSections.length} item{rightSections.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {rightSections.length === 0 ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '13px',
                      color: 'var(--color-text-tertiary)'
                    }}>
                      No other items today
                    </div>
                  ) : (
                    rightSections.map((section, i) => (
                      <DigestSection key={i} section={section} index={i} />
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 0'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--color-medium)',
                      flexShrink: 0
                    }} />
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-medium)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      Medium & Low — FYI
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)'
                    }}>
                      {bottomSections.length} item{bottomSections.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {bottomSections.length === 0 ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '13px',
                      color: 'var(--color-text-tertiary)'
                    }}>
                      No other items today
                    </div>
                  ) : (
                    bottomSections.map((section, i) => (
                      <DigestSection key={i} section={section} index={i} />
                    ))
                  )}
                </div>

              </div>
            )}

            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '12px',
                color: 'var(--color-text-tertiary)'
              }}>
                Generated at {new Date(digest.generated_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                Regenerate digest
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DigestPage;