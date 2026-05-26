import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AssignedHouse, PatientResponse } from '../types';
import { HeartPulse, ShieldAlert, Thermometer, MapPin, Info, RefreshCw } from 'lucide-react';

interface LiveAshaMapProps {
  assignedArea: string; // Dynamic assigned area, can be any "Y" locality
  assignedHouses: AssignedHouse[];
  patients: PatientResponse[];
  onSelectHouse: (house: AssignedHouse) => void;
  selectedHouse: AssignedHouse | null;
}

// Local static area registry to avoid unnecessary API roundtrips for common locations
const LOCAL_COORDINATES_REGISTRY: Record<string, [number, number]> = {
  'ullal': [12.8028, 74.8812],
  'derlakatte': [12.8315, 74.9210],
  'deralakatte': [12.8315, 74.9210],
  'someshwara': [12.8034, 74.8454],
  'kotekar': [12.7933, 74.8624],
  'kumpala': [12.8122, 74.8580],
  'mudipu': [12.7937, 74.9754],
  'talapady': [12.7684, 74.8860],
  'konaje': [12.8173, 74.9392],
  'mangalore': [12.8701, 74.8801],
  'mangaluru': [12.8701, 74.8801],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
};

// Nearby Primary Health Centers (PHC) database registry
const PHCS_REGISTRY: { name: string; area: string; coords: [number, number]; phone: string }[] = [
  { name: "Ullal Community Health Centre", area: "ullal", coords: [12.8012, 74.8775], phone: "+91 824 2462222" },
  { name: "Ullal Primary Health Subcenter", area: "ullal", coords: [12.8058, 74.8870], phone: "+91 824 2461111" },
  { name: "Deralakatte Primary Health Center", area: "derlakatte", coords: [12.8335, 74.9265], phone: "+91 824 2471111" },
  { name: "Natekal Primary Health Centre", area: "derlakatte", coords: [12.8250, 74.9120], phone: "+91 824 2472222" },
  { name: "Someshwara Health Subcenter", area: "someshwara", coords: [12.8040, 74.8480], phone: "+91 824 2481111" },
  { name: "Kotekar Primary Health Subcenter", area: "kotekar", coords: [12.7915, 74.8655], phone: "+91 824 2491111" },
  { name: "Kumpala Health Post", area: "kumpala", coords: [12.8140, 74.8595], phone: "+91 824 2501111" },
  { name: "Mudipu Primary Health Centre", area: "mudipu", coords: [12.7925, 74.9730], phone: "+91 824 2511111" },
  { name: "Talapady Primary Health Centre", area: "talapady", coords: [12.7665, 74.8845], phone: "+91 824 2521111" },
  { name: "Konaje Community Health Outpost", area: "konaje", coords: [12.8190, 74.9410], phone: "+91 824 2531111" },
];

