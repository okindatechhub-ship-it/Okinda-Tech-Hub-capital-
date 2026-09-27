import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isAndroidFrameActive: boolean;
  setIsAndroidFrameActive: (active: boolean) => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isAndroidFrameActive,
  setIsAndroidFrameActive,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A1926] text-[#172B4D] flex flex-col items-center">
      {/* Top Device Simulator Controller Bar (visible on md+ screens) */}
      <div className="w-full bg-[#102A43] text-white border-b border-[#1b3d5e] py-1.5 px-4 text-xs hidden md:flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D9A441] animate-pulse" />
          <span className="font-semibold tracking-wide text-white">CAPITAL HOME RESIDENCE</span>
          <span className="text-slate-400">·</span>
          <span className="text-[#D9A441] font-medium">Live. Connect. Buy. Sell.</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">Android Production App</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAndroidFrameActive(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              isAndroidFrameActive
                ? 'bg-[#D9A441] text-[#102A43] shadow'
                : 'bg-[#1b3d5e] text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Phone View (Pixel / Galaxy)</span>
          </button>

          <button
            onClick={() => setIsAndroidFrameActive(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              !isAndroidFrameActive
                ? 'bg-[#D9A441] text-[#102A43] shadow'
                : 'bg-[#1b3d5e] text-slate-300 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Full Responsive View</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      {isAndroidFrameActive ? (
        <div className="w-full flex-1 flex items-center justify-center p-0 md:p-6 bg-[#07131D]">
          {/* Android Mobile Chassis */}
          <div className="w-full md:max-w-[430px] h-screen md:h-[920px] bg-[#F7F8FA] md:rounded-[44px] md:shadow-[0_25px_70px_rgba(0,0,0,0.65)] md:border-[10px] md:border-[#1E293B] flex flex-col overflow-hidden relative">
            {/* Android Status Bar */}
            <div className="h-9 bg-[#102A43] text-white px-5 flex items-center justify-between text-[11px] font-medium select-none shrink-0 z-50">
              <span>{currentTime || '09:41'}</span>

              {/* Punch-hole camera notch */}
              <div className="w-3.5 h-3.5 bg-black rounded-full border border-slate-700/50" />

              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-[10px] font-bold text-[#D9A441]">5G</span>
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4 text-[#D9A441]" />
              </div>
            </div>

            {/* Scrollable Android App Content */}
            <div className="flex-1 overflow-y-auto relative flex flex-col">
              {children}
            </div>

            {/* Android Bottom Gesture Bar */}
            <div className="h-4 bg-[#F7F8FA] flex items-center justify-center shrink-0 z-40">
              <div className="w-32 h-1 bg-[#172B4D]/30 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-col bg-[#F7F8FA]">
          {children}
        </div>
      )}
    </div>
  );
};
