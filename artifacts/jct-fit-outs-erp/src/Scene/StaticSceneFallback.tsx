export function StaticSceneFallback() {
  return (
    <div className="scene-canvas scene-poster" aria-hidden="true">
      <div className="scene-poster__grid" />
      <svg className="scene-poster__plan" viewBox="0 0 900 620" fill="none">
        <defs>
          <linearGradient id="plan-blue" x1="150" y1="170" x2="760" y2="470" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" stopOpacity=".95" />
            <stop offset="1" stopColor="#2dd4bf" stopOpacity=".38" />
          </linearGradient>
          <linearGradient id="plan-copper" x1="290" y1="150" x2="600" y2="355" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c4845a" stopOpacity=".9" />
            <stop offset="1" stopColor="#c4845a" stopOpacity=".08" />
          </linearGradient>
          <filter id="plan-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g stroke="url(#plan-blue)" strokeWidth="1.4" opacity=".74">
          <path d="m448 82 300 158v205L448 602 148 445V240L448 82Z" fill="#1b5c76" fillOpacity=".08" />
          <path d="m148 240 300 157 300-157M148 445l300 158 300-158M448 397v206M248 292v205M548 345v207M348 345v205M648 292v205" />
          <path d="m248 292 100-52v105m0 0 100 52m0-105 100-52v105m0 0 100 52m-400 0 100-52v105m200-105 100-52v105" />
          <path d="m148 240 100 52m200-52 100 53m100-105 100-30M448 82v105m-200 0v105m400-105v105" strokeDasharray="4 8" />
        </g>
        <g stroke="url(#plan-copper)" strokeWidth="1.3" filter="url(#plan-glow)" opacity=".8">
          <path d="m248 292 100-52v105m200 0 100-52v105m-400 0 100-52v105" />
          <path d="m348 345 100 52m100 0 100 53" />
        </g>
        <g fill="#83bcff">
          <circle cx="248" cy="292" r="3" /><circle cx="448" cy="397" r="3" />
          <circle cx="648" cy="292" r="3" /><circle cx="548" cy="397" r="3" />
        </g>
      </svg>
      <span className="scene-poster__caption">JCT / BLUEPRINT TO BUILT</span>
    </div>
  );
}