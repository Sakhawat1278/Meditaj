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
import { useConfirm } from '@/context/ConfirmationContext';

export default function StoreManagement() {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('inventory'); // inventory | orders | finance
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
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

  const handleDeleteOrder = async (id) => {
    const ok = await confirm({
      title: 'Delete Order Record?',
      message: 'This will permanently remove the order history. You cannot undo this action.',
      confirmText: 'Delete',
      type: 'danger'
    });
    
    if (ok) {
      try {
        await deleteDoc(doc(db, 'product_orders', id));
        toast.success('Order removed');
      } catch (err) { toast.error('Delete failed'); }
    }
  };

  const handleDeleteProduct = async (id) => {
    const ok = await confirm({
      title: 'Remove Product?',
      message: 'Are you sure you want to permanently remove this product from the catalog?',
      confirmText: 'Delete',
      type: 'danger'
    });
    
    if (ok) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('Product deleted');
      } catch (err) { toast.error('Delete failed'); }
    }
  };

  const baseCategories = ['Medicine', 'Wellness', 'Personal Care', 'Supplements', 'Diagnostics', 'Baby Care', 'First Aid'];
  const categoryOptions = [...baseCategories.map(c => ({ label: c, value: c })), { label: 'Add New', value: 'add_new', icon: Plus }];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
        {[
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'orders', label: 'Buying Orders', icon: ShoppingCart },
          { id: 'finance', label: 'Financials', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
            className={`flex items-center gap-3 px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-[#1e4a3a]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="store-tab-active"
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

      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-200">
        <div>
          <h2 className="text-[14px] font-bold text-[#1e4a3a] tracking-widest uppercase">
            {activeTab === 'inventory' ? 'Catalog Management' : activeTab === 'orders' ? 'Order Fulfillment' : 'Finance Dashboard'}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 opacity-60">
            {activeTab === 'inventory' ? 'Control products & stock' : activeTab === 'orders' ? 'Track customer acquisitions' : 'Profit & Revenue Analytics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden bg-slate-50 rounded-lg border border-slate-200">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'orders' ? "Search Order ID/Customer..." : "Search products..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-[280px] h-10 pl-10 pr-4 bg-transparent text-[11px] font-bold text-[#1e4a3a] outline-none"
            />
          </div>
          {activeTab === 'inventory' && (
            <button onClick={() => setShowAddModal(true)} className="h-10 px-6 bg-[#1e4a3a] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
              <Plus size={16} />
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
              <StatCard label="Total Items" value={products.length} icon={ShoppingBag} color="text-[#1e4a3a]" bg="bg-white" />
              <StatCard label="Stock Value" value={`৳${financeStats.inventoryValue.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" bg="bg-white" />
              <StatCard label="In-Stock Profit" value={`৳${(financeStats.inventoryValue - financeStats.inventoryCost).toLocaleString()}`} icon={TrendingUp} color="text-amber-600" bg="bg-white" />
              <StatCard label="Low Stock" value={products.filter(p => Number(p.stock) < 5).length} icon={AlertCircle} color="text-rose-600" bg="bg-white" />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Product Details</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Category</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cost (৳)</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Selling (৳)</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Stock</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {(p.images?.[0] || p.image) ? (
                            <img src={p.images?.[0] || p.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <ShoppingBag className="text-slate-300" size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-[#1e4a3a] leading-tight uppercase tracking-tight">{p.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">{p.status}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">{p.category}</span>
                      </td>
                      <td className="px-6 py-4 text-[12px] font-medium text-slate-400">৳{p.costPrice || 0}</td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#1e4a3a]">৳{p.price}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${Number(p.stock) < 5 ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-slate-600 bg-slate-50 border border-slate-200'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] hover:bg-slate-50 transition-all"><Edit3 size={14} /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 size={14} /></button>
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
              <StatCard label="Pending Orders" value={financeStats.pending} icon={Clock} color="text-rose-600" bg="bg-white" />
              <StatCard label="Processing" value={financeStats.processing} icon={TrendingUp} color="text-amber-600" bg="bg-white" />
              <StatCard label="Completed" value={orders.filter(o => o.status === 'delivered').length} icon={ShieldCheck} color="text-emerald-600" bg="bg-white" />
              <StatCard label="Avg Ticket" value={`৳${orders.length > 0 ? (orders.reduce((acc, o) => acc + (o.total || 0), 0) / orders.length).toFixed(0) : 0}`} icon={Tag} color="text-blue-600" bg="bg-white" />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Items</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-[#1e4a3a] opacity-40 uppercase tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1e4a3a] font-bold text-[10px]">
                            {order.customerName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-[#1e4a3a] leading-none mb-1 uppercase tracking-tight">{order.customerName || 'Anonymous'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">{order.phone || 'No Contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[12px] font-bold text-[#1e4a3a]">
                            {order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0}
                          </span>
                          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none mt-0.5">Units</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[12px] font-bold text-[#1e4a3a]">৳{order.total?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} className="!rounded !py-0.5 !px-2 !text-[8px]" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-[120px]">
                            <CustomDropdown 
                              options={['pending', 'processing', 'shipped', 'delivered', 'cancelled']}
                              value={order.status}
                              onChange={(val) => handleUpdateOrderStatus(order.id, val)}
                              className="!h-8 !text-[10px] uppercase font-bold tracking-widest"
                            />
                          </div>
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] hover:bg-slate-50 transition-all"
                          >
                            <Eye size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Finance View */}
        {activeTab === 'finance' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="finance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1e4a3a] p-6 rounded-lg text-white border border-[#1e4a3a] relative overflow-hidden group">
                <TrendingUp className="absolute -bottom-2 -right-2 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60 mb-3">Net Realized Revenue</p>
                <div className="flex items-end gap-2 mb-4">
                  <h3 className="text-3xl font-bold tracking-tighter">৳{financeStats.revenue.toLocaleString()}</h3>
                  <div className="mb-1 text-[9px] font-bold px-1.5 py-0.5 bg-white/20 rounded uppercase">Stable</div>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Platform Profit (EST)</p>
                <h3 className="text-2xl font-bold text-[#1e4a3a] tracking-tight mb-3">৳{financeStats.profit.toLocaleString()} <span className="text-[12px] text-emerald-500 ml-1">+{financeStats.margin}%</span></h3>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Healthy Margin</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Inventory Capital</p>
                <h3 className="text-2xl font-bold text-[#1e4a3a] tracking-tight mb-3">৳{financeStats.inventoryValue.toLocaleString()}</h3>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Unrealized Value</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-widest flex items-center gap-3">
                    <FileText size={14} /> Recent Settlement Invoices
                  </h4>
                  <button className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-[#1e4a3a] transition-colors">View All</button>
                </div>
                <div className="space-y-2">
                  {orders.filter(o => o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'processing').slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-slate-300 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-400 group-hover:text-[#1e4a3a] transition-colors">
                          {o.status === 'delivered' ? <Check size={14} /> : <Clock size={14} />}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-[#1e4a3a] leading-none mb-1 uppercase tracking-tight">{o.customerName || 'Store Order'}</p>
                          <p className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-[0.2em]">#{o.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-[#1e4a3a]">৳{o.total?.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5 leading-none">PAID</p>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Transaction Ledger Clear</p>}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-8 rounded-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-emerald-500 mb-6 shadow-sm">
                  <BarChart3 size={24} />
                </div>
                <h4 className="text-[14px] font-bold text-[#1e4a3a] uppercase tracking-widest mb-3">Profitability Index</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mb-6">
                  Your direct inventory margins are sitting at <span className="text-[#1e4a3a] font-bold">{financeStats.margin}%</span>. 
                  Efficiency is high; consider expanding the catalog.
                </p>
                <div className="w-full h-2 bg-slate-200 rounded-full max-w-[200px] overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-[#1e4a3a]" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal Redesign */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingOrder(null)} className="absolute inset-0 bg-[#0F172A]/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h3 className="text-[13px] font-bold text-[#1e4a3a] uppercase tracking-widest">Order Manifest</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction Identity: #{viewingOrder.id.toUpperCase()}</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] transition-colors border border-slate-200 rounded-lg"><X size={18} /></button>
              </div>

              <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Contact Subject</p>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                         <p className="text-[14px] font-bold text-[#1e4a3a] uppercase tracking-tight">{viewingOrder.customerName || 'Anonymous'}</p>
                         <p className="text-[11px] font-medium text-slate-500 mt-1">{viewingOrder.phone || 'N/A'}</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fulfillment Path</p>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                         <p className="text-[11px] font-bold text-[#1e4a3a] leading-relaxed uppercase tracking-tight">{viewingOrder.location || 'Local Pickup Only'}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inventory Breakdown</p>
                   <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                      {viewingOrder.items?.map((item, idx) => (
                        <div key={idx} className="p-4 flex justify-between items-center bg-white group hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-400 group-hover:bg-white group-hover:text-[#1e4a3a] transition-colors">{idx+1}</div>
                              <div>
                                 <p className="text-[13px] font-bold text-[#1e4a3a] uppercase tracking-tight">{item.name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unit: ৳{item.price} × {item.quantity || 1}</p>
                              </div>
                           </div>
                           <p className="text-[13px] font-bold text-[#1e4a3a]">৳{(item.price * (item.quantity || 1)).toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-200">
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Total</span>
                         <span className="text-[18px] font-bold text-[#1e4a3a] tracking-tight">৳{viewingOrder.total?.toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Payment Method</p>
                      <p className="text-[11px] font-bold text-[#1e4a3a] uppercase tracking-widest">{viewingOrder.paymentMethod || 'Manual'}</p>
                   </div>
                   <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reference ID</p>
                      <p className="text-[11px] font-bold text-[#1e4a3a] font-mono tracking-widest">{viewingOrder.trxId || 'N/A'}</p>
                   </div>
                </div>
              </div>

              <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                 <StatusBadge status={viewingOrder.status} />
                 <button onClick={() => setViewingOrder(null)} className="h-10 px-8 bg-[#1e4a3a] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-black">Finalize Review</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal Redesign */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-[#0F172A]/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
              <form onSubmit={handleSave}>
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#1e4a3a] uppercase tracking-widest">{editingProduct ? 'Update Inventory Item' : 'Create Catalog Entry'}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure SKU Profile</p>
                  </div>
                  <button type="button" onClick={closeModal} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-[#1e4a3a] border border-slate-200 rounded-lg transition-colors"><X size={18} /></button>
                </div>

                <div className="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Product Descriptor" value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Paracetamol 500mg" />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Catalog Segment</label>
                      {isCustomCategory ? (
                        <div className="relative">
                          <input required autoFocus type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-11 px-5 pr-12 bg-white border border-[#1e4a3a] rounded-lg text-[13px] font-bold text-[#1e4a3a] outline-none" />
                          <button type="button" onClick={() => { setIsCustomCategory(false); setFormData({...formData, category: ''}); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500"><X size={16} /></button>
                        </div>
                      ) : (
                        <CustomDropdown placeholder="Select Segment" options={categoryOptions} value={formData.category} onChange={v => v === 'add_new' ? (setIsCustomCategory(true), setFormData({...formData, category: ''})) : setFormData({...formData, category: v})} className="!h-11" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Structural Type</label>
                      {isCustomType ? (
                        <div className="relative">
                          <input required autoFocus type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-11 px-5 pr-12 bg-white border border-[#1e4a3a] rounded-lg text-[13px] font-bold text-[#1e4a3a] outline-none" />
                          <button type="button" onClick={() => { setIsCustomType(false); setFormData({...formData, type: ''}); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500"><X size={16} /></button>
                        </div>
                      ) : (
                        <CustomDropdown 
                          placeholder="Identify Architecture" 
                          options={[...Object.keys(typeConfig).map(t => ({ label: t, value: t })), { label: 'Register Custom Type', value: 'add_new', icon: Plus }]} 
                          value={formData.type} 
                          onChange={v => v === 'add_new' ? (setIsCustomType(true), setFormData({...formData, type: ''})) : setFormData({...formData, type: v})} 
                          className="!h-11"
                        />
                      )}
                    </div>

                    {/* Dynamic Fields */}
                    {(typeConfig[formData.type] || isCustomType) && (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-4">
                        {(typeConfig[formData.type] || []).map((field) => (
                          <div key={field} className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{field}</label>
                            <input 
                              type="text"
                              value={formData.extraInfo[field] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                extraInfo: { ...formData.extraInfo, [field]: e.target.value }
                              })}
                              className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] transition-all uppercase tracking-tight"
                              placeholder={`Enter Data`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <InputField label="Unit Cost" value={formData.costPrice} onChange={v => setFormData({...formData, costPrice: v})} type="number" />
                    <InputField label="Unit Retail" value={formData.price} onChange={v => setFormData({...formData, price: v})} type="number" />
                    <InputField label="List Price" value={formData.originalPrice} onChange={v => setFormData({...formData, originalPrice: v})} type="number" placeholder="Optional" required={false} />
                    <InputField label="Available Qty" value={formData.stock} onChange={v => setFormData({...formData, stock: v})} type="number" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Catalog Description</label>
                    <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-[#1e4a3a] resize-none outline-none focus:border-[#1e4a3a] focus:bg-white transition-all" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">Visual Assets (MAX 05)</label>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{previews.length}/05 UNITS</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {previews.filter(src => !!src).map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg bg-slate-50 border border-slate-200 overflow-hidden group">
                          <img src={src} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={12} /></button>
                        </div>
                      ))}
                      {previews.length < 5 && (
                        <div onClick={() => document.getElementById('product-images').click()} className="cursor-pointer border-2 border-dashed border-slate-200 rounded-lg aspect-square bg-slate-50 flex items-center justify-center hover:border-[#1e4a3a] hover:bg-[#1e4a3a]/5 transition-all"><Plus size={16} className="text-slate-400" /></div>
                      )}
                    </div>
                    <input id="product-images" type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                  </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                  <button type="button" onClick={closeModal} className="h-11 px-8 rounded-lg text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Discard</button>
                  <button type="submit" disabled={isSaving} className="h-11 px-10 bg-[#1e4a3a] text-white rounded-lg text-[11px] font-bold flex items-center gap-3 hover:bg-black transition-all disabled:opacity-50 uppercase tracking-widest">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    <span>{editingProduct ? 'Update SKU' : 'Confirm & Launch'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className={`p-6 ${bg} border border-slate-200 rounded-lg hover:border-slate-300 transition-all group`}>
      <div className="flex items-center gap-5">
        <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors duration-300">
           <Icon size={20} className={color} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
          <p className="text-[18px] font-bold text-[#1e4a3a] leading-none uppercase tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder = "Enter data...", required = true }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-[#1e4a3a] uppercase tracking-widest ml-1 opacity-70">{label}</label>
      <input 
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-[#1e4a3a] outline-none focus:border-[#1e4a3a] focus:bg-white transition-all uppercase tracking-tight"
      />
    </div>
  );
}

function StatusBadge({ status, className = "" }) {
  const styles = {
    'delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'shipped': 'bg-blue-50 text-blue-600 border-blue-100',
    'processing': 'bg-amber-50 text-amber-600 border-amber-100',
    'pending': 'bg-rose-50 text-rose-600 border-rose-100',
    'cancelled': 'bg-slate-50 text-slate-400 border-slate-200'
  };
  return (
    <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${styles[status] || styles.pending} ${className}`}>
      {status}
    </span>
  );
}
