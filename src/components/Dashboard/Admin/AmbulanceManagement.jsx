'use client';
import React, { useState } from 'react';
import { 
  Ambulance, Navigation, MapPin, Clock, Phone, 
  Search, Filter, Check, X, AlertCircle, Calendar,
  MoreVertical, UserCheck, Activity, Plus, MoreHorizontal,
  ChevronRight, ArrowRight, ShieldCheck, HeartPulse, Edit3, Trash2
} from 'lucide-react';
import { m as motion, AnimatePresence } from 'framer-motion';
import CustomDropdown from '@/components/UI/CustomDropdown';

export default function AmbulanceManagement({ 
  bookings, 
  fleet, 
  isLoading, 
  onAddAmbulance, 
  onEditAmbulance,
  onUpdateStatus,
  onAssignAmbulance,
  onDeleteAmbulance
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
            className="p-6 bg-white border border-slate-200 rounded-lg flex items-center gap-5 hover:border-slate-300 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center border border-slate-100`}>
              <Activity size={24} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1e4a3a] tracking-tight leading-none">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[600px]"
      >
        {/* Sub-Tabs & Actions */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'bookings', label: 'Recent Bookings', icon: Navigation },
              { id: 'fleet', label: 'Ambulance Fleet', icon: Ambulance }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeSubTab === tab.id ? 'text-[#1e4a3a]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {activeSubTab === tab.id && (
                  <motion.div 
                    layoutId="subtab-active"
                    className="absolute inset-0 bg-white border border-slate-200 rounded-md"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={14} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-10 w-full md:w-80 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e4a3a] transition-colors" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeSubTab === 'bookings' ? 'Search bookings...' : 'Search ambulances...'}
                className="w-full h-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 text-[12px] font-bold outline-none focus:border-[#1e4a3a]/30 transition-all placeholder:text-slate-300"
              />
            </div>
            {activeSubTab === 'fleet' && (
              <button 
                onClick={onAddAmbulance}
                className="h-10 px-6 bg-[#1e4a3a] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all"
              >
                <Plus size={16} />
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
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Booking Summary</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup & Dropoff</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Agent</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</th>
                    <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
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
                      <td colSpan="5" className="px-8 py-24 text-center text-slate-300 italic font-bold text-[11px] uppercase tracking-widest">No active requests found</td>
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
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[14px] border border-slate-100 ${booking.status === 'pending' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                              {booking.patientName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-[#1e4a3a] leading-none mb-1.5 uppercase tracking-tight">{booking.patientName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Phone size={11} className="text-slate-300" /> {booking.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <MapPin size={13} className="text-emerald-500 shrink-0" />
                              <p className="text-[11px] font-bold text-slate-700 truncate max-w-[180px]">{booking.pickupAddress}</p>
                            </div>
                            <div className="flex items-center gap-3 opacity-40">
                               <ArrowRight size={11} className="shrink-0" />
                               <p className="text-[10px] font-bold text-slate-500 truncate max-w-[180px]">{booking.dropoffAddress}</p>
                            </div>
                            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                               {booking.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {booking.assignedAmbulanceId ? (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold text-[#1e4a3a] leading-none flex items-center gap-2 uppercase tracking-tight">
                                <Ambulance size={13} className="text-blue-500" /> {fleet.find(f => f.id === booking.assignedAmbulanceId)?.plateNumber}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold">{fleet.find(f => f.id === booking.assignedAmbulanceId)?.driverName}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">Unassigned</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
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
                                className="h-8 px-5 bg-[#1e4a3a] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                              >
                                Dispatch
                              </button>
                            ) : (
                              <div className="w-[140px] inline-block text-left">
                                <CustomDropdown 
                                  options={[
                                    { label: 'Assigned', value: 'assigned' },
                                    { label: 'On Trip', value: 'ongoing' },
                                    { label: 'Completed', value: 'completed' },
                                    { label: 'Cancelled', value: 'cancelled' }
                                  ]}
                                  value={booking.status}
                                  onChange={(val) => onUpdateStatus(booking, val)}
                                  className="!h-8 text-[11px]"
                                />
                              </div>
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
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle Number</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Driver & Contact</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Availability</th>
                    <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit</th>
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
                      <td colSpan="5" className="px-8 py-24 text-center text-slate-300 italic font-bold text-[11px] uppercase tracking-widest">No fleet units registered</td>
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
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold border border-slate-100 ${unit.status === 'available' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              <Ambulance size={18} />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-[#1e4a3a] leading-none mb-1.5 tracking-tight uppercase">{unit.plateNumber}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{unit.model || 'Standard Ambulance'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-1.5">
                              <p className="text-[13px] font-bold text-slate-700 leading-none">{unit.driverName}</p>
                              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-2 leading-none"><Phone size={11} className="text-slate-300" /> {unit.driverPhone}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold uppercase tracking-widest text-slate-600">
                             {unit.type}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${unit.status === 'available' ? 'bg-emerald-500' : unit.status === 'on-trip' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                             <span className={`text-[11px] font-bold uppercase tracking-tight ${unit.status === 'available' ? 'text-emerald-600' : unit.status === 'on-trip' ? 'text-amber-600' : 'text-slate-400'}`}>
                               {unit.status.replace('-', ' ')}
                             </span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => onEditAmbulance(unit)}
                               className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-[#1e4a3a] hover:bg-slate-50 transition-all inline-flex items-center justify-center"
                               title="Edit Unit"
                             >
                               <Edit3 size={14} />
                             </button>
                             <button 
                               onClick={() => onDeleteAmbulance(unit.id)}
                               className="w-8 h-8 rounded-lg border border-slate-200 text-slate-300 hover:text-rose-600 hover:border-rose-100 transition-all inline-flex items-center justify-center"
                               title="Decommission Unit"
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>
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

