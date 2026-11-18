'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Building2, 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3,
  Image as ImageIcon, 
  Upload, 
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PieChart,
  Printer,
  Clock,
  TrendingUp,
  Layers,
  FolderPlus,
  Calendar
} from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type CategoryItem = {
  id: string
  name: string
}

type InventoryItem = {
  id: string
  category: string
  status: string
  tahun?: number
  tenant?: string
  nama_barang?: string
  merek?: string
  type_barang?: string
  spesifikasi?: string
  serial_number?: string
  lokasi?: string
  keterangan?: string
  foto_urls?: string[]
  komputer?: string
}

export default function InventoryAppPro() {
  const currentYear = new Date().getFullYear()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [activeCategory, setActiveCategory] = useState('Semua Kategori')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [lastUpdate, setLastUpdate] = useState('')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')

  // Lightbox
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const initialFormState: Partial<InventoryItem> = {
    category: '',
    tahun: currentYear,
    status: 'Barang Baru Masuk',
    nama_barang: '',
    tenant: '',
    merek: '',
    serial_number: '',
    spesifikasi: '',
    lokasi: '',
    type_barang: '',
    keterangan: '',
    foto_urls: []
  }

  const [formData, setFormData] = useState<Partial<InventoryItem>>(initialFormState)
  const [uploading, setUploading] = useState(false)

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error && data) {
        setCategories(data)
        if (data.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: data[0].name }))
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const parseFotoUrls = (item: any): string[] => {
    if (Array.isArray(item.foto_urls)) return item.foto_urls
    if (item.foto_urls && typeof item.foto_urls === 'string') {
      try {
        const parsed = JSON.parse(item.foto_urls)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return [item.foto_urls]
      }
    }
    const singleUrl = item.foto_url || item.foto_komputer_url
    return singleUrl ? [singleUrl] : []
  }

  const fetchItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        const normalized = data.map(item => {
          const itemYear = Number(item.tahun) || currentYear
          const calculatedStatus = itemYear >= currentYear ? 'Barang Baru Masuk' : 'Barang Lama (Inventaris)'

          return {
            ...item,
            tahun: itemYear,
            status: item.status || calculatedStatus,
            foto_urls: parseFotoUrls(item)
          }
        })
        setItems(normalized)
        
        const now = new Date()
        const options: Intl.DateTimeFormatOptions = { 
            day: 'numeric', month: 'long', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }
        setLastUpdate(now.toLocaleDateString('id-ID', options).replace(/\./g, ':') + ' WIB')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchItems()
  }, [])

  // ================= CRUD KATEGORI HANDLERS =================
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCatName.trim() }])

      if (error) throw error

      setNewCatName('')
      fetchCategories()
      alert('Kategori berhasil ditambahkan!')
    } catch (err: any) {
      alert('Gagal menambah kategori: ' + err.message)
    }
  }

  const handleUpdateCategory = async (id: string, oldName: string) => {
    if (!editingCatName.trim()) return

    try {
      const newName = editingCatName.trim()
      const { error } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', id)

      if (error) throw error

      await supabase
        .from('inventory_items')
        .update({ category: newName })
        .eq('category', oldName)

      if (activeCategory === oldName) setActiveCategory(newName)

      setEditingCatId(null)
      setEditingCatName('')
      fetchCategories()
      fetchItems()
      alert('Kategori berhasil diperbarui!')
    } catch (err: any) {
      alert('Gagal mengedit kategori: ' + err.message)
    }
  }

  const handleDeleteCategory = async (category: CategoryItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.id)

        if (error) throw error

        if (activeCategory === category.name) {
          setActiveCategory('Semua Kategori')
        }

        fetchCategories()
        alert('Kategori berhasil dihapus!')
      } catch (err: any) {
        alert('Gagal menghapus kategori: ' + err.message)
      }
    }
  }

  // ================= FORM & ITEM HANDLERS =================
  const handleOpenAddModal = () => {
    setEditingId(null)
    setFormData({
      ...initialFormState,
      category: categories.length > 0 ? categories[0].name : '',
      tahun: currentYear
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingId(item.id)
    setFormData({
      ...item,
      tahun: item.tahun || currentYear,
      nama_barang: item.nama_barang || item.komputer || '',
      tenant: item.tenant || item.lokasi || '',
      foto_urls: item.foto_urls || []
    })
    setIsModalOpen(true)
  }

const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return

      const files = Array.from(e.target.files)
      const uploadedUrls: string[] = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
        const filePath = `items/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('inventory-photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('inventory-photos').getPublicUrl(filePath)
        uploadedUrls.push(data.publicUrl)
      }

      setFormData(prev => ({
        ...prev,
        foto_urls: [...(prev.foto_urls || []), ...uploadedUrls]
      }))
    } catch (err: any) {
      alert('Gagal upload foto: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveSinglePhoto = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      foto_urls: (prev.foto_urls || []).filter((_, idx) => idx !== indexToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const selectedYear = Number(formData.tahun) || currentYear
      
      // LOGIKA OTOMATIS PENENTUAN STATUS BERDASARKAN TAHUN
      const computedStatus = selectedYear >= currentYear 
        ? 'Barang Baru Masuk' 
        : 'Barang Lama (Inventaris)'

      const { foto_urls, ...restPayload } = formData
      const payload: Record<string, any> = { 
        ...restPayload,
        tahun: selectedYear,
        status: computedStatus 
      }

      if (payload.nama_barang) payload.komputer = payload.nama_barang
      if (payload.tenant) payload.lokasi = payload.tenant

      if (foto_urls && foto_urls.length > 0) {
        payload.foto_url = foto_urls[0]
        payload.foto_komputer_url = foto_urls[0]
      } else {
        payload.foto_url = null
        payload.foto_komputer_url = null
      }

      if (editingId) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('inventory_items').insert([payload])
        if (error) throw error
      }

      setIsModalOpen(false)
      setFormData(initialFormState)
      setEditingId(null)
      fetchItems()
      alert(`Data inventaris berhasil disimpan! Status diset otomatis ke: "${computedStatus}"`)
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus aset inventaris ini?')) {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id)
      if (error) alert('Gagal menghapus: ' + error.message)
      else fetchItems()
    }
  }

  const filteredItems = items.filter(item => {
    const matchCat = activeCategory === 'Semua Kategori' || item.category === activeCategory
    const matchStatus = statusFilter === 'Semua' || item.status === statusFilter

    if (!matchCat || !matchStatus) return false
    if (!searchQuery.trim()) return true

    const q = searchQuery.toLowerCase().trim()

    const searchableText = [
      item.nama_barang, item.komputer, item.tenant, item.lokasi,
      item.merek, item.type_barang, item.spesifikasi, item.serial_number,
      item.keterangan, item.category, item.tahun?.toString()
    ].filter(Boolean).join(' ').toLowerCase()

    return searchableText.includes(q)
  })

  const totalBarang = items.length
  const barangBaru = items.filter(i => i.status === 'Barang Baru Masuk').length
  const barangLama = items.filter(i => i.status === 'Barang Lama (Inventaris)').length

  const allCategoryNames = ['Semua Kategori', ...categories.map(c => c.name)]

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 shadow-2xl z-20">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-5 flex items-center gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/40 relative overflow-hidden group shrink-0">
            <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-white">DPMPTSP</h1>
              <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">KOTA BANDUNG</p>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-3 px-3">
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-sky-400" />
                <span>Sektor Kategori</span>
              </p>
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <FolderPlus className="h-3 w-3" />
                <span>Kelola</span>
              </button>
            </div>

            <nav className="space-y-1.5">
              {allCategoryNames.map((cat) => {
                const count = cat === 'Semua Kategori' ? items.length : items.filter(i => i.category === cat).length
                const isActive = activeCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 font-semibold' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="w-full bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Inventaris</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-100/70">
        <header className="px-6 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{activeCategory}</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Sistem Pengelolaan Inventaris Aset IT DPMPTSP Kota Bandung</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              <span>Update: <span className="font-bold text-slate-800">{lastUpdate}</span></span>
            </div>
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-950 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-sky-400" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">

          {/* DASHBOARD ANALYTICS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Total Aset Terdaftar
                </span>
                <Package className="h-5 w-5 text-sky-300" />
              </div>
              <h3 className="text-4xl font-black text-white mt-2">
                {totalBarang} <span className="text-xs font-medium text-slate-400">Unit Barang</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800">
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase">Barang Baru ({currentYear})</p>
                  <p className="text-xl font-black text-emerald-300 mt-0.5">{barangBaru} <span className="text-xs font-normal">Unit</span></p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-300 font-bold uppercase">Barang Lama (&lt; {currentYear})</p>
                  <p className="text-xl font-black text-slate-200 mt-0.5">{barangLama} <span className="text-xs font-normal">Unit</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <PieChart className="h-4 w-4 text-sky-600" />
                  <span>Distribusi Berdasarkan Sektor Kategori</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs max-h-40 overflow-y-auto">
                  {categories.map((cat) => {
                    const count = items.filter(i => i.category === cat.name).length
                    return (
                      <div key={cat.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-slate-700 font-bold truncate">{cat.name}</span>
                        <span className="font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-lg">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* BAR PENCARIAN & FILTER */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari data (Merek, Tahun, Nama, Lokasi, dll)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="Semua">-- Filter Semua Status --</option>
                <option value="Barang Baru Masuk">Barang Baru Masuk ({currentYear})</option>
                <option value="Barang Lama (Inventaris)">Barang Lama (&lt; {currentYear})</option>
              </select>
            </div>
          </div>

          {/* TABEL DATA INVENTARIS */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white uppercase font-bold tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">No</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Tenant / Lokasi</th>
                    <th className="p-3.5">Nama Barang</th>
                    <th className="p-3.5">Merek / Spec</th>
                    <th className="p-3.5 text-center">Tahun</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Foto</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-slate-400 font-semibold animate-pulse">Memuat data dari database...</td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-slate-400 font-medium">Tidak ada data ditemukan.</td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const photos = item.foto_urls || []
                      const isBarangBaru = item.status === 'Barang Baru Masuk'
                      
                      return (
                        <tr key={item.id} className="bg-white hover:bg-slate-50 transition-all">
                          <td className="p-3.5 font-mono text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-3.5">
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200/80 font-bold text-[10px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold">{item.tenant || item.lokasi || '-'}</td>
                          <td className="p-3.5 font-extrabold text-indigo-950">{item.nama_barang || item.komputer || '-'}</td>
                          <td className="p-3.5 text-slate-500">{item.merek || item.spesifikasi || '-'}</td>
                          
                          <td className="p-3.5 text-center font-bold text-slate-700">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {item.tahun || '-'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isBarangBaru 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            {photos.length > 0 ? (
                              <button
                                onClick={() => {
                                  setPreviewImages(photos)
                                  setActiveImageIdx(0)
                                }}
                                className="inline-flex items-center gap-1.5 text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 font-bold cursor-pointer"
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                                <span>{photos.length} Foto</span>
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="text-slate-400 hover:text-sky-600 p-1.5 rounded-lg cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* MODAL KELOLA KATEGORI */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900 text-white">
              <h3 className="font-extrabold text-sm">Kelola Sektor Kategori</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nama Kategori Baru..."
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-sky-500"
                />
                <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  <span>Tambah</span>
                </button>
              </form>

              <div className="border border-slate-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-3 flex justify-between items-center">
                    {editingCatId === cat.id ? (
                      <div className="flex gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          className="flex-1 bg-slate-100 border rounded-lg px-2 py-1 text-xs font-semibold"
                        />
                        <button onClick={() => handleUpdateCategory(cat.id, cat.name)} className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">Simpan</button>
                        <button onClick={() => setEditingCatId(null)} className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg">Batal</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="p-1.5 text-slate-400 hover:text-sky-600">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat)} className="p-1.5 text-slate-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT / EDIT INVENTARIS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900 text-white">
              <h3 className="font-extrabold text-sm">
                {editingId ? 'Edit Inventaris Barang' : 'Tambah Inventaris Barang'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Target *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* INPUT TAHUN PENGADAAN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun Pengadaan *</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max="2100"
                    placeholder="Contoh: 2026"
                    value={formData.tahun || ''}
                    onChange={(e) => setFormData({...formData, tahun: parseInt(e.target.value) || currentYear})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Tahun ≥ {currentYear} diset <b>Barang Baru</b>. &lt; {currentYear} diset <b>Barang Lama</b>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Barang / Komputer *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_barang || ''}
                    onChange={(e) => setFormData({...formData, nama_barang: e.target.value, komputer: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant / Lokasi</label>
                  <input
                    type="text"
                    value={formData.tenant || ''}
                    onChange={(e) => setFormData({...formData, tenant: e.target.value, lokasi: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Merek</label>
                  <input
                    type="text"
                    value={formData.merek || ''}
                    onChange={(e) => setFormData({...formData, merek: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Serial Number / Type</label>
                  <input
                    type="text"
                    value={formData.serial_number || ''}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value, type_barang: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Spesifikasi Detail / Keterangan</label>
                <textarea
                  rows={2}
                  value={formData.spesifikasi || ''}
                  onChange={(e) => setFormData({...formData, spesifikasi: e.target.value, keterangan: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* UPLOAD FOTO MULTIPLE */}
              <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-semibold text-slate-600">Foto Barang</label>
                  <label
                    htmlFor="file-upload-multi-pro"
                    className="cursor-pointer bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploading ? 'Mengunggah...' : 'Pilih Foto'}</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultipleFileUpload}
                    className="hidden"
                    id="file-upload-multi-pro"
                  />
                </div>

                {formData.foto_urls && formData.foto_urls.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 mt-3 max-h-48 overflow-y-auto p-1">
                    {formData.foto_urls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border bg-white aspect-square">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveSinglePhoto(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada foto tersimpan.</p>
                )}
              </div>

              <div className="pt-3 flex gap-3 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW FOTO */}
      {previewImages.length > 0 && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl p-4 flex flex-col items-center">
            <button 
              onClick={() => setPreviewImages([])}
              className="absolute top-4 right-4 bg-slate-900 text-white p-2 rounded-full cursor-pointer"
            >

              
              <X className="h-5 w-5" />
            </button>

            <div className="relative w-full h-[60vh] flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden">
              <img 
                src={previewImages[activeImageIdx]} 
                alt={`Preview ${activeImageIdx}`} 
                className="max-h-full max-w-full object-contain" 
              />

              {previewImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIdx((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white text-slate-800 rounded-full shadow cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIdx((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-slate-800 rounded-full shadow cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}