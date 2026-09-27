import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  Store,
  Search,
  ShoppingBag,
  MessageSquare,
  Bookmark,
  Share2,
  PlusCircle,
  AlertCircle,
  Tag,
  Star,
  Heart,
  Laptop,
  Smartphone,
  Tv,
  Armchair,
  BookOpen,
  Home,
  Shirt,
  Wrench
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Product, Category } from '../types';
import { AddProductModal } from '../components/AddProductModal';

interface MarketplacePageProps {
  onSelectProduct: (productId: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  onOpenChatWithUser?: (userId: string, initialMessage?: string, productRef?: any) => void;
  setCurrentTab: (tab: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onSelectProduct,
  openAuthModal,
  onOpenChatWithUser,
  setCurrentTab,
}) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Saved products
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);

  // Add product modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  useEffect(() => {
    loadProducts();
    if (user) {
      loadSavedProducts();
    }
  }, [selectedCategory, selectedCondition, sortOption, user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCondition !== 'all') params.append('condition', selectedCondition);
      if (sortOption) params.append('sort', sortOption);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiRequest(`/products?${params.toString()}`);
      setProducts(res.products || []);
      setCategories(res.categories || []);
    } catch (err: any) {
      toast.error('Failed to load marketplace products');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedProducts = async () => {
    try {
      const res = await apiRequest('/saved');
      if (res?.products) {
        setSavedProductIds(res.products.map((p: Product) => p.id));
      }
    } catch {
      // ignore
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleToggleSave = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await apiRequest('/saved/toggle', {
        method: 'POST',
        body: JSON.stringify({ item_type: 'product', item_id: productId }),
      });
      if (res.is_saved) {
        setSavedProductIds(prev => [...prev, productId]);
        toast.success('Saved to wishlist');
      } else {
        setSavedProductIds(prev => prev.filter(id => id !== productId));
        toast.info('Removed from saved');
      }
    } catch (err) {
      toast.error('Failed to update saved items');
    }
  };

  const handleChatWithSeller = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (onOpenChatWithUser) {
      onOpenChatWithUser(
        product.advertiser_id,
        `Hi! I am interested in buying "${product.name}" priced at KSh ${product.price.toLocaleString()}. Is it currently available for pickup?`,
        product
      );
    }
  };

  const handleSellClick = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsAddProductOpen(true);
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'cat-computers': return Laptop;
      case 'cat-phones': return Smartphone;
      case 'cat-electronics': return Tv;
      case 'cat-furniture': return Armchair;
      case 'cat-books': return BookOpen;
      case 'cat-household': return Home;
      case 'cat-clothing': return Shirt;
      case 'cat-services': return Wrench;
      default: return Tag;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#102A43] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b3d5e] border border-[#D9A441]/40 text-[#D9A441] text-xs font-bold uppercase tracking-wider">
            <Store className="w-4 h-4" />
            <span>Campus Student Marketplace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Capital Home Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Live. Connect. Buy. Sell. Laptops, phones, dorm essentials, study desks, and student services.
          </p>
        </div>

        <button
          onClick={handleSellClick}
          className="self-start md:self-center px-6 py-3.5 bg-[#D9A441] hover:bg-[#c99532] text-[#102A43] rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Sell an Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search laptops, smartphones, desk chairs, textbooks..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-[#E4E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] bg-white text-[#172B4D]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold transition shrink-0"
          >
            Search
          </button>
        </form>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#102A43] text-[#D9A441] shadow-xs'
                : 'bg-[#F1F3F5] text-[#667085] hover:text-[#102A43]'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => {
            const Icon = getCategoryIcon(cat.id);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#102A43] text-[#D9A441] shadow-xs'
                    : 'bg-[#F1F3F5] text-[#667085] hover:text-[#102A43]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Condition & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E4E7EC]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#667085] font-semibold">Condition:</span>
            {(['all', 'New', 'Used', 'Refurbished'] as const).map(c => (
              <button
                key={c}
                onClick={() => setSelectedCondition(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  selectedCondition === c
                    ? 'bg-[#102A43] text-[#D9A441]'
                    : 'text-[#667085] hover:bg-[#F1F3F5]'
                }`}
              >
                {c === 'all' ? 'All Conditions' : c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="py-1.5 px-3 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] bg-white text-[#172B4D]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E4E7EC] p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F3F5] text-[#102A43] flex items-center justify-center mx-auto shadow-xs">
            <Store className="w-8 h-8 text-[#D9A441]" />
          </div>
          <h3 className="text-lg font-bold text-[#102A43]">No marketplace listings yet</h3>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            Be the first resident to list laptops, study furniture, gadgets, or campus services!
          </p>
          <button
            onClick={handleSellClick}
            className="px-6 py-2.5 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold hover:bg-[#1b3d5e] transition"
          >
            + Post Product Advertisement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map(product => {
            const isSaved = savedProductIds.includes(product.id);
            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product.id)}
                className="group bg-white rounded-2xl border border-[#E4E7EC] hover:border-[#D9A441]/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
              >
                {/* 1. PRODUCT IMAGE WITH HEART */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  <img
                    src={product.images[0] || '/src/assets/images/marketplace_item_setup_1790501145428.jpg'}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Condition Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[#102A43]/85 backdrop-blur-xs text-[#D9A441] text-[10px] font-bold">
                    {product.condition}
                  </div>

                  {/* Heart / Wishlist button */}
                  <button
                    onClick={(e) => handleToggleSave(product.id, e)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-[#102A43]/70 hover:bg-[#102A43] text-white backdrop-blur-xs transition"
                    title={isSaved ? 'Remove from wishlist' : 'Save item'}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                  </button>

                  {/* Stock tag */}
                  <div className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-xs ${
                    product.quantity > 0 ? 'bg-[#16A34A] text-white' : 'bg-[#DC2626] text-white'
                  }`}>
                    {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>

                {/* 2. PRODUCT DETAILS SECTION */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Category & Seller */}
                    <div className="flex items-center justify-between text-[11px] text-[#667085]">
                      <span className="font-semibold text-[#D9A441] uppercase tracking-wider text-[10px]">
                        {product.category_name || 'Marketplace'}
                      </span>
                      <span className="truncate max-w-[120px]">
                        {product.seller?.name || product.advertiser_name || 'Resident Seller'}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-sm text-[#102A43] line-clamp-2 leading-tight group-hover:text-[#D9A441] transition">
                      {product.name}
                    </h3>

                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-1.5 text-xs text-[#667085]">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="ml-1 font-bold text-[#172B4D] text-xs">
                          {product.rating || '4.8'}
                        </span>
                      </div>
                      <span>({product.reviews_count || 12} reviews)</span>
                    </div>

                    {/* Price & Discount */}
                    <div className="pt-1 flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-black text-[#102A43]">
                        KSh {product.price.toLocaleString()}
                      </span>
                      {product.discount_price && product.discount_price > product.price && (
                        <span className="text-xs text-[#667085] line-through">
                          KSh {product.discount_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Add to Cart & Chat */}
                  <div className="pt-2 border-t border-[#E4E7EC] flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                        toast.success(`Added ${product.name} to cart`);
                      }}
                      className="flex-1 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      onClick={(e) => handleChatWithSeller(product, e)}
                      className="p-2 border border-[#E4E7EC] hover:bg-[#F1F3F5] text-[#102A43] rounded-xl transition"
                      title="Chat with seller"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#D9A441]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Combined Seller Product Setup Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={() => loadProducts()}
      />
    </div>
  );
};
