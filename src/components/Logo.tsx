import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 
          THE KINETIC VAULT LOGO (HEX-VAULT)
          Meaning:
          - The Hexagon: The strongest geometric shape in nature.
          - Wireframe structure: Transparency, precision, and architectural logic.
          - Concentric Hexagons: The layers of the 5 pillars orbiting the core identity.
          - Connected Vertices: Holistic alignment and kinetic energy distribution.
        */}
        
        {/* Paths for the wireframe structure */}
        {/* Lines from center to outer vertices */}
        <path d="M50 50L50 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
        <path d="M50 50L89 27.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
        <path d="M50 50L89 72.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
        <path d="M50 50L50 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
        <path d="M50 50L11 72.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />
        <path d="M50 50L11 27.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-40" />

        {/* Outer Hexagon (Scale 1.0) */}
        <path d="M50 5L89 27.5L89 72.5L50 95L11 72.5L11 27.5Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />

        {/* Middle Hexagon (Scale 0.6) */}
        <path 
          d="M50 23L73.4 36.5L73.4 63.5L50 77L26.6 63.5L26.6 36.5Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinejoin="round" 
          className="opacity-60"
        />

        {/* Inner Hexagon (Scale 0.3) */}
        <path 
          d="M50 36.5L61.7 43.25L61.7 56.75L50 63.5L38.3 56.75L38.3 43.25Z" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinejoin="round" 
          className="opacity-80"
        />

        {/* Glow effect for the center */}
        <circle cx="50" cy="50" r="5" fill="currentColor" className="text-indigo-500 animate-pulse" />
      </svg>
    </div>
  );
}
