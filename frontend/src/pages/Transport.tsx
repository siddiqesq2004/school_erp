import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/useStore';
import { SearchableSelect } from '../components/SearchableSelect';
import { Bus, MapPin, Truck, Layers, Loader, Plus, Sparkles, UserPlus, Trash2, Edit2 } from 'lucide-react';

const api = 'http://localhost:5000/api';
const today = new Date().toISOString().slice(0, 10);

const Transport = () => {
  const MapBounds = ({ positions }: { positions: [number, number][] }) => {
    const map = useMap();
    useEffect(() => {
      if (positions && positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [positions, map]);
    return null;
  };
  const { school } = useStore();
  const brandColor = school?.themeColor || '#3b82f6';
  const token = localStorage.getItem('scl_token');
  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [vehicleForm, setVehicleForm] = useState({ registrationNumber: '', make: '', model: '', capacity: 20, insuranceExpiry: '', fitnessExpiry: '', driverId: '' });
  const [driverForm, setDriverForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [routeForm, setRouteForm] = useState<any>({ name: '', vehicleId: '', driverId: '', stops: [{ sequence: 1, name: '', address: '', latitude: '', longitude: '', estimatedTime: '' }] });
  const [allocationForm, setAllocationForm] = useState({ studentId: '', routeId: '', stopId: '' });

  const [gpsForm, setGpsForm] = useState({ vehicleId: '', latitude: '', longitude: '', recordedAt: today });
  const [latestLocation, setLatestLocation] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.1271, 78.6569]);
  
  const [routeSearch, setRouteSearch] = useState('');
  const [mapRouteId, setMapRouteId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, routesRes, allocationsRes, studentsRes, staffRes] = await Promise.all([
        fetch(`${api}/transport/vehicles`, { headers }),
        fetch(`${api}/transport/routes`, { headers }),
        fetch(`${api}/transport/allocations`, { headers }),
        fetch(`${api}/school/students`, { headers }),
        fetch(`${api}/school/staff`, { headers }),
      ]);
      const [vehiclesData, routesData, allocationsData, studentsData, staffData] = await Promise.all([
        vehiclesRes.json(),
        routesRes.json(),
        allocationsRes.json(),
        studentsRes.json(),
        staffRes.json(),
      ]);
      if (vehiclesData.success) setVehicles(vehiclesData.data);
      if (routesData.success) setRoutes(routesData.data);
      if (allocationsData.success) setAllocations(allocationsData.data);
      if (studentsData.success) setStudents(studentsData.data);
      if (staffData.success) setDrivers(staffData.data.filter((s: any) => s.designation?.toLowerCase() === 'driver' || s.employeeCode?.startsWith('DRV')));
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
  const driverOptions = useMemo(() => drivers.map((driver) => ({ id: driver.id, label: `${driver.firstName} ${driver.lastName} (${driver.employeeCode})` })), [drivers]);

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

  const createDriver = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const payload = {
      role: 'STAFF',
      employeeCode: `DRV${Date.now()}`,
      username: `drv_${driverForm.firstName.toLowerCase()}_${Date.now().toString().slice(-4)}`,
      password: 'password123',
      firstName: driverForm.firstName,
      lastName: driverForm.lastName,
      designation: 'Driver',
      phone: driverForm.phone,
    };
    const res = await fetch(`${api}/school/staff`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMessage(data.success ? 'Driver created successfully' : data.message || 'Unable to create driver');
    if (data.success) {
      setDriverForm({ firstName: '', lastName: '', phone: '' });
      loadData();
    }
  };

  const createRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.name || routeForm.stops.length === 0) {
      setMessage('Route name and stops are required');
      return;
    }
    try {
      const payload = {
        ...routeForm,
        vehicleId: routeForm.vehicleId || undefined,
        driverId: routeForm.driverId || undefined,
        stops: routeForm.stops.map(({ address, ...stop }) => ({
          sequence: Number(stop.sequence),
          name: stop.name,
          latitude: stop.latitude ? Number(stop.latitude) : undefined,
          longitude: stop.longitude ? Number(stop.longitude) : undefined,
          estimatedTime: stop.estimatedTime,
        })),
      };
      const isEditing = !!routeForm.id;
      const url = isEditing ? `${api}/transport/routes/${routeForm.id}` : `${api}/transport/routes`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setMessage(data.success ? `Route ${isEditing ? 'updated' : 'created'} successfully` : data.message || `Unable to ${isEditing ? 'update' : 'create'} route`);
      if (data.success) {
        setRouteForm({ name: '', vehicleId: '', driverId: '', stops: [{ sequence: 1, name: '', address: '', latitude: '', longitude: '', estimatedTime: '' }] });
        loadData();
      }
    } catch (err) {
      setMessage('Error creating route');
    }
  };

  const editRoute = (route: any) => {
    setRouteForm({
      id: route.id,
      name: route.name,
      vehicleId: route.vehicleId || '',
      driverId: route.driverId || '',
      stops: route.stops && route.stops.length > 0 ? route.stops : [{ sequence: 1, name: '', address: '', latitude: '', longitude: '', estimatedTime: '' }],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const deleteRoute = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      const res = await fetch(`${api}/transport/routes/${id}`, { method: 'DELETE', headers: jsonHeaders });
      const data = await res.json();
      if (data.success) loadData();
      else alert(data.message || 'Error deleting route');
    } catch (err) {
      alert('Error deleting route');
    }
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

  const selectedRoute = routes.find((route) => route.id === mapRouteId) || routes.find((route) => route.id === allocationForm.routeId) || routes[0];
  const isFormActive = routeForm.stops.some((s: any) => s.latitude && s.longitude) || routeForm.name;
  const mapDisplayRoute = isFormActive ? { ...routeForm, id: 'form' } : selectedRoute;

  const routeCoordinates = mapDisplayRoute?.stops?.filter((stop: any) => stop.latitude && stop.longitude).map((stop: any) => [stop.latitude, stop.longitude]) || [];

  const [roadCoordinates, setRoadCoordinates] = useState<[number, number][]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!mapDisplayRoute?.stops) return setRoadCoordinates([]);
      
      const validStops = mapDisplayRoute.stops.filter((s: any) => s.latitude && s.longitude).sort((a: any, b: any) => a.sequence - b.sequence);
      if (validStops.length < 2) return setRoadCoordinates([]);
      
      const coordinatesString = validStops.map((s: any) => `${s.longitude},${s.latitude}`).join(';');
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates;
          setRoadCoordinates(coords.map((c: any) => [c[1], c[0]]));
        } else {
          setRoadCoordinates([]);
        }
      } catch (err) {
        setRoadCoordinates([]);
      }
    };
    fetchRoute();
  }, [mapDisplayRoute]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Bus className="w-5 h-5 text-sky-400" /> Transport Management
        </h2>
        <p className="text-xs text-slate-500">Bus routes, vehicle records, student allocations, and GPS location tracking.</p>
      </div>

      {message && <div className="glass border border-emerald-500/20 text-emerald-300 text-xs rounded-xl p-3">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <form onSubmit={createVehicle} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-400" /> Add Vehicle</h3>
          <input value={vehicleForm.registrationNumber} onChange={(event) => setVehicleForm({ ...vehicleForm, registrationNumber: event.target.value })} placeholder="Reg. Number" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <input value={vehicleForm.make} onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })} placeholder="Make (e.g. Tata, Ashok Leyland)" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <input value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="Model" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
          <input type="number" value={vehicleForm.capacity} onChange={(event) => setVehicleForm({ ...vehicleForm, capacity: Number(event.target.value) })} placeholder="Capacity" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Save Vehicle</button>
        </form>

        <form onSubmit={createDriver} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-purple-400" /> Add Driver</h3>
          <input value={driverForm.firstName} onChange={(event) => setDriverForm({ ...driverForm, firstName: event.target.value })} placeholder="First Name" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <input value={driverForm.lastName} onChange={(event) => setDriverForm({ ...driverForm, lastName: event.target.value })} placeholder="Last Name" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <input type="tel" pattern="[0-9]{10}" maxLength={10} minLength={10} title="10-digit Phone Number" value={driverForm.phone} onChange={(event) => setDriverForm({ ...driverForm, phone: event.target.value.replace(/\D/g, '') })} placeholder="10-digit Phone Number" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>Save Driver</button>
        </form>

        <form onSubmit={createRoute} className="glass p-5 rounded-2xl border border-white/5 space-y-4 xl:col-span-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-400" /> {routeForm.id ? 'Edit Route' : 'Create Route'}</h3>
          <input value={routeForm.name} onChange={(event) => setRouteForm({ ...routeForm, name: event.target.value })} placeholder="Route Name" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" required />
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect
              options={vehicles.map(v => ({ id: v.id, label: v.registrationNumber }))}
              value={routeForm.vehicleId}
              onChange={(val) => setRouteForm({ ...routeForm, vehicleId: val })}
              placeholder="Select Vehicle (optional)"
              className="w-full"
            />
            <SearchableSelect
              options={driverOptions}
              value={routeForm.driverId}
              onChange={(val) => setRouteForm({ ...routeForm, driverId: val })}
              placeholder="Select Driver (optional)"
              className="w-full"
            />
          </div>
          <div className="space-y-3">
            {routeForm.stops.map((stop, index) => (
              <div key={index} className="space-y-2 p-3 bg-slate-900/30 border border-white/5 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                  <div className="flex gap-2 col-span-2">
                    <input value={stop.address || ''} onChange={(event) => {
                      const value = event.target.value;
                      setRouteForm((prev) => ({
                        ...prev,
                        stops: prev.stops.map((item, idx) => idx === index ? { ...item, address: value } : item),
                      }));
                    }} className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" placeholder="Address (State, District, Area)" />
                    <button type="button" onClick={async () => {
                      if (!stop.address && !stop.name) return alert('Enter stop name or address first');
                      try {
                        const query = `${stop.name ? stop.name + ', ' : ''}${stop.address || ''}`;
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                        const data = await res.json();
                        if (data && data.length > 0) {
                          setRouteForm((prev) => ({
                            ...prev,
                            stops: prev.stops.map((item, idx) => idx === index ? { ...item, latitude: data[0].lat, longitude: data[0].lon } : item),
                          }));
                          setMessage('Coordinates found!');
                        } else {
                          alert('Address not found');
                        }
                      } catch(err) {
                        alert('Geocoding failed');
                      }
                    }} className="px-3 py-2 bg-sky-500/20 text-sky-400 rounded-xl text-xs font-bold hover:bg-sky-500/30 whitespace-nowrap">Get GPS</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  }} className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" placeholder="ETA (e.g. 08:00 AM)" />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200" onClick={() => setRouteForm((prev) => ({ ...prev, stops: [...prev.stops, { sequence: prev.stops.length + 1, name: '', address: '', latitude: '', longitude: '', estimatedTime: '' }] }))}>
            <Plus className="w-3.5 h-3.5 inline-block mr-1" /> Add Stop
          </button>
          <div className="flex gap-3">
            {routeForm.id && (
              <button type="button" onClick={() => setRouteForm({ name: '', vehicleId: '', driverId: '', stops: [{ sequence: 1, name: '', address: '', latitude: '', longitude: '', estimatedTime: '' }] })} className="w-1/3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800">Cancel</button>
            )}
            <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: brandColor }}>{routeForm.id ? 'Update Route' : 'Save Route'}</button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={assignRoute} className="glass p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /> Route Allocation</h3>
          <SearchableSelect
            options={studentOptions}
            value={allocationForm.studentId}
            onChange={(val) => setAllocationForm({ ...allocationForm, studentId: val })}
            placeholder="Select Student"
            className="w-full"
          />
          <SearchableSelect
            options={routeOptions}
            value={allocationForm.routeId}
            onChange={(val) => setAllocationForm({ ...allocationForm, routeId: val })}
            placeholder="Select Route"
            className="w-full"
          />
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
          <div className="space-y-4">
            <div className="px-5">
              <input 
                type="text" 
                placeholder="Search routes by name or vehicle..." 
                value={routeSearch} 
                onChange={(e) => setRouteSearch(e.target.value)} 
                className="w-full max-w-sm px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 focus:outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/20 text-slate-500 uppercase text-[10px]"><tr><th className="px-5 py-3">Route</th><th className="px-5 py-3">Vehicle</th><th className="px-5 py-3">Stops</th><th className="px-5 py-3">Assignments</th><th className="px-5 py-3">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-900/60">
                  {routes.filter((route) => 
                    route.name.toLowerCase().includes(routeSearch.toLowerCase()) || 
                    (route.vehicle?.registrationNumber || '').toLowerCase().includes(routeSearch.toLowerCase())
                  ).map((route) => (
                    <tr 
                      key={route.id} 
                      onClick={() => setMapRouteId(route.id)}
                      className={`cursor-pointer transition-colors ${mapRouteId === route.id || (!mapRouteId && selectedRoute?.id === route.id) ? 'bg-sky-500/10 hover:bg-sky-500/20' : 'hover:bg-slate-900/40'}`}
                    >
                      <td className="px-5 py-4 text-white font-semibold">{route.name}</td>
                      <td className="px-5 py-4 text-slate-300">{route.vehicle?.registrationNumber || 'No vehicle'}</td>
                      <td className="px-5 py-4 text-slate-300"><div className="space-y-1">{route.stops?.map((stop: any) => (<div key={stop.id} className="text-[11px] text-slate-400">{stop.sequence}. {stop.name}</div>))}</div></td>
                      <td className="px-5 py-4 text-slate-300">{allocations.filter((allocation) => allocation.routeId === route.id).length} students</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); editRoute(route); }} className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center hover:bg-sky-500/20 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteRoute(route.id); }} className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <MapBounds positions={(roadCoordinates.length > 0 ? roadCoordinates : routeCoordinates) as [number, number][]} />
            {(roadCoordinates.length > 0 || routeCoordinates.length > 0) && (
              <Polyline positions={(roadCoordinates.length > 0 ? roadCoordinates : routeCoordinates) as [number, number][]} pathOptions={{ color: brandColor, weight: 5, opacity: 0.7 }} />
            )}
            {mapDisplayRoute?.stops?.map((stop: any, idx: number) => stop.latitude && stop.longitude ? (
              <CircleMarker key={stop.id || idx} center={[stop.latitude, stop.longitude]} radius={6} pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8' }}>
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
