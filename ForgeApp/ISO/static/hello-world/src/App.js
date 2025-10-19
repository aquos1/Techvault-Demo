import React, { useState } from "react";

function App() {
  const [ideaText, setIdeaText] = useState(
    "As a user, I want a new 'Quick Add' button on the dashboard..."
  );
  const [loading, setLoading] = useState(false);

  const analyzeIdea = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800); // simulate async analysis
  };

  return (
    <div
      style={{
        fontFamily: "Inter, Arial, sans-serif",
        backgroundColor: "#f4f5f7",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <header style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#172B4D" }}>
          PredictIQ
        </h1>
        <p style={{ color: "#5E6C84", marginTop: "0.25rem" }}>
          Paste a feature idea to see a simulated analysis.
        </p>
      </header>

      <textarea
        value={ideaText}
        onChange={(e) => setIdeaText(e.target.value)}
        placeholder="Paste a feature idea here..."
        style={{
          width: "100%",
          height: "120px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          padding: "0.75rem",
          fontSize: "14px",
          resize: "none",
        }}
      />

      <button
        onClick={analyzeIdea}
        style={{
          backgroundColor: "#0052CC",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "0.65rem 1.4rem",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        Analyze Feature Idea
      </button>

      {loading && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            textAlign: "center",
            color: "#172B4D",
            fontWeight: "600",
          }}
        >
          Analyzing data...
        </div>
      )}
    </div>
  );
}

export default App;
