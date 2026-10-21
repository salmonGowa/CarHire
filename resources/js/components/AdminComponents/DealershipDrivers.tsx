import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import LoadState from "../LoadState";
import BookingStatusPill from "../StatusPill";
import { Search, UserPlus, Star, ChevronLeft, Car, History, IdCard, X, UserRound, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { dateTime, longDate } from "@/lib/format";
import type { Driver, DriverDetail } from "@/types/models";

const EMPTY = { name: "", phone: "", license_class: "B", license_number: "", license_expires_on: "", photo_url: "", license_image_url: "" };

const Avatar = ({ driver, size }: { driver: Pick<Driver, "name" | "photo_url">; size: string }) =>
  driver.photo_url
    ? <img src={driver.photo_url} className={`${size} object-cover border border-slate-100 dark:border-slate-800`} alt={driver.name} />
    : <div className={`${size} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400`}><UserRound className="w-1/2 h-1/2" /></div>;

export default function DealershipDrivers() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"new" | Driver | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useApi<{ data: Driver[] }>("/api/drivers");
  const { data: detail, reload: reloadDetail } = useApi<{ data: DriverDetail }>(selectedId ? `/api/drivers/${selectedId}` : null);
  const selected = selectedId && detail?.data.id === selectedId ? detail.data : null;

  const filteredDrivers = (data?.data ?? []).filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const openForm = (driver: Driver | null) => {
    setErrors({});
    setForm(driver ? {
      name: driver.name, phone: driver.phone, license_class: driver.license_class, license_number: driver.license_number ?? "",
      license_expires_on: driver.license_expires_on ?? "", photo_url: driver.photo_url ?? "", license_image_url: driver.license_image_url ?? "",
    } : EMPTY);
    setModal(driver ?? "new");
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]));
    try {
      if (modal === "new") await api("/api/drivers", { method: "POST", body });
      else if (modal) await api(`/api/drivers/${modal.id}`, { method: "PUT", body: { ...body, is_active: modal.is_active } });
      setModal(null);
      reload();
      if (selectedId) reloadDetail();
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (driver: Driver) => {
    try {
      await api(`/api/drivers/${driver.id}`, { method: "PUT", body: { ...driver, is_active: !driver.is_active } });
      reload();
      reloadDetail();
    } catch (err) {
      window.alert(errorMessage(err));
    }
  };

  return (
    <div className="relative h-full">
      <AnimatePresence mode="wait">
        {!selectedId ? (
          /* ── Main List View ── */
          <motion.div
            key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-6 pb-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Driver Network</h2>
                <p className="text-sm text-slate-500">Chauffeurs for driver-included hires. Assign them on the Contracts page.</p>
              </div>
              <Button className="flex items-center gap-2" onClick={() => openForm(null)}><UserPlus className="w-5 h-5" /> Onboard Driver</Button>
            </div>

            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Search drivers..." aria-label="Search drivers"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-200 outline-none transition-all focus:ring-2 ring-blue-500/20"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <LoadState loading={loading} error={error} onRetry={reload} empty={filteredDrivers.length === 0 && (search ? "No drivers match." : "No drivers yet. Onboard your first one.")}>
                <Table heads={["Driver", "License", "Current Duty", "Rating", "Status"]}>
                  {filteredDrivers.map((d) => (
                    <Tr key={d.id} onClick={() => setSelectedId(d.id)}>
                      <Td label="Driver">
                        <div className="flex items-center gap-3">
                          <Avatar driver={d} size="w-10 h-10 rounded-full" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{d.name}</span>
                            <span className="text-[11px] font-medium text-slate-500">{d.reference} · {d.phone}</span>
                          </div>
                        </div>
                      </Td>
                      <Td label="License">
                        <span className="text-xs font-black text-blue-500">Class {d.license_class}</span>
                        {d.license_expired && <span className="block text-[10px] font-bold text-rose-500">Licence expired</span>}
                      </Td>
                      <Td label="Current Duty">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {d.current_assignment ? d.current_assignment.vehicle : "Standby"}
                        </span>
                        {d.current_assignment && <span className="block text-[11px] text-slate-500">with {d.current_assignment.customer_name}</span>}
                      </Td>
                      <Td label="Rating">
                        {d.average_rating != null
                          ? <div className="flex items-center gap-1 text-amber-500 font-black"><Star className="w-3.5 h-3.5 fill-current" /> {d.average_rating}</div>
                          : <span className="text-xs text-slate-400">No ratings yet</span>}
                        <span className="block text-[10px] text-slate-400">{d.completed_trips} trip{d.completed_trips === 1 ? "" : "s"}</span>
                      </Td>
                      <Td label="Status">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${d.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {d.is_active ? "Active" : "Inactive"}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </Table>
              </LoadState>
            </div>
          </motion.div>
        ) : (
          /* ── Full Profile Drill-Down View ── */
          <motion.div
            key="detail" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="space-y-8 pb-10"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedId(null)} aria-label="Back to drivers" className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Driver Profile{selected ? `: ${selected.name}` : ""}</h2>
            </div>

            {!selected ? <LoadState loading error={null} /> : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Essential Info */}
                <div className="space-y-6">
                  <div className="p-8 rounded-[2.5rem] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-10" />
                    <div className="relative z-10 w-32 h-32 mx-auto mb-4"><Avatar driver={selected} size="w-32 h-32 rounded-3xl border-[6px] border-white dark:border-slate-900 shadow-xl" /></div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">{selected.name}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2">{selected.reference}{selected.joined_on ? ` • Joined ${longDate(selected.joined_on)}` : ""}</p>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{selected.phone}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">License</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">Class {selected.license_class}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button variant="secondary" fullWidth size="sm" onClick={() => openForm(selected)}>Edit</Button>
                      <Button variant={selected.is_active ? "danger" : "success"} fullWidth size="sm" onClick={() => toggleActive(selected)}>{selected.is_active ? "Deactivate" : "Reactivate"}</Button>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Current Assignment</h4>
                    {selected.current_assignment ? (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/[0.03] border border-blue-100 dark:border-blue-500/20">
                        <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"><Car className="w-6 h-6" /></div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{selected.current_assignment.vehicle}</p>
                          <p className="text-[11px] font-bold text-blue-500">Client: {selected.current_assignment.customer_name} · back {dateTime(selected.current_assignment.return_at)}</p>
                        </div>
                      </div>
                    ) : <p className="text-sm text-slate-500">On standby.</p>}
                  </div>
                </div>

                {/* Right Column: History & Docs */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Trips</h4>
                      <History className="w-5 h-5 text-slate-300" />
                    </div>
                    {selected.trips.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No trips yet.</p> : (
                      <Table heads={["Vehicle", "Client", "Pickup", "Date", "Status"]}>
                        {selected.trips.map((t) => (
                          <Tr key={t.id}>
                            <Td className="font-bold text-blue-500">{t.vehicle}</Td>
                            <Td className="font-bold text-slate-700 dark:text-slate-300">{t.customer_name}</Td>
                            <Td className="text-slate-500">{t.pickup_location}</Td>
                            <Td className="text-[11px] font-black uppercase text-slate-400">{longDate(t.pickup_at)}</Td>
                            <Td><BookingStatusPill booking={{ status: t.status, is_overdue: false }} /></Td>
                          </Tr>
                        ))}
                      </Table>
                    )}
                  </div>

                  <div className="p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Driving Licence</h4>
                      {selected.license_expired
                        ? <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase"><AlertTriangle className="w-3.5 h-3.5" /> Expired</span>
                        : selected.license_expires_on && <span className="text-[11px] font-bold text-slate-500">Valid until {longDate(selected.license_expires_on)}</span>}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Number: <span className="font-mono font-bold">{selected.license_number ?? "not recorded"}</span></p>
                    <div className="rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-video flex items-center justify-center">
                      {selected.license_image_url
                        ? <img src={selected.license_image_url} className="w-full h-full object-cover" alt="Licence copy" />
                        : <span className="flex flex-col items-center gap-2 text-sm text-slate-400"><IdCard className="w-10 h-10" /> No licence copy on file</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Onboard / Edit modal ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              role="dialog" aria-modal="true" aria-label={modal === "new" ? "Onboard driver" : "Edit driver"}
              className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{modal === "new" ? "Onboard Driver" : `Edit ${modal.name}`}</h3>
                <button onClick={() => setModal(null)} aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={save} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required error={errors.name} />
                  <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required error={errors.phone} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Licence Class" value={form.license_class} onChange={(e) => setForm({ ...form, license_class: e.target.value })} required error={errors.license_class} />
                  <Input label="Licence No." value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} error={errors.license_number} />
                  <Input label="Expires" type="date" value={form.license_expires_on} onChange={(e) => setForm({ ...form, license_expires_on: e.target.value })} error={errors.license_expires_on} />
                </div>
                <Input label="Photo URL (optional)" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." error={errors.photo_url} />
                <Input label="Licence copy URL (optional)" value={form.license_image_url} onChange={(e) => setForm({ ...form, license_image_url: e.target.value })} placeholder="https://..." error={errors.license_image_url} />
                {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
                <Button fullWidth type="submit" loading={saving}>{modal === "new" ? "Add Driver" : "Save Changes"}</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
