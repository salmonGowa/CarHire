import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card"; // Path to your reusable table components
import Input from "../Input";
import Button from "../Button";
import { 
  Car, Plus, Search, Filter, MoreHorizontal, CheckCircle2, 
  AlertTriangle, Fuel, Gauge, X, Edit2, Trash2, Camera, UploadCloud 
} from "lucide-react";

// --- Mock Data ---
const INITIAL_FLEET = [
  { 
    id: "VEH-001", 
    model: "Toyota Land Cruiser Prado", 
    plate: "KDK 123X", 
    type: "SUV", 
    status: "Available", 
    mileage: "45,200", 
    fuel: "85",
    image: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&q=80&w=400" 
  },
  { 
    id: "VEH-002", 
    model: "Mazda CX-5", 
    plate: "KDH 999Y", 
    type: "SUV", 
    status: "Rented", 
    mileage: "12,800", 
    fuel: "40",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400" 
  },
];

// --- Internal Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/60">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function DealerFleet() {
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // 'add' | 'edit' | 'delete'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  const [formData, setFormData] = useState({ 
    model: "", plate: "", type: "SUV", mileage: "", fuel: "", status: "Available", image: "" 
  });

  // --- Handlers ---
  const handleOpenModal = (type, vehicle = null) => {
    setModalType(type);
    setSelectedVehicle(vehicle);
    if (vehicle) setFormData(vehicle);
    else setFormData({ model: "", plate: "", type: "SUV", mileage: "", fuel: "", status: "Available", image: "" });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (modalType === "add") {
      const newVehicle = { ...formData, id: `VEH-00${fleet.length + 1}` };
      setFleet([...fleet, newVehicle]);
    } else {
      setFleet(fleet.map(v => v.id === selectedVehicle.id ? formData : v));
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    setFleet(fleet.filter(v => v.id !== selectedVehicle.id));
    setIsModalOpen(false);
  };

  const filteredFleet = fleet.filter(v => 
    v.model.toLowerCase().includes(search.toLowerCase()) || 
    v.plate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fleet Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Control and monitor your vehicle assets.</p>
        </div>
        <Button onClick={() => handleOpenModal("add")} className="flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add New Vehicle
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md focus-within:ring-2 ring-blue-500/20 transition-all">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model or plate..." 
            className="bg-transparent outline-none text-sm w-full text-slate-700 dark:text-slate-200" 
          />
        </div>
      </div>

      {/* Fleet Table */}
      <div className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all">
        <Table heads={["Vehicle Details", "Category", "Status", "Maintenance", "Actions"]}>
          {filteredFleet.map((car) => (
            <Tr key={car.id}>
              <Td label="Vehicle Details">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 group">
                    {car.image ? (
                      <img src={car.image} alt={car.model} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400"><Car className="w-6 h-6" /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{car.model}</span>
                    <span className="text-[11px] font-mono font-black text-blue-500 tracking-wider bg-blue-500/5 dark:bg-blue-500/10 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                      {car.plate}
                    </span>
                  </div>
                </div>
              </Td>

              <Td label="Category">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                  {car.type}
                </span>
              </Td>

              <Td label="Status">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  car.status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' :
                  car.status === 'Rented' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' : 
                  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${car.status === 'Available' ? 'bg-emerald-500' : car.status === 'Rented' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                  {car.status}
                </span>
              </Td>

              <Td label="Maintenance">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Gauge className="w-3.5 h-3.5" /> {car.mileage} km
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Fuel className="w-3.5 h-3.5" /> {car.fuel}%
                  </div>
                </div>
              </Td>

              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => handleOpenModal("edit", car)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 rounded-xl transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleOpenModal("delete", car)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </div>

      {/* --- CRUD Modals --- */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalType === 'add' ? "Register New Vehicle" : modalType === 'edit' ? "Update Vehicle Details" : "Remove Vehicle"}
      >
        {modalType === 'delete' ? (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <Trash2 className="w-10 h-10" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">Are you sure you want to remove <span className="font-bold text-slate-900 dark:text-white">{selectedVehicle?.model}</span>? This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button fullWidth className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Delete Asset</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Image Preview / Upload Mock */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors hover:border-blue-500 group">
              {formData.image ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden">
                   <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                   <button type="button" onClick={() => setFormData({...formData, image: ""})} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-rose-500 transition-colors">
                     <X className="w-4 h-4" />
                   </button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Upload vehicle photo</p>
                  <p className="text-xs text-slate-400">Supports JPG, PNG (Max 2MB)</p>
                </div>
              )}
            </div>

            <Input label="Image URL (Demo)" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} placeholder="https://..." />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Model Name" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} placeholder="Toyota Axio" required />
              <Input label="Plate Number" value={formData.plate} onChange={(e) => setFormData({...formData, plate: e.target.value})} placeholder="KDX 123Y" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Vehicle Type</label>
                  <select 
                    value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="SUV">SUV</option>
                    <option value="Compact">Compact</option>
                    <option value="Sedan">Sedan</option>
                  </select>
               </div>
               <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                  <select 
                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="Available">Available</option>
                    <option value="Rented">Rented</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
              <Button variant="secondary" fullWidth type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button fullWidth type="submit">{modalType === 'add' ? "Register Asset" : "Update Asset"}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}