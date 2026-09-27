import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Store,
  CreditCard,
  Upload,
  AlertCircle,
  Truck
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { uploadLocalFile } from '../api/upload';

export const CartModal: React.FC = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount, isCartOpen, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment_instructions' | 'submit_code' | 'success'>('cart');
  const [selectedSellerPayMethod, setSelectedSellerPayMethod] = useState<any>(null);

  // Verification form
  const [mpesaCode, setMpesaCode] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');

  const screenshotInputRef = useRef<HTMLInputElement>(null);

  if (!isCartOpen) return null;

  // Primary seller for this cart checkout
  const primaryItem = items[0];
  const seller = primaryItem?.product.seller;
  const sellerPaymentMethods = primaryItem?.product.payment_methods || [];

  const handleStartCheckout = () => {
    if (!user) {
      toast.info('Please sign in first to checkout');
      return;
    }
    if (items.length === 0) return;

    setAmountPaid(totalAmount.toString());
    setDeliveryAddress(`Room ${user.resident_room_number || 'Lobby'}`);
    setCheckoutStep('payment_instructions');
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadLocalFile(file);
      setPaymentScreenshot(url);
      toast.success('Payment screenshot uploaded from device storage!');
    } catch {
      toast.error('Failed to upload screenshot');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaCode.trim()) {
      toast.error('M-PESA transaction code is compulsory');
      return;
    }

    try {
      setSubmittingOrder(true);
      const res = await apiRequest<{ message: string; order: any }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map(i => ({
            product_id: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            image: i.product.images[0] || '',
            selected_variation: i.selected_variation,
            advertiser_id: i.product.advertiser_id
          })),
          total_amount: totalAmount,
          advertiser_id: primaryItem.product.advertiser_id,
          advertiser_name: seller?.name || primaryItem.product.advertiser_name || 'Campus Seller',
          payment_method_used: selectedSellerPayMethod || {
            type: 'send_money',
            title: 'M-PESA',
            details: seller?.phone || 'Direct payment'
          },
          mpesa_transaction_code: mpesaCode.trim().toUpperCase(),
          amount_paid: Number(amountPaid) || totalAmount,
          payment_screenshot: paymentScreenshot || undefined,
          delivery_type: deliveryType,
          delivery_address: deliveryAddress
        })
      });

      setCreatedOrderNumber(res.order.id);
      clearCart();
      setCheckoutStep('success');
      toast.success('Order submitted! Awaiting seller verification.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#E4E7EC] flex items-center justify-between bg-[#102A43] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1b3d5e] border border-[#D9A441]/40 text-[#D9A441] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {checkoutStep === 'cart' ? 'Shopping Cart' : 'Checkout & Payment'}
                </h2>
                <p className="text-xs text-slate-300">
                  {checkoutStep === 'cart' ? `${totalItems} item(s) in your cart` : 'Direct seller M-Pesa verification'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-[#1b3d5e]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. CART ITEMS VIEW */}
            {checkoutStep === 'cart' && (
              <>
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-[#F1F3F5] text-[#102A43] flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-[#D9A441]" />
                    </div>
                    <h3 className="text-base font-bold text-[#102A43]">Your cart is empty</h3>
                    <p className="text-xs text-[#667085] max-w-xs">
                      Explore the Capital Home Marketplace for laptops, electronics, study desks and essentials.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-5 py-2.5 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="divide-y divide-[#E4E7EC]">
                      {items.map(item => (
                        <div key={item.product.id} className="py-3 flex items-start gap-3">
                          <img
                            src={item.product.images[0] || '/src/assets/images/marketplace_item_setup_1790501145428.jpg'}
                            alt={item.product.name}
                            className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shrink-0 border border-[#E4E7EC]"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-[#102A43] truncate">{item.product.name}</h4>
                            {item.selected_variation && (
                              <p className="text-[10px] text-[#D9A441] font-semibold">{item.selected_variation}</p>
                            )}
                            <p className="text-xs font-black text-[#102A43] mt-0.5">
                              KSh {item.product.price.toLocaleString()}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center border border-[#E4E7EC] rounded-lg bg-[#F7F8FA]">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="p-1 text-[#667085] hover:text-[#102A43]"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-xs font-bold text-[#102A43]">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="p-1 text-[#667085] hover:text-[#102A43]"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-[#667085] hover:text-red-600 p-1"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 2. PAYMENT INSTRUCTIONS VIEW (As per prompt) */}
            {checkoutStep === 'payment_instructions' && (
              <div className="space-y-4 text-xs">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="flex items-center gap-1 font-bold text-[#667085] hover:text-[#102A43]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Cart</span>
                </button>

                <div className="p-4 rounded-2xl bg-[#102A43] text-white space-y-2">
                  <span className="text-[10px] font-bold text-[#D9A441] uppercase tracking-wider">
                    Step 1 of 2: Pay Seller Directly
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Pay Seller: {seller?.name || primaryItem?.product.advertiser_name || 'Resident Seller'}
                  </h3>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Since there is no automatic M-Pesa API integration, make direct payment to the seller using any of their accepted methods below.
                  </p>
                </div>

                {/* Seller's Payment Methods */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#102A43]">
                    {seller?.name || primaryItem?.product.advertiser_name || 'The Seller'} accepts:
                  </h4>

                  {sellerPaymentMethods.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-1">
                      <div className="flex items-center gap-2 font-bold text-[#102A43]">
                        <Phone className="w-4 h-4 text-[#D9A441]" />
                        <span>📱 Send Money (M-PESA)</span>
                      </div>
                      <p className="text-[#172B4D] pl-6 font-semibold">
                        M-PESA: {seller?.phone || '07XXXXXXXX'}
                      </p>
                      <p className="text-[#667085] pl-6 text-[11px]">
                        Name: {seller?.name || 'Seller'}
                      </p>
                    </div>
                  ) : (
                    sellerPaymentMethods.map((pm: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedSellerPayMethod(pm)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                          selectedSellerPayMethod === pm
                            ? 'border-[#D9A441] bg-[#fef8eb] ring-2 ring-[#D9A441]/30'
                            : 'border-[#E4E7EC] bg-[#F7F8FA] hover:border-[#D9A441]'
                        }`}
                      >
                        {pm.type === 'send_money' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-bold text-[#102A43]">
                              <Phone className="w-4 h-4 text-[#D9A441]" />
                              <span>📱 Send Money (M-PESA)</span>
                            </div>
                            <p className="text-[#172B4D] pl-6 font-bold">M-PESA: {pm.phone_number}</p>
                            <p className="text-[#667085] pl-6 text-[11px]">Name: {pm.recipient_name || pm.account_name}</p>
                          </div>
                        )}

                        {pm.type === 'till' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-bold text-[#102A43]">
                              <Store className="w-4 h-4 text-[#D9A441]" />
                              <span>🛒 Lipa na M-PESA Till</span>
                            </div>
                            <p className="text-[#172B4D] pl-6 font-bold">Till Number: {pm.till_number}</p>
                            <p className="text-[#667085] pl-6 text-[11px]">{pm.business_name || pm.account_name}</p>
                          </div>
                        )}

                        {pm.type === 'paybill' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-bold text-[#102A43]">
                              <CreditCard className="w-4 h-4 text-[#D9A441]" />
                              <span>💼 Lipa na M-PESA PayBill</span>
                            </div>
                            <p className="text-[#172B4D] pl-6 font-bold">PayBill: {pm.paybill_number}</p>
                            <p className="text-[#667085] pl-6 text-[11px]">Account: {pm.account_number} ({pm.business_name})</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Amount to pay display */}
                <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] flex items-center justify-between">
                  <span className="font-bold text-[#667085]">Amount to Pay:</span>
                  <span className="text-xl font-black text-[#102A43]">KSh {totalAmount.toLocaleString()}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutStep('submit_code')}
                  className="w-full py-3.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-2xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>I've Made Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 3. SUBMIT CODE VIEW (After payment) */}
            {checkoutStep === 'submit_code' && (
              <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('payment_instructions')}
                  className="flex items-center gap-1 font-bold text-[#667085] hover:text-[#102A43]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Payment Methods</span>
                </button>

                <div className="p-3.5 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 text-xs text-[#102A43]">
                  Enter your M-PESA confirmation code below. The seller will verify your transaction code and update your order status.
                </div>

                <div>
                  <label className="font-bold text-[#172B4D] block mb-1">
                    M-PESA Transaction Code * (e.g. QHK982LK45)
                  </label>
                  <input
                    type="text"
                    required
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="QHK982LK45"
                    className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl font-black tracking-widest text-[#102A43] uppercase text-sm focus:ring-2 focus:ring-[#D9A441]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#172B4D] block mb-1">
                    Amount Paid (KSh) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl font-bold text-[#102A43]"
                  />
                </div>

                {/* Optional Screenshot from Local Device Storage */}
                <div>
                  <label className="font-bold text-[#172B4D] block mb-1">
                    Optional Payment Screenshot (From Device Storage)
                  </label>
                  <input
                    type="file"
                    ref={screenshotInputRef}
                    onChange={handleScreenshotUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => screenshotInputRef.current?.click()}
                      className="px-3 py-2 border border-[#E4E7EC] rounded-xl bg-[#F7F8FA] hover:bg-[#E4E7EC] font-bold text-xs text-[#102A43] flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#D9A441]" />
                      <span>{paymentScreenshot ? 'Change Screenshot' : 'Upload Receipt Screenshot'}</span>
                    </button>
                    {paymentScreenshot && (
                      <span className="text-xs text-[#16A34A] font-bold">Screenshot attached ✓</span>
                    )}
                  </div>
                </div>

                {/* Delivery options */}
                <div className="space-y-2 pt-2 border-t border-[#E4E7EC]">
                  <label className="font-bold text-[#172B4D] block">Fulfillment Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition ${
                        deliveryType === 'pickup'
                          ? 'border-[#102A43] bg-[#102A43] text-[#D9A441]'
                          : 'border-[#E4E7EC] text-[#667085]'
                      }`}
                    >
                      Self Pickup
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition ${
                        deliveryType === 'delivery'
                          ? 'border-[#102A43] bg-[#102A43] text-[#D9A441]'
                          : 'border-[#E4E7EC] text-[#667085]'
                      }`}
                    >
                      Room Delivery
                    </button>
                  </div>

                  {deliveryType === 'delivery' && (
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Old Room 18 / Gate B"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs mt-1 text-[#172B4D]"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="w-full py-3.5 bg-[#102A43] hover:bg-[#1b3d5e] disabled:opacity-50 text-[#D9A441] rounded-2xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2 mt-4"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#D9A441]" />
                  <span>{submittingOrder ? 'Submitting Order...' : 'Submit Payment for Seller Verification'}</span>
                </button>
              </form>
            )}

            {/* 4. SUCCESS ORDER VIEW */}
            {checkoutStep === 'success' && (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto ring-4 ring-[#16A34A]/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-[#102A43]">Order Submitted!</h3>
                <div className="p-3 bg-[#fef8eb] rounded-2xl border border-[#D9A441]/40 text-xs font-bold text-[#102A43]">
                  Status: Payment Submitted — Awaiting Seller Verification
                </div>
                <p className="text-xs text-[#667085] max-w-xs mx-auto">
                  Order <strong>#{createdOrderNumber}</strong>. The seller has been notified to verify your M-Pesa transaction code.
                </p>
                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('cart');
                    }}
                    className="w-full py-3 bg-[#102A43] text-[#D9A441] rounded-2xl text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer (only on cart step) */}
          {checkoutStep === 'cart' && items.length > 0 && (
            <div className="p-5 border-t border-[#E4E7EC] bg-[#F7F8FA] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Subtotal:</span>
                <span className="font-bold text-[#172B4D]">KSh {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085]">Estimated Fulfillment:</span>
                <span className="font-bold text-[#16A34A]">Free Student Pickup</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-[#E4E7EC]">
                <span className="font-black text-[#102A43]">Total Amount:</span>
                <span className="font-black text-lg text-[#102A43]">KSh {totalAmount.toLocaleString()}</span>
              </div>

              <button
                onClick={handleStartCheckout}
                className="w-full py-3.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-2xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
