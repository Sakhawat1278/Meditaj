'use client';
import { motion } from 'framer-motion';
import { Plus, Info, Check } from 'lucide-react';

export default function LabTestCard({ test, onAddToCart, isInCart }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-300 rounded-xl p-4 hover:border-emerald-300 transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              {test.category || 'Diagnostic'}
            </span>
          </div>
          <h3 className="text-[14px] font-bold text-[#1e4a3a] leading-tight group-hover:text-emerald-700 transition-colors">
            {test.name}
          </h3>
        </div>
        <div className="text-right whitespace-nowrap">
          <span className="text-[15px] font-black text-[#1e4a3a]">৳{test.price}</span>
        </div>
      </div>

      <div className="space-y-2">
        {test.description && (
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">
            {test.description}
          </p>
        )}

        {test.preparation && (
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
            <div className="flex items-center gap-1.5">
              <Info size={13} className="text-slate-300" />
              <span>{test.preparation}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
        <button
          onClick={() => onAddToCart(test)}
          disabled={isInCart}
          className={`h-9 px-4 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2
            ${isInCart 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' 
              : 'bg-white border border-slate-300 text-slate-600 hover:bg-[#1e4a3a] hover:text-white hover:border-[#1e4a3a] active:scale-95'
            }
          `}
        >
          {isInCart ? (
            <>
              <Check size={14} strokeWidth={3} />
              Added to cart
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={3} />
              Add to cart
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
