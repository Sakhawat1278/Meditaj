'use client';
import React, { useState } from 'react';
import { 
  Ambulance, Navigation, MapPin, Clock, Phone, 
  Search, Filter, Check, X, AlertCircle, Calendar,
  MoreVertical, UserCheck, Activity, Plus, MoreHorizontal,
  ChevronRight, ArrowRight, ShieldCheck, HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AmbulanceManagement({ 
  bookings, 
  fleet, 
  isLoading, 
  onAddAmbulance, 
  onEditAmbulance,
  onUpdateStatus,
  onAssignAmbulance
}) {
  const [activeSubTab, setActiveSubTab] = useState('bookings'); // bookings | fleet
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Pending Requests', value: bookings.filter(b => b.status === 'pending').length, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Active Trips', value: bookings.filter(b => b.status === 'assigned' || b.status === 'ongoing').length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Available Fleet', value: fleet.filter(a => a.status === 'available').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Overview Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx} 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-5 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
              <Activity size={28} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{stat.label}</p>
              <p className="text-3xl font-black text-[#1e4a3a] tracking-tighter leading-none">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-slate-200 rounded-[32px] overflow-hidden flex flex-col min-h-[600px] shadow-sm"
      >
        {/* Sub-Tabs & Actions */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50">
            {[
              { id: 'bookings', label: 'Recent Bookings', icon: Navigation },
              { id: 'fleet', label: 'Ambulance Fleet', icon: Ambulance }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all relative ${activeSubTab === tab.id ? 'text-[#1e4a3a]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {activeSubTab === tab.id && (
                  <motion.div 
                    layoutId="subtab-active"
                    className="absolute inset-0 bg-white shadow-md border border-slate-200 rounded-xl"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={16} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-12 w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeSubTab === 'bookings' ? 'Search bookings...' : 'Search ambulances...'}
                className="w-full h-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 text-[13px] font-bold outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300"
              />
            </div>
            {activeSubTab === 'fleet' && (
              <button 
                onClick={onAddAmbulance}
                className="h-12 px-8 bg-[#1e4a3a] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
              >
                <Plus size={18} />
                Add Ambulance
              </button>
            )}
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeSubTab === 'bookings' ? (
              <motion.table 
                key="bookings-table"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="w-full border-collapse"
              >
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Booking Summary</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Pickup & Dropoff</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Agent</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                    <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-50"
                >
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-24 text-center text-slate-300 italic font-bold text-[14px] uppercase tracking-widest">No active requests found</td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <motion.tr 
                        key={booking.id} 
                        variants={itemVariants}
                        className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-[16px] shadow-sm ${booking.status === 'pending' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                              {booking.patientName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[14px] font-black text-[#1e4a3a] leading-none mb-2">{booking.patientName}</p>
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-2">
                                <Phone size={11} className="text-slate-300" /> {booking.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-3">
                              <MapPin size={14} className="text-emerald-500 shrink-0" />
                              <p className="text-[12px] font-bold text-slate-700 truncate max-w-[180px]">{booking.pickupAddress}</p>
                            </div>
                            <div className="flex items-center gap-3 opacity-40 pl-0.5">
                               <ArrowRight size={12} className="shrink-0" />
                               <p className="text-[11px] font-bold text-slate-500 truncate max-w-[180px]">{booking.dropoffAddress}</p>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                               {booking.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {booking.assignedAmbulanceId ? (
                            <div className="space-y-2">
                              <p className="text-[12px] font-black text-[#1e4a3a] leading-none flex items-center gap-2 uppercase tracking-tight">
                                <Ambulance size={14} className="text-blue-500" /> {fleet.find(f => f.id === booking.assignedAmbulanceId)?.plateNumber}
                              </p>
                              <p className="text-[11px] text-slate-400 font-bold ml-5">{fleet.find(f => f.id === booking.assignedAmbulanceId)?.driverName}</p>
                            </div>
                          ) : (
                            <span className="text-[11px] font-black text-slate-300 italic uppercase tracking-widest">Unassigned</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
                            booking.status === 'pending' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                            booking.status === 'assigned' ? 'bg-blue-50 text-blue-500 border-blue-100' :
                            booking.status === 'ongoing' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                            'bg-emerald-50 text-emerald-500 border-emerald-100'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {booking.status === 'pending' ? (
                              <button 
                                onClick={() => onAssignAmbulance(booking)}
                                className="h-10 px-6 bg-[#1e4a3a] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                              >
                                Dispatch
                              </button>
                            ) : (
                              <select 
                                value={booking.status}
                                onChange={(e) => onUpdateStatus(booking, e.target.value)}
                                className="h-10 bg-white border border-slate-200 rounded-xl px-4 text-[11px] font-black uppercase tracking-widest outline-none focus:border-[#1e4a3a] transition-all cursor-pointer"
                              >
                                <option value="assigned">Assigned</option>
                                <option value="ongoing">On Trip</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </motion.tbody>
              </motion.table>
            ) : (
              <motion.table 
                key="fleet-table"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="w-full border-collapse"
              >
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle Number</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Driver & Contact</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Availability</th>
                    <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Edit</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-50"
                >
                  {fleet.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-24 text-center text-slate-300 italic font-bold text-[14px] uppercase tracking-widest">No fleet units registered</td>
                    </tr>
                  ) : (
                    fleet.map((unit) => (
                      <motion.tr 
                        key={unit.id} 
                        variants={itemVariants}
                        className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black border shadow-sm ${unit.status === 'available' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              <Ambulance size={20} />
                            </div>
                            <div>
                              <p className="text-[14px] font-black text-[#1e4a3a] leading-none mb-2 tracking-tighter uppercase">{unit.plateNumber}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{unit.model || 'Standard Ambulance'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-2">
                              <p className="text-[14px] font-black text-slate-700 leading-none">{unit.driverName}</p>
                              <p className="text-[11px] text-slate-400 font-extrabold flex items-center gap-2 leading-none"><Phone size={12} className="text-slate-300" /> {unit.driverPhone}</p>
                              {unit.description && (
                                <p className="text-[11px] text-slate-400 italic font-medium leading-tight max-w-[240px] line-clamp-2">
                                  {unit.description}
                                </p>
                              )}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm">
                             {unit.type}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                             <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${unit.status === 'available' ? 'bg-emerald-500' : unit.status === 'on-trip' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                             <span className={`text-[12px] font-black uppercase tracking-tight ${unit.status === 'available' ? 'text-emerald-600' : unit.status === 'on-trip' ? 'text-amber-600' : 'text-slate-400'}`}>
                               {unit.status.replace('-', ' ')}
                             </span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button 
                             onClick={() => onEditAmbulance(unit)}
                             className="w-10 h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-[#1e4a3a] hover:bg-white hover:shadow-md transition-all inline-flex items-center justify-center active:scale-90"
                           >
                             <Edit3 size={16} />
                           </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </motion.tbody>
              </motion.table>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

