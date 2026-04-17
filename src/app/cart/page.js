'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { m as motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Trash2, ArrowRight, ChevronRight, 
  ShieldCheck, Lock, Info, Plus, Minus,
  Activity, Microscope, Heart, Calendar, Clock, MapPin, Hand, Phone, ShoppingBag
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-hot-toast';
import DatePicker from '@/components/UI/DatePicker';
import CustomDropdown from '@/components/UI/CustomDropdown';

function CartItemRow({ item, getItemIcon, updateQuantity, removeFromCart }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="p-5 flex items-center gap-6 group hover:bg-slate-50/30 transition-all"
    >
      <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
        {getItemIcon(item.type)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-tighter rounded border border-slate-200">
            {item.type}
          </span>
          {item.category && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.category}</span>
          )}
        </div>
        <h4 className="text-[15px] font-black text-[#1e4a3a] tracking-tight">{item.name}</h4>
        <p className="text-[11px] font-bold text-slate-400 mt-0.5 line-clamp-1">{item.providerName || 'Meditaj Certified Doctor'}</p>
      </div>
      <div className="flex items-center gap-6 px-4">
        {item.type === 'product' && (
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded h-7">
            <button onClick={() => updateQuantity(item.id, item.type, -1)} className="w-6 h-full flex items-center justify-center text-slate-400 hover:text-emerald-500 border-r border-slate-200"><Minus size={10} /></button>
            <span className="w-7 text-center text-[11px] font-bold text-slate-600">{item.quantity || 1}</span>
            <button onClick={() => updateQuantity(item.id, item.type, 1)} className="w-6 h-full flex items-center justify-center text-slate-400 hover:text-emerald-500 border-l border-slate-200"><Plus size={10} /></button>
          </div>
        )}
        <div className="text-right min-w-[80px]">
          <p className="text-[16px] font-black text-[#1e4a3a] font-mono tracking-tighter">
            ৳{(Number(item.price) * (item.quantity || 1))}
          </p>
          {(item.quantity || 1) > 1 && (
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">৳{item.price} each</p>
          )}
        </div>
        <button 
          onClick={() => removeFromCart(item.id, item.type)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { cartItems, removeFromCart, clearCart, getSubtotal, cartCount, updateQuantity } = useCart();
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    phone: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);



  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        phone: prev.phone || profile.phone || '',
        location: prev.location || profile.address || ''
      }));
    }
  }, [profile]);

  const handleCheckout = () => {
    if (cartCount === 0) return;
    if (!user) {
      toast.error('Please login to continue');
      router.push('/login?redirect=/cart');
      return;
    }
    
    if (!formData.phone || !formData.location) {
      toast.error('Please complete Shipping & Contact details');
      return;
    }

    const subtotal = getSubtotal();
    
    const checkoutSession = {
      type: 'product',
      items: cartItems,
      totalAmount: subtotal,
      patientPhone: formData.phone,
      location: formData.location,
      discount: 0
    };

    sessionStorage.setItem('medita_checkout', JSON.stringify(checkoutSession));
    router.push('/checkout');
  };

  const getItemIcon = (type) => {
    switch(type) {
      case 'lab': return <Microscope size={18} className="text-emerald-500" />;
      case 'doctor': return <Activity size={18} className="text-blue-500" />;
      case 'nursing': return <Heart size={18} className="text-rose-500" />;
      case 'product': return <ShoppingBag size={18} className="text-amber-500" />;
      default: return <Activity size={18} className="text-slate-400" />;
    }
  };

  return (
    <main className="min-h-screen bg-white">

      <div className="pt-28 lg:pt-36 pb-12 w-full max-w-[1825px] mx-auto px-6 lg:px-12 xl:px-16">
        <div className="flex flex-col gap-8">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1e4a3a] rounded-lg flex items-center justify-center text-white border border-black">
                <ShoppingCart size={20} />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#1e4a3a] tracking-tighter uppercase">My Health Cart</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-emerald-500">Active Session</span> • {cartCount} Services Selected
                </p>
              </div>
            </div>
            <button 
              onClick={clearCart}
              className="px-5 py-2 text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors border border-slate-100 rounded-lg hover:border-rose-100"
            >
              Clear Cart
            </button>
          </div>

          {cartCount === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300"
            >
              <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center text-slate-200 mb-6 border border-slate-300 shadow-sm">
                <ShoppingCart size={40} strokeWidth={1} />
              </div>
              <h2 className="text-xl font-bold text-[#1e4a3a] mb-2 uppercase tracking-tight">Your cart is empty</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-8">Start adding medical services to see them here.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => router.push('/labs')}
                  className="h-12 px-8 bg-[#1e4a3a] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 group border border-[#1e4a3a] shadow-xl"
                >
                  <Microscope size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                  Lab Tests
                </button>
                <button 
                  onClick={() => router.push('/nursing')}
                  className="h-12 px-8 bg-white border border-slate-300 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center gap-3 group shadow-sm"
                >
                  <Hand size={14} className="text-slate-400 group-hover:text-[#1e4a3a] transition-colors" />
                  Nursing & Care
                </button>
                <button 
                  onClick={() => router.push('/shop')}
                  className="h-12 px-8 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-amber-100 transition-all flex items-center gap-3 group shadow-sm"
                >
                  <ShoppingBag size={14} className="text-amber-400 group-hover:text-amber-600 transition-colors" />
                  Health Store
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              <div className="lg:col-span-8 space-y-8">
                
                <div className="space-y-6">
                  {cartItems.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-[#1e4a3a] uppercase tracking-[0.3em] ml-1 flex items-center gap-3">
                        Health Store Products
                        <span className="w-5 h-5 bg-amber-50 rounded-full flex items-center justify-center text-[9px] text-amber-600 border border-amber-100">{cartItems.length}</span>
                      </h3>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                          {cartItems.map((item) => (
                            <CartItemRow key={`${item.id}-${item.type}`} item={item} getItemIcon={getItemIcon} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6 pt-4">
                  <h3 className="text-[12px] font-black text-[#1e4a3a] uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
                    Shipping & Contact
                    <div className="flex-1 h-px bg-slate-200" />
                  </h3>
                  
                   <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Phone size={12} className="text-rose-500" /> Recipient Phone
                          </label>
                          <input 
                            type="text" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="01XXXXXXXXX"
                            className="w-full h-11 px-5 bg-white border border-slate-300 rounded-full outline-none text-[13px] font-bold focus:border-[#1e4a3a] transition-all placeholder:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <MapPin size={12} className="text-amber-500" /> Delivery Address
                          </label>
                          <textarea 
                            rows={1}
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            placeholder="House, Road, Area..."
                            className="w-full h-11 px-5 py-3 bg-white border border-slate-300 rounded-full outline-none text-[13px] font-bold focus:border-[#1e4a3a] transition-all placeholder:text-slate-100 resize-none"
                          />
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="bg-white border border-slate-300 rounded-xl p-8 sticky top-44 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10 -mr-16 -mt-16 opacity-40" />
                  
                  <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-[0.2em] mb-8">Service Summary</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[13px] font-bold">
                        <span className="text-slate-400 uppercase tracking-widest leading-none">Subtotal</span>
                        <span className="text-[#1e4a3a] font-mono tracking-tighter">৳{getSubtotal()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px] font-bold pb-2 border-b border-slate-200">
                        <span className="text-slate-400 uppercase tracking-widest leading-none">Vat / Taxes</span>
                        <span className="text-[#1e4a3a] font-mono tracking-tighter">৳0.00</span>
                      </div>
                      <div className="flex justify-between items-center text-[16px] font-black pt-4">
                        <span className="text-[#1e4a3a] uppercase tracking-[0.2em] leading-none">Total Payable</span>
                        <span className="text-[#1e4a3a] font-mono tracking-tighter text-2xl">৳{getSubtotal()}</span>
                      </div>
                    </div>

                    <div className="pt-8 space-y-4">
                      <button
                        onClick={handleCheckout}
                        disabled={cartCount === 0}
                        className="w-full h-12 bg-[#1e4a3a] hover:bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                      >
                        Proceed to Checkout
                        <ArrowRight size={16} />
                      </button>
                      <div className="pt-2 space-y-2">
                        <button 
                          onClick={() => router.push('/shop')}
                          className="w-full h-12 bg-[#1e4a3a] text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-[#1e4a3a] flex items-center justify-center gap-2 shadow-lg"
                        >
                          <ShoppingBag size={14} /> Continue Shopping
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </main>
  );
}
