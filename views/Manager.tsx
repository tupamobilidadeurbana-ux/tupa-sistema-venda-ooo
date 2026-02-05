import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, DemoSite, Consultant, Acquisition, AcquisitionStatus } from '../types';

declare const L: any; // Leaflet global

interface ManagerProps {
  categories: Category[];
  sites: DemoSite[];
  consultants: Consultant[];
  acquisitions: Acquisition[];
  managerPassword: string;
  onUpdatePassword: (pass: string) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddSite: (site: Omit<DemoSite, 'id'>) => Promise<void>;
  onUpdateSite: (id: string, site: Omit<DemoSite, 'id'>) => Promise<void>;
  onDeleteSite: (id: string) => Promise<void>;
  onAddConsultant: (consultant: Omit<Consultant, 'id'>) => Promise<void>;
  onUpdateConsultant: (id: string, consultant: Omit<Consultant, 'id'>) => Promise<void>;
  onDeleteConsultant: (id: string) => Promise<void>;
  onUpdateAcquisition: (id: string, updates: Partial<Acquisition>) => Promise<void>;
  onDeleteAcquisition: (id: string) => Promise<void>;
}

const Manager: React.FC<ManagerProps> = ({ 
  categories, 
  sites, 
  consultants,
  acquisitions,
  managerPassword,
  onUpdatePassword,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSite, 
  onUpdateSite,
  onDeleteSite,
  onAddConsultant, 
  onUpdateConsultant,
  onDeleteConsultant,
  onUpdateAcquisition,
  onDeleteAcquisition
}) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const [activeTab, setActiveTab] = useState<'sites' | 'consultants' | 'sales' | 'billingMap' | 'settings'>('sites');
  const [catName, setCatName] = useState('');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editingConsultantId, setEditingConsultantId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  const [newPass, setNewPass] = useState('');
  const [saleSearchQuery, setSaleSearchQuery] = useState('');
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [saleStatusFilter, setSaleStatusFilter] = useState<AcquisitionStatus | 'all'>('all');
  
  // Estados Mapa Financeiro
  const [billingStartDate, setBillingStartDate] = useState('');
  const [billingEndDate, setBillingEndDate] = useState('');
  const [hasSearchedBilling, setHasSearchedBilling] = useState(false);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [focusedClientIndex, setFocusedClientIndex] = useState(0);

  const [editingSale, setEditingSale] = useState<Acquisition | null>(null);
  const [saleEditForm, setSaleEditForm] = useState<Partial<Acquisition>>({});

  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const siteFileRef = useRef<HTMLInputElement>(null);
  const galleryFilesRef = useRef<HTMLInputElement>(null);
  const attachmentFileRef = useRef<HTMLInputElement>(null);
  const positionPadRef = useRef<HTMLDivElement>(null);
  const consultantPhotoFileRef = useRef<HTMLInputElement>(null);
  const consultantPositionPadRef = useRef<HTMLDivElement>(null);

  const [siteForm, setSiteForm] = useState({
    title: '',
    link: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
    categoryId: '',
    description: '',
    galleryUrls: [] as string[],
    objectPosition: '50% 50%'
  });

  const [consultantForm, setConsultantForm] = useState({
    name: '',
    cpf: '',
    whatsapp: '',
    photoUrl: '',
    photoPosition: '50% 50%'
  });

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === managerPassword) {
      setIsAuthorized(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPassInput('');
    }
  };

  const handleUpdatePass = async () => {
    if (!newPass.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdatePassword(newPass);
      setNewPass('');
      alert("Senha atualizada com sucesso!");
    } catch (err: any) {
      alert("Erro ao atualizar senha: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSiteFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const isVideo = file.type.startsWith('video/');
      setSiteForm(prev => ({ ...prev, mediaUrl: base64, mediaType: isVideo ? 'video' : 'image', objectPosition: '50% 50%' }));
    }
  };

  const handleConsultantPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setConsultantForm(prev => ({ ...prev, photoUrl: base64, photoPosition: '50% 50%' }));
    }
  };

  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await fileToBase64(files[i]);
        newUrls.push(base64);
      }
      setSiteForm(prev => ({ ...prev, galleryUrls: [...prev.galleryUrls, ...newUrls] }));
    }
  };

  const removeGalleryImage = (index: number) => {
    setSiteForm(prev => ({
      ...prev,
      galleryUrls: prev.galleryUrls.filter((_, i) => i !== index)
    }));
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setSaleEditForm(prev => ({ ...prev, attachmentUrl: base64 }));
    }
  };

  const handlePositionInteraction = (e: React.MouseEvent | React.TouchEvent, target: 'site' | 'consultant') => {
    const padRef = target === 'site' ? positionPadRef : consultantPositionPadRef;
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const clientX = 'clientX' in e ? (e as React.MouseEvent).clientX : (e as React.TouchEvent).touches[0].clientX;
    const clientY = 'clientY' in e ? (e as React.MouseEvent).clientY : (e as React.TouchEvent).touches[0].clientY;
    
    let x = Math.round(((clientX - rect.left) / rect.width) * 100);
    let y = Math.round(((clientY - rect.top) / rect.height) * 100);
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    if (target === 'site') {
      setSiteForm(prev => ({ ...prev, objectPosition: `${x}% ${y}%` }));
    } else {
      setConsultantForm(prev => ({ ...prev, photoPosition: `${x}% ${y}%` }));
    }
  };

  const openInGoogleMaps = (acq: Acquisition) => {
    if (acq.location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${acq.location.latitude},${acq.location.longitude}`, '_blank');
    } else {
      alert("Localização não disponível.");
    }
  };

  const filteredBilling = useMemo(() => {
    if (!hasSearchedBilling) return []; 
    if (!billingStartDate && !billingEndDate) return [];

    const effectiveStartDate = billingStartDate || billingEndDate;
    const effectiveEndDate = billingEndDate || billingStartDate;
    
    const list = acquisitions.filter(a => {
      if (!a.paymentDate) return false;
      const rawDate = a.paymentDate.trim();
      const vencimentoNormalizado = rawDate.substring(0, 10);
      return vencimentoNormalizado >= effectiveStartDate && vencimentoNormalizado <= effectiveEndDate;
    });

    return list.sort((a, b) => (a.paymentDate || '').localeCompare(b.paymentDate || ''));
  }, [acquisitions, billingStartDate, billingEndDate, hasSearchedBilling]);

  useEffect(() => {
    if (isAuthorized && activeTab === 'billingMap') {
      let cancelled = false;
      const timers: ReturnType<typeof setTimeout>[] = [];

      const waitForLeaflet = (cb: () => void, attempts = 0) => {
        if (typeof L !== 'undefined') { cb(); return; }
        if (attempts > 50) return; // safety: stop after ~5s
        const t = setTimeout(() => waitForLeaflet(cb, attempts + 1), 100);
        timers.push(t);
      };

      const initMap = () => {
        if (cancelled) return;
        const container = document.getElementById('billing-map');
        if (!container) return;

        // Ensure container has explicit pixel dimensions before Leaflet init
        container.style.height = '600px';
        container.style.width = '100%';
        container.style.position = 'relative';

        if (mapRef.current) {
          try { mapRef.current.remove(); } catch (_e) { /* ignore */ }
          mapRef.current = null;
        }

        mapRef.current = L.map('billing-map', {
          center: [-23.5505, -46.6333],
          zoom: 12,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Corrige bug do mapa ficar cinza ou sumir – chamadas múltiplas
        const invalidate = () => { if (mapRef.current) mapRef.current.invalidateSize(); };
        timers.push(setTimeout(invalidate, 100));
        timers.push(setTimeout(invalidate, 300));
        timers.push(setTimeout(invalidate, 600));
        timers.push(setTimeout(invalidate, 1200));

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            if (mapRef.current && !cancelled) {
              const uLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(uLoc);
              mapRef.current.setView([uLoc.lat, uLoc.lng], 13);
              L.circleMarker([uLoc.lat, uLoc.lng], { radius: 10, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.5 }).addTo(mapRef.current).bindPopup("<b>Sua Localização</b>");
              invalidate();
            }
          });
        }
      };

      // Wait for DOM + Leaflet to be ready, then init
      const startTimer = setTimeout(() => waitForLeaflet(initMap), 100);
      timers.push(startTimer);

      return () => {
        cancelled = true;
        timers.forEach(t => clearTimeout(t));
        if (mapRef.current) {
          try { mapRef.current.remove(); } catch (_e) { /* ignore */ }
          mapRef.current = null;
        }
      };
    }
  }, [activeTab, isAuthorized]);

  useEffect(() => {
    if (isAuthorized && mapRef.current && activeTab === 'billingMap' && typeof L !== 'undefined') {
      markersRef.current.forEach(m => { try { mapRef.current.removeLayer(m); } catch (_e) { /* ignore */ } });
      markersRef.current.clear();
      filteredBilling.forEach(acq => {
        if (acq.location) {
          const color = acq.isPaid ? '#10b981' : '#ef4444';
          const icon = L.divIcon({
            className: "custom-pin",
            iconAnchor: [0, 24],
            html: `<span style="background-color: ${color}; width: 2.5rem; height: 2.5rem; display: block; left: -1.25rem; top: -1.25rem; position: relative; border-radius: 2.5rem 2.5rem 0; transform: rotate(45deg); border: 3px solid #FFFFFF; box-shadow: 0 0 15px rgba(0,0,0,0.4);" />`
          });
          const m = L.marker([acq.location.latitude, acq.location.longitude], { icon })
            .addTo(mapRef.current)
            .bindPopup(`
              <div class="p-2 font-['Inter']">
                <b class="text-slate-900 text-sm">${acq.clientName}</b><br/>
                <span class="text-[10px] uppercase font-black text-blue-600">${acq.siteTitle}</span><br/>
                <span class="text-[9px] font-bold text-slate-400">COBRANÇA PARCELA:</span><br/>
                <b class="text-lg" style="color: ${color}">R$ ${acq.installmentValue?.toLocaleString('pt-BR')}</b>
              </div>
            `);
          markersRef.current.set(acq.id, m);
        }
      });
      // Ensure tiles re-render after adding markers
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 200);
    }
  }, [filteredBilling, activeTab, isAuthorized]);

  const handleNextClient = () => {
    if (filteredBilling.length === 0) return;
    const nextIdx = (focusedClientIndex + 1) % filteredBilling.length;
    setFocusedClientIndex(nextIdx);
    const client = filteredBilling[nextIdx];
    if (client.location && mapRef.current) {
      mapRef.current.setView([client.location.latitude, client.location.longitude], 15);
      const marker = markersRef.current.get(client.id);
      if (marker) marker.openPopup();
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/#/consultant/${id}`;
    navigator.clipboard.writeText(url);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catName.trim()) {
      setIsSubmitting(true);
      try { await onAddCategory(catName); setCatName(''); }
      catch (err: any) { alert(err.message); }
      finally { setIsSubmitting(false); }
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    if (name.trim()) {
      setIsSubmitting(true);
      try { await onUpdateCategory(id, name); setEditingCategoryId(null); }
      catch (err: any) { alert(err.message); }
      finally { setIsSubmitting(false); }
    }
  };

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (siteForm.title && siteForm.link && siteForm.categoryId) {
      setIsSubmitting(true);
      try {
        if (editingSiteId) await onUpdateSite(editingSiteId, siteForm);
        else await onAddSite(siteForm);
        setEditingSiteId(null);
        setSiteForm({ title: '', link: '', mediaUrl: '', mediaType: 'image', categoryId: '', description: '', galleryUrls: [], objectPosition: '50% 50%' });
      } catch (err: any) { alert(err.message); }
      finally { setIsSubmitting(false); }
    }
  };

  const handleConsultantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultantForm.name || !consultantForm.cpf || !consultantForm.photoUrl) {
      alert("⚠️ Preencha Nome, CPF e selecione uma Foto.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingConsultantId) await onUpdateConsultant(editingConsultantId, consultantForm);
      else await onAddConsultant(consultantForm);
      setEditingConsultantId(null);
      setConsultantForm({ name: '', cpf: '', whatsapp: '', photoUrl: '', photoPosition: '50% 50%' });
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  const startEditConsultant = (c: Consultant) => {
    setEditingConsultantId(c.id);
    setConsultantForm({ name: c.name, cpf: c.cpf, whatsapp: c.whatsapp || '', photoUrl: c.photoUrl, photoPosition: c.photoPosition || '50% 50%' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditSale = (acq: Acquisition) => {
    setEditingSale(acq);
    setSaleEditForm({ ...acq });
  };

  const handleSaleUpdateSubmit = async () => {
    if (editingSale) {
      setIsSubmitting(true);
      try { 
        await onUpdateAcquisition(editingSale.id, saleEditForm); 
        setEditingSale(null); 
      }
      catch (err: any) { alert(err.message); }
      finally { setIsSubmitting(false); }
    }
  };

  const handleDeleteAcq = async () => {
    if (editingSale && confirm('Tem certeza que deseja excluir este lead permanentemente?')) {
      setIsSubmitting(true);
      try {
        await onDeleteAcquisition(editingSale.id);
        setEditingSale(null);
      } catch (err: any) { alert(err.message); }
      finally { setIsSubmitting(false); }
    }
  };

  const filteredAcquisitions = useMemo(() => {
    return acquisitions.filter(acq => {
      const matchesSearch = acq.clientName.toLowerCase().includes(saleSearchQuery.toLowerCase()) || acq.siteTitle.toLowerCase().includes(saleSearchQuery.toLowerCase());
      const matchesStatus = saleStatusFilter === 'all' || acq.status === saleStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [acquisitions, saleSearchQuery, saleStatusFilter]);

  const filteredSites = useMemo(() => {
    if (!siteSearchQuery.trim()) return sites;
    const lowerQuery = siteSearchQuery.toLowerCase();
    return sites.filter(s => {
      const categoryName = categories.find(c => c.id === s.categoryId)?.name || '';
      return s.title.toLowerCase().includes(lowerQuery) || categoryName.toLowerCase().includes(lowerQuery);
    });
  }, [sites, siteSearchQuery, categories]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#000814] flex items-center justify-center p-6 font-['Inter']">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#bf953f] rounded-full blur-[150px]"></div>
        </div>
        <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-2xl p-12 rounded-[3rem] border border-white/10 shadow-2xl relative z-10 text-center">
          <button onClick={() => navigate('/')} className="mb-8 text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:text-blue-300 transition-all">
             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
             Voltar
          </button>
          <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
             <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Painel Restrito</h2>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-10">Identifique-se para continuar</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <input 
                type="password" 
                placeholder="Chave de Acesso"
                className={`w-full px-8 py-5 bg-white/5 border-2 rounded-2xl outline-none text-white text-center font-black tracking-[0.5em] transition-all focus:bg-white/10 ${authError ? 'border-red-500 animate-shake' : 'border-white/10 focus:border-blue-500'}`}
                value={passInput}
                onChange={e => setPassInput(e.target.value)}
                autoFocus
              />
              {authError && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2">Senha Incorreta</p>}
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-500 transition-all active:scale-95">Acessar Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-['Inter']">
      {isSubmitting && (
        <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex items-center gap-4 animate-pulse">
             <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black text-xs uppercase tracking-widest text-slate-900">Sincronizando...</p>
          </div>
        </div>
      )}

      {editingSale && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-6 animate-[fadeIn_0.3s]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingSale(null)}></div>
          <div className="bg-white w-full max-w-3xl relative z-10 p-10 rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh]">
            <header className="mb-10 flex items-center justify-between border-b pb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Ficha do Lead / Venda</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">ID: {editingSale.id}</p>
              </div>
              <button onClick={() => setEditingSale(null)} className="p-3 hover:bg-slate-100 rounded-full transition-all">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </header>
            
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nome do Cliente</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-900" value={saleEditForm.clientName} onChange={e => setSaleEditForm({...saleEditForm, clientName: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Telefone / WhatsApp</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-900" value={saleEditForm.clientPhone} onChange={e => setSaleEditForm({...saleEditForm, clientPhone: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Fluxo de Produção</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['pending', 'processing', 'done'] as AcquisitionStatus[]).map(s => (
                    <button key={s} onClick={() => setSaleEditForm({ ...saleEditForm, status: s })} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${saleEditForm.status === s ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {s === 'pending' ? 'Pendente' : s === 'processing' ? 'Produção' : 'Finalizado'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Gestão Financeira</h4>
                  <div className="flex gap-2">
                     <button onClick={() => setSaleEditForm({...saleEditForm, isPaid: true})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${saleEditForm.isPaid ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>QUITADO</button>
                     <button onClick={() => setSaleEditForm({...saleEditForm, isPaid: false})} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${!saleEditForm.isPaid ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}`}>EM ABERTO</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Total do Projeto (R$)</label>
                      <input type="number" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900" value={saleEditForm.totalValue} onChange={e => setSaleEditForm({...saleEditForm, totalValue: parseFloat(e.target.value)})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vencimento Próxima Parcela</label>
                      <input type="date" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900" value={saleEditForm.paymentDate} onChange={e => setSaleEditForm({...saleEditForm, paymentDate: e.target.value})} />
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Comentários do Gestor</label>
                    <textarea rows={4} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 font-medium text-slate-700" value={saleEditForm.comment} onChange={(e) => setSaleEditForm({ ...saleEditForm, comment: e.target.value })}></textarea>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Documentação / Comprovante</label>
                    <input 
                      type="file" 
                      ref={attachmentFileRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleAttachmentChange} 
                    />
                    <div 
                      onClick={() => attachmentFileRef.current?.click()}
                      className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
                    >
                      {saleEditForm.attachmentUrl ? (
                        <>
                          <img src={saleEditForm.attachmentUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                             <p className="text-white font-black text-[10px] uppercase tracking-widest">Capturar Nova Foto</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">Clique para tirar foto</p>
                        </>
                      )}
                    </div>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-6">
                <button onClick={handleDeleteAcq} className="flex-1 py-5 border-2 border-red-500 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Excluir Permanente</button>
                <button onClick={() => openInGoogleMaps(editingSale)} className="flex-1 py-5 border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Ver Localização</button>
                <button onClick={handleSaleUpdateSubmit} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-700 transition-all">Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button onClick={() => navigate('/')} className="mb-4 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center hover:bg-blue-50 px-4 py-2 rounded-full transition-all w-fit">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
              Voltar ao Início
            </button>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Gestor</h1>
            <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.4em] mt-2">Painel de Gestão</p>
          </div>
        </header>

        <nav className="flex gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { id: 'sites', label: 'Projetos Demo', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'consultants', label: 'Consultores', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'sales', label: 'Vendas', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'billingMap', label: 'Mapa Financeiro', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
            { id: 'settings', label: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}/></svg>
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'sites' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-slate-900">
            <div className="lg:col-span-1 space-y-10">
              <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black mb-8 text-slate-900 tracking-tight uppercase">Segmentos</h2>
                <form onSubmit={handleAddCategory} className="space-y-4 mb-8">
                  <input type="text" placeholder="Nome da Categoria" className="w-full px-8 py-5 border-2 border-slate-50 bg-slate-50 rounded-[1.5rem] focus:border-blue-600 outline-none font-bold text-slate-800" value={catName} onChange={(e) => setCatName(e.target.value)} />
                  <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Criar Categoria</button>
                </form>
                <div className="grid grid-cols-1 gap-3">
                  {categories.map(c => (
                    <div key={c.id} className="group relative">
                      {editingCategoryId === c.id ? (
                        <div className="flex gap-2">
                          <input type="text" className="flex-1 px-4 py-3 bg-white border-2 border-blue-600 rounded-xl outline-none font-bold text-[9px] uppercase tracking-widest text-slate-900" value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} autoFocus />
                          <button onClick={() => handleUpdateCategory(c.id, editingCategoryName)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg></button>
                          <button onClick={() => setEditingCategoryId(null)} className="p-3 bg-slate-200 text-slate-500 rounded-xl hover:bg-slate-300 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                          <span className="font-black text-[9px] uppercase tracking-widest text-slate-500">{c.name}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingCategoryId(c.id); setEditingCategoryName(c.name); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                            <button onClick={() => { if(confirm('Excluir esta categoria?')) onDeleteCategory(c.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="lg:col-span-2 space-y-10">
              <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black mb-8 text-slate-900 tracking-tight uppercase">{editingSiteId ? 'Editar Demo' : 'Nova Demo'}</h2>
                <form onSubmit={handleSiteSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Título do Projeto</label>
                    <input type="text" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-900" value={siteForm.title} onChange={(e) => setSiteForm({ ...siteForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Live URL</label>
                    <input type="url" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-900" value={siteForm.link} onChange={(e) => setSiteForm({ ...siteForm, link: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Categoria</label>
                    <select className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-black text-[10px] uppercase text-slate-900" value={siteForm.categoryId} onChange={(e) => setSiteForm({ ...siteForm, categoryId: e.target.value })}>
                      <option value="">Selecione...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 text-center">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Mídia de Capa (Imagem ou Vídeo)</label>
                    <input type="file" ref={siteFileRef} className="hidden" accept="image/*,video/*" onChange={handleSiteFileChange} />
                    <div onClick={() => siteFileRef.current?.click()} className="w-full h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all overflow-hidden relative group">
                      {siteForm.mediaUrl ? (
                        <>
                          {siteForm.mediaType === 'video' ? <video src={siteForm.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop /> : <img src={siteForm.mediaUrl} className="w-full h-full object-cover" style={{ objectPosition: siteForm.objectPosition }} />}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                             <p className="text-white font-black text-[10px] uppercase tracking-widest">Alterar Arquivo</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Clique para abrir a galeria</p>
                        </>
                      )}
                    </div>
                  </div>

                  {siteForm.mediaUrl && siteForm.mediaType === 'image' && (
                    <div className="md:col-span-2 space-y-6 bg-slate-100/50 p-8 rounded-[3rem] border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-black text-[#2563eb] uppercase tracking-widest mb-4 px-2">Ajuste de Enquadramento (Clique e Arraste no Pad abaixo)</label>
                        <div className="flex flex-col md:flex-row gap-10 items-center">
                          <div 
                            ref={positionPadRef}
                            onMouseDown={(e) => { handlePositionInteraction(e, 'site'); }}
                            onMouseMove={(e) => { if(e.buttons === 1) handlePositionInteraction(e, 'site'); }}
                            onTouchMove={(e) => { handlePositionInteraction(e, 'site'); }}
                            className="w-48 h-48 bg-slate-900 rounded-3xl relative cursor-crosshair overflow-hidden shadow-2xl border-4 border-white"
                          >
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20% 20%' }}></div>
                            <div 
                              className="absolute w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-[0_0_15px_rgba(37,99,235,0.6)] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
                              style={{ left: siteForm.objectPosition.split(' ')[0], top: siteForm.objectPosition.split(' ')[1] }}
                            >
                               <div className="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-30"></div>
                            </div>
                            <div className="absolute bottom-3 left-3 text-[8px] font-black text-white/40 uppercase tracking-tighter">Pos: {siteForm.objectPosition}</div>
                          </div>

                          <div className="flex-1 space-y-4 w-full">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Demostrativo de Exibição (Preview Real)</p>
                            <div className="w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border-4 border-white ring-1 ring-slate-200">
                              <img 
                                src={siteForm.mediaUrl} 
                                className="w-full h-full object-cover transition-all duration-150" 
                                style={{ objectPosition: siteForm.objectPosition }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Galeria de Fotos do Projeto</label>
                    <input type="file" ref={galleryFilesRef} className="hidden" accept="image/*" multiple onChange={handleGalleryFilesChange} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {siteForm.galleryUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100">
                          <img src={url} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => galleryFilesRef.current?.click()}
                        className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-100 transition-all text-slate-300 hover:text-blue-500"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2 text-center md:text-left">Descrição Curta</label>
                    <textarea 
                      className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-medium text-slate-700" 
                      rows={3}
                      value={siteForm.description}
                      onChange={(e) => setSiteForm({ ...siteForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="md:col-span-2"><button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-600 transition-all active:scale-95">{editingSiteId ? 'Atualizar Projeto' : 'Publicar Demonstração'}</button></div>
                </form>
              </section>

              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
                  <input type="text" placeholder="Buscar nos sites demo por nome ou categoria..." className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-slate-900 shadow-sm transition-all" value={siteSearchQuery} onChange={(e) => setSiteSearchQuery(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSites.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group shadow-sm hover:shadow-xl transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shadow-inner">
                          {s.mediaType === 'video' ? <video src={s.mediaUrl} className="w-full h-full object-cover" muted /> : <img src={s.mediaUrl} className="w-full h-full object-cover" style={{ objectPosition: s.objectPosition }} />}
                        </div>
                        <div><p className="font-black text-slate-900 leading-none mb-1">{s.title}</p><p className="text-[9px] uppercase font-black text-blue-500 tracking-widest">{categories.find(c => c.id === s.categoryId)?.name}</p></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setEditingSiteId(s.id); setSiteForm({...s, galleryUrls: s.galleryUrls || [], objectPosition: s.objectPosition || '50% 50%'}); }} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">Editar</button>
                        <button onClick={() => { if(confirm('Excluir demo?')) onDeleteSite(s.id); }} className="text-[9px] font-black uppercase tracking-widest text-red-300 hover:text-red-500">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultants' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <section className={`p-10 rounded-[3rem] shadow-sm border h-fit transition-all duration-500 ${editingConsultantId ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-500/10' : 'bg-white border-slate-100'}`}>
                <h2 className={`text-2xl font-black tracking-tight uppercase mb-8 ${editingConsultantId ? 'text-blue-600' : 'text-slate-900'}`}>{editingConsultantId ? 'Editando Consultor' : 'Novo Credenciamento'}</h2>
                <form onSubmit={handleConsultantSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Nome Completo</label>
                    <input type="text" placeholder="Nome do Consultor" className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-900" value={consultantForm.name} onChange={(e) => setConsultantForm({ ...consultantForm, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">CPF</label>
                      <input type="text" placeholder="000.000.000-00" className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-900" value={consultantForm.cpf} onChange={(e) => setConsultantForm({ ...consultantForm, cpf: e.target.value.replace(/\D/g,'') })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">WhatsApp</label>
                      <input type="tel" placeholder="00000000000" className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold text-slate-900" value={consultantForm.whatsapp} onChange={(e) => setConsultantForm({ ...consultantForm, whatsapp: e.target.value.replace(/\D/g,'') })} />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Foto de Perfil</label>
                    <input type="file" ref={consultantPhotoFileRef} className="hidden" accept="image/*" onChange={handleConsultantPhotoChange} />
                    <div 
                      onClick={() => consultantPhotoFileRef.current?.click()} 
                      className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all overflow-hidden relative group"
                    >
                      {consultantForm.photoUrl ? (
                        <>
                          <img 
                            src={consultantForm.photoUrl} 
                            className="w-full h-full object-cover" 
                            style={{ objectPosition: consultantForm.photoPosition }} 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                             <p className="text-white font-black text-[10px] uppercase tracking-widest">Alterar Foto</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest">Selecionar da Galeria</p>
                        </>
                      )}
                    </div>
                  </div>

                  {consultantForm.photoUrl && (
                    <div className="space-y-6 bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100">
                      <div>
                        <label className="block text-[9px] font-black text-blue-600 uppercase tracking-widest mb-3 px-2">Ajuste o Centro da Foto</label>
                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                          <div 
                            ref={consultantPositionPadRef}
                            onMouseDown={(e) => { handlePositionInteraction(e, 'consultant'); }}
                            onMouseMove={(e) => { if(e.buttons === 1) handlePositionInteraction(e, 'consultant'); }}
                            onTouchMove={(e) => { handlePositionInteraction(e, 'consultant'); }}
                            className="w-32 h-32 bg-slate-900 rounded-2xl relative cursor-crosshair overflow-hidden shadow-lg border-2 border-white"
                          >
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20% 20%' }}></div>
                            <div 
                              className="absolute w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                              style={{ left: consultantForm.photoPosition.split(' ')[0], top: consultantForm.photoPosition.split(' ')[1] }}
                            />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Preview do Perfil</p>
                            <div className="w-20 h-20 mx-auto sm:mx-0 rounded-full overflow-hidden border-2 border-white shadow-md">
                              <img 
                                src={consultantForm.photoUrl} 
                                className="w-full h-full object-cover" 
                                style={{ objectPosition: consultantForm.photoPosition }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    {editingConsultantId && <button type="button" onClick={() => { setEditingConsultantId(null); setConsultantForm({ name: '', cpf: '', whatsapp: '', photoUrl: '', photoPosition: '50% 50%' }); }} className="flex-1 bg-slate-200 text-slate-500 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>}
                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all bg-slate-900 text-white hover:bg-blue-600">{isSubmitting ? 'Processando...' : 'Salvar Consultor'}</button>
                  </div>
                </form>
             </section>
             <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2 scrollbar-hide">
                {consultants.map(c => (
                  <div key={c.id} className={`p-8 bg-white rounded-[3rem] border shadow-sm transition-all hover:shadow-2xl group relative overflow-hidden ${editingConsultantId === c.id ? 'border-blue-500' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-6 mb-8 text-slate-900">
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50">
                        <img src={c.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: c.photoPosition || '50% 50%' }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black uppercase tracking-tighter text-2xl mb-1">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">WhatsApp: {c.whatsapp || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => startEditConsultant(c)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                        <button onClick={() => { if(confirm('Excluir?')) onDeleteConsultant(c.id); }} className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => handleCopyLink(c.id)} className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${copyStatus === c.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{copyStatus === c.id ? 'Copiado' : 'Link Público'}</button>
                      <button onClick={() => navigate(`/consultant/${c.id}`)} className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Perfil</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none text-center md:text-left">Fluxo Comercial</h2>
              <div className="bg-blue-600 text-white px-8 py-3 rounded-full text-[12px] font-black uppercase tracking-[0.2em] w-fit mx-auto md:mx-0">{filteredAcquisitions.length} Negócios</div>
            </div>
            <div className="mb-6 relative group">
              <input type="text" placeholder="Pesquisar venda por cliente ou site..." className="w-full px-8 py-5 bg-white border border-slate-200 rounded-3xl outline-none focus:border-blue-600 font-bold shadow-sm text-slate-900" value={saleSearchQuery} onChange={(e) => setSaleSearchQuery(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-8">
              {filteredAcquisitions.map(acq => (
                <div key={acq.id} className="p-8 md:p-12 bg-white rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col lg:flex-row justify-between gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                       <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${acq.status === 'pending' ? 'bg-amber-100 text-amber-700' : acq.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{acq.status === 'pending' ? '• Aguardando' : acq.status === 'processing' ? '• Produção' : '• Finalizado'}</span>
                       <span className="bg-slate-900 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">{acq.siteTitle}</span>
                       <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${acq.isPaid ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{acq.isPaid ? 'QUITADO' : 'COBRANÇA'}</span>
                    </div>
                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{acq.clientName}</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-wrap gap-10">
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Valor Total</p><p className="text-2xl font-black text-slate-900">R$ {acq.totalValue?.toLocaleString('pt-BR')}</p></div>
                        {!acq.isPaid && <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Parcela Atual</p><p className="text-xl font-black text-slate-900">R$ {acq.installmentValue?.toLocaleString('pt-BR')}</p></div>}
                        <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Vencimento Ref.</p><p className="text-xl font-bold text-slate-700">{formatDisplayDate(acq.paymentDate)}</p></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 w-full lg:w-64">
                    <button onClick={() => startEditSale(acq)} className="bg-white border-2 border-slate-900 text-slate-900 py-4 rounded-2xl hover:bg-slate-900 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest">Editar Ficha</button>
                    <button onClick={() => window.open(`https://wa.me/55${acq.clientPhone.replace(/\D/g,'')}`, '_blank')} className="bg-[#25D366] text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl">WhatsApp</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'billingMap' && (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Mapa Financeiro</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Busca inteligente: Localiza faturamentos no intervalo informado.</p>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#2563eb] uppercase tracking-widest px-2">Data Inicial</label>
                  <input 
                    type="date" 
                    className="px-6 py-4 bg-white border-2 border-blue-100 rounded-2xl text-sm font-black outline-none focus:border-blue-600 transition-all text-slate-900 shadow-sm" 
                    value={billingStartDate} 
                    onChange={(e) => {setBillingStartDate(e.target.value); setHasSearchedBilling(false);}} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#2563eb] uppercase tracking-widest px-2">Data Final</label>
                  <input 
                    type="date" 
                    className="px-6 py-4 bg-white border-2 border-blue-100 rounded-2xl text-sm font-black outline-none focus:border-blue-600 transition-all text-slate-900 shadow-sm" 
                    value={billingEndDate} 
                    onChange={(e) => {setBillingEndDate(e.target.value); setHasSearchedBilling(false);}} 
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setHasSearchedBilling(true)}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all flex items-center gap-3 h-[60px]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    Buscar
                  </button>
                  {hasSearchedBilling && (
                    <button 
                      onClick={() => { setBillingStartDate(''); setBillingEndDate(''); setHasSearchedBilling(false); }}
                      className="bg-slate-200 text-slate-500 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-300 transition-all h-[60px]"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="relative group rounded-[3rem] shadow-2xl border-4 border-white bg-slate-50" style={{ overflow: 'hidden' }}>
               <div id="billing-map" style={{ height: '600px', width: '100%', zIndex: 10, position: 'relative', background: '#e2e8f0' }}></div>
               <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-xl text-slate-900">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Volume no Período</p>
                  <p className="text-3xl font-black text-blue-600">R$ {filteredBilling.reduce((acc, curr) => acc + (curr.installmentValue || 0), 0).toLocaleString('pt-BR')}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{filteredBilling.length} Pontos de Faturamento</p>
               </div>
               <button onClick={handleNextClient} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all border border-white/20">Avançar para Próximo Cliente</button>
            </div>

            <div className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">#</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cliente / Projeto</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vencimento</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Parcela</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Gestão</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {filteredBilling.map((acq, index) => (
                       <tr key={acq.id} className={`hover:bg-blue-50/40 transition-colors ${focusedClientIndex === index ? 'bg-blue-50/60' : ''}`}>
                         <td className="px-8 py-6"><span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">{index + 1}</span></td>
                         <td className="px-8 py-6"><p className="font-black text-slate-900 text-sm leading-none mb-1">{acq.clientName}</p><p className="text-[9px] uppercase font-bold text-blue-500 tracking-tight">{acq.siteTitle}</p></td>
                         <td className="px-8 py-6"><span className="text-xs font-bold text-slate-700">{formatDisplayDate(acq.paymentDate)}</span></td>
                         <td className="px-8 py-6"><span className="font-black text-slate-900">R$ {acq.installmentValue?.toLocaleString('pt-BR')}</span></td>
                         <td className="px-8 py-6"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${acq.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{acq.isPaid ? 'Pago' : 'Aberto'}</span></td>
                         <td className="px-8 py-6">
                           <div className="flex items-center justify-center gap-2">
                              <button onClick={() => startEditSale(acq)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                              <button onClick={() => openInGoogleMaps(acq)} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-all shadow-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg></button>
                              <button onClick={() => window.open(`https://wa.me/55${acq.clientPhone.replace(/\D/g,'')}`, '_blank')} className="p-2.5 bg-[#25D366] text-white rounded-xl hover:brightness-110 transition-all shadow-md"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></button>
                           </div>
                         </td>
                       </tr>
                     ))}
                     {(!hasSearchedBilling || filteredBilling.length === 0) && (
                       <tr>
                         <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs leading-relaxed">
                           {!hasSearchedBilling ? "Informe o período e clique em 'Buscar'" : "Nenhum faturamento encontrado neste intervalo."}
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-10 py-10 animate-[fadeIn_0.5s]">
             <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                   <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter text-center">Segurança</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-10 text-center">Alteração da Chave Mestra do Painel</p>
                
                <div className="space-y-6 text-left">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nova Senha de Acesso</label>
                      <input 
                        type="text" 
                        className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-blue-600 font-black tracking-[0.3em] text-center text-slate-900" 
                        placeholder="••••••••"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                      />
                   </div>
                   <button 
                     onClick={handleUpdatePass}
                     className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-600 transition-all active:scale-95"
                   >
                     Atualizar Chave
                   </button>
                </div>
                <p className="mt-10 text-slate-300 text-[9px] font-bold uppercase tracking-widest leading-relaxed italic text-center">Atenção: A nova senha entrará em vigor imediatamente para todos os acessos ao gestor.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Manager;