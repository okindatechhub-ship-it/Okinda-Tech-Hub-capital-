import React from 'react';
import { Building2, Phone, Mail, MapPin, Shield, Heart } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  return (
    <footer className="bg-[#0A1926] text-slate-300 text-xs border-t border-[#1b3d5e] pb-24 md:pb-8 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#102A43] border border-[#D9A441]/40 flex items-center justify-center text-[#D9A441]">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Capital Home <span className="text-[#D9A441]">Residence</span>
              </span>
            </div>
            <p className="text-[#D9A441] font-bold text-[11px] tracking-wider uppercase">
              Live. Connect. Buy. Sell.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Official student residence platform for Capital Home Residence. Providing room vacancy tracking, verified student marketplace, social network, and direct messaging.
            </p>
          </div>

          {/* Residence Info */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Residence Facilities</h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>
                <strong className="text-[#D9A441]">54 Old Rooms:</strong> KSh 15,000 / semester
              </li>
              <li>
                <strong className="text-[#D9A441]">28 New Rooms:</strong> KSh 25,000 / semester
              </li>
              <li>24/7 Borehole Clean Water</li>
              <li>Solar Backup System & Lighting</li>
              <li>Optical Fiber Wi-Fi Included</li>
              <li>24/7 CCTV & Security Guard</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Platform Hubs</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => { setCurrentTab('residence'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-slate-300 hover:text-[#D9A441] transition"
                >
                  Room Vacancies & Booking
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentTab('marketplace'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-slate-300 hover:text-[#D9A441] transition"
                >
                  Campus Marketplace
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentTab('community'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-slate-300 hover:text-[#D9A441] transition"
                >
                  Community Social Feed
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentTab('account-selling'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-slate-300 hover:text-[#D9A441] transition"
                >
                  Apply for Advertiser Verification
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Safety */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Office & Contact</h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
                <span>Capital Home Residence, Block A Caretaker Desk</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D9A441] shrink-0" />
                <span>+254 711 000 111 (Caretaker Desk)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D9A441] shrink-0" />
                <span>info@capitalhome.co.ke</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#102A43] border border-[#1b3d5e] text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-[#D9A441] mb-0.5">
                  <Shield className="w-3.5 h-3.5" /> Direct Payment Policy
                </div>
                Manual direct payment via seller instructions or caretaker office. Inspect items before sending money.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#1b3d5e] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} Capital Home Residence. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Live. Connect. Buy. Sell. <Heart className="w-3 h-3 text-[#D9A441] fill-[#D9A441] inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
