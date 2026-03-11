import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingBasket, Info, Tag, Plus, Upload, X, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Vegetable {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}

// 1. Updated global URL to point to your live Render API
const API_BASE_URL = "https://vege-catalog.onrender.com/api/vegetables";

export default function App() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVeg, setNewVeg] = useState({ name: "", price: "", description: "", imageUrl: "" });
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [vegToDelete, setVegToDelete] = useState<Vegetable | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FETCH: GET all vegetables
  useEffect(() => {
    const fetchVegetables = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error("Failed to connect to the farm (Backend Error)");
        }
        const data = await response.json();
        setVegetables(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVegetables();
  }, []);

  // ADD/EDIT: POST or PUT vegetable
  const handleAddVegetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVeg.name || !newVeg.price || !newVeg.imageUrl) return;

    try {
      const url = editingId ? `${API_BASE_URL}/${editingId}` : API_BASE_URL;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVeg.name,
          price: parseFloat(newVeg.price),
          description: newVeg.description || "Freshly added produce.",
          imageUrl: newVeg.imageUrl
        })
      });

      if (!response.ok) throw new Error(`Failed to ${editingId ? 'update' : 'add'} vegetable`);
      
      const result = await response.json();
      
      if (editingId) {
        setVegetables(prev => prev.map(v => v.id === editingId ? result : v));
      } else {
        setVegetables(prev => [result, ...prev]);
      }

      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE: Remove vegetable
  const confirmDelete = async () => {
    if (!vegToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${vegToDelete.id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete vegetable");
      
      setVegetables(prev => prev.filter(v => v.id !== vegToDelete.id));
      setVegToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ("files" in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ("dataTransfer" in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewVeg({ ...newVeg, imageUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (veg: Vegetable) => {
    setEditingId(veg.id);
    setNewVeg({
      name: veg.name,
      price: veg.price.toString(),
      description: veg.description,
      imageUrl: veg.imageUrl
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewVeg({ name: "", price: "", description: "", imageUrl: "" });
  };

  const handleDeleteVegetable = (veg: Vegetable) => {
    setVegToDelete(veg);
  };

  const filteredVegetables = vegetables.filter((veg) =>
    veg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-xl">
              <ShoppingBasket className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">VeggieCatalog</h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => { closeModal(); setIsModalOpen(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Vegetable
            </button>
            <div className="relative flex-1 max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vegetables..."
                className="w-full bg-gray-100 border-none rounded-2xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Harvesting fresh data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl text-center">
            <p className="font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-4xl font-serif font-medium mb-2">Fresh Produce</h2>
              <p className="text-gray-500 italic">Sourced directly from organic farms worldwide.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredVegetables.map((veg) => (
                  <motion.div
                    layout
                    key={veg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-black/5"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={veg.imageUrl}
                        alt={veg.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-center">
                          <span className="text-emerald-700 font-bold text-sm">₹{veg.price}</span>
                          <span className="text-gray-400 text-xs ml-1">/ kg</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(veg); }}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit vegetable"
                            aria-label="Edit vegetable"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteVegetable(veg); }}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete vegetable"
                            aria-label="Delete vegetable"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-3">{veg.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                        {veg.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Info className="w-4 h-4" />
                          <span className="text-xs font-medium">Details</span>
                        </div>
                        <button className="bg-[#5A5A40] hover:bg-[#4a4a35] text-white px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Add to Box
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* MODALS (Add/Edit and Delete Confirmation) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl">
              <div className="flex justify-between mb-8">
                <h2 className="text-2xl font-semibold">{editingId ? 'Edit Vegetable' : 'Add New Vegetable'}</h2>
                <button onClick={closeModal} title="Close modal" aria-label="Close modal"><X className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleAddVegetable} className="space-y-6">
                <div onClick={() => fileInputRef.current?.click()} className="aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden">
                  {newVeg.imageUrl ? <img src={newVeg.imageUrl} className="w-full h-full object-cover" /> : <Upload className="text-emerald-600" />}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Name" className="bg-gray-50 p-4 rounded-2xl outline-none" value={newVeg.name} onChange={(e) => setNewVeg({ ...newVeg, name: e.target.value })} />
                  <input required type="number" placeholder="Price" className="bg-gray-50 p-4 rounded-2xl outline-none" value={newVeg.price} onChange={(e) => setNewVeg({ ...newVeg, price: e.target.value })} />
                </div>
                <textarea rows={3} placeholder="Description" className="w-full bg-gray-50 p-4 rounded-2xl outline-none resize-none" value={newVeg.description} onChange={(e) => setNewVeg({ ...newVeg, description: e.target.value })} />
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                  {editingId ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {vegToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setVegToDelete(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[32px] p-8 text-center shadow-2xl">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 className="text-red-600" /></div>
              <h2 className="text-2xl font-semibold mb-2">Remove Vegetable?</h2>
              <p className="text-gray-500 mb-8">Are you sure you want to remove "{vegToDelete.name}"?</p>
              <div className="flex gap-4">
                <button onClick={() => setVegToDelete(null)} className="flex-1 py-4 rounded-2xl font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20">Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}