import { useState, type FormEvent, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { VEHICLE_STATUS_LABEL, ksh } from "@/lib/format";
import type { Paginated, Vehicle, VehicleStatus } from "@/types/models";
import LoadState from "../LoadState";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card"; // Path to your reusable table components
import Input from "../Input";
import Button from "../Button";
import { Car, Plus, Search, Fuel, Gauge, X, Edit2, Trash2 } from "lucide-react";

const TYPES = ["SUV", "Sedan", "Compact", "Luxury", "Van", "Pickup"];

interface VehicleForm {
  model: string;
  plate: string;
  type: string;
  year: string;
  seats: string;
  transmission: Vehicle["transmission"];
  fuel_type: Vehicle["fuel_type"];
  daily_rate: string;
  mileage: string;
  fuel_level: string;
  status: VehicleStatus;
  location: string;
  image_url: string;
}

const EMPTY_FORM: VehicleForm = {
  model: "", plate: "", type: "SUV", year: "", seats: "5", transmission: "auto", fuel_type: "petrol",
  daily_rate: "", mileage: "", fuel_level: "100", status: "available", location: "", image_url: "",
};

const toForm = (v: Vehicle): VehicleForm => ({
  model: v.model, plate: v.plate, type: v.type, year: v.year ? String(v.year) : "", seats: String(v.seats),
  transmission: v.transmission, fuel_type: v.fuel_type, daily_rate: String(v.daily_rate), mileage: String(v.mileage),
  fuel_level: String(v.fuel_level), status: v.status, location: v.location ?? "", image_url: v.image_url ?? "",
});

const toPayload = (f: VehicleForm) => ({
  ...f,
  year: f.year ? Number(f.year) : null,
  seats: Number(f.seats),
  daily_rate: Number(f.daily_rate),
  mileage: f.mileage ? Number(f.mileage) : 0,
  fuel_level: f.fuel_level ? Number(f.fuel_level) : 100,
  location: f.location || null,
  image_url: f.image_url || null,
});

const selectClass = "w-full h-11 bg-white dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all";
const selectLabel = "text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block";

// --- Internal Modal Component ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: ReactNode; children?: ReactNode }) => (
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
  const [search, setSearch] = useState("");
  const { data, setData, loading, error, reload } = useApi<Paginated<Vehicle>>("/api/vehicles?per_page=100");
  const fleet = data?.data ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete">("add");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState("");

  const set = (k: keyof VehicleForm) => (e: { target: { value: string } }) => setFormData((f) => ({ ...f, [k]: e.target.value }));

  // --- Handlers ---
  const handleOpenModal = (type: "add" | "edit" | "delete", vehicle: Vehicle | null = null) => {
    setModalType(type);
    setSelectedVehicle(vehicle);
    setFormData(vehicle ? toForm(vehicle) : EMPTY_FORM);
    setFormErrors({});
    setFormMessage("");
    setIsModalOpen(true);
  };

  const replaceInList = (updater: (list: Vehicle[]) => Vehicle[]) =>
    setData((d) => (d ? { ...d, data: updater(d.data) } : d));

  const fail = (err: unknown) => {
    if (err instanceof ApiError) {
      setFormErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
      setFormMessage(Object.keys(err.errors).length ? "" : err.message);
    } else {
      setFormMessage("Couldn't reach the server. Please try again.");
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalType === "add") {
        const { data: created } = await api<{ data: Vehicle }>("/api/vehicles", { method: "POST", body: toPayload(formData) });
        replaceInList((list) => [created, ...list]);
      } else if (selectedVehicle) {
        const { data: updated } = await api<{ data: Vehicle }>(`/api/vehicles/${selectedVehicle.id}`, { method: "PUT", body: toPayload(formData) });
        replaceInList((list) => list.map((v) => (v.id === updated.id ? updated : v)));
      }
      setIsModalOpen(false);
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    setSaving(true);
    try {
      await api(`/api/vehicles/${selectedVehicle.id}`, { method: "DELETE" });
      replaceInList((list) => list.filter((v) => v.id !== selectedVehicle.id));
      setIsModalOpen(false);
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
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
        <LoadState loading={loading} error={error} onRetry={reload} empty={filteredFleet.length === 0 && (search ? "No vehicles match your search." : "No vehicles yet. Add your first one.")}>
        <Table heads={["Vehicle Details", "Category", "Status", "Maintenance", "Actions"]}>
          {filteredFleet.map((car) => (
            <Tr key={car.id}>
              <Td label="Vehicle Details">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 group">
                    {car.image_url ? (
                      <img src={car.image_url} alt={car.model} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
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
                  car.status === 'available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' :
                  car.status === 'rented' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' :
                  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${car.status === 'available' ? 'bg-emerald-500' : car.status === 'rented' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                  {VEHICLE_STATUS_LABEL[car.status]}
                </span>
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5">{ksh(car.daily_rate)}/day</span>
              </Td>

              <Td label="Maintenance">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Gauge className="w-3.5 h-3.5" /> {car.mileage.toLocaleString()} km
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Fuel className="w-3.5 h-3.5" /> {car.fuel_level}%
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
        </LoadState>
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
            <p className="text-slate-600 dark:text-slate-400">Remove <span className="font-bold text-slate-900 dark:text-white">{selectedVehicle?.model} ({selectedVehicle?.plate})</span> from your fleet? Its past bookings are kept.</p>
            {formMessage && <p className="text-sm text-rose-600 dark:text-rose-400">{formMessage}</p>}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button fullWidth className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete} loading={saving}>Delete Asset</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {formData.image_url && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden">
                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFormData({ ...formData, image_url: "" })} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-rose-500 transition-colors" aria-label="Remove image">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Input label="Image URL" value={formData.image_url} onChange={set("image_url")} placeholder="https://..." error={formErrors.image_url} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Model Name" value={formData.model} onChange={set("model")} placeholder="Toyota Axio" required error={formErrors.model} />
              <Input label="Plate Number" value={formData.plate} onChange={set("plate")} placeholder="KDX 123Y" required error={formErrors.plate} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={selectLabel}>Vehicle Type</label>
                <select value={formData.type} onChange={set("type")} className={selectClass}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={selectLabel}>Status</label>
                <select value={formData.status} onChange={set("status")} className={selectClass}>
                  {(Object.keys(VEHICLE_STATUS_LABEL) as VehicleStatus[]).map((s) => <option key={s} value={s}>{VEHICLE_STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Daily Rate (KSh)" type="number" min={100} value={formData.daily_rate} onChange={set("daily_rate")} placeholder="4500" required error={formErrors.daily_rate} />
              <Input label="Seats" type="number" min={1} value={formData.seats} onChange={set("seats")} required error={formErrors.seats} />
              <Input label="Year" type="number" min={1990} value={formData.year} onChange={set("year")} placeholder="2021" error={formErrors.year} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={selectLabel}>Transmission</label>
                <select value={formData.transmission} onChange={set("transmission")} className={selectClass}>
                  <option value="auto">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className={selectLabel}>Fuel</label>
                <select value={formData.fuel_type} onChange={set("fuel_type")} className={selectClass}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Mileage (km)" type="number" min={0} value={formData.mileage} onChange={set("mileage")} error={formErrors.mileage} />
              <Input label="Fuel Level (%)" type="number" min={0} max={100} value={formData.fuel_level} onChange={set("fuel_level")} error={formErrors.fuel_level} />
              <Input label="Location" value={formData.location} onChange={set("location")} placeholder="Nairobi" error={formErrors.location} />
            </div>

            {formMessage && <p className="text-sm text-rose-600 dark:text-rose-400">{formMessage}</p>}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex gap-3">
              <Button variant="secondary" fullWidth type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button fullWidth type="submit" loading={saving}>{modalType === 'add' ? "Register Asset" : "Update Asset"}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}