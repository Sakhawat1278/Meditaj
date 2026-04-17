'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAYS_IN_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function DatePicker({ value, onChange, placeholder = "Select a date", label, className = "", error, icon: Icon = CalendarIcon }) {
 const [isOpen, setIsOpen] = useState(false);
 const containerRef = useRef(null);

 const defaultDate = value ? new Date(value) : new Date();
 const [currentMonth, setCurrentMonth] = useState(defaultDate.getMonth());
 const [currentYear, setCurrentYear] = useState(defaultDate.getFullYear());
 const [showYearPicker, setShowYearPicker] = useState(false);
 const yearGridRef = useRef(null);

 useEffect(() => {
 if (value) {
 const d = new Date(value);
 setCurrentMonth(d.getMonth());
 setCurrentYear(d.getFullYear());
 }
 }, [value]);

 useEffect(() => {
 function handleClickOutside(event) {
 if (containerRef.current && !containerRef.current.contains(event.target)) {
 setIsOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
 const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

 const handlePrevMonth = () => {
 if (currentMonth === 0) {
 setCurrentMonth(11);
 setCurrentYear(prev => prev - 1);
 } else {
 setCurrentMonth(prev => prev - 1);
 }
 };

 const handleNextMonth = () => {
 if (currentMonth === 11) {
 setCurrentMonth(0);
 setCurrentYear(prev => prev + 1);
 } else {
 setCurrentMonth(prev => prev + 1);
 }
 };

 const handleSelectDate = (day) => {
 // Format YYYY-MM-DD
 const date = new Date(Date.UTC(currentYear, currentMonth, day));
 const year = date.getUTCFullYear();
 const month = String(date.getUTCMonth() + 1).padStart(2, '0');
 const d = String(date.getUTCDate()).padStart(2, '0');
 onChange(`${year}-${month}-${d}`);
 setIsOpen(false);
 };

 const clearDate = (e) => {
 e.stopPropagation();
 onChange('');
 };

 const daysInMonth = getDaysInMonth(currentYear, currentMonth);
 const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

 const blanks = Array.from({ length: firstDay }, (_, i) => i);
 const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

 // Year range for picker
 const startYear = new Date().getFullYear() - 100;
 const endYear = new Date().getFullYear() + 10;
 const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();

 const handleYearSelect = (year) => {
 setCurrentYear(year);
 setShowYearPicker(false);
 };

 const displayDate = value ? new Date(value).toLocaleDateString('en-US', {
 month: 'short',
 day: 'numeric',
 year: 'numeric'
 }) : '';

  return (
    <div className={`relative w-full space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center justify-between">
          <span>{label}</span>
          {error && <span className="text-rose-500 lowercase font-normal italic">{error}</span>}
        </label>
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 flex items-center justify-between text-[13px] font-medium px-5 bg-white border rounded-full cursor-pointer transition-all 
        ${error ? 'border-rose-300 text-rose-500 bg-rose-50/50' : 'border-slate-200 text-slate-800 hover:border-[#1e4a3a] focus:border-[#1e4a3a]'}
        ${isOpen ? 'border-[#1e4a3a] ring-4 ring-[#1e4a3a]/5 bg-white' : ''}
        `}
      >
        <div className="flex items-center gap-3">
 <Icon size={16} className={`transition-colors ${error ? 'text-rose-400' : (isOpen ? 'text-[#1e4a3a]' : 'text-slate-300')}`} />
 {value ? (
 <span className="text-[#1e4a3a]">{displayDate}</span>
 ) : (
 <span className="text-slate-300">{placeholder}</span>
 )}
 </div>
 {value && (
 <button 
 type="button"
 onClick={clearDate}
 className="w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
 >
 <X size={12} />
 </button>
 )}
 </div>

 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 transition={{ duration: 0.2 }}
 className="absolute z-50 top-full left-0 mt-2 p-4 bg-white rounded-2xl border border-[#1e4a3a]/10 w-[280px]"
 >
 <div className="flex items-center justify-between mb-4">
 <button 
 type="button"
 onClick={handlePrevMonth}
 disabled={showYearPicker}
 className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors ${showYearPicker ? 'opacity-0' : ''}`}
 >
 <ChevronLeft size={16} />
 </button>
 
 <div className="flex items-center gap-1.5">
 <span className="text-[13px] font-extrabold text-[#1e4a3a] tracking-tight uppercase">
 {MONTHS[currentMonth]}
 </span>
 <button 
 type="button"
 onClick={() => setShowYearPicker(!showYearPicker)}
 className={`px-2 py-0.5 rounded-md text-[13px] font-extrabold tracking-tight transition-all ${showYearPicker ? 'bg-[#1e4a3a] text-white' : 'text-[#1e4a3a] hover:bg-slate-100'}`}
 >
 {currentYear}
 </button>
 </div>

 <button 
 type="button"
 onClick={handleNextMonth}
 disabled={showYearPicker}
 className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors ${showYearPicker ? 'opacity-0' : ''}`}
 >
 <ChevronRight size={16} />
 </button>
 </div>

 <AnimatePresence mode="wait">
 {showYearPicker ? (
 <motion.div
 key="year-picker"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="grid grid-cols-4 gap-2 h-[200px] overflow-y-auto custom-scrollbar p-1"
 >
 {years.map(year => (
 <button
 key={year}
 type="button"
 onClick={() => handleYearSelect(year)}
 className={`h-9 flex items-center justify-center rounded-xl text-[12px] font-bold transition-all
 ${currentYear === year 
 ? 'bg-[#1e4a3a] text-white' 
 : 'text-slate-600 hover:bg-slate-100'
 }
 `}
 >
 {year}
 </button>
 ))}
 </motion.div>
 ) : (
 <motion.div
 key="calendar-grid"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 >
 <div className="grid grid-cols-7 gap-1 mb-2">
 {DAYS_IN_WEEK.map(day => (
 <div key={day} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
 {day}
 </div>
 ))}
 </div>

 <div className="grid grid-cols-7 gap-1">
 {blanks.map(blank => (
 <div key={`blank-${blank}`} className="w-8 h-8" />
 ))}
 {days.map(day => {
 const isSelected = value && new Date(value).getUTCDate() === day && new Date(value).getUTCMonth() === currentMonth && new Date(value).getUTCFullYear() === currentYear;
 return (
 <button
 key={day}
 type="button"
 onClick={() => handleSelectDate(day)}
 className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all mx-auto
 ${isSelected 
 ? 'bg-[#1e4a3a] text-white' 
 : 'text-slate-700 hover:bg-slate-100'
 }
 `}
 >
 {day}
 </button>
 )
 })}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}


