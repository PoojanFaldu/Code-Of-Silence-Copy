import { useState } from "react";
import { useGame } from "@/contexts/GameContext";

const CodeOfSilence = () => {
  const { timeRemaining } = useGame();
  const [view, setView] = useState<'landing' | 'folders'>('landing');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      margin: 0, 
      background: 'linear-gradient(180deg,#041226 0%,#071226 100%)', 
      color: '#e6eef8', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      fontFamily: 'Inter, ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial'
    }}>
      {view === 'landing' ? (
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 8px 30px rgba(4,10,20,0.7)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(125,211,252,0.1)',
            border: '2px solid rgba(125,211,252,0.3)',
            borderRadius: '8px',
            padding: '8px',
            margin: '0 auto 24px'
          }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>TIME</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: timeRemaining < 300 ? '#ef4444' : '#7dd3fc', fontFamily: 'monospace' }}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          <h1 style={{ fontSize: '32px', margin: '0 0 16px', color: '#7dd3fc' }}>Code of Silence</h1>
          <p style={{ fontSize: '16px', color: '#9ca3af', marginBottom: '32px' }}>
            Access the forensic investigation system to uncover hidden clues and solve the mystery.
          </p>
          <button
            onClick={() => setView('folders')}
            style={{
              background: 'linear-gradient(180deg,rgba(125,211,252,0.2),rgba(125,211,252,0.1))',
              border: '1px solid rgba(125,211,252,0.3)',
              color: '#7dd3fc',
              padding: '16px 32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '18px',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            Enter Investigation
          </button>
        </div>
      ) : (
        <div style={{
          width: '100%',
          maxWidth: '800px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 8px 30px rgba(4,10,20,0.7)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', margin: 0, color: '#7dd3fc' }}>Investigation Files</h1>
            <div style={{
              width: '80px',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(125,211,252,0.1)',
              border: '2px solid rgba(125,211,252,0.3)',
              borderRadius: '8px',
              padding: '4px'
            }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>TIME</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: timeRemaining < 300 ? '#ef4444' : '#7dd3fc', fontFamily: 'monospace' }}>
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { name: "Dr. Verma's Office", icon: "📁", desc: "Personal files and notes", room: "verma" },
              { name: "Research Lab", icon: "🔬", desc: "Experimental data", room: "research" },
              { name: "Archives", icon: "📚", desc: "Historical records", room: "archive" },
              { name: "Server Files", icon: "💾", desc: "Digital evidence", room: "server" }
            ].map((folder, idx) => (
              <a
                key={idx}
                href={`/game?room=${folder.room}`}
                style={{
                  background: 'rgba(125,211,252,0.05)',
                  border: '1px solid rgba(125,211,252,0.2)',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  opacity: 1,
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>{folder.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#7dd3fc', marginBottom: '4px' }}>{folder.name}</div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>{folder.desc}</div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#34d399' }}>✓ Available</div>
              </a>
            ))}
          </div>
          <button
            onClick={() => setView('landing')}
            style={{
              background: 'transparent',
              border: '1px dashed rgba(255,255,255,0.2)',
              color: '#9ca3af',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            ← Back to Main Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeOfSilence;
