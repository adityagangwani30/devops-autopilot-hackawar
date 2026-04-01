"use client"

const particles = [
  { size: 4, left: 12, top: 23, duration: 18, delay: 2 },
  { size: 3, left: 45, top: 67, duration: 25, delay: 5 },
  { size: 5, left: 78, top: 34, duration: 21, delay: 8 },
  { size: 2, left: 23, top: 89, duration: 32, delay: 1 },
  { size: 4, left: 56, top: 12, duration: 19, delay: 7 },
  { size: 3, left: 89, top: 45, duration: 28, delay: 3 },
  { size: 5, left: 34, top: 78, duration: 23, delay: 9 },
  { size: 2, left: 67, top: 56, duration: 17, delay: 4 },
  { size: 4, left: 11, top: 91, duration: 29, delay: 6 },
  { size: 3, left: 94, top: 22, duration: 22, delay: 0 },
  { size: 5, left: 41, top: 63, duration: 26, delay: 8 },
  { size: 2, left: 73, top: 38, duration: 20, delay: 2 },
  { size: 4, left: 28, top: 84, duration: 31, delay: 5 },
  { size: 3, left: 59, top: 17, duration: 24, delay: 9 },
  { size: 5, left: 86, top: 49, duration: 27, delay: 1 },
  { size: 2, left: 15, top: 72, duration: 18, delay: 7 },
  { size: 4, left: 47, top: 95, duration: 33, delay: 3 },
  { size: 3, left: 82, top: 28, duration: 21, delay: 6 },
  { size: 5, left: 36, top: 51, duration: 25, delay: 4 },
  { size: 2, left: 69, top: 83, duration: 19, delay: 0 },
]

const shimmerParticles = [
  { size: 3, left: 15, top: 8, duration: 3, delay: 0 },
  { size: 4, left: 28, top: 25, duration: 4, delay: 1.5 },
  { size: 2, left: 42, top: 5, duration: 3.5, delay: 0.5 },
  { size: 3, left: 55, top: 35, duration: 4.5, delay: 2 },
  { size: 4, left: 68, top: 15, duration: 3, delay: 1 },
  { size: 2, left: 82, top: 28, duration: 5, delay: 0 },
  { size: 3, left: 35, top: 42, duration: 3.5, delay: 2.5 },
  { size: 4, left: 48, top: 12, duration: 4, delay: 0.5 },
  { size: 2, left: 62, top: 32, duration: 3, delay: 1.5 },
  { size: 3, left: 75, top: 20, duration: 4.5, delay: 1 },
  { size: 4, left: 22, top: 45, duration: 5, delay: 0 },
  { size: 2, left: 88, top: 10, duration: 3.5, delay: 2 },
  { size: 3, left: 38, top: 38, duration: 4, delay: 1 },
  { size: 4, left: 52, top: 22, duration: 3, delay: 0.5 },
  { size: 2, left: 65, top: 48, duration: 4.5, delay: 2.5 },
  { size: 3, left: 18, top: 18, duration: 3.5, delay: 1.5 },
  { size: 4, left: 78, top: 35, duration: 4, delay: 0 },
  { size: 2, left: 45, top: 55, duration: 5, delay: 1 },
]

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(140deg, #0f172a 0%, #0c1a32 32%, #0d203d 58%, #0e1b34 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 150% 100% at 20% 10%, rgba(45, 212, 191, 0.26) 0%, transparent 58%)",
          animation: "light-wave 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 120% 80% at 75% 25%, rgba(34, 211, 238, 0.2) 0%, transparent 52%)",
          animation: "light-wave-2 10s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 70% at 45% 5%, rgba(45, 212, 191, 0.16) 0%, transparent 48%)",
          animation: "light-wave-3 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 60% 20%, rgba(14, 165, 233, 0.14) 0%, transparent 44%)",
          animation: "light-wave-4 14s ease-in-out infinite",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(45, 212, 191, 0.16) 0%, transparent 50%)",
          animation: "light-pulse 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 70% 60%, rgba(34, 211, 238, 0.14) 0%, transparent 45%)",
          animation: "light-pulse 8s ease-in-out infinite 2s",
        }}
      />

      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-300/25"
            style={{
              width: p.size + "px",
              height: p.size + "px",
              left: p.left + "%",
              top: p.top + "%",
              animation: `float-particle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[30%] left-[10%] h-[160%] w-[50%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(45, 212, 191, 0.26) 0%, rgba(45, 212, 191, 0.12) 25%, rgba(45, 212, 191, 0.04) 50%, transparent 80%)",
            transform: "skewX(-8deg)",
            animation: "canopy-ray-1 6s ease-in-out infinite",
            filter: "blur(24px)",
          }}
        />

        <div
          className="absolute -top-[25%] left-[50%] h-[150%] w-[35%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(34, 211, 238, 0.24) 0%, rgba(34, 211, 238, 0.1) 30%, rgba(34, 211, 238, 0.04) 55%, transparent 75%)",
            transform: "skewX(6deg)",
            animation: "canopy-ray-2 8s ease-in-out infinite",
            filter: "blur(20px)",
          }}
        />

        <div
          className="absolute -top-[20%] left-[0%] h-[140%] w-[25%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(45, 212, 191, 0.18) 0%, rgba(45, 212, 191, 0.08) 35%, transparent 70%)",
            transform: "skewX(-12deg)",
            animation: "canopy-ray-3 10s ease-in-out infinite",
            filter: "blur(28px)",
          }}
        />

        <div
          className="absolute -top-[35%] left-[70%] h-[170%] w-[20%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0.08) 25%, transparent 60%)",
            transform: "skewX(10deg)",
            animation: "canopy-ray-1 12s ease-in-out infinite reverse",
            filter: "blur(18px)",
          }}
        />

        <div
          className="absolute -top-[15%] left-[30%] h-[130%] w-[40%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(45, 212, 191, 0.2) 0%, rgba(45, 212, 191, 0.08) 20%, transparent 50%)",
            transform: "skewX(-3deg)",
            animation: "canopy-ray-2 14s ease-in-out infinite 3s",
            filter: "blur(34px)",
          }}
        />

        <div
          className="absolute -top-[25%] left-[85%] h-[145%] w-[15%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.08) 30%, transparent 65%)",
            transform: "skewX(15deg)",
            animation: "canopy-ray-3 9s ease-in-out infinite 1.5s",
            filter: "blur(22px)",
          }}
        />
      </div>

      <div className="absolute inset-0">
        {shimmerParticles.map((p, i) => (
          <div
            key={`shimmer-${i}`}
            className="absolute rounded-full bg-teal-200/35"
            style={{
              width: p.size + "px",
              height: p.size + "px",
              left: p.left + "%",
              top: p.top + "%",
              animation: `canopy-shimmer ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}
