import React, { useState } from "react";

// --- Hardcoded Analysis Data ---
const hardcodedAnalysis = {
  topIdeas: [
    {
      id: 1,
      title: "Quick Add Button on Dashboard",
      timeToValueDays: 5,
      rationale:
        "This feature automates a high-traffic workflow for new task creation, directly addressing a primary user pain point. Similar past features focusing on reducing steps in core workflows increased engagement by ~35%. Moderate effort is predicted because backend integration is required for real-time validation, necessitating 2 backend endpoints and a complex UI component.",
      metrics: {
        reach: {
          value: "85%",
          explanation:
            "Impacts 85% of active users who interact with the main dashboard (1,200 users/week).",
          color: "text-green-600",
        },
        impact: {
          value: 9,
          explanation:
            "High because this dramatically simplifies the most common action (adding a task), improving conversion by an estimated 15%.",
          color: "text-green-600",
        },
        confidence: {
          value: "90%",
          explanation:
            "Confidence is high due to clear, quantitative data from similar, high-traffic feature improvements in Q1.",
          color: "text-green-600",
        },
        effort: {
          value: "60 Hours",
          explanation:
            "Requires API integration, 2 new backend endpoints, and 1 complex React UI component with modal state.",
          color: "text-yellow-600",
        },
      },
    },
    {
      id: 2,
      title: "AI-Powered Task Categorization",
      timeToValueDays: 10,
      rationale:
        "The model predicts that automatic task categorization will significantly reduce cognitive load. The moderate confidence level stems from the fact that this is an experimental ML feature, and limited past analogues exist. The high effort is driven by the need to integrate with the ML inference service.",
      metrics: {
        reach: {
          value: "65%",
          explanation:
            "Impacts users who manually categorize their tasks, representing 65% of the user base (950 users/week).",
          color: "text-yellow-600",
        },
        impact: {
          value: 7,
          explanation:
            "Moderate-high, as it removes friction but only for a secondary action after task creation is complete.",
          color: "text-yellow-600",
        },
        confidence: {
          value: "75%",
          explanation:
            "Confidence is lower due to limited past analogues in this specific ML/product area; data is mostly qualitative.",
          color: "text-yellow-600",
        },
        effort: {
          value: "120 Story Points",
          explanation:
            "Requires setting up a new ML inference pipeline and updating data schemas, driving high story point allocation.",
          color: "text-red-600",
        },
      },
    },
    {
      id: 3,
      title: "Advanced Filtering Options",
      timeToValueDays: 3,
      rationale:
        "Users often complain about difficulty finding specific tasks in large projects. This low-effort feature addresses core UX friction. Since this is purely a frontend update with no new API calls, the time to value is extremely fast.",
      metrics: {
        reach: {
          value: "40%",
          explanation:
            "Only impacts advanced power users with high task volumes (approx. 400 users/week).",
          color: "text-red-600",
        },
        impact: {
          value: 6,
          explanation:
            "Moderate. It's a quality-of-life improvement that increases satisfaction but doesn't drive core revenue or conversion.",
          color: "text-yellow-600",
        },
        confidence: {
          value: "80%",
          explanation:
            "Moderate confidence, backed by direct user interview data and support ticket analysis.",
          color: "text-yellow-600",
        },
        effort: {
          value: "30 Hours",
          explanation:
            "Frontend-only change, primarily updating the state management and existing filter component logic.",
          color: "text-green-600",
        },
      },
    },
  ],
  otherIdeas: [
    {
      title: "Customizable Color Themes",
      reasonLower:
        "Low impact on core business metrics (Impact 3) and high required effort (40 hours) for limited gain.",
    },
    {
      title: "Integrate with Google Calendar",
      reasonLower:
        "High development effort (80 hours) coupled with a low user reach (15% of users actively request this integration).",
    },
  ],
};

// Reusable Metric Display Component
const MetricDisplay = ({ name, data }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.5rem 0",
      borderBottom: "1px solid #EBECF0",
    }}
  >
    <div style={{ color: "#5E6C84", fontWeight: "600", flex: 1 }}>{name}</div>
    <div style={{ flex: 2 }}>
      <div className={data.color} style={{ fontWeight: "700" }}>
        {data.value}
      </div>
      <p
        style={{ fontSize: "0.75rem", color: "#5E6C84", marginTop: "0.25rem" }}
      >
        {data.explanation}
      </p>
    </div>
  </div>
);

