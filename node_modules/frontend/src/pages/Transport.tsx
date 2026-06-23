import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/useStore';
import { Bus, MapPin, Truck, Layers, Loader, Plus, Sparkles } from 'lucide-react';

const api = 'http://localhost:5000/api';
const today = new Date().toISOString().slice(0, 10);

const Transport = () => {
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';
  const token = localStorage.getItem('scl_token');
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [vehicleForm, setVehicleForm] = useState({ registrationNumber: '', make: '', model: '', capacity: 20, insuranceExpiry: '', fitnessExpiry: '', driverId: '' });
  const [routeForm, setRouteForm] = useState({ name: '', vehicleId: '', driverId: '', stops: [{ sequence: 1, name: '', latitude: '', longitude: '', estimatedTime: '' }] });
  const [allocationForm, setAllocationForm] = useState({ studentId: '', routeId: '', stopId: '' });

  const [gpsForm, setGpsForm] = useState({ vehicleId: '', latitude: '', longitude: '', recordedAt: today });
  const [latestLocation, setLatestLocation] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.1271, 78.6569]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, routesRes, allocationsRes, studentsRes] = await Promise.all([
        fetch(`${api}/transport/vehicles`, { headers }),
        fetch(`${api}/transport/routes`, { headers }),
        fetch(`${api}/transport/allocations`, { headers }),
        fetch(`${api}/school/students`, { headers }),
      ]);
      const [vehiclesData, routesData, allocationsData, studentsData] = await Promise.all([
        vehiclesRes.json(),
        routesRes.json(),
        allocationsRes.json(),
        studentsRes.json(),
      ]);
      if (vehiclesData.success) setVehicles(vehiclesData.data);
      if (routesData.success) setRoutes(routesData.data);
      if (allocationsData.success) setAllocations(allocationsData.data);
      if (studentsData.success) setStudents(studentsData.data);
    } catch (error) {
      console.error(error);
      setMessage('Unable to load transport data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const routeOptions = useMemo(() => routes.map((route) => ({ id: route.id, label: route.name })), [routes]);
  const studentOptions = useMemo(() => students.map((student) => ({ id: student.id, label: `${student.firstName} ${student.lastName}` })), [students]);

  const createVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const payload = { ...vehicleForm, capacity: Number(vehicleForm.capacity), driverId: vehicleForm.driverId || undefined };
    const res = await fetch(`${api}/transport/vehicles`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMessage(data.success ? 'Vehicle created successfully' : data.message || 'Unable to create vehicle');
    if (data.success) {
      setVehicleForm({ registrationNumber: '', make: '', model: '', capacity: 20, insuranceExpiry: '', fitnessExpiry: '', driverId: '' });
      loadData();
    }
  };

  const createRoute = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const payload = {
      ...routeForm,
      vehicleId: routeForm.vehicleId || undefined,
      driverId: routeForm.driverId || undefined,
      stops: routeForm.stops.map((stop) => ({
        sequence: Number(stop.sequence),
        name: stop.name,
        latitude: stop.latitude ? Number(stop.latitude) : undefined,
        longitude: stop.longitude ? Number(stop.longitude) : undefined,
        estimatedTime: stop.estimatedTime,
      })),
    };
    const res = await fetch(`${api}/transport/routes`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMessage(data.success ? 'Route created successfully' : data.message || 'Unable to create route');
    if (data.success) {
      setRouteForm({ name: '', vehicleId: '', driverId: '', stops: [{ sequence: 1, name: '', latitude: '', longitude: '', estimatedTime: '' }] });
      loadData();
    }
  };

  const assignRoute = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const payload = { ...allocationForm, stopId: allocationForm.stopId || undefined };
    const res = await fetch(`${api}/transport/allocations`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMessage(data.success ? 'Student assigned to route' : data.message || 'Unable to assign route');
    if (data.success) loadData();
  };

  const recordGPS = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const res = await fetch(`${api}/transport/gps`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        vehicleId: gpsForm.vehicleId,
        latitude: Number(gpsForm.latitude),
        longitude: Number(gpsForm.longitude),
        recordedAt: gpsForm.recordedAt,
      }),
    });
    const data = await res.json();
    setMessage(data.success ? 'GPS location recorded' : data.message || 'Unable to record location');
    if (data.success) {
      setGpsForm({ ...gpsForm, latitude: '', longitude: '' });
      if (gpsForm.vehicleId) fetchLatestLocation(gpsForm.vehicleId);
    }
  };

  const fetchLatestLocation = async (vehicleId: string) => {
    if (!vehicleId) return;
    try {
      const res = await fetch(`${api}/transport/gps/latest?vehicleId=${vehicleId}`, { headers });
      const data = await res.json();
      if (data.success) setLatestLocation(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (gpsForm.vehicleId) fetchLatestLocation(gpsForm.vehicleId);
  }, [gpsForm.vehicleId]);

  useEffect(() => {
    const firstStop = routes.flatMap((route) => route.stops || []).find((stop: any) => stop.latitude && stop.longitude);
    if (firstStop) {
      setMapCenter([firstStop.latitude, firstStop.longitude]);
    } else if (latestLocation) {
      setMapCenter([latestLocation.latitude, latestLocation.longitude]);
    }
  }, [routes, latestLocation]);

  const selectedRoute = routes.find((route) => route.id === allocationForm.routeId) || routes[0];
  const routeCoordinates = selectedRoute?.stops?.filter((stop: any) => stop.latitude && stop.longitude).map((stop: any) => [stop.latitude, stop.longitude]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Bus className="w-5 h-5 text-sky-400" /> Transport Management
        </h2>
        <p className="text-xs text-slate-500">Bus routes, vehicle records, student allocations, and GPS location tracking.</p>
      </div>

      {message && <div className="glass border border-emerald-500/20 text-emerald-300 text-xs rounded-xl p-3">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={createVehicle} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-400" /> Add Vehicle</h3>
          <input value={vehicleForm.registrationNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, registrationNumber: event.target.value })} placeholder="Reg. Number" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <input value={vehicleForm.make} onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })} placeholder="Make (e.g. Tata, Ashok Leyland)" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <input value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="Model" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <input type="number" value={vehicleForm.capacity} onChange={(event) => setVehicleForm({ ...vehicleForm, capacity: Number(event.target.value) })} placeholder="Capacity" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Save Vehicle</button>
        </form>

        <form onSubmit={createRoute} className="glass p-5 rounded-2xl border border-white/5 space-y-4 xl:col-span-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Layers className="w-4 h-4 text-sky-400" /> Create Route</h3>
          <input value={routeForm.name} onChange={(event) => setRouteForm({ ...routeForm, name: event.target.value })} placeholder="Route name" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <div className="grid grid-cols-2 gap-3">
            <select value={routeForm.vehicleId} onChange={(event) => setRouteForm({ ...routeForm, vehicleId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
              <option value="">Select Vehicle (optional)</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber}</option>)}
            </select>
            <select value={routeForm.driverId} onChange={(event) => setRouteForm({ ...routeForm, driverId: event.target.value })} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
              <option value="">Select Driver (optional)</option>
              {Array.from(new Set(vehicles.map((vehicle) => vehicle.driver))).filter(Boolean).map((driver: any) => <option key={driver.id} value={driver.id}>{driver.firstName} {driver.lastName}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {routeForm.stops.map((stop, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input type="number" value={stop.sequence} onChange={(event) => {
                  const value = Number(event.target.value);
                  setRouteForm((prev) => ({
                    ...prev,
                    stops: prev.stops.map((item, idx) => idx === index ? { ...item, sequence: value } : item),
                  }));
                }} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" placeholder="Seq" required />
                <input value={stop.name} onChange={(event) => {
                  const value = event.target.value;
                  setRouteForm((prev) => ({
                    ...prev,
                    stops: prev.stops.map((item, idx) => idx === index ? { ...item, name: value } : item),
                  }));
                }} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" placeholder="Stop name" required />
                <input value={stop.latitude} onChange={(event) => {
                  const value = event.target.value;
                  setRouteForm((prev) => ({
                    ...prev,
                    stops: prev.stops.map((item, idx) => idx === index ? { ...item, latitude: value } : item),
                  }));
                }} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" placeholder="Latitude" />
                <input value={stop.longitude} onChange={(event) => {
                  const value = event.target.value;
                  setRouteForm((prev) => ({
                    ...prev,
                    stops: prev.stops.map((item, idx) => idx === index ? { ...item, longitude: value } : item),
                  }));
                }} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" placeholder="Longitude" />
                <input value={stop.estimatedTime} onChange={(event) => {
                  const value = event.target.value;
                  setRouteForm((prev) => ({
                    ...prev,
                    stops: prev.stops.map((item, idx) => idx === index ? { ...item, estimatedTime: value } : item),
                  }));
                }} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" placeholder="ETA" />
              </div>
            ))}
          </div>
          <button type="button" className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200" onClick={() => setRouteForm((prev) => ({ ...prev, stops: [...prev.stops, { sequence: prev.stops.length + 1, name: '', latitude: '', longitude: '', estimatedTime: '' }] }))}>
            <Plus className="w-3.5 h-3.5 inline-block mr-1" /> Add Stop
          </button>
          <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Save Route</button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={assignRoute} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /> Route Allocation</h3>
          <select value={allocationForm.studentId} onChange={(event) => setAllocationForm({ ...allocationForm, studentId: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required>
            <option value="">Select Student</option>
            {studentOptions.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
          </select>
          <select value={allocationForm.routeId} onChange={(event) => setAllocationForm({ ...allocationForm, routeId: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required>
            <option value="">Select Route</option>
            {routeOptions.map((route) => <option key={route.id} value={route.id}>{route.label}</option>)}
          </select>
          <input value={allocationForm.stopId} onChange={(event) => setAllocationForm({ ...allocationForm, stopId: event.target.value })} placeholder="Preferred stop ID (optional)" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Assign Student</button>
        </form>

        <form onSubmit={recordGPS} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-sky-400" /> GPS Tracking</h3>
          <select value={gpsForm.vehicleId} onChange={(event) => setGpsForm({ ...gpsForm, vehicleId: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required>
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={gpsForm.latitude} onChange={(event) => setGpsForm({ ...gpsForm, latitude: event.target.value })} placeholder="Latitude" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
            <input type="text" value={gpsForm.longitude} onChange={(event) => setGpsForm({ ...gpsForm, longitude: event.target.value })} placeholder="Longitude" className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          </div>
          <input type="date" value={gpsForm.recordedAt} onChange={(event) => setGpsForm({ ...gpsForm, recordedAt: event.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Record Location</button>
          {latestLocation && (
            <div className="glass p-4 rounded-2xl border border-white/5 text-xs text-slate-300">
              <p className="font-semibold text-white">Latest GPS point</p>
              <p>Latitude: {latestLocation.latitude}</p>
              <p>Longitude: {latestLocation.longitude}</p>
              <p>At: {new Date(latestLocation.recordedAt).toLocaleString()}</p>
            </div>
          )}
        </form>
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-slate-900 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Routes & Allocations</h3>
            <p className="text-xs text-slate-500">Manage route mapping and see student transport assignments.</p>
          </div>
          <span className="text-[10px] uppercase tracking-[.3em] text-slate-500">Live-ready module</span>
        </div>

        {loading ? <div className="py-16 flex justify-center text-slate-500"><Loader className="w-6 h-6 animate-spin" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/20 text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Route</th><th className="px-5 py-3">Vehicle</th><th className="px-5 py-3">Stops</th><th className="px-5 py-3">Assignments</th></tr></thead>
              <tbody className="divide-y divide-slate-900/60">
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="px-5 py-4 text-white font-semibold">{route.name}</td>
                    <td className="px-5 py-4 text-slate-300">{route.vehicle?.registrationNumber || 'No vehicle'}</td>
                    <td className="px-5 py-4 text-slate-300"><div className="space-y-1">{route.stops?.map((stop: any) => (<div key={stop.id} className="text-[11px] text-slate-400">{stop.sequence}. {stop.name}</div>))}</div></td>
                    <td className="px-5 py-4 text-slate-300">{allocations.filter((allocation) => allocation.routeId === route.id).length} students</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-slate-900 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">GPS Map View</h3>
            <p className="text-xs text-slate-500">Route stops and the latest live vehicle location on a map.</p>
          </div>
          <span className="text-[10px] uppercase tracking-[.3em] text-slate-500">Visualization</span>
        </div>

        <div className="h-[420px]">
          <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {routeCoordinates.length > 0 && (
              <Polyline positions={routeCoordinates as [number, number][]} pathOptions={{ color: brandColor }} />
            )}
            {selectedRoute?.stops?.map((stop: any) => stop.latitude && stop.longitude ? (
              <CircleMarker key={stop.id} center={[stop.latitude, stop.longitude]} radius={6} pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8' }}>
                <Popup>
                  <div className="text-xs text-slate-800">
                    <strong>{stop.name}</strong><br />
                    Seq: {stop.sequence}<br />
                    {stop.estimatedTime ? `ETA: ${stop.estimatedTime}` : 'No ETA'}
                  </div>
                </Popup>
              </CircleMarker>
            ) : null)}
            {latestLocation && (
              <CircleMarker center={[latestLocation.latitude, latestLocation.longitude]} radius={10} pathOptions={{ color: '#f97316', fillColor: '#fb923c' }}>
                <Popup>
                  <div className="text-xs text-slate-800">
                    <strong>Vehicle live location</strong><br />
                    Lat: {latestLocation.latitude}<br />
                    Lon: {latestLocation.longitude}<br />
                    {new Date(latestLocation.recordedAt).toLocaleString()}
                  </div>
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Transport;
