import { useState, useEffect } from 'react';

const LOADING_STEPS = [
  'Fetching Slack messages...',
  'Summarizing threads...',
  'Detecting silence alerts...',
  'Generating your digest...'
];

function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      gap: '1.5rem'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid var(--color-border)',
        borderTop: '3px solid var(--color-accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}/>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: '15px',
          color: 'var(--color-text)',
          fontWeight: 500,
          marginBottom: '0.5rem'
        }}>
          {LOADING_STEPS[currentStep]}
        </p>
        <p style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)'
        }}>
          This may take up to 20 seconds
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentStep ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i <= currentStep
                ? 'var(--color-accent)'
                : 'var(--color-border)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingState;