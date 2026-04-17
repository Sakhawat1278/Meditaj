'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { 
  ChevronUp, 
  ChevronDown, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  CreditCard,
  Share2, 
  Info,
  Minus,
  Plus,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-hot-toast';
import CurateHeader from '@/components/Home/CurateHeader';
import CurateFooter from '@/components/Home/CurateFooter';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, isInCart } = useCart();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          
          // Fetch related products (Alternative Products)
          const q = query(
            collection(db, 'products'),
            where('category', '==', data.category),
            limit(10)
          );
          const querySnap = await getDocs(q);
          setRelatedProducts(querySnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.id !== data.id)
            .slice(0, 10)
          );
        } else {
          toast.error('Product not found');
          router.push('/shop');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error loading product');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1e4a3a]/20 border-t-[#1e4a3a] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const images = product.images || (product.image ? [product.image] : []);

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      
      <main className="max-w-[1745px] mx-auto pt-24 pb-12 space-y-4">
        {/* Back Navigation */}
        <Link href="/shop" className="group flex items-center gap-2 text-slate-600 hover:text-[#1e4a3a] transition-all w-fit mb-2">
           <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-all">
             <ChevronUp className="-rotate-90" size={16} />
           </div>
           <span className="text-[12px] font-bold uppercase tracking-widest">Back to Shop</span>
        </Link>
        {/* Main Product Section */}
        <div className="bg-white rounded-lg border border-slate-300 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Thumbnails Vertical Bar */}
            <div className="lg:col-span-1 border-r border-slate-50 pr-4 flex flex-col items-center gap-1.5 overflow-hidden">
              <button className="w-full py-1 flex items-center justify-center text-slate-200 hover:text-[#1e4a3a]"><ChevronUp size={14} /></button>
              <div className="flex flex-col gap-1.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-10 h-10 rounded border transition-all p-0.5 overflow-hidden bg-white ${activeImage === idx ? 'border-cyan-400' : 'border-slate-100'}`}
                  >
                    <img src={img} className="w-full h-full object-contain" alt="" />
                  </button>
                ))}
              </div>
              <button className="w-full py-1 flex items-center justify-center text-slate-200 hover:text-[#1e4a3a]"><ChevronDown size={14} /></button>
            </div>

            {/* Middle Main Image */}
            <div className="lg:col-span-4 flex items-center justify-center p-4 bg-white min-h-[320px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={images[activeImage]}
                  className="max-h-[280px] w-auto object-contain"
                  alt={product.name}
                />
              </AnimatePresence>
            </div>

            {/* Right Details */}
            <div className="lg:col-span-7 space-y-3 flex flex-col justify-center border-l border-slate-50 pl-5">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight uppercase">
                  {product.name}
                </h1>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded border border-slate-300 uppercase">{product.category}</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">• In Stock</span>
              </div>

              <div className="flex flex-wrap gap-2 py-0.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-50 border border-cyan-300 rounded">
                  <span className="text-[9px] font-bold text-cyan-800">Generic:</span>
                  <span className="text-[10px] font-bold text-slate-900">{product.extraInfo?.['Generic Name'] || 'MD'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-300 rounded">
                  <span className="text-[9px] font-bold text-amber-800">Brand:</span>
                  <span className="text-[10px] font-bold text-slate-900">{product.extraInfo?.['Manufacturer'] || 'PHARMA'}</span>
                </div>
              </div>

              <div className="flex items-end justify-between pt-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none">Price Per Strip:</p>
                  <p className="text-xl font-black text-slate-800">৳{product.price}.00</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-800">QTY:</span>
                  <div className="flex items-center bg-white border border-slate-200 rounded h-7">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-full flex items-center justify-center text-slate-400 hover:text-cyan-500 border-r border-slate-200"><Minus size={10} /></button>
                    <span className="w-7 text-center text-[12px] font-bold text-slate-700">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-6 h-full flex items-center justify-center text-slate-400 hover:text-cyan-500 border-l border-slate-200"><Plus size={10} /></button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => addToCart({ ...product, quantity, type: 'product' })}
                    className="h-9 px-8 rounded-full bg-white border border-[#1e4a3a] text-[#1e4a3a] text-[11px] font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={14} /> Add
                  </button>
                  <button 
                    onClick={() => { addToCart({ ...product, quantity, type: 'product' }); router.push('/cart'); }}
                    className="h-9 px-12 rounded-full bg-[#1e4a3a] text-white text-[11px] font-bold hover:opacity-90 transition-all uppercase tracking-widest"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Integrated Feature Strip */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  <div className="bg-white rounded-full border border-slate-300 p-4 flex items-center gap-3 text-[11px] font-bold text-slate-700">
                    <ShieldCheck size={16} className="text-emerald-600" /> 100% Genuine
                  </div>
                  <div className="bg-white rounded-full border border-slate-300 p-4 flex items-center gap-3 text-[11px] font-bold text-slate-700">
                    <CreditCard size={16} className="text-blue-600" /> Secure Payment
                  </div>
                  <div className="bg-white rounded-full border border-slate-300 p-4 flex items-center gap-3 text-[11px] font-bold text-slate-700">
                    <Truck size={16} className="text-rose-600" /> Local Dispatch
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid Ultra Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-12">
          <div className="lg:col-span-8 bg-white rounded-lg border border-slate-300 p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-2">Description</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
               <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Clinical Intro</p>
                  <p className="text-[12px] text-slate-500 leading-snug">{product.description || 'Pharmaceutical standard guidance applies.'}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Usage Course</p>
                  <p className="text-[12px] text-slate-500 leading-snug">Take whole as advised by physician. Do not crush.</p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-300 p-4 space-y-3">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-2">Alternative products</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {relatedProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 border border-transparent transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.images?.[0] || p.image} className="w-8 h-8 object-contain rounded bg-white p-0.5 border" alt="" />
                    <div className="min-w-0">
                      <p onClick={() => router.push(`/shop/${p.id}`)} className="text-[10px] font-bold text-slate-700 cursor-pointer truncate">{p.name}</p>
                      <p className="text-[11px] font-black text-[#1e4a3a]">৳{p.price}</p>
                    </div>
                  </div>
                  <button onClick={() => addToCart({ ...p, quantity: 1, type: 'product' })} className="w-6 h-6 rounded bg-cyan-50 text-cyan-500 flex items-center justify-center shrink-0"><Plus size={10} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
