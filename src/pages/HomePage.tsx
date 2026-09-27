import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  DoorOpen,
  Store,
  Users,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ShoppingBag,
  ChevronRight,
  Flame,
  Zap,
  Droplets,
  Wifi,
  Lock,
  Building2
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Room, Product, Post } from '../types';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
  onSelectRoom: (roomId: string) => void;
  onSelectProduct: (productId: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setCurrentTab,
  onSelectRoom,
  onSelectProduct,
  openAuthModal,
}) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [residenceStats, setResidenceStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        // Load rooms
        const roomsRes = await apiRequest('/rooms');
        if (roomsRes?.rooms) {
          setFeaturedRooms(
            roomsRes.rooms
              .filter((r: Room) => r.status === 'MOVING_OUT' || r.status === 'AVAILABLE')
              .slice(0, 4)
          );
          setResidenceStats(roomsRes.stats);
        }

        // Load products
        const prodRes = await apiRequest('/products');
        if (prodRes?.products) {
          setMarketplaceProducts(prodRes.products.slice(0, 4));
        }

        // Load posts
        const postsRes = await apiRequest('/posts');
        if (Array.isArray(postsRes)) {
          setCommunityPosts(postsRes.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setCurrentTab('residence');
  };

  const getStatusBadge = (status: Room['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#16A34A]/15 text-[#16A34A] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            Available Now
          </span>
        );
      case 'MOVING_OUT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D97706]/15 text-[#D97706] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Upcoming Vacancy
          </span>
        );
      case 'RESERVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DC2626]/15 text-[#DC2626]">
            Reserved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F1F3F5] text-[#667085]">
            Occupied
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#102A43] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 shadow-xl">
        {/* Background photo with subtle measured contrast scrim */}
        <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
          <img
            src="/src/assets/images/hero_capital_residence_1790501121492.jpg"
            alt="Capital Home Residence"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b3d5e] border border-[#D9A441]/40 text-[#D9A441] text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Residence Community & Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Capital Home <span className="text-[#D9A441]">Residence</span>
          </h1>

          <p className="text-xl sm:text-2xl font-bold text-slate-100 tracking-wide">
            Live. Connect. Buy. Sell.
          </p>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Discover upcoming room vacancies before anyone else, buy and sell verified campus items, create community posts, and chat securely with fellow residents.
          </p>

          {/* Global Search Bar */}
          <form onSubmit={handleGlobalSearch} className="max-w-xl mx-auto pt-1">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, rooms, sellers or posts..."
                className="w-full pl-11 pr-28 py-3.5 bg-white text-[#172B4D] placeholder:text-slate-400 text-xs sm:text-sm rounded-2xl border border-white/20 focus:outline-none focus:ring-3 focus:ring-[#D9A441] shadow-lg transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold shadow transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setCurrentTab('residence')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b3d5e] hover:bg-[#234b73] text-white text-xs font-semibold border border-white/10 transition"
            >
              <DoorOpen className="w-4 h-4 text-[#D9A441]" />
              <span>Find a Room</span>
            </button>
            <button
              onClick={() => setCurrentTab('marketplace')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b3d5e] hover:bg-[#234b73] text-white text-xs font-semibold border border-white/10 transition"
            >
              <Store className="w-4 h-4 text-[#D9A441]" />
              <span>Marketplace</span>
            </button>
            <button
              onClick={() => setCurrentTab('community')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b3d5e] hover:bg-[#234b73] text-white text-xs font-semibold border border-white/10 transition"
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>Community</span>
            </button>
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else setCurrentTab('account-selling');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D9A441] hover:bg-[#c49132] text-[#102A43] text-xs font-extrabold shadow transition"
            >
              <Flame className="w-4 h-4 text-[#102A43]" />
              <span>Sell Something</span>
            </button>
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else setCurrentTab('messages');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b3d5e] hover:bg-[#234b73] text-white text-xs font-semibold border border-white/10 transition"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Messages</span>
            </button>
          </div>
        </div>

        {/* Quick Facility Perks Bar */}
        <div className="mt-10 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-slate-200 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1b3d5e]/70 border border-white/10 backdrop-blur-sm">
            <Droplets className="w-4 h-4 text-[#D9A441] shrink-0" />
            <span className="truncate">24/7 Borehole Clean Water</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1b3d5e]/70 border border-white/10 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-[#D9A441] shrink-0" />
            <span className="truncate">Solar Backup System</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1b3d5e]/70 border border-white/10 backdrop-blur-sm">
            <Wifi className="w-4 h-4 text-[#D9A441] shrink-0" />
            <span className="truncate">Fast Optical Fiber Wi-Fi</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1b3d5e]/70 border border-white/10 backdrop-blur-sm">
            <Lock className="w-4 h-4 text-[#D9A441] shrink-0" />
            <span className="truncate">24/7 CCTV & Gate Guard</span>
          </div>
        </div>
      </section>

      {/* 2. RESIDENCE OVERVIEW & 82 ROOMS BREAKDOWN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 border border-[#E4E7EC] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#D9A441] text-xs font-bold uppercase tracking-wider mb-1">
                <Building2 className="w-4 h-4" />
                <span>Residence Management System</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#102A43]">
                Capital Home Residence Overview
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
                Total of 82 rooms with real-time occupancy and early move-out announcements.
              </p>
            </div>

            <button
              onClick={() => setCurrentTab('residence')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold transition shadow-xs"
            >
              <span>Explore All 82 Rooms</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
              <div className="text-[11px] font-bold text-[#667085] uppercase">Total Rooms</div>
              <div className="text-2xl font-extrabold text-[#102A43] mt-1 tabular-nums">82</div>
              <div className="text-[11px] text-[#667085] mt-0.5">54 Old · 28 New</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
              <div className="text-[11px] font-bold text-[#667085] uppercase">Available Now</div>
              <div className="text-2xl font-extrabold text-[#16A34A] mt-1 tabular-nums">
                {residenceStats?.available ?? 6}
              </div>
              <div className="text-[11px] text-[#667085] mt-0.5">Immediate move-in</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
              <div className="text-[11px] font-bold text-[#667085] uppercase">Upcoming Vacancies</div>
              <div className="text-2xl font-extrabold text-[#D97706] mt-1 tabular-nums">
                {residenceStats?.moving_out ?? 3}
              </div>
              <div className="text-[11px] text-[#667085] mt-0.5">Move-out notice posted</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
              <div className="text-[11px] font-bold text-[#667085] uppercase">Semester Pricing</div>
              <div className="text-base font-extrabold text-[#102A43] mt-1">
                KSh 15k <span className="text-xs font-normal text-[#667085]">/ </span>25k
              </div>
              <div className="text-[11px] text-[#667085] mt-0.5">Old Wing / New Wing</div>
            </div>
          </div>

          {/* Featured Available / Upcoming Vacancies */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102A43]">
                Available Rooms & Upcoming Vacancies
              </h3>
              <button
                onClick={() => setCurrentTab('residence')}
                className="text-xs font-bold text-[#D9A441] hover:underline flex items-center gap-1"
              >
                <span>View Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className="group bg-white rounded-2xl border border-[#E4E7EC] hover:border-[#D9A441]/50 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={room.images[0] || '/src/assets/images/room_interior_capital_1790501134217.jpg'}
                      alt={room.room_number}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      {getStatusBadge(room.status)}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-[#102A43]/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs">
                      {room.room_type}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#102A43] group-hover:text-[#D9A441] transition">
                        {room.room_number}
                      </h4>
                      <p className="text-xs text-[#667085] line-clamp-1 mt-0.5">
                        {room.amenities.slice(0, 3).join(' · ')}
                      </p>
                    </div>

                    {room.status === 'MOVING_OUT' && (
                      <div className="text-[11px] font-semibold text-[#D97706] flex items-center gap-1 bg-[#fef8eb] px-2 py-1 rounded-lg">
                        <Calendar className="w-3 h-3" />
                        <span>Vacating: {room.move_out_date || 'End of Semester'}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#667085] uppercase">Price</div>
                        <div className="text-sm font-extrabold text-[#102A43]">
                          KSh {room.price.toLocaleString()}
                          <span className="text-[10px] font-normal text-[#667085]"> /sem</span>
                        </div>
                      </div>

                      <span className="px-3 py-1.5 rounded-xl bg-[#F7F8FA] group-hover:bg-[#102A43] text-[#172B4D] group-hover:text-[#D9A441] text-xs font-bold transition">
                        Details
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAMPUS MARKETPLACE HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 border border-[#E4E7EC] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#D9A441] text-xs font-bold uppercase tracking-wider mb-1">
                <Store className="w-4 h-4" />
                <span>Verified Student Marketplace</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#102A43]">
                Featured Marketplace Deals
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
                Buy and sell directly with verified student advertisers and residents.
              </p>
            </div>

            <button
              onClick={() => setCurrentTab('marketplace')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold transition shadow-xs"
            >
              <span>Browse All Items</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketplaceProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-[#E4E7EC] hover:border-[#D9A441]/50 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div
                  onClick={() => onSelectProduct(product.id)}
                  className="relative h-44 overflow-hidden bg-slate-100 cursor-pointer"
                >
                  <img
                    src={product.images[0] || '/src/assets/images/marketplace_item_setup_1790501145428.jpg'}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-[#102A43]/90 text-[#D9A441] text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs">
                    {product.condition}
                  </div>
                  {product.is_featured && (
                    <div className="absolute top-2.5 right-2.5 bg-[#D9A441] text-[#102A43] text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                      HOT DEAL
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div onClick={() => onSelectProduct(product.id)} className="cursor-pointer">
                    <h4 className="font-bold text-sm text-[#102A43] line-clamp-1 group-hover:text-[#D9A441] transition">
                      {product.name}
                    </h4>
                    <p className="text-xs text-[#667085] line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#667085] uppercase">Price</div>
                      <div className="text-sm font-extrabold text-[#102A43]">
                        KSh {product.price.toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToCart(product);
                        toast.success(`Added ${product.name} to cart!`);
                      }}
                      className="p-2 rounded-xl bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] transition shadow-xs"
                      title="Add to cart"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RESIDENCE COMMUNITY SNIPPET */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 border border-[#E4E7EC] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#D9A441] text-xs font-bold uppercase tracking-wider mb-1">
                <Users className="w-4 h-4" />
                <span>Residence Social Network</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#102A43]">
                Community Highlights & Announcements
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
                Share updates, ask neighbors, find study buddies, and stay connected.
              </p>
            </div>

            <button
              onClick={() => setCurrentTab('community')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold transition shadow-xs"
            >
              <span>Join the Conversation</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {communityPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setCurrentTab('community')}
                className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] hover:border-[#D9A441]/50 cursor-pointer transition shadow-xs space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={post.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.user_name}`}
                    alt={post.user_name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover bg-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#102A43]">{post.user_name}</h4>
                    <span className="text-[10px] text-[#667085] capitalize">{post.user_role}</span>
                  </div>
                </div>

                <p className="text-xs text-[#172B4D] line-clamp-3 leading-relaxed">
                  {post.content}
                </p>

                <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between text-[11px] text-[#667085]">
                  <span>{post.likes_count || 0} Likes</span>
                  <span>{post.comments_count || 0} Comments</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