// Main Idea Card Component
const IdeaCard = ({ idea, index }) => {
  const { title, rationale, timeToValueDays, metrics } = idea;
  const isTopIdea = index !== undefined;

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    marginBottom: "1rem",
    borderLeft: isTopIdea ? `4px solid #0052CC` : "none",
  };

  return (
    <div style={cardStyle}>
      <h2
        style={{
          fontSize: "1.125rem",
          fontWeight: "700",
          color: "#172B4D",
          marginBottom: "0.75rem",
        }}
      >
        {isTopIdea ? `🚀 Idea #${index + 1}: ${title}` : title}
      </h2>

      {isTopIdea && (
        <>
          <div
            style={{
              backgroundColor: "#F4F5F7",
              padding: "1rem",
              borderRadius: "6px",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#172B4D",
                marginBottom: "0.5rem",
              }}
            >
              Short Rationale
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#5E6C84",
                lineHeight: "1.4",
              }}
            >
              {rationale}
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#172B4D",
                marginBottom: "0.5rem",
              }}
            >
              Core RICE Metrics
            </h3>
            <MetricDisplay name="Reach" data={metrics.reach} />
            <MetricDisplay name="Impact (1-10)" data={metrics.impact} />
            <MetricDisplay name="Confidence" data={metrics.confidence} />
            <MetricDisplay name="Effort" data={metrics.effort} />
          </div>

          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#0052CC",
              borderTop: "1px solid #EBECF0",
              paddingTop: "1rem",
            }}
          >
            Time to Value:{" "}
            <span style={{ fontWeight: "700" }}>{timeToValueDays} Days</span>
          </div>
        </>
      )}
    </div>
  );
};

// Summary Card Component for non-top ideas
const OtherIdeaSummary = ({ idea }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
      padding: "0.75rem 0",
      borderBottom: "1px dashed #EBECF0",
    }}
  >
    <div style={{ fontWeight: "600", color: "#172B4D" }}>{idea.title}</div>
    <div style={{ fontSize: "0.875rem", color: "#5E6C84" }}>
      <span style={{ fontWeight: "600" }}>Reason Lower:</span>{" "}
      {idea.reasonLower}
    </div>
  </div>
);

function App() {
  const [ideaText, setIdeaText] = useState(
    "As a user, I want a new 'Quick Add' button on the dashboard to create new tasks quickly, saving me 3 clicks every time."
  );
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [experimentMessage, setExperimentMessage] = useState("");

  const analyzeIdea = () => {
    setAnalysisResult(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setAnalysisResult(hardcodedAnalysis);
      setExperimentMessage(""); // reset experiment message on new analysis
    }, 1500);
  };

  const createExperiment = () => {
    // Hardcoded response for now
    setExperimentMessage(
      "✅ Experiment created successfully! (Simulated response)"
    );
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
        maxWidth: "640px",
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      {/* Header and Textarea */}
      <header style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#172B4D" }}>
          PredictIQ Analysis
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
        disabled={loading}
        style={{
          backgroundColor: loading ? "#A7B2C6" : "#0052CC",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "0.65rem 1.4rem",
          fontSize: "14px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s",
        }}
      >
        {loading ? "Analyzing Feature..." : "Analyze Feature/Idea"}
      </button>

      {/* Loading Indicator */}
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

      {/* Analysis Results */}
      {analysisResult && (
        <div style={{ marginTop: "1rem" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#172B4D",
              marginBottom: "1rem",
              borderBottom: "2px solid #EBECF0",
              paddingBottom: "0.5rem",
            }}
          >
            Analysis Results
          </h2>

          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#172B4D",
              marginBottom: "0.75rem",
            }}
          >
            Top 3 Recommended Ideas:
          </h3>
          {analysisResult.topIdeas.map((idea, index) => (
            <IdeaCard key={idea.id} idea={idea} index={index} />
          ))}

          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#172B4D",
              marginTop: "2rem",
              marginBottom: "0.5rem",
            }}
          >
            Other Ideas Analyzed
          </h3>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "0 1.5rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            }}
          >
            {analysisResult.otherIdeas.map((idea, index) => (
              <OtherIdeaSummary key={index} idea={idea} />
            ))}
          </div>

          {/* Create Experiment Button */}
          <button
            onClick={createExperiment}
            style={{
              marginTop: "1.5rem",
              backgroundColor: "#36B37E",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "0.75rem 1.5rem",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            Create Experiments
          </button>

          {/* Hardcoded experiment message */}
          {experimentMessage && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem 1rem",
                backgroundColor: "#E3FCEF",
                color: "#0B6E4F",
                borderRadius: "6px",
                fontWeight: "600",
              }}
            >
              {experimentMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
