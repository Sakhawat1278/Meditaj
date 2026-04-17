'use client';
import { useState, useEffect, useMemo } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Filter, ArrowRight, 
  ChevronRight, Star, Clock, ShieldCheck, 
  ShoppingBag, Loader2, Plus, Minus
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import CurateHeader from '@/components/Home/CurateHeader';

import CustomDropdown from '@/components/UI/CustomDropdown';
import Image from 'next/image';
import Link from 'next/link';

export default function ShopPage() {
  const { addToCart, cartItems } = useCart();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const categories = ['All', 'Medicine', 'Wellness', 'Personal Care', 'Supplements', 'Diagnostics', 'Baby Care'];

  useEffect(() => {
    const q = query(
      collection(db, 'products'), 
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const isPublic = p.status === 'active';
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        return isPublic && matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return 0; // Default newest (already sorted by query)
      });
  }, [products, searchQuery, activeCategory, sortBy]);

  const isInCart = (id) => cartItems.some(item => item.id === id && item.type === 'product');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-[72px]">
      <CurateHeader />

      {/* Hero Header */}
      <section className="bg-[#1e4a3a] py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-400 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
        </div>
        
        <div className="max-w-[1745px] mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >

            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
              Our Health Store <br/> <span className="text-emerald-400">Delivered to You</span>
            </h1>
            <p className="text-emerald-100/60 max-w-2xl mx-auto text-[14px] font-medium leading-relaxed">
              Find the best medicines, health supplements, and daily essentials. 
              Always genuine and trusted by thousands.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Controls Bar */}
      <div className="sticky top-[72px] z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-[1745px] mx-auto h-20 flex items-center justify-between gap-8">
          <div className="hidden lg:flex items-center gap-3">
            <h2 className="text-[12px] font-black text-[#1e4a3a] uppercase tracking-[0.2em]">Product List</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{products.length} Items Found</span>
          </div>

          {/* Search & Sort */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="w-full h-11 pl-12 pr-4 bg-slate-100 border border-slate-200 rounded-full text-[13px] font-bold text-[#1e4a3a] focus:outline-none focus:bg-white focus:border-[#1e4a3a] transition-all"
              />
            </div>
            
            <div className="hidden md:block min-w-[180px]">
              <CustomDropdown 
                options={[
                  { label: 'Latest Arrivals', value: 'newest' },
                  { label: 'Price: Low to High', value: 'price-low' },
                  { label: 'Price: High to Low', value: 'price-high' }
                ]}
                value={sortBy}
                onChange={(val) => setSortBy(val)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1745px] mx-auto w-full py-12 flex-1">
        <div className="flex gap-12">
          {/* Sidebar Filter - 20% */}
          <aside className="w-[20%] space-y-10 sticky top-[180px] h-fit">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-[0.3em] flex items-center gap-3">
                <Filter size={14} /> Categories
              </h3>
              <div className="flex flex-col gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`group flex items-center justify-between px-6 py-4 rounded-full text-[13px] font-bold transition-all border ${
                      activeCategory === cat 
                        ? 'bg-[#1e4a3a] text-white border-[#1e4a3a] translate-x-1 outline-none' 
                        : 'bg-white text-slate-500 border-slate-300 hover:border-[#1e4a3a] hover:text-[#1e4a3a] hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {cat}
                    </span>
                    <ChevronRight size={14} className={`transition-transform ${activeCategory === cat ? 'opacity-100 text-emerald-400' : 'opacity-0 group-hover:opacity-40 group-hover:translate-x-1'}`} />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product List Section - Rest of the width (65%) */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="animate-spin text-[#1e4a3a]" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Items...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, idx) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col"
                    >
                      <Link 
                        href={`/shop/${product.id}`}
                        className="flex flex-col flex-1"
                      >
                        {/* Product Image Container */}
                        <div className="aspect-square bg-white flex items-center justify-center p-2 relative">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                              <ShoppingBag size={24} strokeWidth={1} />
                            </div>
                          )}
                          
                          {/* Badge if discount */}
                          {product.originalPrice && (
                            <div className="absolute top-1 left-1">
                              <span className="px-1 py-0.5 bg-rose-500 text-white text-[6px] font-black uppercase tracking-widest rounded-sm">
                                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-2.5 pt-0 flex-1 flex flex-col">
                          <div className="flex flex-col gap-1 mb-0.5 text-left">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em]">{product.category}</span>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[13px] font-black text-[#1e4a3a]">৳{product.price}</span>
                                {product.originalPrice && (
                                  <span className="text-[8px] text-slate-400 line-through font-medium leading-none">৳{product.originalPrice}</span>
                                )}
                              </div>
                            </div>
                            <h3 className="text-[11px] font-bold text-[#1e4a3a] leading-tight line-clamp-2 min-h-[20px]">
                              {product.name}
                            </h3>
                          </div>
                        </div>
                      </Link>
                      
                      <div className="p-2.5 pt-0">
                        <button 
                          disabled={isInCart(product.id) || Number(product.stock) === 0}
                          onClick={() => addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image,
                            type: 'product'
                          })}
                          className={`w-full py-2.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                            isInCart(product.id)
                              ? 'bg-emerald-500 text-white cursor-default'
                              : Number(product.stock) === 0
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-[#1e4a3a] text-white hover:bg-[#1e4a3a]/90 active:scale-[0.98]'
                          }`}
                        >
                          {isInCart(product.id) ? 'Added' : (Number(product.stock) === 0 ? 'Empty' : 'Add to Cart')}
                        </button>
                      </div>
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl border border-slate-200 flex items-center justify-center text-slate-300 mb-6 shadow-xl shadow-slate-200/50">
                  <ShoppingBag size={40} strokeWidth={1} />
                </div>
                <h2 className="text-xl font-bold text-[#1e4a3a]">No Products Found</h2>
                <p className="text-slate-500 text-[13px] font-medium mt-2 max-w-sm mx-auto">
                  We couldn't find any products matching your current filters or search query.
                </p>
                <button 
                  onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                  className="mt-6 text-[11px] font-black text-[#1e4a3a] uppercase tracking-[0.2em] border-b-2 border-[#1e4a3a] pb-1 hover:opacity-70 transition-opacity"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Trust Badges */}
      <section className="bg-white border-t border-slate-200 py-12 px-4">
        <div className="max-w-[1745px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: ShieldCheck, title: 'Authentic', desc: '100% Genuine Medicine' },
            { icon: Clock, title: 'Fast Delivery', desc: 'Reliable and quick shipping' },
            { icon: ShoppingCart, title: 'Safe Storage', desc: 'Kept in perfect condition' },
            { icon: Star, title: 'Expert Help', desc: 'Pharmacists available 24/7' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1e4a3a]">
                <item.icon size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#1e4a3a] uppercase tracking-tight">{item.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}

function Check({ size }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
