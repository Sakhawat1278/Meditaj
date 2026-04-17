'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, Plus, Info, Globe, ChevronRight } from 'lucide-react';
import CustomDropdown from '@/components/UI/CustomDropdown';
import { bdLocations, getDivisions, getDistricts, getAreas } from '@/lib/locationData';

export default function LabModals({
  showAddLabProvider,
  setShowAddLabProvider,
  editingLabProvider,
  labProviderForm,
  setLabProviderForm,
  handleSaveLabProvider,
  showAddLabTest,
  setShowAddLabTest,
  editingLabTest,
  labTestForm,
  setLabTestForm,
  handleSaveLabTest,
  labProviders
}) {
  const [isCustomDivision, setIsCustomDivision] = useState(false);
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [isCustomArea, setIsCustomArea] = useState(false);

  // States for filtering providers in Add Test modal
  const [filterDiv, setFilterDiv] = useState('');
  const [filterDist, setFilterDist] = useState('');
  const [filterArea, setFilterArea] = useState('');

  // Divisions list with Add New option
  const divisionOptions = [
    ...getDivisions().map(d => ({ label: d, value: d })),
    { label: "+ Add New Division", value: "add_new", icon: Plus }
  ];

  // Districts list based on selected division
  const getDistrictOptions = (division) => [
    ...(division && !isCustomDivision ? getDistricts(division).map(d => ({ label: d, value: d })) : []),
    { label: "+ Add New District", value: "add_new", icon: Plus }
  ];

  // Areas list based on selected district
  const getAreaOptions = (division, district) => [
    ...(division && district && !isCustomDistrict ? getAreas(division, district).map(a => ({ label: a, value: a })) : []),
    { label: "+ Add New Area", value: "add_new", icon: Plus }
  ];

  // Filtered providers for the test modal
  const filteredProviders = labProviders.filter(p => {
    if (filterDiv && p.division !== filterDiv) return false;
    if (filterDist && p.district !== filterDist) return false;
    if (filterArea && p.area !== filterArea) return false;
    return true;
  });

  return (
    <AnimatePresence>
      {showAddLabProvider && (
        <div key="add-lab-provider-modal" className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1e4a3a]/40" onClick={() => setShowAddLabProvider(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden border border-slate-300 shadow-2xl">
            <form onSubmit={handleSaveLabProvider} className="p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-black text-[#1e4a3a] tracking-tight uppercase leading-none mb-2">{editingLabProvider ? 'Update Clinical Branch' : 'Register Diagnostic Provider'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure Clinical Branch Details</p>
                </div>
                <button type="button" onClick={() => setShowAddLabProvider(false)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-[#1e4a3a] hover:bg-slate-100 flex items-center justify-center transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                {/* 01. Identification */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] text-white flex items-center justify-center text-[10px] font-black">01</div>
                    <h4 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Identity</h4>
                  </div>
                  <div className="space-y-1.5 font-bold">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Provider / Center Name</label>
                    <div className="relative group">
                      <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e4a3a] transition-colors" />
                      <input 
                        required type="text" 
                        value={labProviderForm.name} 
                        onChange={e => setLabProviderForm({...labProviderForm, name: e.target.value})} 
                        placeholder="e.g. Popular Diagnostic Center..." 
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-[13px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" 
                      />
                    </div>
                  </div>
                </div>

                {/* 02. Location Hierarchy */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] text-white flex items-center justify-center text-[10px] font-black">02</div>
                    <h4 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Global Location Hierarchy</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Division */}
                    <div className="space-y-1.5">
                      {isCustomDivision ? (
                        <div className="space-y-1.5 font-bold">
                          <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Custom Division</label>
                          <div className="relative">
                            <input 
                              autoFocus
                              required type="text" 
                              value={labProviderForm.division} 
                              onChange={e => setLabProviderForm({...labProviderForm, division: e.target.value})} 
                              className="w-full h-11 bg-white border-2 border-[#1e4a3a] rounded-xl px-4 text-[13px] font-bold outline-none" 
                            />
                            <button onClick={() => { setIsCustomDivision(false); setLabProviderForm({...labProviderForm, division: ''}); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-rose-500 hover:scale-105 transition-transform">Reset</button>
                          </div>
                        </div>
                      ) : (
                        <CustomDropdown 
                          label="Division"
                          placeholder="Select Division"
                          icon={MapPin}
                          options={divisionOptions}
                          value={labProviderForm.division}
                          onChange={(val) => {
                            if (val === 'add_new') {
                              setIsCustomDivision(true);
                              setLabProviderForm({...labProviderForm, division: '', district: '', area: ''});
                            } else {
                              setLabProviderForm({...labProviderForm, division: val, district: '', area: ''});
                            }
                          }}
                          searchable
                        />
                      )}
                    </div>

                    {/* District */}
                    <div className="space-y-1.5">
                      {isCustomDistrict ? (
                        <div className="space-y-1.5 font-bold">
                          <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Custom District</label>
                          <div className="relative">
                            <input 
                              autoFocus
                              required type="text" 
                              value={labProviderForm.district} 
                              onChange={e => setLabProviderForm({...labProviderForm, district: e.target.value})} 
                              className="w-full h-11 bg-white border-2 border-[#1e4a3a] rounded-xl px-4 text-[13px] font-bold outline-none" 
                            />
                            <button onClick={() => { setIsCustomDistrict(false); setLabProviderForm({...labProviderForm, district: ''}); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-rose-500 hover:scale-105 transition-transform">Reset</button>
                          </div>
                        </div>
                      ) : (
                        <CustomDropdown 
                          label="District"
                          placeholder="Select District"
                          icon={Navigation}
                          options={getDistrictOptions(labProviderForm.division)}
                          value={labProviderForm.district}
                          onChange={(val) => {
                            if (val === 'add_new') {
                              setIsCustomDistrict(true);
                              setLabProviderForm({...labProviderForm, district: '', area: ''});
                            } else {
                              setLabProviderForm({...labProviderForm, district: val, area: ''});
                            }
                          }}
                          searchable
                          disabled={!labProviderForm.division}
                        />
                      )}
                    </div>
                  </div>

                  {/* Specific Area */}
                  <div className="space-y-1.5">
                    {isCustomArea ? (
                      <div className="space-y-1.5 font-bold">
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Custom Area / Branch</label>
                        <div className="relative">
                          <input 
                            autoFocus
                            required type="text" 
                            value={labProviderForm.area} 
                            onChange={e => setLabProviderForm({...labProviderForm, area: e.target.value})} 
                            className="w-full h-11 bg-emerald-50 border-2 border-emerald-500 rounded-xl px-4 text-[13px] font-bold outline-none" 
                          />
                          <button onClick={() => { setIsCustomArea(false); setLabProviderForm({...labProviderForm, area: ''}); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-rose-500 hover:scale-105 transition-transform">Reset</button>
                        </div>
                      </div>
                    ) : (
                      <CustomDropdown 
                        label="Specific Area / Branch"
                        placeholder="Gulshan-2, Road 45"
                        icon={MapPin}
                        options={getAreaOptions(labProviderForm.division, labProviderForm.district)}
                        value={labProviderForm.area}
                        onChange={(val) => {
                          if (val === 'add_new') {
                            setIsCustomArea(true);
                            setLabProviderForm({...labProviderForm, area: ''});
                          } else {
                            setLabProviderForm({...labProviderForm, area: val});
                          }
                        }}
                        className="border-emerald-500"
                        searchable
                        disabled={!labProviderForm.district}
                      />
                    )}
                  </div>
                </div>

                {/* 03. Visibility Status */}
                <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                      <Activity size={20} className={labProviderForm.status === 'active' ? 'text-emerald-500' : ''} />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Provider Status</h5>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Currently visible to patients</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setLabProviderForm({...labProviderForm, status: labProviderForm.status === 'active' ? 'inactive' : 'active'})}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${labProviderForm.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${labProviderForm.status === 'active' ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setShowAddLabProvider(false)} className="flex-1 h-12 text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Discard</button>
                <button type="submit" className="flex-[1.5] h-12 bg-[#0F172A] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]">
                  {editingLabProvider ? 'Update Records' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showAddLabTest && (
        <div key="add-lab-test-modal" className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-[#1e4a3a]/40" 
            onClick={() => {
              setShowAddLabTest(false);
              setFilterDiv('');
              setFilterDist('');
              setFilterArea('');
            }} 
          />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden border border-slate-300 shadow-2xl">
            <form onSubmit={handleSaveLabTest} className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-black text-[#1e4a3a] tracking-tight uppercase leading-none mb-2">{editingLabTest ? 'Modify Diagnostic Test' : 'Add Test to Catalog'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Clinical Test Parameters</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddLabTest(false);
                    setFilterDiv('');
                    setFilterDist('');
                    setFilterArea('');
                  }} 
                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-[#1e4a3a] hover:bg-slate-100 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* 1. Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] text-white flex items-center justify-center text-[10px] font-black">01</div>
                    <h4 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Test Information</h4>
                  </div>
                  <div className="space-y-1.5 font-bold">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Diagnostic Test Name</label>
                    <input required type="text" value={labTestForm.name} onChange={e => setLabTestForm({...labTestForm, name: e.target.value})} placeholder="e.g. Blood Sugar (Fasting)" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 font-bold">
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <input required type="text" value={labTestForm.category} onChange={e => setLabTestForm({...labTestForm, category: e.target.value})} placeholder="Biochemistry" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-1.5 font-bold">
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Base Price (৳)</label>
                      <input required type="number" value={labTestForm.price} onChange={e => setLabTestForm({...labTestForm, price: e.target.value})} placeholder="500" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" />
                    </div>
                  </div>
                </div>

                {/* 2. Provider Location Filter */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">02</div>
                    <h4 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Identify Provider Location</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <CustomDropdown 
                      label="Division"
                      placeholder="Select"
                      options={getDivisions().map(d => ({ label: d, value: d }))}
                      value={filterDiv}
                      onChange={(val) => { setFilterDiv(val); setFilterDist(''); setFilterArea(''); setLabTestForm({...labTestForm, providerId: ''}); }}
                      searchable={true}
                    />
                    <CustomDropdown 
                      label="District"
                      placeholder="Select"
                      disabled={!filterDiv}
                      options={getDistricts(filterDiv).map(d => ({ label: d, value: d }))}
                      value={filterDist}
                      onChange={(val) => { setFilterDist(val); setFilterArea(''); setLabTestForm({...labTestForm, providerId: ''}); }}
                      searchable={true}
                    />
                    <CustomDropdown 
                      label="Area"
                      placeholder="Select"
                      disabled={!filterDist}
                      options={getAreas(filterDiv, filterDist).map(a => ({ label: a, value: a }))}
                      value={filterArea}
                      onChange={(val) => { setFilterArea(val); setLabTestForm({...labTestForm, providerId: ''}); }}
                      searchable={true}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <CustomDropdown 
                      label="Assign Clinical Provider"
                      placeholder="Find lab in selected area..."
                      icon={ShieldCheck}
                      disabled={!filterArea}
                      options={filteredProviders.map(p => ({ label: p.name, value: p.id }))}
                      value={labTestForm.providerId}
                      onChange={(val) => setLabTestForm({...labTestForm, providerId: val})}
                      searchable={true}
                      className="border-emerald-500"
                    />
                    {!filterArea && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select location hierarchy to see providers</p>}
                    {filterArea && filteredProviders.length === 0 && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest ml-1">No providers found in this area</p>}
                  </div>
                </div>

                {/* 3. Logistics */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#1e4a3a] text-white flex items-center justify-center text-[10px] font-black">03</div>
                    <h4 className="text-[11px] font-black text-[#1e4a3a] uppercase tracking-widest">Clinical Logistics</h4>
                  </div>
                  <div className="space-y-1.5 font-bold">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">Preparation & Description</label>
                    <textarea value={labTestForm.preparation} onChange={e => setLabTestForm({...labTestForm, preparation: e.target.value})} placeholder="e.g. 8-10 hours fasting required. Morning sample preferred." className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[12px] font-medium resize-none outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddLabTest(false);
                    setFilterDiv('');
                    setFilterDist('');
                    setFilterArea('');
                  }} 
                  className="flex-1 h-12 text-[12px] font-black uppercase tracking-widest text-slate-400"
                >
                  Cancel
                </button>
                <button type="submit" disabled={!labTestForm.providerId} className="flex-[1.5] h-12 bg-[#1e4a3a] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 active:scale-[0.98]">
                  {editingLabTest ? 'Apply Updates' : 'Confirm & Add to Index'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
