import React, { useState } from 'react';

function App() {
  const [ideaText, setIdeaText] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const mockPrediction = {
    reach: '5,000 users/mo',
    impact: '+3.5% conversion rate',
    confidence: '0.82',
    effort: '4 engineer-weeks',
    rice: '143',
    rationale:
      'Based on similar past features improving onboarding flow by 3–5%.',
  };

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      setPrediction(mockPrediction);
      setLoading(false);
    }, 1000);
  };

  return (
    <div
      style={{
        fontFamily: 'Inter, Arial, sans-serif',
        padding: '1.5rem',
        backgroundColor: '#f4f5f7',
        minHeight: '100vh',
      }}
    >
      <h2 style={{ marginBottom: '0.25rem' }}>🧠 ISO — Feature Estimator</h2>
      <p style={{ color: '#5E6C84', marginBottom: '1rem' }}>
        Paste a feature idea or PRD snippet below, then click “Analyze” to see
        estimated RICE scores.
      </p>

      <textarea
        value={ideaText}
        onChange={(e) => setIdeaText(e.target.value)}
        placeholder="e.g. Add personalized recommendations to dashboard..."
        style={{
          width: '100%',
          height: '100px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          padding: '0.75rem',
          fontSize: '14px',
          resize: 'none',
          marginBottom: '1rem',
        }}
      />

      <button
        onClick={handleAnalyze}
        disabled={!ideaText || loading}
        style={{
          backgroundColor: '#0052CC',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '0.6rem 1.2rem',
          fontSize: '14px',
          cursor: !ideaText || loading ? 'not-allowed' : 'pointer',
          opacity: !ideaText || loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {prediction && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>Predicted RICE Estimate</h3>
          <p style={{ color: '#5E6C84', fontSize: '13px', marginBottom: '1rem' }}>
            Generated from historical Confluence & Jira data
          </p>

          <ul style={{ listStyleType: 'none', paddingLeft: 0, lineHeight: 1.6 }}>
            <li>
              <strong>Reach:</strong> {prediction.reach}
            </li>
            <li>
              <strong>Impact:</strong> {prediction.impact}
            </li>
            <li>
              <strong>Confidence:</strong> {prediction.confidence}
            </li>
            <li>
              <strong>Effort:</strong> {prediction.effort}
            </li>
            <li>
              <strong>RICE Score:</strong> {prediction.rice}
            </li>
          </ul>

          <p
            style={{
              marginTop: '0.75rem',
              fontStyle: 'italic',
              color: '#5E6C84',
            }}
          >
            {prediction.rationale}
          </p>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              style={{
                backgroundColor: '#0052CC',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Create Epic
            </button>
            <button
              style={{
                backgroundColor: '#E9EBEE',
                color: '#172B4D',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Create Experiment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
