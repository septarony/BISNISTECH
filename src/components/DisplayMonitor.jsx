import { useState, useEffect } from 'react';

// CSS injected once for animations not available in Tailwind
const DISPLAY_STYLES = `
@keyframes fadeInScale {
  0%   { opacity: 0; transform: scale(0.7); }
  60%  { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.15; }
}
@keyframes marquee {
  0%   { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
.anim-fadescale {
  animation: fadeInScale 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}
.anim-blink {
  animation: blink 0.8s ease-in-out 3;
}
.anim-marquee {
  display: inline-block;
  animation: marquee 22s linear infinite;
  white-space: nowrap;
}
`;

function injectStyles() {
  if (document.getElementById('display-monitor-styles')) return;
  const el = document.createElement('style');
  el.id = 'display-monitor-styles';
  el.textContent = DISPLAY_STYLES;
  document.head.appendChild(el);
}

export default function DisplayMonitor({ currentNumber, history, isFullscreen, onToggleFullscreen }) {
  const [animKey, setAnimKey] = useState(0);

  // Inject styles sekali saja
  useEffect(() => { injectStyles(); }, []);

  // Trigger animasi baru setiap currentNumber berubah
  useEffect(() => {
    if (currentNumber !== null) {
      setAnimKey((k) => k + 1);
    }
  }, [currentNumber]);

  return (
    <div
      className="w-full rounded-xl overflow-hidden select-none shrink-0"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 60%, #0a0f1e 100%)',
        border: '2px solid #1e3a5f',
        fontFamily: "'Segment7', 'Share Tech Mono', 'Courier New', monospace",
        minHeight: isFullscreen ? '28vh' : '420px',
      }}
    >
      {/* ── Header Bar ── */}
      <div
        className={`flex items-center justify-between ${isFullscreen ? 'px-3 py-2' : 'px-6 py-3'}`}
        style={{ background: '#0d1f3c', borderBottom: '1px solid #1e3a5f' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500" style={{ boxShadow: '0 0 8px #ef4444' }} />
          <div className="w-3 h-3 rounded-full bg-yellow-400" style={{ boxShadow: '0 0 8px #facc15' }} />
          <div className="w-3 h-3 rounded-full bg-green-400" style={{ boxShadow: '0 0 8px #4ade80' }} />
        </div>
        <p
          className={`text-xs font-semibold tracking-widest uppercase ${isFullscreen ? 'hidden sm:block' : ''}`}
          style={{ color: '#4a7fbf', fontFamily: 'system-ui, sans-serif' }}
        >
          SEPTA · Queue Display System
        </p>
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Keluar Fullscreen' : 'Tampilkan Fullscreen'}
          className="text-xs px-3 py-1 rounded border transition-all hover:opacity-80"
          style={{
            color: '#4a7fbf',
            borderColor: '#1e3a5f',
            background: 'transparent',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {isFullscreen ? '⊠ Exit' : '⛶ Fullscreen'}
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-col md:flex-row" style={{ minHeight: isFullscreen ? '18vh' : '320px' }}>

        {/* LEFT: Nomor Sekarang */}
        <div
          className={`flex-1 flex flex-col items-center justify-center ${isFullscreen ? 'p-4 md:p-5' : 'p-8 md:p-12'}`}
          style={{ borderRight: '1px solid #1e3a5f' }}
        >
          <p
            className={`text-xs tracking-[0.4em] uppercase font-semibold ${isFullscreen ? 'mb-2' : 'mb-6'}`}
            style={{ color: '#4a7fbf', fontFamily: 'system-ui, sans-serif' }}
          >
            ◆ NOMOR SEKARANG ◆
          </p>

          <div
            key={animKey}
            className={currentNumber !== null ? 'anim-fadescale' : ''}
            style={{
              fontSize: isFullscreen ? 'clamp(2.2rem, 10vw, 5rem)' : 'clamp(4rem, 12vw, 8rem)',
              fontWeight: 900,
              lineHeight: 1,
              color: currentNumber !== null ? '#ffd700' : '#1e3a5f',
              textShadow: currentNumber !== null
                ? '0 0 30px #ffd70088, 0 0 60px #ffd70044, 0 0 4px #fff'
                : 'none',
              letterSpacing: '0.05em',
            }}
          >
            {currentNumber !== null ? String(currentNumber).padStart(3, '0') : '---'}
          </div>

          {currentNumber !== null && (
            <p
              className={`${isFullscreen ? 'mt-2 text-xs' : 'mt-6 text-sm'} tracking-widest`}
              style={{ color: '#facc15', fontFamily: 'system-ui, sans-serif' }}
            >
              Silakan menuju loket
            </p>
          )}
        </div>

        {/* RIGHT: Riwayat Panggilan */}
        <div
          className={`w-full md:w-56 flex flex-col ${isFullscreen ? 'p-3' : 'p-6'}`}
          style={{ background: '#080c14' }}
        >
          <p
            className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold"
            style={{ color: '#4a7fbf', fontFamily: 'system-ui, sans-serif' }}
          >
            Riwayat
          </p>

          <div className={`flex flex-col flex-1 ${isFullscreen ? 'gap-2' : 'gap-3'}`}>
            {history.length === 0 ? (
              <p
                className="text-xs text-center mt-4"
                style={{ color: '#1e3a5f', fontFamily: 'system-ui, sans-serif' }}
              >
                — belum ada —
              </p>
            ) : (
              history.map((num, idx) => (
                <div
                  key={`${num}-${idx}`}
                  className={`flex items-center justify-between rounded-lg ${isFullscreen ? 'px-3 py-2' : 'px-4 py-3'}`}
                  style={{
                    background: idx === 0 ? '#0d1f3c' : '#0a1628',
                    border: `1px solid ${idx === 0 ? '#2a5298' : '#1a2a4a'}`,
                    opacity: 1 - idx * 0.2,
                  }}
                >
                  <span
                    className="text-xs"
                    style={{ color: '#4a7fbf', fontFamily: 'system-ui, sans-serif' }}
                  >
                    #{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: isFullscreen ? '1.1rem' : '1.5rem',
                      fontWeight: 700,
                      color: idx === 0 ? '#ffd700' : '#a0aec0',
                      textShadow: idx === 0 ? '0 0 10px #ffd70055' : 'none',
                    }}
                  >
                    {String(num).padStart(3, '0')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Running Text / Ticker ── */}
      <div
        className={`overflow-hidden ${isFullscreen ? 'px-3 py-2' : 'px-4 py-3'}`}
        style={{ background: '#050810', borderTop: '1px solid #1e3a5f' }}
      >
        <span
          className={`anim-marquee font-semibold ${isFullscreen ? 'text-[11px]' : 'text-xs'}`}
          style={{
            color: '#4a7fbf',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.08em',
          }}
        >
          ★&nbsp;&nbsp;Selamat Datang di BisnisTech&nbsp;&nbsp;—&nbsp;&nbsp;Silakan menunggu nomor Anda dipanggil&nbsp;&nbsp;—&nbsp;&nbsp;Harap tetap tenang dan tertib&nbsp;&nbsp;—&nbsp;&nbsp;Terima kasih atas kesabaran Anda&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </span>
      </div>
    </div>
  );
}
