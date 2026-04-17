'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Package, ImagePlus, 
  Loader2, Check, X, AlertCircle, ShoppingBag, Tag,
  ArrowUpRight, DollarSign, Archive, Eye, Trash, 
  ShoppingCart, BarChart3, TrendingUp, User, MapPin, 
  ExternalLink, FileText, Calendar, Filter, ShieldCheck, Clock
} from 'lucide-react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '@/lib/firebase';
import { 
  collection, onSnapshot, addDoc, updateDoc, 
  deleteDoc, doc, query, orderBy, where, limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import CustomDropdown from '@/components/UI/CustomDropdown';

export default function StoreManagement() {
  const [activeTab, setActiveTab] = useState('inventory'); // inventory | orders | finance
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type: '',
    price: '',
    costPrice: '',
    originalPrice: '',
    stock: '',
    description: '',
    status: 'active',
    images: [],
    extraInfo: {} // For dynamic fields
  });
  
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isCustomType, setIsCustomType] = useState(false);

  const typeConfig = {
    'Medicine (Tablet Strip)': ['Generic Name', 'Strength', 'Tablets per Strip', 'Strips per Box', 'Manufacturer'],
    'Medicine (Syrup/Liquid)': ['Generic Name', 'Strength (%)', 'Volume (ml)', 'Flavor', 'Manufacturer'],
    'Medicine (Capsule)': ['Generic Name', 'Strength', 'Capsules per Strip', 'Manufacturer'],
    'Medicine (Injection/IV)': ['Generic Name', 'Strength', 'Route (IM/IV)', 'Volume (ml)', 'Manufacturer'],
    'Medicine (Inhaler)': ['Generic Name', 'Strength', 'Number of Puffs', 'Manufacturer'],
    'Medicine (Ointment/Cream)': ['Generic Name', 'Strength (%)', 'Weight (g)', 'Manufacturer'],
    'Health Supplements': ['Ingredients', 'Serving Size', 'Pack Size', 'Dietary Type'],
    'Wellness & Personal Care': ['Brand', 'Material/Main Ingredient', 'Weight/Volume', 'Skin Type'],
    'Clinical Diagnostics': ['Sample Type', 'Turnaround Time', 'Preparation Required', 'Lab Location']
  };

  // Data Fetching
  useEffect(() => {
    // Fetch Products
    const pq = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(pq, (sx) => {
      setProducts(sx.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Orders
    const oq = query(collection(db, 'product_orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(oq, (sx) => {
      setOrders(sx.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, []);

  // Finance Calculations
  const financeStats = useMemo(() => {
    // 1. Calculate Realized Revenue (All orders that have been paid for)
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'processing' || o.status === 'shipped');
    
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    
    const totalCost = paidOrders.reduce((acc, o) => {
      // Calculate cost from items stored in the order
      const orderCost = o.items?.reduce((itemAcc, item) => itemAcc + ((item.costPrice || 0) * (item.quantity || 1)), 0) || 0;
      return acc + orderCost;
    }, 0);
    
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing' || o.status === 'shipped').length;
    const inventoryValue = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock)), 0);
    const inventoryCost = products.reduce((acc, p) => acc + (Number(p.costPrice || 0) * Number(p.stock)), 0);

    return {
      revenue: totalRevenue,
      profit: totalRevenue - totalCost,
      pending: pendingOrders,
      processing: processingOrders,
      inventoryValue,
      inventoryCost,
      margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1) : 0
    };
  }, [orders, products]);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      type: product.type || '',
      price: product.price,
      costPrice: product.costPrice || '',
      originalPrice: product.originalPrice || '',
      stock: product.stock,
      description: product.description || '',
      status: product.status || 'active',
      images: product.images || (product.image ? [product.image] : []),
      extraInfo: product.extraInfo || {}
    });
    setPreviews(product.images || (product.image ? [product.image] : []));
    setNewImageFiles([]);
    setIsCustomType(false);
    setShowAddModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setNewImageFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const img = previews[index];
    setPreviews(prev => prev.filter((_, i) => i !== index));
    if (typeof img === 'string' && img.startsWith('http')) {
      setFormData(prev => ({ ...prev, images: prev.images.filter(url => url !== img) }));
    } else {
      setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.category && !isCustomCategory) { toast.error('Required field missing'); return; }
    setIsSaving(true);
    try {
      const uploadedUrls = [];
      for (const file of newImageFiles) {
        const sRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const res = await uploadBytes(sRef, file);
        uploadedUrls.push(await getDownloadURL(res.ref));
      }
      const finalImages = [...formData.images, ...uploadedUrls];
      const data = {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: Number(formData.stock),
        description: formData.description,
        status: formData.status,
        images: finalImages,
        image: finalImages[0] || '',
        extraInfo: formData.extraInfo,
        updatedAt: new Date().toISOString()
      };
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        toast.success('Product updated');
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: new Date().toISOString() });
        toast.success('Product added');
      }
      closeModal();
    } catch (err) { toast.error('Save failed'); } finally { setIsSaving(false); }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const isConfirmed = await confirm({
      title: 'Update order status?',
      message: `Are you sure you want to mark this order as ${newStatus}?`,
      confirmText: `Set to ${newStatus}`,
      type: 'warning'
    });
    if (!isConfirmed) return;
    try {
      await updateDoc(doc(db, 'product_orders', orderId), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Order set to ${newStatus}`);
    } catch (err) { toast.error('Status update failed'); }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({ 
      name: '', category: '', type: '', price: '', 
      costPrice: '', originalPrice: '', stock: '', 
      description: '', status: 'active', images: [],
      extraInfo: {}
    });
    setNewImageFiles([]);
    setPreviews([]);
    setIsCustomCategory(false);
    setIsCustomType(false);
  };

  const [viewingOrder, setViewingOrder] = useState(null);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOrders = orders.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.trxId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteOrder = (id) => {
    setConfirmModal({
      show: true,
      title: 'Delete Order Record?',
      message: 'This will permanently remove the order history. You cannot undo this action.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'product_orders', id));
          toast.success('Order removed');
        } catch (err) { toast.error('Delete failed'); }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleDeleteProduct = (id) => {
    setConfirmModal({
      show: true,
      title: 'Remove Product?',
      message: 'Are you sure you want to permanently remove this product from the catalog?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'products', id));
          toast.success('Product deleted');
        } catch (err) { toast.error('Delete failed'); }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const baseCategories = ['Medicine', 'Wellness', 'Personal Care', 'Supplements', 'Diagnostics', 'Baby Care', 'First Aid'];
  const categoryOptions = [...baseCategories.map(c => ({ label: c, value: c })), { label: 'Add New', value: 'add_new', icon: Plus }];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-300 shadow-sm w-fit">
        {[
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'orders', label: 'Buying Orders', icon: ShoppingCart },
          { id: 'finance', label: 'Financials', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#1e4a3a] text-white shadow-lg shadow-[#1e4a3a]/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-300">
        <div>
          <h2 className="text-[18px] font-black text-[#1e4a3a] tracking-tight uppercase">
            {activeTab === 'inventory' ? 'Catalog Management' : activeTab === 'orders' ? 'Order Fulfillment' : 'Finance Dashboard'}
          </h2>
          <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {activeTab === 'inventory' ? 'Control products & stock' : activeTab === 'orders' ? 'Track customer acquisitions' : 'Profit & Revenue Analytics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden bg-slate-50 rounded-full border border-slate-300">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'orders' ? "Search Order ID/Customer..." : "Search products..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-[280px] h-11 pl-11 pr-4 bg-transparent text-[12px] font-bold text-[#1e4a3a] outline-none"
            />
          </div>
          {activeTab === 'inventory' && (
            <button onClick={() => setShowAddModal(true)} className="h-11 px-6 bg-[#1e4a3a] text-white rounded-full text-[12px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg active:scale-95">
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Inventory View */}
        {activeTab === 'inventory' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="inventory">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Items" value={products.length} icon={ShoppingBag} color="text-blue-500" bg="bg-blue-50" />
              <StatCard label="Stock Value" value={`৳${financeStats.inventoryValue.toLocaleString()}`} icon={DollarSign} color="text-emerald-500" bg="bg-emerald-50" />
              <StatCard label="In-Stock Profit" value={`৳${(financeStats.inventoryValue - financeStats.inventoryCost).toLocaleString()}`} icon={TrendingUp} color="text-amber-500" bg="bg-amber-50" />
              <StatCard label="Low Stock" value={products.filter(p => Number(p.stock) < 5).length} icon={AlertCircle} color="text-rose-500" bg="bg-rose-50" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost (৳)</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Selling (৳)</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {(p.images?.[0] || p.image) ? (
                            <img src={p.images?.[0] || p.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <ShoppingBag className="text-slate-200" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-[#1e4a3a] leading-tight">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.status}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{p.category}</span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-slate-400">৳{p.costPrice || 0}</td>
                      <td className="px-6 py-4 text-[14px] font-black text-[#1e4a3a]">৳{p.price}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[12px] font-black ${Number(p.stock) < 5 ? 'text-rose-600 bg-rose-50 px-3 py-1 rounded-lg' : 'text-slate-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(p)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all bg-white"><Edit3 size={16} /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all bg-white"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Orders View */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="orders">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Pending Orders" value={financeStats.pending} icon={Clock} color="text-rose-500" bg="bg-rose-50" />
              <StatCard label="Processing" value={financeStats.processing} icon={TrendingUp} color="text-amber-500" bg="bg-amber-50" />
              <StatCard label="Completed" value={orders.filter(o => o.status === 'delivered').length} icon={ShieldCheck} color="text-emerald-500" bg="bg-emerald-50" />
              <StatCard label="Avg Ticket" value={`৳${orders.length > 0 ? (orders.reduce((acc, o) => acc + (o.total || 0), 0) / orders.length).toFixed(0) : 0}`} icon={Tag} color="text-blue-500" bg="bg-blue-50" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-300 shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3.5">
                        <span className="text-[12px] font-black text-[#1e4a3a] opacity-50 uppercase tracking-tighter">#{order.id.slice(-6)}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#1e4a3a] font-black text-[11px]">
                            {order.customerName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-[#1e4a3a] leading-none mb-1">{order.customerName || 'Anonymous'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{order.phone || 'No Contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[12px] font-black text-[#1e4a3a]">{order.items?.length || 0}</span>
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Units</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-[13px] font-black text-[#1e4a3a]">৳{order.total?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3 pb-2">
                          <div className="w-[140px]">
                            <CustomDropdown 
                              options={['pending', 'processing', 'shipped', 'delivered', 'cancelled']}
                              value={order.status}
                              onChange={(val) => handleUpdateOrderStatus(order.id, val)}
                              className="!h-9 text-[11px] font-bold"
                            />
                          </div>
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] hover:border-[#1e4a3a] transition-all bg-white"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all bg-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="py-24 text-center">
                  <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No order history found</p>
                </div>
              )}
            </div>

            {/* Order Detail Modal */}
            <AnimatePresence>
              {viewingOrder && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingOrder(null)} className="absolute inset-0 bg-[#1e4a3a]/40" />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#1e4a3a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#1e4a3a]/20"><FileText size={20} /></div>
                        <div>
                          <h3 className="text-[14px] font-black text-[#1e4a3a] uppercase tracking-tight">Order Details</h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{viewingOrder.id.toUpperCase()}</p>
                        </div>
                      </div>
                      <button onClick={() => setViewingOrder(null)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"><X size={20} className="text-slate-400" /></button>
                    </div>

                    <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                      {/* Customer Info */}
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><User size={12} /> Contact</label>
                          <div className="space-y-1">
                            <p className="text-[15px] font-black text-[#1e4a3a]">{viewingOrder.customerName || 'Anonymous'}</p>
                            <p className="text-[12px] font-bold text-slate-500">{viewingOrder.phone || 'No phone recorded'}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={12} /> Delivery Address</label>
                          <p className="text-[12px] font-bold text-[#1e4a3a] leading-relaxed">{viewingOrder.location || 'No address provided'}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><ShoppingCart size={12} /> Purchased Items</label>
                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {viewingOrder.items?.map((item, i) => (
                            <div key={i} className="flex justify-between items-center group">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-[#1e4a3a]">{i+1}</span>
                                <span className="text-[13px] font-bold text-[#1e4a3a]">{item.name}</span>
                              </div>
                              <span className="text-[13px] font-black text-[#1e4a3a]">৳{item.price}</span>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-slate-200 mt-2 flex justify-between items-center">
                            <span className="text-[12px] font-black text-[#1e4a3a] uppercase tracking-widest">Total Payable</span>
                            <span className="text-[18px] font-black text-[#1e4a3a]">৳{viewingOrder.total?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Context */}
                      <div className="p-5 bg-[#1e4a3a]/5 rounded-2xl border border-[#1e4a3a]/10 grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Method</p>
                          <p className="text-[13px] font-black text-[#1e4a3a] uppercase tracking-tight">{viewingOrder.paymentMethod || 'manual'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Transaction ID</p>
                          <p className="text-[13px] font-black text-[#1e4a3a] tracking-widest font-mono">{viewingOrder.trxId || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                       <StatusBadge status={viewingOrder.status} />
                       <button onClick={() => setViewingOrder(null)} className="h-11 px-8 bg-[#1e4a3a] text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#1e4a3a]/20">Close Details</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Finance View */}
        {activeTab === 'finance' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="finance">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <motion.div whileHover={{ y: -2 }} className="bg-[#1e4a3a] p-5 rounded-xl text-white shadow-lg shadow-[#1e4a3a]/15 relative overflow-hidden">
                <TrendingUp className="absolute top-4 right-4 opacity-10" size={32} />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Net Realized Revenue</p>
                <h3 className="text-2xl font-black tracking-tighter mb-3">৳{financeStats.revenue.toLocaleString()}</h3>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/20 rounded-lg text-[8px] font-black uppercase tracking-widest">
                  +12.5% vs Prev Month
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-xl border border-slate-300 shadow-md shadow-slate-200/30">
                <BarChart3 className="text-emerald-500 mb-3" size={20} />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Estimated Profit</p>
                <h3 className="text-2xl font-black text-[#1e4a3a] tracking-tighter mb-2">৳{financeStats.profit.toLocaleString()}</h3>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Average Margin: {financeStats.margin}%</p>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-xl border border-slate-300 shadow-md shadow-slate-200/30">
                <Package className="text-blue-500 mb-3" size={20} />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Inventory Liquidity</p>
                <h3 className="text-2xl font-black text-[#1e4a3a] tracking-tighter mb-2">৳{financeStats.inventoryValue.toLocaleString()}</h3>
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Unrealized Asset Value</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
                <h4 className="text-[10px] font-black text-[#1e4a3a] uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                  <ExternalLink size={14} className="text-slate-400" /> Recent Delivered Invoices
                </h4>
                <div className="space-y-2.5">
                  {orders.filter(o => o.status === 'delivered').slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-emerald-600 shadow-sm border border-slate-200">
                          <Check size={14} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-[#1e4a3a] leading-none mb-1">{o.customerName}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">INV#{o.id.slice(-8)}</p>
                        </div>
                      </div>
                      <p className="text-[13px] font-black text-[#1e4a3a]">৳{o.total?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-md border border-slate-100 mb-3">
                  <TrendingUp size={24} />
                </div>
                <h4 className="text-[13px] font-black text-[#1e4a3a] uppercase tracking-tight mb-1.5">Growth Analytics</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[240px]">
                  Your store's profit margin is currently healthy at <span className="text-emerald-600 font-black">{financeStats.margin}%</span>. 
                  Optimizing for higher turnover.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-[#1e4a3a]/40" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <form onSubmit={handleSave}>
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1e4a3a] rounded-xl flex items-center justify-center text-white shadow-lg"><Package size={20} /></div>
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#1e4a3a] leading-none uppercase tracking-tight">{editingProduct ? 'Update Product' : 'Add New Item'}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Managed Catalog</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"><X size={18} className="text-slate-400" /></button>
                </div>

                <div className="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Product Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Paracetamol" />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      {isCustomCategory ? (
                        <div className="relative">
                          <input required autoFocus type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-11 px-5 pr-12 bg-white border-2 border-[#1e4a3a] rounded-full text-[13px] font-bold text-[#1e4a3a]" />
                          <button type="button" onClick={() => { setIsCustomCategory(false); setFormData({...formData, category: ''}); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500"><X size={16} /></button>
                        </div>
                      ) : (
                        <CustomDropdown placeholder="Select Category" options={categoryOptions} value={formData.category} onChange={v => v === 'add_new' ? (setIsCustomCategory(true), setFormData({...formData, category: ''})) : setFormData({...formData, category: v})} />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Type</label>
                      {isCustomType ? (
                        <div className="relative">
                          <input required autoFocus type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-11 px-5 pr-12 bg-white border-2 border-[#1e4a3a] rounded-full text-[13px] font-bold text-[#1e4a3a]" />
                          <button type="button" onClick={() => { setIsCustomType(false); setFormData({...formData, type: ''}); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500"><X size={16} /></button>
                        </div>
                      ) : (
                        <CustomDropdown 
                          placeholder="Select Product Type" 
                          options={[...Object.keys(typeConfig).map(t => ({ label: t, value: t })), { label: 'Add New Type', value: 'add_new', icon: Plus }]} 
                          value={formData.type} 
                          onChange={v => v === 'add_new' ? (setIsCustomType(true), setFormData({...formData, type: ''})) : setFormData({...formData, type: v})} 
                        />
                      )}
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {(typeConfig[formData.type] || isCustomType) && (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4">
                        {(typeConfig[formData.type] || []).map((field) => (
                          <div key={field} className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field}</label>
                            <input 
                              type="text"
                              value={formData.extraInfo[field] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                extraInfo: { ...formData.extraInfo, [field]: e.target.value }
                              })}
                              className="w-full h-10 px-4 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] transition-all"
                              placeholder={`Enter ${field}`}
                            />
                          </div>
                        ))}
                        {isCustomType && (
                           <div className="col-span-2 py-4 text-center">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Note: Dynamic properties for custom types will be available in future updates.</p>
                           </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <InputField label="Cost Price" value={formData.costPrice} onChange={v => setFormData({...formData, costPrice: v})} type="number" />
                    <InputField label="Sale Price" value={formData.price} onChange={v => setFormData({...formData, price: v})} type="number" />
                    <InputField label="Old Price" value={formData.originalPrice} onChange={v => setFormData({...formData, originalPrice: v})} type="number" placeholder="Optional" required={false} />
                    <InputField label="Stock" value={formData.stock} onChange={v => setFormData({...formData, stock: v})} type="number" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold text-[#1e4a3a] resize-none outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Media Gallery (Max 5)</label>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{previews.length}/5 Images</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {previews.filter(src => !!src).map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden group">
                          <img src={src} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={12} /></button>
                        </div>
                      ))}
                      {previews.length < 5 && (
                        <div onClick={() => document.getElementById('product-images').click()} className="cursor-pointer border-2 border-dashed border-slate-200 rounded-xl aspect-square bg-slate-50 flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-50/10 transition-all"><Plus size={16} className="text-slate-400" /></div>
                      )}
                    </div>
                    <input id="product-images" type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                  </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" onClick={closeModal} className="h-11 px-8 rounded-full text-[12px] font-bold text-slate-500 hover:bg-slate-200">Cancel</button>
                  <button type="submit" disabled={isSaving} className="h-11 px-10 bg-[#1e4a3a] text-white rounded-full text-[12px] font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{editingProduct ? 'Commit Changes' : 'Launch Product'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setConfirmModal({ ...confirmModal, show: false })}
              className="absolute inset-0 bg-[#1e4a3a]/40" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[16px] font-bold text-[#1e4a3a] leading-tight">
                    {confirmModal.title}
                  </h3>
                  <p className="text-[12px] font-medium text-slate-400 leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="px-8 py-2.5 bg-rose-500 text-white rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className={`p-5 ${bg} rounded-2xl border border-slate-200 hover:shadow-lg transition-all`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm"><Icon size={18} className={color} /></div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-[#1e4a3a] leading-none mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder, required = true }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        required={required}
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-full text-[13px] font-bold text-[#1e4a3a] focus:outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" 
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-rose-50 text-rose-500 border-rose-100',
    processing: 'bg-amber-50 text-amber-500 border-amber-100',
    shipped: 'bg-blue-50 text-blue-500 border-blue-100',
    delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    cancelled: 'bg-slate-100 text-slate-400 border-slate-200'
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
