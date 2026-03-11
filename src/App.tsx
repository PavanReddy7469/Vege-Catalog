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

// THE ABSOLUTE BACKEND URL - Critical for Netlify -> Render communication
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
      setLoading(true);
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error("The farm server is currently unavailable.");
        }
        const data = await response.json();
        setVegetables(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching data.");
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
          description: newVeg.description || "Fresh produce.",
          imageUrl: newVeg.imageUrl
        })
      });

      if (!response.ok) throw new Error("Failed to save changes to the catalog.");
      
      const result = await response.json();
      
      if (editingId) {
        setVegetables(prev => prev.map(v => v.id === editingId ? result : v));
      } else {
        setVegetables(prev => [result, ...prev]);
      }

      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving vegetable");
    }
  };

  // DELETE: Remove vegetable
  const confirmDelete = async () => {
    if (!vegToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${vegToDelete.id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete the item.");
      
      setVegetables(prev => prev.filter(v => v.id !== vegToDelete.id));
      setVegToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting vegetable");
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
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-sans selection:bg-emerald-100">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-600/20"
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
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Waking up the server...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto bg-red-50 border border-red-100 text-red-600 p-8 rounded-[32px] text-center">
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
               <Info className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-sm mb-6 opacity-80">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <div className="mb-12">
              <h2 className="text-5xl font-serif font-medium mb-3 tracking-tight">Fresh Produce</h2>
              <p className="text-gray-500 text-lg">Directly from the farm to your catalog.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredVegetables.map((veg) => (
                  <motion.div
                    layout
                    key={veg.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-black/5"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={veg.imageUrl}
                        alt={veg.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="absolute top-6 right-6 flex flex-col gap-3">
                        <div className="bg-white/95 backdrop-blur shadow-xl px-4 py-2 rounded-2xl text-center">
                          <span className="text-emerald-700 font-bold text-lg">₹{veg.price}</span>
                          <span className="text-gray-400 text-xs ml-1">/kg</span>
                        </div>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(veg); }}
                          className="flex-1 bg-white text-gray-900 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteVegetable(veg); }}
                          className="bg-white/20 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-red-500 transition-colors"
                          aria-label="Delete vegetable"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-8">
                      <h3 className="text-2xl font-semibold mb-3">{veg.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                        {veg.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* MODAL: ADD/EDIT */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-semibold">{editingId ? 'Update Item' : 'New Vegetable'}</h2>
                <button type="button" onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close modal"><X /></button>
              </div>
              
              <form onSubmit={handleAddVegetable} className="space-y-6">
                <div onClick={() => fileInputRef.current?.click()} className="group relative aspect-video border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all overflow-hidden">
                  {newVeg.imageUrl ? (
                    <>
                      <img src={newVeg.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="text-white w-8 h-8" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="bg-emerald-100 p-4 rounded-full mb-3 inline-block">
                        <Upload className="text-emerald-600 w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">Upload Product Image</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase px-1">Name</label>
                    <input required placeholder="Carrot" className="w-full bg-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={newVeg.name} onChange={(e) => setNewVeg({ ...newVeg, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase px-1">Price (₹)</label>
                    <input required type="number" placeholder="40" className="w-full bg-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={newVeg.price} onChange={(e) => setNewVeg({ ...newVeg, price: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase px-1">Description</label>
                  <textarea rows={3} placeholder="Describe the freshness..." className="w-full bg-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none" value={newVeg.description} onChange={(e) => setNewVeg({ ...newVeg, description: e.target.value })} />
                </div>

                <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30 active:scale-95">
                  {editingId ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE */}
      <AnimatePresence>
        {vegToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setVegToDelete(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 text-center shadow-2xl">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-600 w-10 h-10" />
              </div>
              <h2 className="text-3xl font-semibold mb-3">Remove Item?</h2>
              <p className="text-gray-500 mb-10 leading-relaxed">Are you sure you want to remove <span className="font-bold text-gray-900">"{vegToDelete.name}"</span>? This cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => setVegToDelete(null)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}