export const LiveAshaMap: React.FC<LiveAshaMapProps> = ({
  assignedArea,
  assignedHouses,
  patients,
  onSelectHouse,
  selectedHouse
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);
  const phcLayerRef = useRef<L.LayerGroup | null>(null);

  // Map control options
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [housepinsEnabled, setHousepinsEnabled] = useState(true);
  const [patientMarkersEnabled, setPatientMarkersEnabled] = useState(true);
  const [heatmapType, setHeatmapType] = useState<'all' | 'diabetes' | 'bp' | 'comorbid'>('all');
  const [currentZoom, setCurrentZoom] = useState(15);

  // State to handle dynamic real-world map centering for any arbitrary "Y" locality
  const [mapCenterCoords, setMapCenterCoords] = useState<[number, number]>([12.8028, 74.8812]);
  const [isSearchingCoordinates, setIsSearchingCoordinates] = useState(false);

  // Resolve dynamic center dynamically whenever assignedArea changes
  useEffect(() => {
    if (!assignedArea) return;
    
    let isCurrent = true;
    const cleanArea = assignedArea.trim().toLowerCase();

    // 1. Direct match on local pre-cached registry
    if (LOCAL_COORDINATES_REGISTRY[cleanArea]) {
      setMapCenterCoords(LOCAL_COORDINATES_REGISTRY[cleanArea]);
      return;
    }

    // Substring match on local pre-cached registry
    const matchedKey = Object.keys(LOCAL_COORDINATES_REGISTRY).find(
      k => cleanArea.includes(k) || k.includes(cleanArea)
    );
    if (matchedKey) {
      setMapCenterCoords(LOCAL_COORDINATES_REGISTRY[matchedKey]);
      return;
    }

    // 2. Fallback to live search of any "Y" area using OpenStreetMap Nominatim Client API
    setIsSearchingCoordinates(true);
    const query = `${assignedArea}, Karnataka, India`;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AshaWorkerOutreachDashboard/1.0'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!isCurrent) return;
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapCenterCoords([lat, lon]);
        } else {
          // General lookup fallback
          return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(assignedArea)}&limit=1`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'AshaWorkerOutreachDashboard/1.0'
            }
          })
            .then(res => res.json())
            .then(fallbackData => {
              if (!isCurrent) return;
              if (fallbackData && fallbackData.length > 0) {
                const lat = parseFloat(fallbackData[0].lat);
                const lon = parseFloat(fallbackData[0].lon);
                setMapCenterCoords([lat, lon]);
              }
            });
        }
      })
      .catch((err) => {
        console.warn("OSM Geocoding Fetch Error (using fallback):", err);
      })
      .finally(() => {
        if (isCurrent) {
          setIsSearchingCoordinates(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [assignedArea]);

  const cleanAreaName = assignedArea?.trim().toLowerCase() || 'ullal';

  // STRICT LOCALITY FILTERING LOGIC
  // Filter patients belonging strictly to this ASHA worker's assigned locality
  const localPatients = patients.filter(p => {
    const address = p.address?.toLowerCase() || '';
    const workerArea = p.ashaWorker?.assignedArea?.toLowerCase() || '';
    
    return workerArea.includes(cleanAreaName) || address.includes(cleanAreaName);
  });

  // Filter houses belonging strictly to this active worker's assigned region (for separation)
  const localHouses = assignedHouses.filter(house => {
    const houseArea = (house as any).area?.toLowerCase() || 'ullal';
    return houseArea === cleanAreaName || cleanAreaName.includes(houseArea) || houseArea.includes(cleanAreaName);
  });

  // Convert 0-100 coordinate grid to beautiful real-world latitude and longitude offsets around the resolved area center
  const getGeoCoords = (x: number, y: number): [number, number] => {
    // This maps the 0-100 coordinate grid dynamically to a beautiful 1.5km local neighborhood domain
    const latOffset = (50 - y) * 0.00018; 
    const lngOffset = (x - 50) * 0.00022;
    return [mapCenterCoords[0] + latOffset, mapCenterCoords[1] + lngOffset];
  };

  const onSelectHouseRef = useRef(onSelectHouse);
  useEffect(() => {
    onSelectHouseRef.current = onSelectHouse;
  }, [onSelectHouse]);

  // Select a specific house card in real-time marker list
  const selectHouseMarkerOnMap = (houseId: string) => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.eachLayer((layer: any) => {
      if (layer.options && layer.options.attribution === houseId) {
        layer.openPopup();
      }
    });
  };

  // Fly map to selected house when updated from parent list view on sidebar click
  useEffect(() => {
    if (selectedHouse && mapRef.current) {
      const coords = getGeoCoords(selectedHouse.coords.x, selectedHouse.coords.y);
      mapRef.current.setView(coords, 18, { animate: true, duration: 1 });
      setTimeout(() => {
        selectHouseMarkerOnMap(selectedHouse.id);
      }, 350);
    }
  }, [selectedHouse]);

  // INITIALIZE MAP INSTANCE ONCE ON MOUNT
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create the map focusing on initial coordinate
    const map = L.map(mapContainerRef.current, {
      center: mapCenterCoords,
      zoom: 15,
      zoomControl: true,
      maxZoom: 19,
      minZoom: 11
    });

    mapRef.current = map;

    // Use highly legible, light-weight voyager layer map skin
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Mount dedicated clean Layers
    const markersLayer = L.layerGroup().addTo(map);
    const heatLayer = L.layerGroup().addTo(map);
    const phcLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    heatLayerRef.current = heatLayer;
    phcLayerRef.current = phcLayer;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // SMOOTH VIEW FLYING WHEN CENTER COORDINATES UPDATE
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(mapCenterCoords, 15, { animate: true, duration: 1 });
    }
  }, [mapCenterCoords]);

  // RENDER PHC AND MEDICAL SUBCENTER PLOTS DYNAMICALLY
  useEffect(() => {
    if (!mapRef.current || !phcLayerRef.current) return;

    phcLayerRef.current.clearLayers();

    const activeCleanName = assignedArea?.trim().toLowerCase() || 'ullal';

    PHCS_REGISTRY.forEach((phc) => {
      // Check if subcenter belongs or is relevant to this village outreach
      const matchesArea = phc.area === activeCleanName || activeCleanName.includes(phc.area) || phc.area.includes(activeCleanName);

      if (matchesArea) {
        const phcIcon = L.divIcon({
          className: 'custom-hospital-icon-div',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-12 h-12 bg-blue-600/20 rounded-full animate-ping"></div>
              <div class="relative w-8 h-8 bg-blue-600 rounded-lg border-2 border-white shadow-xl flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        L.marker(phc.coords, { icon: phcIcon })
          .addTo(phcLayerRef.current!)
          .bindPopup(`
            <div class="p-2.5 select-none" style="font-family: sans-serif; min-width: 155px; max-width: 200px;">
              <div class="flex items-center gap-1.5 mb-1 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="shrink-0"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h5.78"/></svg>
                <h4 class="text-[9px] font-black m-0 uppercase tracking-widest leading-none">PRIMARY HEALTH CENTER</h4>
              </div>
              <h5 class="text-xs font-black text-slate-900 m-0 mb-1">${phc.name}</h5>
              <p class="text-[10px] text-slate-500 m-0">Assigned Area: <span class="capitalize font-bold text-slate-700">${phc.area} sector</span></p>
              <p class="text-[10px] text-slate-500 m-0 mb-1.5">Emergency Referrals: <b class="text-blue-600">${phc.phone}</b></p>
              <div class="pt-1 select-none">
                <a href="tel:${phc.phone}" class="block w-full text-center py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[9.5px] font-black tracking-wide transition border border-blue-200" style="text-decoration: none;">📞 Contact PHC</a>
              </div>
            </div>
          `);
      }
    });
  }, [mapCenterCoords, assignedArea]);

  // HANDLE MARKERS DRAWING WHEN PATIENTS OR HOUSES STATE MODIFIES
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !heatLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    heatLayerRef.current.clearLayers();

    // 1. RENDER HEATMAP CLUSTER LAYER
    if (heatmapEnabled) {
      localPatients.forEach((patient) => {
        const nameHash = patient.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const matchedHouse = localHouses.find(h => 
          h.familyHead.toLowerCase().includes(patient.name.toLowerCase().split(' ')[0]) ||
          (patient.address && h.houseNumber.includes(patient.address.replace(/\D/g, '')))
        ) || localHouses[nameHash % localHouses.length];

        if (!matchedHouse) return;

        const coords = getGeoCoords(matchedHouse.coords.x, matchedHouse.coords.y);
        const hasDiabetes = patient.predictions.diabetesRisk === 'high' || patient.hasDiabetesOrHypertension?.toLowerCase().includes('diabetes') || patient.hasDiabetesOrHypertension?.toLowerCase().includes('diab');
        const hasBP = patient.predictions.hypertensionRisk === 'high' || patient.hasDiabetesOrHypertension?.toLowerCase().includes('bp') || patient.hasDiabetesOrHypertension?.toLowerCase().includes('hyper');
        const isComorbid = hasDiabetes && hasBP;

        if (heatmapType === 'diabetes' && !hasDiabetes) return;
        if (heatmapType === 'bp' && !hasBP) return;
        if (heatmapType === 'comorbid' && !isComorbid) return;

        let heatRadius = 140;
        let heatColor = '#10b981'; // Green
        let heatOpacity = 0.15;

        if (patient.riskFactor === 'high') {
          heatRadius = 180;
          heatColor = '#ef4444'; // Red
          heatOpacity = 0.28;
        } else if (patient.riskFactor === 'medium') {
          heatRadius = 150;
          heatColor = '#f97316'; // Orange
          heatOpacity = 0.22;
        }

        L.circle(coords, {
          radius: heatRadius * 1.8,
          stroke: false,
          fillColor: heatColor,
          fillOpacity: heatOpacity * 0.4,
          interactive: false
        }).addTo(heatLayerRef.current!);

        L.circle(coords, {
          radius: heatRadius,
          stroke: false,
          fillColor: heatColor,
          fillOpacity: heatOpacity,
          interactive: false
        }).addTo(heatLayerRef.current!);

        if (isComorbid) {
          L.circle(coords, {
            radius: 65,
            stroke: false,
            fillColor: '#8b5cf6', // Purple
            fillOpacity: 0.35,
            interactive: false
          }).addTo(heatLayerRef.current!);
        }
      });
    }

    // 2. RENDER HOUSEHOLD CLUSTER BOUNDARY PINS
    if (housepinsEnabled) {
      localHouses.forEach((house) => {
        const coords = getGeoCoords(house.coords.x, house.coords.y);
        
        let colorClass = "bg-slate-400 border-slate-650 shadow-slate-400";
        let statusTitle = "Not Screened Yet";
        let pulseClass = "";

        if (house.screeningStatus === 'completed') {
          if (house.riskRatio === 'high') {
            colorClass = "bg-red-500 border-red-650 shadow-red-300";
            statusTitle = "HI-RISK RECORDED";
            pulseClass = "animate-pulse";
          } else if (house.riskRatio === 'medium') {
            colorClass = "bg-orange-500 border-orange-650 shadow-orange-300";
            statusTitle = "ELEVATED ALERT";
          } else {
            colorClass = "bg-green-500 border-green-650 shadow-green-200";
            statusTitle = "HEALTHY NORMAL";
          }
        } else if (house.screeningStatus === 'overdue') {
          colorClass = "bg-slate-600 border-slate-800 shadow-slate-300";
          statusTitle = "OVERDUE SCREENING";
        }

        const isCurrentlySelected = selectedHouse && selectedHouse.id === house.id;
        const borderThickness = isCurrentlySelected ? 'border-[3.5px] border-sky-400 scale-[1.25] z-[1001]' : 'border-[2px] border-white';

        const markerHtml = `
          <div class="relative flex items-center justify-center select-none cursor-pointer">
            ${house.screeningStatus === 'completed' && house.riskRatio === 'high' ? `
              <div class="absolute -top-1.5 -left-1.5 w-9 h-9 rounded-full bg-red-500/30 animate-ping"></div>
            ` : ''}
            <div class="w-6 h-6 rounded-lg text-[9px] text-white flex items-center justify-center font-black shadow-lg transition-transform hover:scale-110 ${colorClass} ${borderThickness} ${pulseClass}">
              ${house.id}
            </div>
          </div>
        `;

        const houseIcon = L.divIcon({
          className: 'custom-household-marker-icon-div',
          html: markerHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker(coords, { 
          icon: houseIcon,
          attribution: house.id
        })
        .addTo(markersLayerRef.current!)
        .bindPopup(`
          <div class="p-2.5 text-slate-800" style="font-family: sans-serif; min-width: 145px; max-width: 200px;">
            <p class="text-[9px] m-0 font-extrabold uppercase text-slate-400 tracking-wider">Household ID: ${house.id}</p>
            <h4 class="text-xs font-black m-0 mb-1 text-slate-800">${house.houseNumber}</h4>
            <p class="text-[11px] m-0 text-slate-600">Family Head: <b>${house.familyHead}</b></p>
            <p class="text-[11px] m-0 text-slate-600 mb-1.5">Occupants: <b>${house.memberCount} members</b></p>
            
            <div class="my-1 py-0.5 px-2 bg-slate-50 border border-slate-100 rounded text-[9.5px] font-black text-center uppercase tracking-wide text-slate-700">
              ${statusTitle}
            </div>
            
            <button 
              id="map-btn-${house.id}" 
              class="w-full mt-2 py-1 px-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] border-0 transition cursor-pointer text-center select-none"
            >
              Select Household Card
            </button>
          </div>
        `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`map-btn-${house.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectHouseRef.current(house);
            };
          }
        });
      });
    }

    // 3. RENDER DYNAMIC RISK LEVEL PATIENT DOTS (RED, ORANGE, GREEN)
    if (patientMarkersEnabled) {
      localPatients.forEach((patient) => {
        const nameHash = patient.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const matchedHouse = localHouses.find(h => 
          h.familyHead.toLowerCase().includes(patient.name.toLowerCase().split(' ')[0]) ||
          (patient.address && h.houseNumber.includes(patient.address.replace(/\D/g, '')))
        ) || localHouses[nameHash % localHouses.length];

        if (!matchedHouse) return;

        const baseCoords = getGeoCoords(matchedHouse.coords.x, matchedHouse.coords.y);
        const offsetLat = ((nameHash % 7) - 3) * 0.00014;
        const offsetLng = (((nameHash * 13) % 7) - 3) * 0.00014;
        const patientCoords: [number, number] = [baseCoords[0] + offsetLat, baseCoords[1] + offsetLng];

        let markerColor = "bg-green-500 border-green-600 shadow-green-200";
        let markerPulse = "";
        let riskLabel = "Low Risk";

        if (patient.riskFactor === 'high') {
          markerColor = "bg-red-500 border-red-650 shadow-red-300";
          markerPulse = "animate-pulse";
          riskLabel = "High Risk";
        } else if (patient.riskFactor === 'medium') {
          markerColor = "bg-orange-500 border-orange-600 shadow-orange-300";
          riskLabel = "Medium Risk";
        }

        const patientIcon = L.divIcon({
          className: 'custom-patient-marker-icon',
          html: `
            <div class="relative flex items-center justify-center select-none cursor-pointer">
              <div class="absolute -top-1.5 -left-1.5 w-8 h-8 rounded-full bg-slate-400/10 ${patient.riskFactor === 'high' ? 'bg-red-500/25 animate-ping' : ''}"></div>
              <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white ${markerColor} ${markerPulse}">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const workerName = patient.ashaWorker?.name || (cleanAreaName.includes('derlakatte') ? 'Shravya' : 'ALIA RAI');
        const patientAddress = patient.address || `${assignedArea} Ward Sector`;
        
        const riskBadgeColor = patient.riskFactor === 'high' 
          ? 'bg-red-50 text-red-700 border-red-200' 
          : patient.riskFactor === 'medium'
          ? 'bg-orange-50 text-orange-700 border-orange-200'
          : 'bg-green-50 text-green-700 border-green-200';

        const popupContent = `
          <div class="p-3 select-none text-slate-800" style="font-family: sans-serif; min-width: 180px; max-width: 220px;">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="w-2 h-2 rounded-full ${patient.riskFactor === 'high' ? 'bg-red-500 animate-pulse' : patient.riskFactor === 'medium' ? 'bg-orange-500' : 'bg-green-500'}"></span>
              <p class="text-[9.5px] m-0 font-extrabold uppercase text-slate-400 tracking-wider">Live Patient Target</p>
            </div>
            <h4 class="text-sm font-black m-0 text-slate-905">${patient.name}</h4>
            <p class="text-[11px] m-0 text-slate-550 mt-1">Age / Sex: <b>${patient.age} / ${patient.gender || 'Male'}</b></p>
            <p class="text-[11px] m-0 text-slate-550 leading-tight">Village Address: <b>${patientAddress}</b></p>
            
            <div class="my-2 py-0.5 px-2 rounded-lg text-[10px] font-black tracking-wider border uppercase text-center ${riskBadgeColor}">
              ${riskLabel} (Score: ${patient.riskScore || 'N/A'})
            </div>
            
            <div class="mt-2 pt-1.5 border-t border-slate-100 flex flex-col gap-0.5">
              <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Outreach Provider Node</span>
              <span class="text-[11px] text-slate-800 font-bold block">${workerName}</span>
            </div>
            
            <button 
              id="map-pat-btn-${patient.id}" 
              class="w-full mt-2.5 py-1 px-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] border-0 transition cursor-pointer text-center select-none"
            >
              Select Household Card
            </button>
          </div>
        `;

        const marker = L.marker(patientCoords, { icon: patientIcon })
          .addTo(markersLayerRef.current!)
          .bindPopup(popupContent);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`map-pat-btn-${patient.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectHouseRef.current(matchedHouse);
            };
          }
        });
      });
    }

  }, [localHouses, localPatients, heatmapEnabled, housepinsEnabled, patientMarkersEnabled, heatmapType, selectedHouse, mapCenterCoords]);

  return (
    <div className="flex flex-col h-full grow min-h-[460px] relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      {/* Dynamic searching banner indicator */}
      {isSearchingCoordinates && (
        <div className="absolute top-3 left-3 z-[1000] bg-sky-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Searching coordinates for {assignedArea}...</span>
        </div>
      )}

      {/* Map Control overlay board */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 shadow-lg flex flex-col gap-3 max-w-xs text-xs select-none">
        
        {/* Layer Toggles */}
        <div className="space-y-1 pb-2 border-b border-slate-100 border-solid">
          <p className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400">Map Visual Layers</p>
          
          <label className="flex items-center gap-2 font-bold text-slate-755 cursor-pointer">
            <input 
              type="checkbox" 
              checked={heatmapEnabled} 
              onChange={(e) => setHeatmapEnabled(e.target.checked)}
              className="accent-slate-800 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-red-500" />
              Thermal Risk Heatmap
            </span>
          </label>

          <label className="flex items-center gap-2 font-bold text-slate-755 cursor-pointer">
            <input 
              type="checkbox" 
              checked={housepinsEnabled} 
              onChange={(e) => setHousepinsEnabled(e.target.checked)}
              className="accent-slate-800 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Household Cluster Pins
            </span>
          </label>

          <label className="flex items-center gap-2 font-bold text-slate-755 cursor-pointer">
            <input 
              type="checkbox" 
              checked={patientMarkersEnabled} 
              onChange={(e) => setPatientMarkersEnabled(e.target.checked)}
              className="accent-slate-800 w-3.5 h-3.5 rounded cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-500 border border-slate-650 flex items-center justify-center text-white text-[8px] font-bold">P</span>
              Live Patient Location Markers
            </span>
          </label>
        </div>

        {/* Heatmap filter selector */}
        {heatmapEnabled && (
          <div className="space-y-1.5">
            <p className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400">Heat Filter Focus</p>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
              <button 
                onClick={() => setHeatmapType('all')}
                className={`py-1 px-1.5 rounded transition text-center ${heatmapType === 'all' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100'}`}
              >
                Overall Risk
              </button>
              <button 
                onClick={() => setHeatmapType('diabetes')}
                className={`py-1 px-1.5 rounded transition text-center ${heatmapType === 'diabetes' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100'}`}
              >
                Diabetics
              </button>
              <button 
                onClick={() => setHeatmapType('bp')}
                className={`py-1 px-1.5 rounded transition text-center ${heatmapType === 'bp' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100'}`}
              >
                Hypertension
              </button>
              <button 
                onClick={() => setHeatmapType('comorbid')}
                className={`py-1 px-1.5 rounded transition text-center ${heatmapType === 'comorbid' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100'}`}
              >
                Co-morbid
              </button>
            </div>
          </div>
        )}

        {/* Stats Summary Panel */}
        <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-150 text-[10px] text-slate-500 font-mono space-y-0.5">
          <p className="flex justify-between font-bold text-slate-700">
            <span>Coverage Center:</span>
            <span className="text-sky-600 uppercase font-bold">{assignedArea}</span>
          </p>
          <p className="flex justify-between">
            <span>Local Households:</span>
            <span className="font-bold text-slate-700 font-sans">{localHouses.length}</span>
          </p>
          <p className="flex justify-between">
            <span>Local Patients:</span>
            <span className="font-bold text-slate-700 font-sans">{localPatients.length}</span>
          </p>
          <p className="flex justify-between">
            <span>Current Zoom Scale:</span>
            <span className="font-bold text-slate-700 font-mono">{currentZoom} / 19</span>
          </p>
        </div>
      </div>

      {/* Map Live Leaflet Stage Container */}
      <div 
         ref={mapContainerRef} 
         id="live-osm-stages" 
         className="w-full flex-1 min-h-[420px] outline-none z-10" 
      />

      {/* Map Legend Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-bold text-slate-600 scale-[0.88] origin-left">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500 block shadow-md shadow-red-300"></span>
            High-Risk Patient / Area
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-orange-500 block shadow-md shadow-orange-300"></span>
            Medium-Risk Patient / Area
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-green-500 block shadow-md shadow-green-250"></span>
            Low-Risk Patient / Area
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-500 flex items-center justify-center text-white text-[8px] font-black shadow-md cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            Patient Dot (Red=High, Orange=Med, Green=Low)
          </span>
          <span className="flex items-center gap-1.5">
            <div className="relative w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-extrabold shadow-md shrink-0">
               +
            </div>
            PHC Health Center
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono tracking-tighter flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          Map restricted to assigned sector: {assignedArea}
        </p>
      </div>
    </div>
  );
};
