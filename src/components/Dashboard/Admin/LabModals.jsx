'use client';
import { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/30 backdrop-blur-sm" onClick={() => setShowAddLabProvider(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-lg bg-white rounded-lg overflow-hidden border border-slate-300 shadow-2xl">
            <form onSubmit={handleSaveLabProvider} className="p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-[#1e4a3a] tracking-widest uppercase mb-1.5">{editingLabProvider ? 'Update Clinical Branch' : 'Register Diagnostic Provider'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Fulfillment Configuration</p>
                </div>
                <button type="button" onClick={() => setShowAddLabProvider(false)} className="w-9 h-9 border border-slate-200 rounded-lg text-slate-400 hover:text-[#1e4a3a] hover:bg-slate-50 flex items-center justify-center transition-all"><X size={18} /></button>
              </div>

              <div className="space-y-6">
                {/* 01. Identification */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-[#1e4a3a] text-white flex items-center justify-center text-[9px] font-bold">01</div>
                    <h4 className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest">Identity Manifest</h4>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Provider / Center Name</label>
                    <div className="relative group">
                      <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e4a3a] transition-colors" />
                      <input 
                        required type="text" 
                        value={labProviderForm.name} 
                        onChange={e => setLabProviderForm({...labProviderForm, name: e.target.value})} 
                        placeholder="e.g. Popular Diagnostic Center..." 
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 text-[13px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] focus:bg-white transition-all uppercase tracking-tight" 
                      />
                    </div>
                  </div>
                </div>

                {/* 02. Location Hierarchy */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-[#1e4a3a] text-white flex items-center justify-center text-[9px] font-bold">02</div>
                    <h4 className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest">Operational Hierarchy</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Division */}
                    <div className="space-y-2">
                      {isCustomDivision ? (
                        <div className="space-y-2 font-bold">
                          <label className="text-[10px] text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Manual Division</label>
                          <div className="relative">
                            <input 
                              autoFocus
                              required type="text" 
                              value={labProviderForm.division} 
                              onChange={e => setLabProviderForm({...labProviderForm, division: e.target.value})} 
                              className="w-full h-11 bg-white border border-[#1e4a3a] rounded-lg px-4 text-[13px] font-bold outline-none uppercase tracking-tight" 
                            />
                            <button onClick={() => { setIsCustomDivision(false); setLabProviderForm({...labProviderForm, division: ''}); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase text-rose-500">Reset</button>
                          </div>
                        </div>
                      ) : (
                        <CustomDropdown 
                          label="Global Division"
                          placeholder="Select"
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
                          className="!h-11 border-slate-200"
                          searchable
                        />
                      )}
                    </div>

                    {/* District */}
                    <div className="space-y-2">
                      {isCustomDistrict ? (
                        <div className="space-y-2 font-bold">
                          <label className="text-[10px] text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Manual District</label>
                          <div className="relative">
                            <input 
                              autoFocus
                              required type="text" 
                              value={labProviderForm.district} 
                              onChange={e => setLabProviderForm({...labProviderForm, district: e.target.value})} 
                              className="w-full h-11 bg-white border border-[#1e4a3a] rounded-lg px-4 text-[13px] font-bold outline-none uppercase tracking-tight" 
                            />
                            <button onClick={() => { setIsCustomDistrict(false); setLabProviderForm({...labProviderForm, district: ''}); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase text-rose-500">Reset</button>
                          </div>
                        </div>
                      ) : (
                        <CustomDropdown 
                          label="Active District"
                          placeholder="Select"
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
                          className="!h-11 border-slate-200"
                          searchable
                          disabled={!labProviderForm.division}
                        />
                      )}
                    </div>
                  </div>

                  {/* Specific Area */}
                  <div className="space-y-2">
                    {isCustomArea ? (
                      <div className="space-y-2 font-bold">
                        <label className="text-[10px] text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Manual Area / Cluster</label>
                        <div className="relative">
                          <input 
                            autoFocus
                            required type="text" 
                            value={labProviderForm.area} 
                            onChange={e => setLabProviderForm({...labProviderForm, area: e.target.value})} 
                            className="w-full h-11 bg-emerald-50 border border-emerald-500 rounded-lg px-4 text-[13px] font-bold outline-none uppercase tracking-tight" 
                          />
                          <button onClick={() => { setIsCustomArea(false); setLabProviderForm({...labProviderForm, area: ''}); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase text-rose-500">Reset</button>
                        </div>
                      </div>
                    ) : (
                      <CustomDropdown 
                        label="Center Area / Cluster"
                        placeholder="Identify specific location..."
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
                        className="!h-11 border-slate-200"
                        searchable
                        disabled={!labProviderForm.district}
                      />
                    )}
                  </div>
                </div>

                {/* 03. Visibility Status */}
                <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-lg group">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${labProviderForm.status === 'active' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-white text-slate-300 border-slate-200'}`}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-widest">Publication Status</h5>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">Visible within booking stream</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setLabProviderForm({...labProviderForm, status: labProviderForm.status === 'active' ? 'inactive' : 'active'})}
                    className={`relative w-10 h-5 rounded-full transition-all duration-300 ${labProviderForm.status === 'active' ? 'bg-[#1e4a3a]' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${labProviderForm.status === 'active' ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setShowAddLabProvider(false)} className="flex-1 h-11 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#1e4a3a] transition-all">Discard</button>
                <button type="submit" className="flex-[1.5] h-11 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all">
                  {editingLabProvider ? 'Commit Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showAddLabTest && (
        <div key="add-lab-test-modal" className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/30 backdrop-blur-sm" onClick={() => { setShowAddLabTest(false); setFilterDiv(''); setFilterDist(''); setFilterArea(''); }} />
          <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-lg bg-white rounded-lg overflow-hidden border border-slate-300 shadow-2xl">
            <form onSubmit={handleSaveLabTest} className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-[#1e4a3a] tracking-widest uppercase mb-1.5">{editingLabTest ? 'Modify Diagnostic Test' : 'Add Test to Catalog'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Clinical Parameterization</p>
                </div>
                <button type="button" onClick={() => { setShowAddLabTest(false); setFilterDiv(''); setFilterDist(''); setFilterArea(''); }} className="w-9 h-9 border border-slate-200 rounded-lg text-slate-400 hover:text-[#1e4a3a] hover:bg-slate-50 flex items-center justify-center transition-all"><X size={18} /></button>
              </div>

              <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar font-bold">
                {/* 1. Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-[#1e4a3a] text-white flex items-center justify-center text-[9px] font-bold">01</div>
                    <h4 className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest">Test Specification</h4>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Diagnostic Test Title</label>
                    <input required type="text" value={labTestForm.name} onChange={e => setLabTestForm({...labTestForm, name: e.target.value})} placeholder="e.g. Blood Sugar (Fasting)" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-[13px] font-bold outline-none focus:border-[#1e4a3a] focus:bg-white transition-all uppercase tracking-tight" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Category Segment</label>
                      <input required type="text" value={labTestForm.category} onChange={e => setLabTestForm({...labTestForm, category: e.target.value})} placeholder="Biochemistry" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-[13px] font-bold outline-none focus:border-[#1e4a3a] focus:bg-white transition-all uppercase tracking-tight" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Unit Fee (৳)</label>
                      <input required type="number" value={labTestForm.price} onChange={e => setLabTestForm({...labTestForm, price: e.target.value})} placeholder="500" className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-[13px] font-bold outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" />
                    </div>
                  </div>
                </div>

                {/* 2. Provider Location Filter */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">02</div>
                    <h4 className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest">Route to Provider Center</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <CustomDropdown 
                      label="Div"
                      placeholder="Select"
                      options={getDivisions().map(d => ({ label: d, value: d }))}
                      value={filterDiv}
                      onChange={(val) => { setFilterDiv(val); setFilterDist(''); setFilterArea(''); setLabTestForm({...labTestForm, providerId: ''}); }}
                      className="!h-10 border-slate-200"
                      searchable={true}
                    />
                    <CustomDropdown 
                      label="Dist"
                      placeholder="Select"
                      disabled={!filterDiv}
                      options={getDistricts(filterDiv).map(d => ({ label: d, value: d }))}
                      value={filterDist}
                      onChange={(val) => { setFilterDist(val); setFilterArea(''); setLabTestForm({...labTestForm, providerId: ''}); }}
                      className="!h-10 border-slate-200"
                      searchable={true}
                    />
                    <CustomDropdown 
                      label="Area"
                      placeholder="Select"
                      disabled={!filterDist}
                      options={getAreas(filterDiv, filterDist).map(a => ({ label: a, value: a }))}
                      value={filterArea}
                      onChange={(val) => { setFilterArea(val); setLabTestForm({...labTestForm, providerId: ''}); }}
                      className="!h-10 border-slate-200"
                      searchable={true}
                    />
                  </div>

                  <div className="space-y-2">
                    <CustomDropdown 
                      label="Select Associated Clinical Provider"
                      placeholder="Filter by location above..."
                      icon={ShieldCheck}
                      disabled={!filterArea}
                      options={filteredProviders.map(p => ({ label: p.name, value: p.id }))}
                      value={labTestForm.providerId}
                      onChange={(val) => setLabTestForm({...labTestForm, providerId: val})}
                      className="!h-11 border-slate-200"
                      searchable={true}
                    />
                    {!filterArea && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Define location parameters first</p>}
                    {filterArea && filteredProviders.length === 0 && <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest ml-1">Manifest empty for this sector</p>}
                  </div>
                </div>

                {/* 3. Logistics */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded bg-[#1e4a3a] text-white flex items-center justify-center text-[9px] font-bold">03</div>
                    <h4 className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest">Clinical Protocol</h4>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Preparation Instruction</label>
                    <textarea value={labTestForm.preparation} onChange={e => setLabTestForm({...labTestForm, preparation: e.target.value})} placeholder="e.g. 8-10 hours fasting required." className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 text-[12px] font-medium resize-none outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddLabTest(false); setFilterDiv(''); setFilterDist(''); setFilterArea(''); }} className="flex-1 h-11 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#1e4a3a] transition-all">Cancel</button>
                <button type="submit" disabled={!labTestForm.providerId} className="flex-[1.5] h-11 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-40">
                  {editingLabTest ? 'Apply Updates' : 'Confirm Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
