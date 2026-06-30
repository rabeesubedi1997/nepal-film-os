import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Edit3, Trash2, Search, Phone, Mail, MapPin, DollarSign, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { vendorService } from '../services/vendorService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const TYPE_OPTIONS = ['equipment', 'catering', 'transport', 'costume', 'post_production', 'other'];

const TYPE_LABELS = {
  equipment: 'Equipment',
  catering: 'Catering',
  transport: 'Transport',
  costume: 'Costume',
  post_production: 'Post Production',
  other: 'Other',
};

const TYPE_COLORS = {
  equipment: 'blue',
  catering: 'amber',
  transport: 'green',
  costume: 'red',
  post_production: 'slate',
  other: 'slate',
};

export default function VendorsView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await vendorService.index(filmId);
      setVendors(data || []);
    } catch (err) { console.error('Failed to load vendors:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const filtered = useMemo(() => {
    let result = vendors;
    if (typeFilter !== 'all') {
      result = result.filter(v => v.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(q) || (v.contact_name || '').toLowerCase().includes(q) || (v.services || '').toLowerCase().includes(q));
    }
    return result;
  }, [vendors, typeFilter, search]);

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  useEffect(() => { setCurrentPage(1); }, [typeFilter, search]);

  const handleInput = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(f => ({ ...f, [e.target.name]: value }));
  };

  const openCreate = () => {
    setEditVendor(null);
    setFormData({ name: '', type: 'equipment', contact_name: '', contact_phone: '', contact_email: '', address: '', services: '', rate: '', currency: 'NPR', is_active: true, notes: '' });
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditVendor(v);
    setFormData({
      name: v.name,
      type: v.type,
      contact_name: v.contact_name || '',
      contact_phone: v.contact_phone || '',
      contact_email: v.contact_email || '',
      address: v.address || '',
      services: v.services || '',
      rate: v.rate || '',
      currency: v.currency || 'NPR',
      is_active: v.is_active !== false,
      notes: v.notes || '',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        rate: formData.rate ? parseFloat(formData.rate) : null,
      };
      if (editVendor) {
        await vendorService.update(filmId, editVendor.id, data);
      } else {
        await vendorService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editVendor ? 'Vendor updated' : 'Vendor saved');
    } catch (err) { console.error('Failed to save vendor:', err); addToast('Failed to save vendor', 'error'); }
  };

  const deleteVendor = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    try { await vendorService.destroy(filmId, id); fetchData(); addToast('Vendor deleted'); } catch (err) { console.error(err); addToast('Failed to delete vendor', 'error'); }
  };

  const toggleActive = async (vendor) => {
    try {
      await vendorService.update(filmId, vendor.id, { is_active: !vendor.is_active });
      fetchData();
      addToast(vendor.is_active ? 'Vendor deactivated' : 'Vendor activated');
    } catch (err) { console.error(err); addToast('Failed to update vendor', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-400" /> Vendors
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {vendors.length} vendors</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Vendor</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {['all', ...TYPE_OPTIONS].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${typeFilter === t ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}>
              {t === 'all' ? 'All' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X className="h-3 w-3" /></button>}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">{search || typeFilter !== 'all' ? 'No vendors match your filters' : 'No vendors yet. Add your first vendor!'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map(vendor => (
          <div key={vendor.id} className={`bg-slate-900 border rounded-xl p-4 transition-all ${vendor.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${vendor.is_active ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{vendor.name}</p>
                  <Badge color={TYPE_COLORS[vendor.type] || 'slate'}>{TYPE_LABELS[vendor.type] || vendor.type}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(vendor)} className="p-1 text-slate-500 hover:text-amber-400" title={vendor.is_active ? 'Deactivate' : 'Activate'}>
                  {vendor.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(vendor)} className="p-1 text-slate-500 hover:text-amber-400"><Edit3 className="h-3 w-3" /></button>
                <button onClick={() => deleteVendor(vendor.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>

            <div className="space-y-1.5">
              {(vendor.contact_name || vendor.contact_phone) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{vendor.contact_name ? `${vendor.contact_name} · ` : ''}{vendor.contact_phone || ''}</span>
                </div>
              )}
              {vendor.contact_email && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{vendor.contact_email}</span>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{vendor.address}</span>
                </div>
              )}
              {vendor.rate != null && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <DollarSign className="h-3 w-3 shrink-0" />
                  <span>{Number(vendor.rate).toLocaleString()} {vendor.currency || 'NPR'}</span>
                </div>
              )}
              {vendor.services && (
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{vendor.services}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={filtered.length} showPageSizeSelector onPageSizeChange={setPageSize} />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editVendor ? 'Edit Vendor' : 'Add New Vendor'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Vendor Name" value={formData.name} onChange={handleInput} name="name" required placeholder="e.g., Kathmandu Camera Rentals" />
          <Input label="Type" value={formData.type} onChange={handleInput} name="type" options={TYPE_OPTIONS.map(t => ({ value: t, label: TYPE_LABELS[t] }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={formData.contact_name} onChange={handleInput} name="contact_name" />
            <Input label="Contact Phone" value={formData.contact_phone} onChange={handleInput} name="contact_phone" />
          </div>
          <Input label="Contact Email" type="email" value={formData.contact_email} onChange={handleInput} name="contact_email" />
          <Input label="Address" value={formData.address} onChange={handleInput} name="address" placeholder="Full address" />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Services</label>
            <textarea name="services" value={formData.services} onChange={handleInput} rows={3} placeholder="Describe services offered..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Rate" type="number" step="0.01" value={formData.rate} onChange={handleInput} name="rate" />
            <Input label="Currency" value={formData.currency} onChange={handleInput} name="currency" options={['NPR', 'USD', 'INR']} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInput}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500" />
            <label htmlFor="is_active" className="text-xs font-medium text-slate-400">Active</label>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleInput} rows={2} placeholder="Additional notes..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editVendor ? 'Update' : 'Create'} Vendor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
