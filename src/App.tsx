import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingBasket, Info, Tag, Plus, Upload, X, Image as ImageIcon, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Vegetable {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}

export default function App() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVeg, setNewVeg] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: ""
  });
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [vegToDelete, setVegToDelete] = useState<Vegetable | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchVegetables = async () => {
      try {
        const response = await fetch("https://vege-catalog.onrender.com/api/vegetables");
        if (!response.ok) {
          throw new Error("Failed to fetch vegetables");
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

  const filteredVegetables = vegetables.filter((veg) =>
    veg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleAddVegetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVeg.name || !newVeg.price || !newVeg.imageUrl) return;

    try {
      const url = editingId ? `/api/vegetables/${editingId}` : "/api/vegetables";
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

  const handleDeleteVegetable = (veg: Vegetable) => {
    setVegToDelete(veg);
  };

  const confirmDelete = async () => {
    if (!vegToDelete) return;

    try {
      const response = await fetch(`/api/vegetables/${vegToDelete.id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete vegetable");
      
      setVegetables(prev => prev.filter(v => v.id !== vegToDelete.id));
      setVegToDelete(null);
    } catch (err) {
      console.error(err);
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
        {/* Mobile Search */}
        <div className="mt-4 relative md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search vegetables..."
            className="w-full bg-gray-100 border-none rounded-2xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(veg); }}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-blue-600 hover:bg-blue-50 transition-colors pointer-events-auto"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteVegetable(veg); }}
                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-red-600 hover:bg-red-50 transition-colors pointer-events-auto"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold">{veg.name}</h3>
                      </div>
                      
                      <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                        {veg.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Info className="w-4 h-4" />
                          <span className="text-xs font-medium">Details</span>
                        </div>
                        <button 
                          title="Add vegetable to shopping box"
                          className="bg-[#5A5A40] hover:bg-[#4a4a35] text-white px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Tag className="w-4 h-4" />
                          Add to Box
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredVegetables.length === 0 && (
              <div className="text-center py-20">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-gray-400 w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">No vegetables found</h3>
                <p className="text-gray-500">Try searching for something else, like "Carrot" or "Kale".</p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-400">
          <p>© 2026 VeggieCatalog. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>

      {/* Add Vegetable Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold">{editingId ? 'Edit Vegetable' : 'Add New Vegetable'}</h2>
                  <button 
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Close modal"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleAddVegetable} className="space-y-6">
                  <div className="space-y-4">
                    {/* Image Upload Area */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleImageUpload(e); }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 overflow-hidden
                        ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'}
                        ${newVeg.imageUrl ? 'border-none' : ''}`}
                    >
                      {newVeg.imageUrl ? (
                        <>
                          <img src={newVeg.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-medium flex items-center gap-2">
                              <Upload className="w-5 h-5" /> Change Image
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-emerald-100 p-4 rounded-full">
                            <Upload className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-700">Click or drag image here</p>
                            <p className="text-sm text-gray-400">Supports JPG, PNG, WEBP</p>
                          </div>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden" 
                        accept="image/*"
                        title="Upload vegetable image"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Name</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Purple Carrot"
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                          value={newVeg.name}
                          onChange={(e) => setNewVeg({ ...newVeg, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Price (₹/kg)</label>
                        <input
                          required
                          type="number"
                          placeholder="0.00"
                          className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                          value={newVeg.price}
                          onChange={(e) => setNewVeg({ ...newVeg, price: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Description</label>
                      <textarea
                        placeholder="Tell us about this vegetable..."
                        rows={3}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                        value={newVeg.description}
                        onChange={(e) => setNewVeg({ ...newVeg, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!newVeg.name || !newVeg.price || !newVeg.imageUrl}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-600/20"
                  >
                    {editingId ? 'Save Changes' : 'Add to Catalog'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {vegToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVegToDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                
                <h2 className="text-2xl font-semibold mb-2">Remove Vegetable?</h2>
                <p className="text-gray-500 mb-8">
                  Are you sure you want to remove <span className="font-semibold text-gray-900">"{vegToDelete.name}"</span> from the catalog? This action cannot be undone.
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setVegToDelete(null)}
                    className="flex-1 px-6 py-3.5 rounded-2xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3.5 rounded-2xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
