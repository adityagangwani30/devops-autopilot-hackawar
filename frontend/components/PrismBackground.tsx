"use client"

// ═══════════════════════════════════════════════════════════════════
// PrismBackground.tsx - CSS-only prismatic light effect
// Uses pure CSS animations - no WebGL, canvas, or JS loops
// ═══════════════════════════════════════════════════════════════════

export function PrismBackground() {
  return (
    <div className="prism-container">
      <div className="prism-layer prism-layer-1" />
      <div className="prism-layer prism-layer-2" />
      <div className="prism-layer prism-layer-3" />
      
      <style jsx>{`
        .prism-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
          background: #080c10;
        }

        .prism-layer {
          position: absolute;
          width: 200%;
          height: 200%;
          left: -50%;
          top: -50%;
          will-change: transform, opacity;
        }

        .prism-layer-1 {
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.08) 0%,
            rgba(139, 92, 246, 0.06) 25%,
            rgba(59, 130, 246, 0.04) 50%,
            rgba(139, 92, 246, 0.06) 75%,
            rgba(59, 130, 246, 0.08) 100%
          );
          animation: prism-move-1 20s ease-in-out infinite;
        }

        .prism-layer-2 {
          background: linear-gradient(
            225deg,
            rgba(139, 92, 246, 0.06) 0%,
            rgba(59, 130, 246, 0.04) 30%,
            rgba(99, 102, 241, 0.05) 60%,
            rgba(139, 92, 246, 0.06) 100%
          );
          animation: prism-move-2 25s ease-in-out infinite;
        }

        .prism-layer-3 {
          background: radial-gradient(
            ellipse at 30% 20%,
            rgba(56, 189, 248, 0.05) 0%,
            transparent 50%
          );
          animation: prism-move-3 30s ease-in-out infinite;
        }

        @keyframes prism-move-1 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          33% {
            transform: translate(5%, 3%) rotate(2deg);
            opacity: 0.8;
          }
          66% {
            transform: translate(-3%, 5%) rotate(-1deg);
            opacity: 0.9;
          }
        }

        @keyframes prism-move-2 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.9;
          }
          25% {
            transform: translate(-5%, -3%) rotate(-2deg);
            opacity: 1;
          }
          50% {
            transform: translate(3%, 5%) rotate(1deg);
            opacity: 0.7;
          }
          75% {
            transform: translate(-2%, -4%) rotate(-1deg);
            opacity: 0.85;
          }
        }

        @keyframes prism-move-3 {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.6;
          }
          33% {
            transform: translate(10%, 10%);
            opacity: 0.4;
          }
          66% {
            transform: translate(-5%, 15%);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}