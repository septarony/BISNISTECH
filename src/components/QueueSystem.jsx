import { useState, useCallback, useEffect, useRef } from 'react';
import DisplayMonitor from './DisplayMonitor';

// Fungsi TTS: Panggil nomor via Web Speech API
function announceNumber(number) {
  if (!window.speechSynthesis) return;

  // Hentikan suara sebelumnya agar tidak tumpang tindih
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(
    `Nomor antrean ${number}, silakan menuju loket.`
  );
  utterance.lang = 'id-ID';
  utterance.rate = 0.9;
  utterance.pitch = 1.1;

  // Pilih suara wanita bahasa Indonesia jika tersedia
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(
    (v) => v.lang === 'id-ID' && v.name.toLowerCase().includes('female')
  ) || voices.find((v) => v.lang === 'id-ID');
  if (idVoice) utterance.voice = idVoice;

  window.speechSynthesis.speak(utterance);
}

export default function QueueSystem() {
  const pageRef = useRef(null);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [queueList, setQueueList] = useState([]);
  const [nextTicketNumber, setNextTicketNumber] = useState(1);
  const [stats, setStats] = useState({ served: 0, waiting: 0 });
  const [history, setHistory] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await pageRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen tidak didukung atau ditolak oleh browser.', error);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Fungsi: Ambil Tiket (Kiosk)
  const takeTicket = useCallback(() => {
    const newNumber = nextTicketNumber;
    setQueueList((prev) => [...prev, newNumber]);
    setNextTicketNumber((prev) => prev + 1);
    setStats((prev) => ({ ...prev, waiting: prev.waiting + 1 }));
  }, [nextTicketNumber]);

  // Fungsi: Panggil Nomor Berikutnya (Staff)
  const callNext = useCallback(() => {
    if (queueList.length === 0) {
      alert('Tidak ada nomor antrean yang tersisa');
      return;
    }
    const [firstNumber, ...rest] = queueList;
    setCurrentNumber(firstNumber);
    setQueueList(rest);
    setStats((prev) => ({
      ...prev,
      waiting: prev.waiting - 1,
      served: prev.served + 1,
    }));
    // Simpan ke history (max 4 nomor terakhir, terbaru di depan)
    setHistory((prev) => [firstNumber, ...prev].slice(0, 4));
    announceNumber(firstNumber);
  }, [queueList]);

  // Fungsi: Reset Simulasi
  const resetSimulation = useCallback(() => {
    setCurrentNumber(null);
    setQueueList([]);
    setNextTicketNumber(1);
    setStats({ served: 0, waiting: 0 });
    setHistory([]);
  }, []);

  return (
    <div
      ref={pageRef}
      className={`min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 ${isFullscreen ? 'h-screen overflow-hidden p-2 sm:p-3' : 'p-6 md:p-8'}`}
    >
      <div className={`${isFullscreen ? 'max-w-none h-full flex flex-col' : 'max-w-6xl'} mx-auto`}>
        {/* Digital Display Monitor */}
        <DisplayMonitor
          currentNumber={currentNumber}
          history={history}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />

        {/* Header */}
        <div className={`text-center ${isFullscreen ? 'mb-2 mt-2' : 'mb-8 mt-8'}`}>
          <h1 className={`${isFullscreen ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'} font-bold text-white mb-2`}>
            Simulasi Sistem Antrian SEPTA
          </h1>
          <p className={`${isFullscreen ? 'hidden md:block text-xs' : 'text-sm md:text-base'} text-gray-300`}>
            Uji alur layanan antrean real-time di sini
          </p>
        </div>

        {/* Main Grid */}
        <div className={`grid ${isFullscreen ? 'grid-cols-2 gap-2 mb-2 flex-1 min-h-0' : 'grid-cols-1 lg:grid-cols-2 gap-6 mb-8'}`}>
          {/* KIOSK SECTION - Ambil Tiket */}
          <div className={`bg-slate-800 border-2 border-blue-500 rounded-xl ${isFullscreen ? 'p-2 sm:p-3 overflow-hidden h-full' : 'p-6 md:p-8'} shadow-lg`}>
            <div className={`text-center ${isFullscreen ? 'mb-3' : 'mb-8'}`}>
              <h2 className={`${isFullscreen ? 'text-sm sm:text-base' : 'text-2xl'} font-bold text-white mb-1`}>🎫 Kiosk</h2>
              <p className={`${isFullscreen ? 'text-xs' : 'text-sm'} text-gray-300`}>Ambil Nomor Antrean</p>
            </div>

            <div className={`bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg ${isFullscreen ? 'p-2 mb-2' : 'p-8 mb-6'} text-center cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={takeTicket}>
              <p className={`${isFullscreen ? 'text-[10px] mb-1' : 'text-sm mb-3'} text-gray-200`}>Tekan untuk Ambil Tiket</p>
              <div className={`${isFullscreen ? 'text-2xl' : 'text-5xl'} font-bold text-white`}>+</div>
              <p className={`${isFullscreen ? 'text-[10px] mt-1' : 'text-xs mt-3'} text-gray-300`}>Nomor Berikutnya: {nextTicketNumber}</p>
            </div>

            <button
              onClick={takeTicket}
              className={`w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold ${isFullscreen ? 'py-2 px-2 text-xs sm:text-sm' : 'py-3 px-4'} rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95`}>
              Ambil Tiket
            </button>

            {/* Queue Preview */}
            <div className={`${isFullscreen ? 'mt-3 pt-3' : 'mt-6 pt-6'} border-t border-slate-700`}>
              <h3 className={`${isFullscreen ? 'text-xs mb-2' : 'text-sm mb-4'} text-white font-semibold`}>Daftar Menunggu ({queueList.length})</h3>
              {queueList.length === 0 ? (
                <p className={`${isFullscreen ? 'text-xs py-1' : 'text-sm py-4'} text-gray-400 text-center`}>Tidak ada antrean</p>
              ) : (
                <div className={`grid grid-cols-4 gap-1 ${isFullscreen ? 'max-h-14' : 'max-h-32'} overflow-y-auto`}>
                  {queueList.map((num) => (
                    <div
                      key={num}
                      className={`${isFullscreen ? 'py-1 text-xs' : 'py-2 text-sm'} bg-blue-500 bg-opacity-30 border border-blue-400 rounded-lg text-center text-white font-semibold`}>
                      {num}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DISPLAY MONITOR - Nomor Sekarang */}
          <div className={`bg-slate-800 border-2 border-amber-500 rounded-xl ${isFullscreen ? 'p-2 sm:p-3 overflow-hidden h-full' : 'p-6 md:p-8'} shadow-lg`}>
            <div className={`text-center ${isFullscreen ? 'mb-3' : 'mb-8'}`}>
              <h2 className={`${isFullscreen ? 'text-sm sm:text-base' : 'text-2xl'} font-bold text-white mb-1`}>📊 Monitor Display</h2>
              <p className={`${isFullscreen ? 'text-xs' : 'text-sm'} text-gray-300`}>Nomor Sedang Dilayani</p>
            </div>

            {/* Current Number Display */}
            <div className={`bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg ${isFullscreen ? 'p-2 mb-2 min-h-20' : 'p-8 mb-6 min-h-48'} text-center flex flex-col justify-center`}>
              {currentNumber === null ? (
                <>
                  <p className={`${isFullscreen ? 'text-[10px] mb-1' : 'text-sm mb-4'} text-gray-200`}>MENUNGGU...</p>
                  <div className={`${isFullscreen ? 'text-3xl' : 'text-6xl'} font-bold text-white`}>--</div>
                  <p className={`${isFullscreen ? 'text-[10px] mt-1' : 'text-xs mt-4'} text-gray-300`}>Tekan tombol Panggil untuk menampilkan</p>
                </>
              ) : (
                <>
                  <p className={`${isFullscreen ? 'text-[10px] mb-1' : 'text-sm mb-4'} text-gray-200`}>NOMOR SEKARANG</p>
                  <div className={`${isFullscreen ? 'text-4xl' : 'text-7xl'} font-bold text-white animate-pulse`}>{currentNumber}</div>
                  <p className={`${isFullscreen ? 'text-[10px] mt-1' : 'text-xs mt-4'} text-gray-300`}>Silahkan menuju counter</p>
                </>
              )}
            </div>

            <button
              onClick={callNext}
              className={`w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold ${isFullscreen ? 'py-2 px-2 text-xs sm:text-sm' : 'py-3 px-4'} rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95`}>
              Panggil Nomor Berikutnya
            </button>

            {/* Statistics */}
            <div className={`${isFullscreen ? 'mt-2 pt-2 gap-1' : 'mt-6 pt-6 gap-4'} border-t border-slate-700 grid grid-cols-2`}>
              <div className={`bg-slate-700 rounded-lg ${isFullscreen ? 'p-2' : 'p-4'} text-center`}>
                <p className="text-gray-400 text-xs mb-1">Dilayani</p>
                <p className={`${isFullscreen ? 'text-xl' : 'text-2xl'} font-bold text-green-400`}>{stats.served}</p>
              </div>
              <div className={`bg-slate-700 rounded-lg ${isFullscreen ? 'p-2' : 'p-4'} text-center`}>
                <p className="text-gray-400 text-xs mb-1">Menunggu</p>
                <p className={`${isFullscreen ? 'text-xl' : 'text-2xl'} font-bold text-red-400`}>{stats.waiting}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className={`flex flex-col md:flex-row ${isFullscreen ? 'gap-2' : 'gap-4'} justify-center`}>
          <button
            onClick={resetSimulation}
            className={`${isFullscreen ? 'px-4 py-2 text-sm' : 'px-6 py-3'} bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg`}>
            Reset Simulasi
          </button>
          <p className={`${isFullscreen ? 'hidden' : 'text-sm py-3'} text-gray-400 text-center md:text-left`}>
            💡 Tip: Ambil tiket di Kiosk terlebih dahulu, lalu panggil di Monitor Display
          </p>
        </div>

        {/* Info Panel */}
        <div className={`${isFullscreen ? 'hidden' : 'mt-8'} bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-4 md:p-6`}>
          <h3 className="text-white font-semibold mb-3">ℹ️ Cara Menggunakan</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>• <strong>Kiosk (Kiri):</strong> Tekan tombol "Ambil Tiket" untuk menambah antrian</li>
            <li>• <strong>Monitor (Kanan):</strong> Tekan "Panggil Nomor Berikutnya" untuk menampilkan nomor sekarang</li>
            <li>• Lihat statistik real-time: berapa yang sudah dilayani dan yang masih menunggu</li>
            <li>• Tekan "Reset Simulasi" untuk mulai dari awal</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
