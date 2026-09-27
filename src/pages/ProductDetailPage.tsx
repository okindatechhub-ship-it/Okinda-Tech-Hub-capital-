import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  ShoppingBag,
  MessageSquare,
  Bookmark,
  Share2,
  AlertCircle,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  Star,
  Flag,
  CreditCard,
  Building,
  CheckCircle2,
  Plus,
  Minus,
  X
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Product } from '../types';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  onOpenChatWithUser?: (userId: string, initialMessage?: string, productRef?: any) => void;
  onSelectProduct: (productId: string) => void;
  setCurrentTab: (tab: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onBack,
  openAuthModal,
  onOpenChatWithUser,
  setCurrentTab,
}) => {
  const { user } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  // Selected variations & quantity
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  // Report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Fraud/scam');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    loadProductDetails();
    if (user) {
      checkSavedStatus();
    }
  }, [productId, user]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Product>(`/products/${productId}`);
      setProduct(data);
      if (data.images && data.images.length > 0) {
        setActiveImage(data.images[0]);
      }
      // Set default variations if any
      if (data.variations && data.variations.length > 0) {
        const defaults: Record<string, string> = {};
        data.variations.forEach(v => {
          if (v.options && v.options.length > 0) {
            defaults[v.type] = v.options[0].label;
          }
        });
        setSelectedVariations(defaults);
      }
    } catch (err: any) {
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    try {
      const res = await apiRequest('/saved');
      if (res?.products) {
        setIsSaved(res.products.some((p: Product) => p.id === productId));
      }
    } catch {
      // ignore
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await apiRequest('/saved/toggle', {
        method: 'POST',
        body: JSON.stringify({ item_type: 'product', item_id: productId }),
      });
      setIsSaved(res.is_saved);
      toast.success(res.is_saved ? 'Product saved to wishlist!' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleChat = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!product) return;

    if (onOpenChatWithUser) {
      const variationStr = Object.entries(selectedVariations)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      onOpenChatWithUser(
        product.advertiser_id,
        `Hi! I would like to buy "${product.name}"${variationStr ? ` (${variationStr})` : ''} priced at KSh ${product.price.toLocaleString()}. Can we arrange collection?`,
        product
      );
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const variationDesc = Object.entries(selectedVariations)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    addToCart(product, qty, variationDesc || undefined);
    toast.success(`Added ${qty}x ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsCartOpen(true);
  };

  const handleShareToCommunity = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!product) return;

    try {
      await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: `Check out this student listing: "${product.name}" for KSh ${product.price.toLocaleString()} at Capital Home Marketplace!`,
          product_id: product.id,
          images: product.images.slice(0, 1),
        }),
      });
      toast.success('Shared to Posts feed!');
      setCurrentTab('posts');
    } catch (err: any) {
      toast.error('Failed to share product');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;

    try {
      setSubmittingReport(true);
      await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          target_type: 'product',
          target_id: product.id,
          target_title: product.name,
          reason: reportReason,
          description: reportDescription,
        }),
      });
      toast.success('Report submitted. Management will review this product.');
      setIsReportModalOpen(false);
      setReportDescription('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-6 bg-slate-200 rounded-xl w-1/3" />
            <div className="h-40 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-[#E4E7EC] shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-[#D9A441] mx-auto" />
        <h2 className="text-xl font-bold text-[#102A43]">Product Not Found</h2>
        <p className="text-xs text-[#667085]">
          This listing may have been sold or removed by the seller.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#667085] hover:text-[#102A43] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Market</span>
      </button>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Images */}
        <div className="space-y-3">
          {/* Large Main Image */}
          <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-100 border border-[#E4E7EC] shadow-xs">
            <img
              src={activeImage || product.images[0] || '/src/assets/images/marketplace_item_setup_1790501145428.jpg'}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#102A43]/85 backdrop-blur-xs text-[#D9A441] text-xs font-bold">
              {product.condition}
            </div>
            <button
              onClick={handleToggleSave}
              className="absolute top-3 right-3 p-2.5 rounded-2xl bg-[#102A43]/70 hover:bg-[#102A43] text-white backdrop-blur-xs transition"
              title="Save to wishlist"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'text-[#D9A441] fill-[#D9A441]' : 'text-white'}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                    activeImage === img ? 'border-[#D9A441] shadow-xs' : 'border-[#E4E7EC] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="space-y-5 bg-white p-6 rounded-3xl border border-[#E4E7EC] shadow-xs">
          {/* Title & Brand */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#667085]">
              <span className="font-bold text-[#D9A441] uppercase tracking-wider text-[11px]">
                {product.brand ? `${product.brand} · ` : ''}{product.category_name || 'Marketplace'}
              </span>
              <span className="text-xs">{product.location}</span>
            </div>

            <h1 className="text-2xl font-black text-[#102A43] tracking-tight">
              {product.name}
            </h1>

            {/* ⭐ Rating & Reviews */}
            <div className="flex items-center gap-2 pt-1 text-xs text-[#667085]">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="ml-1 font-bold text-[#172B4D]">
                  {product.rating || '4.8'}
                </span>
              </div>
              <span>({product.reviews_count || 24} verified campus reviews)</span>
            </div>
          </div>

          {/* Price & Discount */}
          <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] flex items-baseline gap-3">
            <span className="text-3xl font-black text-[#102A43]">
              KSh {product.price.toLocaleString()}
            </span>
            {product.discount_price && product.discount_price > product.price && (
              <span className="text-sm font-semibold text-[#667085] line-through">
                KSh {product.discount_price.toLocaleString()}
              </span>
            )}
            <span className="text-[11px] font-bold text-[#16A34A] ml-auto">
              {product.quantity > 0 ? `In Stock (${product.quantity} units)` : 'Out of Stock'}
            </span>
          </div>

          {/* Variations (Color, Storage, Size, etc.) */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#E4E7EC]">
              {product.variations.map((v, i) => (
                <div key={i} className="space-y-1.5">
                  <span className="text-xs font-bold text-[#172B4D]">
                    {v.type}: <span className="font-normal text-[#667085]">{selectedVariations[v.type]}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt, oi) => {
                      const isSelected = selectedVariations[v.type] === opt.label;
                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => setSelectedVariations(prev => ({ ...prev, [v.type]: opt.label }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                            isSelected
                              ? 'bg-[#102A43] text-[#D9A441] border-[#102A43] shadow-xs'
                              : 'bg-white text-[#172B4D] border-[#E4E7EC] hover:border-[#D9A441]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#E4E7EC]">
            <span className="text-xs font-bold text-[#172B4D]">Quantity:</span>
            <div className="flex items-center border border-[#E4E7EC] rounded-xl bg-[#F7F8FA]">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-2 text-[#667085] hover:text-[#102A43]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-4 text-xs font-bold text-[#102A43]">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(Math.min(product.quantity || 99, qty + 1))}
                className="p-2 text-[#667085] hover:text-[#102A43]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                className="py-3 bg-white hover:bg-[#F1F3F5] text-[#102A43] border border-[#102A43] rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <ShoppingBag className="w-4 h-4 text-[#D9A441]" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="py-3 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>Buy Now</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleChat}
                className="flex-1 py-2.5 bg-[#fef8eb] hover:bg-[#fdeece] text-[#102A43] border border-[#D9A441]/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 text-[#D9A441]" />
                <span>Chat with Seller</span>
              </button>

              <button
                onClick={handleShareToCommunity}
                className="p-2.5 border border-[#E4E7EC] hover:bg-[#F1F3F5] text-[#102A43] rounded-xl transition"
                title="Share to Posts"
              >
                <Share2 className="w-4 h-4 text-[#667085]" />
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="p-2.5 border border-[#E4E7EC] hover:bg-rose-50 text-[#667085] hover:text-rose-600 rounded-xl transition"
                title="Report listing"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="pt-4 border-t border-[#E4E7EC] space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#667085]">
              Description
            </h3>
            <p className="text-xs text-[#172B4D] leading-relaxed whitespace-pre-line">
              {product.description || 'No additional description provided by the seller.'}
            </p>
          </div>

          {/* Seller Card */}
          <div className="pt-4 border-t border-[#E4E7EC] p-3.5 rounded-2xl bg-[#F7F8FA] border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={product.seller?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${product.seller?.name || 'Seller'}`}
                alt="Seller avatar"
                className="w-10 h-10 rounded-full object-cover bg-white ring-2 ring-[#E4E7EC]"
              />
              <div>
                <h4 className="font-bold text-xs text-[#102A43]">
                  {product.seller?.name || product.advertiser_name || 'Resident Seller'}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-[#667085]">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <span>4.8 Seller Rating · Resident</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleChat}
              className="px-3 py-1.5 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold hover:bg-[#1b3d5e] transition"
            >
              Chat
            </button>
          </div>

          {/* Delivery Info */}
          {product.delivery && (
            <div className="pt-3 border-t border-[#E4E7EC] flex items-center gap-2 text-xs text-[#667085]">
              <Truck className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>
                {product.delivery.delivery_available ? 'Delivery available' : 'Pickup only'} · {product.delivery.delivery_locations || 'Capital Home Residence'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs" onClick={() => setIsReportModalOpen(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="absolute top-5 right-5 text-[#667085] hover:text-[#102A43]"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-[#102A43] mb-3">Report Product</h3>
              <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-[#172B4D] block mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white"
                  >
                    <option value="Fraud/scam">Fraud / Scam</option>
                    <option value="Counterfeit">Counterfeit / Fake Item</option>
                    <option value="Inappropriate">Inappropriate Content</option>
                    <option value="Overpriced/Violates rules">Violates Residence Rules</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#172B4D] block mb-1">Details</label>
                  <textarea
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Explain what is wrong with this listing..."
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 py-2 bg-[#F1F3F5] rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="flex-1 py-2 bg-[#DC2626] text-white rounded-xl font-bold"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
