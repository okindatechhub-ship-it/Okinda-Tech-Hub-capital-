import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Phone,
  Store,
  CreditCard,
  Truck,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { uploadLocalFile } from '../api/upload';
import { Product, ProductVariation, SellerPaymentOption, ProductDeliveryInfo } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  // 1. Product Information
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('cat-electronics');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState<'New' | 'Used' | 'Refurbished'>('Used');

  // Images from local storage
  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const addlInputRef = useRef<HTMLInputElement>(null);

  // 2. Product Variations
  const [hasVariations, setHasVariations] = useState(false);
  const [variationType, setVariationType] = useState('Color'); // e.g. Color, Size, Storage
  const [variationOptions, setVariationOptions] = useState<
    { label: string; price?: number; stock?: number }[]
  >([
    { label: 'Black', price: 0, stock: 1 },
    { label: 'Blue', price: 0, stock: 1 }
  ]);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');

  // 3. Delivery Information
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deliveryLocations, setDeliveryLocations] = useState('Capital Home Residence & Campus Gate B');
  const [estimatedTime, setEstimatedTime] = useState('1 - 2 Hours / Same Day');

  // 4. Seller Payment Methods
  const [enableSendMoney, setEnableSendMoney] = useState(true);
  const [sendMoneyPhone, setSendMoneyPhone] = useState(user?.phone || '');
  const [sendMoneyName, setSendMoneyName] = useState(user?.full_name || '');

  const [enableTill, setEnableTill] = useState(false);
  const [tillNumber, setTillNumber] = useState('');
  const [tillStoreName, setTillStoreName] = useState('');

  const [enablePaybill, setEnablePaybill] = useState(false);
  const [paybillNumber, setPaybillNumber] = useState('');
  const [paybillAccount, setPaybillAccount] = useState('');
  const [paybillBusinessName, setPaybillBusinessName] = useState('');

  const [defaultMethod, setDefaultMethod] = useState<'send_money' | 'till' | 'paybill'>('send_money');

  if (!isOpen) return null;

  // Handle Main Image upload from local storage
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingMain(true);
      const url = await uploadLocalFile(file);
      setMainImage(url);
      toast.success('Main product image uploaded from device storage!');
    } catch {
      toast.error('Failed to load image from device');
    } finally {
      setUploadingMain(false);
    }
  };

  // Handle Additional Images upload from local storage
  const handleAddlImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    try {
      setUploadingAdditional(true);
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const u = await uploadLocalFile(files[i]);
        urls.push(u);
      }
      setAdditionalImages(prev => [...prev, ...urls]);
      toast.success(`${urls.length} additional image(s) loaded!`);
    } catch {
      toast.error('Failed to load additional image');
    } finally {
      setUploadingAdditional(false);
    }
  };

  const handleAddVariationOption = () => {
    if (!newOptionLabel.trim()) return;
    setVariationOptions(prev => [
      ...prev,
      {
        label: newOptionLabel.trim(),
        price: newOptionPrice ? Number(newOptionPrice) : 0,
        stock: 1
      }
    ]);
    setNewOptionLabel('');
    setNewOptionPrice('');
  };

  const handleRemoveOption = (index: number) => {
    setVariationOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) {
      toast.error('Product name, price, and category are required');
      return;
    }

    if (!mainImage) {
      toast.error('Main product image is required. Please upload from device storage.');
      setStep(1);
      return;
    }

    // Assemble payment methods
    const paymentMethods: SellerPaymentOption[] = [];
    if (enableSendMoney && sendMoneyPhone) {
      paymentMethods.push({
        type: 'send_money',
        phone_number: sendMoneyPhone,
        recipient_name: sendMoneyName || user?.full_name,
        is_default: defaultMethod === 'send_money'
      });
    }
    if (enableTill && tillNumber) {
      paymentMethods.push({
        type: 'till',
        till_number: tillNumber,
        business_name: tillStoreName || user?.full_name,
        is_default: defaultMethod === 'till'
      });
    }
    if (enablePaybill && paybillNumber) {
      paymentMethods.push({
        type: 'paybill',
        paybill_number: paybillNumber,
        account_number: paybillAccount || 'ORDER',
        business_name: paybillBusinessName || user?.full_name,
        is_default: defaultMethod === 'paybill'
      });
    }

    if (paymentMethods.length === 0) {
      // Default to send money
      paymentMethods.push({
        type: 'send_money',
        phone_number: user?.phone || '',
        recipient_name: user?.full_name || '',
        is_default: true
      });
    }

    // Assemble variations
    const variations: ProductVariation[] = hasVariations
      ? [
          {
            type: variationType,
            options: variationOptions
          }
        ]
      : [];

    const deliveryInfo: ProductDeliveryInfo = {
      pickup_available: pickupAvailable,
      delivery_available: deliveryAvailable,
      delivery_fee: deliveryFee ? Number(deliveryFee) : 0,
      delivery_locations: deliveryLocations,
      estimated_time: estimatedTime
    };

    const allImages = [mainImage, ...additionalImages];

    try {
      setSubmitting(true);
      const res = await apiRequest<{ message: string; product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          category_id: categoryId,
          subcategory: subcategory.trim() || undefined,
          brand: brand.trim() || undefined,
          description: description.trim(),
          price: Number(price),
          discount_price: discountPrice ? Number(discountPrice) : undefined,
          quantity: Number(quantity) || 1,
          condition,
          images: allImages,
          has_variations: hasVariations,
          variations,
          delivery: deliveryInfo,
          payment_methods: paymentMethods
        })
      });

      toast.success('Product listed successfully! Every resident has been notified.');
      onSuccess(res.product);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center flex items-center justify-center py-6">
        <div className="fixed inset-0 bg-[#102A43]/70 backdrop-blur-sm" onClick={onClose} />

        <div className="inline-block w-full max-w-2xl p-6 sm:p-8 my-4 text-left align-middle bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#667085] hover:text-[#102A43] p-1.5 rounded-xl hover:bg-[#F1F3F5]"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <span className="text-[11px] font-bold text-[#D9A441] uppercase tracking-wider">
              Seller Hub · Combined Setup
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#102A43] tracking-tight mt-0.5">
              Add New Product Listing
            </h2>
            <p className="text-xs text-[#667085] mt-1">
              Add product details, upload images from your device storage, setup variations, delivery and direct payment methods.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="flex border-b border-[#E4E7EC] mb-6 overflow-x-auto gap-2">
            {[
              { id: 1, label: '1. Information' },
              { id: 2, label: '2. Variations' },
              { id: 3, label: '3. Delivery' },
              { id: 4, label: '4. Payments' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id as any)}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  step === s.id
                    ? 'border-[#D9A441] text-[#102A43]'
                    : 'border-transparent text-[#667085] hover:text-[#102A43]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmitProduct} className="space-y-5 text-xs">
            {/* STEP 1: Product Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Samsung Galaxy A25 or HP EliteBook 840"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] bg-white text-[#172B4D]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white text-[#172B4D]"
                    >
                      <option value="cat-electronics">Electronics</option>
                      <option value="cat-computers">Computers & Laptops</option>
                      <option value="cat-phones">Phones & Tablets</option>
                      <option value="cat-furniture">Furniture & Study Desks</option>
                      <option value="cat-books">Books & Stationery</option>
                      <option value="cat-household">Household Items & Kettles</option>
                      <option value="cat-clothing">Clothing & Shoes</option>
                      <option value="cat-services">Student Services</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="e.g. Android Phones / Laptops / Mesh Chairs"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Brand (Optional)
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Samsung / HP / Apple / Ramtons"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Price (KSh) *
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 28500"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl font-bold text-[#102A43]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Discount/Original Price
                    </label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="e.g. 32000 (shows strike)"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#667085]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#172B4D] block mb-1">
                    Condition
                  </label>
                  <div className="flex gap-3">
                    {(['Used', 'New', 'Refurbished'] as const).map(c => (
                      <label key={c} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="condition"
                          checked={condition === c}
                          onChange={() => setCondition(c)}
                          className="text-[#D9A441] focus:ring-[#D9A441]"
                        />
                        <span className="text-xs text-[#172B4D]">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* IMAGES FROM LOCAL STORAGE */}
                <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-3">
                  <h4 className="font-bold text-[#102A43] text-xs">
                    Product Images (From Local Device Storage)
                  </h4>

                  {/* Main Image */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                      Main Image * (Required)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white border border-[#E4E7EC] flex items-center justify-center overflow-hidden shrink-0">
                        {mainImage ? (
                          <img src={mainImage} alt="Main Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-[#667085]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={mainInputRef}
                          onChange={handleMainImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => mainInputRef.current?.click()}
                          className="px-3 py-2 bg-white hover:bg-[#E4E7EC] border border-[#E4E7EC] text-[#102A43] rounded-xl font-bold flex items-center gap-1.5 transition text-xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#D9A441]" />
                          <span>{uploadingMain ? 'Uploading...' : mainImage ? 'Change Main Image' : 'Select Main Image from Device'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Images */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#172B4D] mb-1">
                      Additional Images (Optional)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {additionalImages.map((img, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#E4E7EC] group">
                          <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <input
                        type="file"
                        ref={addlInputRef}
                        onChange={handleAddlImageUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => addlInputRef.current?.click()}
                        className="w-14 h-14 rounded-xl border-2 border-dashed border-[#D9A441]/60 hover:bg-white flex flex-col items-center justify-center text-[#D9A441] transition"
                        title="Add image from device"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[8px] font-bold">Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#172B4D] block mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about condition, accessories, features, and pickup location..."
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <span>Next: Variations</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Product Variations */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#102A43]">Does this product have variations?</h4>
                    <p className="text-xs text-[#667085]">
                      Examples: Colors, Storage sizes (128GB / 256GB), Shoe sizes (40, 41), Clothing (S, M, L).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVariations}
                      onChange={(e) => setHasVariations(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#102A43]"></div>
                  </label>
                </div>

                {hasVariations && (
                  <div className="p-4 rounded-2xl bg-white border border-[#E4E7EC] space-y-4">
                    <div>
                      <label className="font-bold text-[#172B4D] block mb-1">
                        Variation Type
                      </label>
                      <select
                        value={variationType}
                        onChange={(e) => setVariationType(e.target.value)}
                        className="w-full sm:w-60 px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white"
                      >
                        <option value="Color">Color (Black, Blue, White)</option>
                        <option value="Storage">Storage (128GB, 256GB, 512GB)</option>
                        <option value="Size">Size (S, M, L, XL, 40, 41, 42)</option>
                        <option value="RAM">RAM (8GB, 16GB, 32GB)</option>
                        <option value="Style">Style / Custom</option>
                      </select>
                    </div>

                    {/* Options list */}
                    <div className="space-y-2">
                      <label className="font-bold text-[#172B4D] block">
                        Options for {variationType}
                      </label>
                      {variationOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC]">
                          <span className="font-bold text-[#102A43] flex-1">{opt.label}</span>
                          <span className="text-xs text-[#667085]">
                            {opt.price ? `+ KSh ${opt.price}` : 'Default Price'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(i)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new option */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E4E7EC]">
                      <input
                        type="text"
                        value={newOptionLabel}
                        onChange={(e) => setNewOptionLabel(e.target.value)}
                        placeholder={`e.g. 256GB or Midnight Blue`}
                        className="flex-1 px-3 py-1.5 border border-[#E4E7EC] rounded-xl text-xs"
                      />
                      <input
                        type="number"
                        value={newOptionPrice}
                        onChange={(e) => setNewOptionPrice(e.target.value)}
                        placeholder="Price adjustment (+KSh)"
                        className="w-32 px-3 py-1.5 border border-[#E4E7EC] rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddVariationOption}
                        className="px-3 py-1.5 bg-[#102A43] text-[#D9A441] rounded-xl font-bold text-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-[#E4E7EC] rounded-xl font-bold text-[#102A43]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <span>Next: Delivery</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Delivery Information */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E4E7EC] space-y-4">
                  <div className="flex items-center gap-2 text-[#102A43] font-bold text-sm">
                    <Truck className="w-4 h-4 text-[#D9A441]" />
                    <span>Fulfillment & Delivery Options</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA]">
                      <input
                        type="checkbox"
                        checked={pickupAvailable}
                        onChange={(e) => setPickupAvailable(e.target.checked)}
                        className="rounded text-[#D9A441] focus:ring-[#D9A441]"
                      />
                      <div>
                        <span className="font-bold text-[#102A43] block">Pickup Available</span>
                        <span className="text-[10px] text-[#667085]">Customer meets you at residence</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA]">
                      <input
                        type="checkbox"
                        checked={deliveryAvailable}
                        onChange={(e) => setDeliveryAvailable(e.target.checked)}
                        className="rounded text-[#D9A441] focus:ring-[#D9A441]"
                      />
                      <div>
                        <span className="font-bold text-[#102A43] block">Delivery Available</span>
                        <span className="text-[10px] text-[#667085]">Delivered to room/campus gate</span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Delivery Fee (KSh)
                    </label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      placeholder="0 for free delivery"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Delivery Locations
                    </label>
                    <input
                      type="text"
                      value={deliveryLocations}
                      onChange={(e) => setDeliveryLocations(e.target.value)}
                      placeholder="e.g. Capital Home Residence, Student Centre, Main Campus"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#172B4D] block mb-1">
                      Estimated Delivery Time
                    </label>
                    <input
                      type="text"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      placeholder="e.g. Instant / 1-2 Hours / Same Day"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 border border-[#E4E7EC] rounded-xl font-bold text-[#102A43]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-5 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <span>Next: Payment Methods</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Seller Payment Methods */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 text-xs space-y-1">
                  <h4 className="font-bold text-[#102A43]">Seller Payment Methods</h4>
                  <p className="text-[#667085]">
                    Because the platform does not process payments through an automated API, buyers will pay you directly using your selected methods at checkout.
                  </p>
                </div>

                {/* Option 1: Send Money */}
                <div className={`p-4 rounded-2xl border transition ${enableSendMoney ? 'border-[#D9A441] bg-white shadow-xs' : 'border-[#E4E7EC] bg-[#F7F8FA]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#102A43]">
                      <input
                        type="checkbox"
                        checked={enableSendMoney}
                        onChange={(e) => setEnableSendMoney(e.target.checked)}
                        className="rounded text-[#D9A441] focus:ring-[#D9A441]"
                      />
                      <span>📱 M-PESA Send Money</span>
                    </label>

                    {enableSendMoney && (
                      <label className="flex items-center gap-1.5 text-[11px] text-[#D9A441] font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="defaultPay"
                          checked={defaultMethod === 'send_money'}
                          onChange={() => setDefaultMethod('send_money')}
                        />
                        <span>Default</span>
                      </label>
                    )}
                  </div>

                  {enableSendMoney && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E4E7EC]">
                      <div>
                        <label className="font-semibold text-[#172B4D] block mb-1">M-PESA Phone Number *</label>
                        <input
                          type="tel"
                          value={sendMoneyPhone}
                          onChange={(e) => setSendMoneyPhone(e.target.value)}
                          placeholder="07XXXXXXXX"
                          className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#172B4D] block mb-1">Recipient Name *</label>
                        <input
                          type="text"
                          value={sendMoneyName}
                          onChange={(e) => setSendMoneyName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2: Till Number */}
                <div className={`p-4 rounded-2xl border transition ${enableTill ? 'border-[#D9A441] bg-white shadow-xs' : 'border-[#E4E7EC] bg-[#F7F8FA]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#102A43]">
                      <input
                        type="checkbox"
                        checked={enableTill}
                        onChange={(e) => setEnableTill(e.target.checked)}
                        className="rounded text-[#D9A441] focus:ring-[#D9A441]"
                      />
                      <span>🛒 Lipa na M-PESA Till</span>
                    </label>

                    {enableTill && (
                      <label className="flex items-center gap-1.5 text-[11px] text-[#D9A441] font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="defaultPay"
                          checked={defaultMethod === 'till'}
                          onChange={() => setDefaultMethod('till')}
                        />
                        <span>Default</span>
                      </label>
                    )}
                  </div>

                  {enableTill && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E4E7EC]">
                      <div>
                        <label className="font-semibold text-[#172B4D] block mb-1">Till Number *</label>
                        <input
                          type="text"
                          value={tillNumber}
                          onChange={(e) => setTillNumber(e.target.value)}
                          placeholder="e.g. 1234567"
                          className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#172B4D] block mb-1">Business / Store Name *</label>
                        <input
                          type="text"
                          value={tillStoreName}
                          onChange={(e) => setTillStoreName(e.target.value)}
                          placeholder="e.g. Campus Tech Hub"
                          className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 3: Paybill */}
                <div className={`p-4 rounded-2xl border transition ${enablePaybill ? 'border-[#D9A441] bg-white shadow-xs' : 'border-[#E4E7EC] bg-[#F7F8FA]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#102A43]">
                      <input
                        type="checkbox"
                        checked={enablePaybill}
                        onChange={(e) => setEnablePaybill(e.target.checked)}
                        className="rounded text-[#D9A441] focus:ring-[#D9A441]"
                      />
                      <span>💼 Lipa na M-PESA PayBill</span>
                    </label>

                    {enablePaybill && (
                      <label className="flex items-center gap-1.5 text-[11px] text-[#D9A441] font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="defaultPay"
                          checked={defaultMethod === 'paybill'}
                          onChange={() => setDefaultMethod('paybill')}
                        />
                        <span>Default</span>
                      </label>
                    )}
                  </div>

                  {enablePaybill && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E4E7EC]">
                      <div>
                        <label className="font-semibold text-[#172B4D] block mb-1">PayBill Number *</label>
                        <input
                          type="text"
                          value={paybillNumber}
                          onChange={(e) => setPaybillNumber(e.target.value)}
                          placeholder="e.g. 522522"
                          className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#172B4D] block mb-1">Account Number / Name *</label>
                        <input
                          type="text"
                          value={paybillAccount}
                          onChange={(e) => setPaybillAccount(e.target.value)}
                          placeholder="e.g. 12893821"
                          className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#172B4D] block mb-1">Business Name</label>
                        <input
                          type="text"
                          value={paybillBusinessName}
                          onChange={(e) => setPaybillBusinessName(e.target.value)}
                          placeholder="e.g. KCB / Equity"
                          className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-[#E4E7EC]">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 border border-[#E4E7EC] rounded-xl font-bold text-[#102A43]"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-[#102A43] hover:bg-[#1b3d5e] disabled:opacity-50 text-[#D9A441] rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2"
                  >
                    <span>{submitting ? 'Publishing Product...' : 'Publish Product to Marketplace'}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#D9A441]" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
