'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';

export default function CustomDropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select option", 
  label, 
  icon: Icon,
  searchable = false,
  error,
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') return { label: opt, value: opt };
    return opt;
  });

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  const filteredOptions = normalizedOptions.filter(opt => 
    opt.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`w-full space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center justify-between">
          <span>{label}</span>
          {error && <span className="text-rose-500 lowercase font-normal italic">{error}</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-11 px-5 flex items-center justify-between gap-3 bg-white border transition-all rounded-full select-none outline-none
          ${isOpen ? 'border-[#1e4a3a] bg-white ring-4 ring-[#1e4a3a]/5' : 'border-slate-200 text-slate-400 hover:border-[#1e4a3a]'}
          ${error ? 'border-rose-400 bg-rose-50/30' : ''}
          `}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {Icon && <Icon size={16} className={`${isOpen ? 'text-[#1e4a3a]' : 'text-slate-300'} transition-colors shrink-0`} />}
            <span className={`text-[13px] font-medium truncate ${selectedOption ? 'text-[#1e4a3a]' : 'text-slate-400'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
 <motion.div
 animate={{ rotate: isOpen ? 180 : 0 }}
 transition={{ duration: 0.2 }}
 className="shrink-0"
 >
 <ChevronDown size={16} className="text-slate-300" />
 </motion.div>
 </button>

 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{ opacity: 0, y: 10, scale: 0.98 }}
 animate={{ opacity: 1, y: 4, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.98 }}
 transition={{ duration: 0.15, ease: "easeOut" }}
 className="absolute z-[100] top-full left-0 right-0 bg-white border border-slate-300 rounded-xl overflow-hidden"
 >
 {searchable && (
 <div className="p-2 border-b border-slate-200">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
 <input
 type="text"
 placeholder="Search..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full h-9 pl-9 pr-4 bg-slate-50 border-none rounded-lg text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-med-primary/20 transition-all"
 autoFocus
 />
 </div>
 </div>
 )}

 <div className="max-h-[200px] overflow-y-auto p-1.5 custom-scrollbar">
 {filteredOptions.length > 0 ? (
 filteredOptions.map((option) => (
 <div
 key={option.value}
 onClick={() => {
 onChange(option.value);
 setIsOpen(false);
 setSearchTerm("");
 }}
 className={`group px-3 py-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-all
 ${value === option.value ? 'bg-[#1e4a3a]/5 text-[#1e4a3a]' : 'hover:bg-[#1e4a3a]/5 text-slate-600 hover:text-[#1e4a3a]'}
 `}
 >
 <div className="flex items-center gap-3 overflow-hidden">
 {option.icon && <option.icon size={14} className={value === option.value ? 'text-[#1e4a3a]' : 'text-slate-400 group-hover:text-[#1e4a3a] transition-colors'} />}
 <span className="text-[13px] font-medium truncate">{option.label}</span>
 </div>
 {value === option.value && (
 <Check size={14} className="text-med-primary" />
 )}
 </div>
 ))
 ) : (
 <div className="px-4 py-8 text-center">
 <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">No results found</p>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
}


