'use client';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { Plus, Minus, FileText, CheckCircle2, Loader2 } from 'lucide-react';

const EMPTY_MED = { name: '', dosage: '', duration: '', instructions: '' };

export default function PrescriptionForm({ sessionId, appointmentId, doctorId, patientId, patientName, onDone }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }]);
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addMed = () => setMedicines((prev) => [...prev, { ...EMPTY_MED }]);
  const removeMed = (i) => setMedicines((prev) => prev.filter((_, idx) => idx !== i));
  const updateMed = (i, field, val) =>
    setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));

  const handleSave = async () => {
    if (!diagnosis.trim()) return toast.error('Please enter a diagnosis');
    const validMeds = medicines.filter((m) => m.name.trim());
    if (validMeds.length === 0) return toast.error('Add at least one medicine');

    setIsSaving(true);
    try {
      const prescRef = await addDoc(collection(db, 'prescriptions'), {
        sessionId,
        appointmentId,
        doctorId,
        patientId,
        patientName,
        diagnosis,
        medicines: validMeds,
        advice,
        followUpDate: followUpDate || null,
        issuedAt: serverTimestamp(),
        status: 'issued',
      });

      // Link prescription to session
      await updateDoc(doc(db, 'consultation_sessions', sessionId), {
        prescriptionId: prescRef.id,
      });

      toast.success('Prescription issued successfully');
      onDone?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save prescription');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#1e4a3a] rounded-lg flex items-center justify-center">
          <FileText size={16} className="text-white" />
        </div>
        <div>
          <h3 className="text-[12px] font-black text-[#1e4a3a] uppercase tracking-widest">Digital Prescription</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Patient: {patientName}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Diagnosis */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnosis / Chief Complaint *</label>
          <textarea
            rows={2}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute upper respiratory tract infection with mild fever…"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-800 outline-none focus:border-[#1e4a3a] transition-all resize-none"
          />
        </div>

        {/* Medicines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medicines</label>
            <button
              onClick={addMed}
              className="flex items-center gap-1 text-[9px] font-black text-[#1e4a3a] uppercase tracking-widest hover:text-emerald-600 transition-colors"
            >
              <Plus size={12} /> Add Medicine
            </button>
          </div>
          {medicines.map((med, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medicine {i + 1}</span>
                {medicines.length > 1 && (
                  <button onClick={() => removeMed(i)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <Minus size={12} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Medicine name *"
                  value={med.name}
                  onChange={(e) => updateMed(i, 'name', e.target.value)}
                  className="col-span-2 h-9 px-3 bg-white border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:border-[#1e4a3a] transition-all"
                />
                <input
                  placeholder="Dosage (e.g. 500mg)"
                  value={med.dosage}
                  onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:border-[#1e4a3a] transition-all"
                />
                <input
                  placeholder="Duration (e.g. 5 days)"
                  value={med.duration}
                  onChange={(e) => updateMed(i, 'duration', e.target.value)}
                  className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:border-[#1e4a3a] transition-all"
                />
                <input
                  placeholder="Instructions (e.g. After meal)"
                  value={med.instructions}
                  onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                  className="col-span-2 h-9 px-3 bg-white border border-slate-200 rounded-lg text-[11px] font-medium outline-none focus:border-[#1e4a3a] transition-all"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Advice */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">General Advice</label>
          <textarea
            rows={2}
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="Rest, hydration, diet advice…"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-800 outline-none focus:border-[#1e4a3a] transition-all resize-none"
          />
        </div>

        {/* Follow-up */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Follow-up Date (Optional)</label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium outline-none focus:border-[#1e4a3a] transition-all"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-11 bg-[#1e4a3a] text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {isSaving ? 'Saving…' : 'Issue Prescription'}
        </button>
      </div>
    </div>
  );
}
