import { useState } from 'react';

const ROLES = [
  { id: 'Mechanical Engineer', label: 'Mechanical Engineer', icon: '⚙️', desc: 'CAD, tolerances, assembly' },
  { id: 'Electrical Engineer', label: 'Electrical Engineer', icon: '⚡', desc: 'PCB, power, EMC' },
  { id: 'Supply Chain', label: 'Supply Chain', icon: '📦', desc: 'Lead times, sourcing, BOM' },
  { id: 'Engineering Manager', label: 'Engineering Manager', icon: '🎯', desc: 'Blockers, milestones, team' },
  { id: 'Product Manager', label: 'Product Manager', icon: '🚀', desc: 'Customer, launch, roadmap' }
];

const PHASES = [
  { id: 'Design', label: 'Design', desc: 'Concept and design review' },
  { id: 'Prototype', label: 'Prototype', desc: 'Build and iterate' },
  { id: 'Validation', label: 'Validation', desc: 'DVT and testing' },
  { id: 'Pre-production', label: 'Pre-production', desc: 'Production readiness' },
  { id: 'Production', label: 'Production', desc: 'Manufacturing and field' }
];

function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [phase, setPhase] = useState('');
  const [name, setName] = useState('');
  const [project, setProject] = useState('Atlas Arm v2');

  const handleComplete = () => {
    if (!role || !phase) return;
    onComplete({
      role,
      current_phase: phase,
      name: name || null,
      project
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px'
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--color-accent)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px'
            }}>⚡</div>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>EverCurrent</span>
          </div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 600,
            marginBottom: '0.5rem'
          }}>
            {step === 1 ? 'Who are you?' : step === 2 ? 'What phase are you in?' : 'Almost done'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {step === 1 ? 'Select your role to personalize your digest' : step === 2 ? 'We adapt your digest based on project phase' : 'A few more details'}
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '2rem',
          justifyContent: 'center'
        }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              height: '4px',
              width: '60px',
              borderRadius: '2px',
              background: s <= step ? 'var(--color-accent)' : 'var(--color-border)',
              transition: 'background 0.3s'
            }}/>
          ))}
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: role === r.id
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    background: role === r.id ? '#f0f0ee' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{r.icon}</span>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text)'
                    }}>
                      {r.label}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {r.desc}
                    </div>
                  </div>
                  {role === r.id && (
                    <span style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PHASES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPhase(p.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: phase === p.id
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    background: phase === p.id ? '#f0f0ee' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text)'
                    }}>
                      {p.label}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {p.desc}
                    </div>
                  </div>
                  {phase === p.id && (
                    <span style={{ color: 'var(--color-accent)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--color-text)'
                }}>
                  Your name (used to filter your tickets)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Marcus T."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: name
                      ? '1px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    background: 'var(--color-bg)'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--color-text)'
                }}>
                  Project
                </label>
                <input
                  type="text"
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  placeholder="e.g. Atlas Arm v2"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    background: 'var(--color-bg)'
                  }}
                />
              </div>

              <div style={{
                padding: '12px',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                  fontWeight: 500
                }}>
                  Your digest will be personalized for:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '12px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'var(--color-accent)',
                    color: 'white'
                  }}>
                    {role}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'var(--color-medium-bg)',
                    color: 'var(--color-medium)',
                    border: '1px solid var(--color-medium-border)'
                  }}>
                    {phase} phase
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1.5rem'
        }}>
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                fontSize: '14px',
                color: 'var(--color-text-secondary)'
              }}
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !role : !phase}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: (step === 1 ? !role : !phase)
                  ? 'var(--color-border)'
                  : 'var(--color-accent)',
                color: (step === 1 ? !role : !phase)
                  ? 'var(--color-text-tertiary)'
                  : 'white',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.15s'
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-accent)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Get my digest →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;