function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      gap: '1rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'var(--color-critical-bg)',
        border: '1px solid var(--color-critical-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px'
      }}>
        ⚠
      </div>

      <div>
        <p style={{
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--color-text)',
          marginBottom: '0.5rem'
        }}>
          Something went wrong
        </p>
        <p style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          maxWidth: '320px'
        }}>
          {message || 'Failed to generate digest. Please try again.'}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-strong)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '13px',
            fontWeight: 500,
            marginTop: '0.5rem'
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;