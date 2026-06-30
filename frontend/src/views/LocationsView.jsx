import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit3, Trash2, Phone, Map, Navigation, Camera } from 'lucide-react';
import { locationService } from '../services/locationService';
import { useAuthStore } from '../authStore';
import { Modal, Input, Badge, Button } from '../components/ui';
import { useToastStore } from '../toastStore';
import Pagination from '../components/Pagination';

const permitStatusMap = { 'Approved': 'green', 'Pending': 'amber', 'Rejected': 'red', 'Not Required': 'slate' };

export default function LocationsView() {
  const { currentFilm } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const filmId = currentFilm?.id;

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = locations.filter(l => {
    const matchSearch = l.name?.toLowerCase().includes(search.toLowerCase()) || 
                        l.address?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || l.permit_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handlePageSizeChange = (size) => { setPageSize(size); setCurrentPage(1); };

  const fetchData = async () => {
    if (!filmId) return;
    try {
      setLoading(true);
      const data = await locationService.index(filmId);
      setLocations(data || []);
    } catch (err) { console.error('Failed to load locations:', err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filmId]);

  const handleInput = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditLocation(null);
    setFormData({ name: '', address: '', gps_lat: '', gps_lng: '', contact_name: '', contact_phone: '', parking_info: '', facilities_notes: '', permit_status: 'Not Required' });
    setShowModal(true);
  };

  const openEdit = (l) => {
    setEditLocation(l);
    setFormData({
      name: l.name, address: l.address || '', gps_lat: l.gps_lat || '', gps_lng: l.gps_lng || '',
      contact_name: l.contact_name || '', contact_phone: l.contact_phone || '',
      parking_info: l.parking_info || '', facilities_notes: l.facilities_notes || '',
      permit_status: l.permit_status || 'Not Required',
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
        gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
      };
      if (editLocation) {
        await locationService.update(filmId, editLocation.id, data);
      } else {
        await locationService.store(filmId, data);
      }
      setShowModal(false);
      fetchData();
      addToast(editLocation ? 'Location updated' : 'Location saved');
    } catch (err) { console.error('Failed to save location:', err); addToast('Failed to save location', 'error'); }
  };

  const deleteLocation = async (id) => {
    if (!confirm('Delete this location?')) return;
    try { await locationService.destroy(filmId, id); setSelectedId(null); fetchData(); addToast('Location deleted'); } catch (err) { console.error(err); addToast('Failed to delete location', 'error'); }
  };

  const selected = locations.find(l => l.id === selectedId);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-400" /> Locations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{currentFilm?.title || ''} · {locations.length} locations</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" /> Add Location</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">All Locations</p>
          {paginated.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No locations yet.</div>}
          {paginated.map(loc => (
            <button key={loc.id} onClick={() => setSelectedId(loc.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedId === loc.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg"><MapPin className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{loc.name}</p>
                  <p className="text-xs text-slate-500 truncate">{loc.address || 'No address'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge color={permitStatusMap[loc.permit_status] || 'slate'}>{loc.permit_status}</Badge>
                <button onClick={(e) => { e.stopPropagation(); openEdit(loc); }} className="p-1 text-slate-500 hover:text-amber-400"><Edit3 className="h-3 w-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected && <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500"><MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="font-semibold">Select a location to view details</p></div>}

          {selected && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-100">{selected.name}</h2>
                    <p className="text-sm text-slate-400">{selected.address}</p>
                  </div>
                  <Badge color={permitStatusMap[selected.permit_status] || 'slate'}>{selected.permit_status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {selected.gps_lat && selected.gps_lng && (
                    <div className="bg-slate-800/60 rounded-lg p-3 col-span-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">GPS Coordinates</p>
                      <p className="text-sm font-bold text-slate-200 font-mono">{selected.gps_lat}, {selected.gps_lng}</p>
                      <a href={`https://www.google.com/maps?q=${selected.gps_lat},${selected.gps_lng}`} target="_blank" rel="noreferrer"
                        className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                        <Navigation className="h-3 w-3" /> Open in Google Maps
                      </a>
                    </div>
                  )}
                  {selected.contact_name && (
                    <div className="bg-slate-800/60 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Contact</p>
                      <p className="text-sm font-bold text-slate-200">{selected.contact_name}</p>
                      {selected.contact_phone && (
                        <a href={`tel:${selected.contact_phone}`} className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" /> {selected.contact_phone}
                        </a>
                      )}
                    </div>
                  )}
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Permit Status</p>
                    <div className="mt-1"><Badge color={permitStatusMap[selected.permit_status] || 'slate'}>{selected.permit_status}</Badge></div>
                  </div>
                </div>

                {selected.parking_info && (
                  <div className="bg-slate-800/60 rounded-lg p-3 mb-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Parking Info</p>
                    <p className="text-xs text-slate-300 mt-1">{selected.parking_info}</p>
                  </div>
                )}
                {selected.facilities_notes && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Facilities Notes</p>
                    <p className="text-xs text-slate-300 mt-1">{selected.facilities_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          totalItems={filtered.length}
          showPageSizeSelector
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editLocation ? 'Edit Location' : 'Add New Location'}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Location Name" value={formData.name} onChange={handleInput} name="name" required placeholder="e.g., Patan Durbar Square" />
          <Input label="Address" value={formData.address} onChange={handleInput} name="address" placeholder="Full address" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="GPS Latitude" type="number" step="0.000001" value={formData.gps_lat} onChange={handleInput} name="gps_lat" />
            <Input label="GPS Longitude" type="number" step="0.000001" value={formData.gps_lng} onChange={handleInput} name="gps_lng" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={formData.contact_name} onChange={handleInput} name="contact_name" />
            <Input label="Contact Phone" value={formData.contact_phone} onChange={handleInput} name="contact_phone" />
          </div>
          <Input label="Parking Info" value={formData.parking_info} onChange={handleInput} name="parking_info" placeholder="Parking arrangements" />
          <Input label="Facilities Notes" value={formData.facilities_notes} onChange={handleInput} name="facilities_notes" placeholder="Nearest facilities, power supply, etc." />
          <Input label="Permit Status" value={formData.permit_status} onChange={handleInput} name="permit_status" options={['Not Required', 'Pending', 'Approved', 'Rejected']} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editLocation ? 'Update' : 'Create'} Location</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
