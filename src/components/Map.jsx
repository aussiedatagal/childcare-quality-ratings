import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import 'leaflet/dist/leaflet.css';
import ReactDOMServer from 'react-dom/server';
import ServiceCard from './ServiceCard';
import Legend from './Legend';
import { getRatingIcon } from '../utils/helpers';

// Fix for default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Map = ({ services, keys, defs, onBoundsChange, selectedService, onServiceSelect }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const popupCacheRef = useRef({});
  const ignoreNextMoveRef = useRef(false);
  const popupOpenRef = useRef(false);
  const lastBoundsRef = useRef(null);
  const lastZoomRef = useRef(null);
  const [mapState, setMapState] = useState({ zoom: 4, bounds: [[-44, 113], [-10, 154]] }); // Default Australia bounds

  const onBoundsChangeRef = useRef(onBoundsChange);
  const onServiceSelectRef = useRef(onServiceSelect);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);
  useEffect(() => {
    onServiceSelectRef.current = onServiceSelect;
  }, [onServiceSelect]);

  // Memoize service key generation to avoid recalculation
  const serviceKeys = useMemo(() => {
    return services.map(service => service.name + service.address);
  }, [services]);

  // Memoize popup content generation
  const generatePopupContent = useCallback((service) => {
    const cacheKey = service.name + service.address;
    if (!popupCacheRef.current[cacheKey]) {
      popupCacheRef.current[cacheKey] = ReactDOMServer.renderToString(
        <ServiceCard service={service} keys={keys} defs={defs} isPopup={true} />
      );
    }
    return popupCacheRef.current[cacheKey];
  }, [keys, defs]);

  // Initialize map - runs ONLY ONCE
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      
      let mapInitialized = false; // Flag to prevent multiple initializations
      
      // Try to get user's location, fallback to Australia center
      const initializeMap = (lat = -25.2744, lng = 133.7751, zoom = 4) => {
        // Prevent multiple initializations
        if (mapInitialized || mapInstance.current) {
          return;
        }
        
        // Double-check that the ref is still available
        if (!mapRef.current) {
          console.error("Map.jsx: Map container not found during initialization");
          return;
        }
        
        mapInitialized = true;
        mapInstance.current = L.map(mapRef.current).setView([lat, lng], zoom);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance.current);


        // Set up event listeners after map is created
      const handleMapChange = () => {
        if (mapInstance.current && !ignoreNextMoveRef.current) {
          const bounds = mapInstance.current.getBounds();
          const zoom = mapInstance.current.getZoom();
          
          // FIX: Pass a simple, serializable array instead of the complex Leaflet object
          const boundsArray = [
            [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
            [bounds.getNorthEast().lat, bounds.getNorthEast().lng]
          ];
          
          // Check if bounds or zoom have changed significantly
          const lastBounds = lastBoundsRef.current;
          const lastZoom = lastZoomRef.current;
          const boundsChanged = !lastBounds || 
              Math.abs(boundsArray[0][0] - lastBounds[0][0]) > 0.001 ||
              Math.abs(boundsArray[0][1] - lastBounds[0][1]) > 0.001 ||
              Math.abs(boundsArray[1][0] - lastBounds[1][0]) > 0.001 ||
              Math.abs(boundsArray[1][1] - lastBounds[1][1]) > 0.001;
          const zoomChanged = lastZoom === null || Math.abs(zoom - lastZoom) > 0.1;
          
          if (boundsChanged || zoomChanged) {
            lastBoundsRef.current = boundsArray;
            lastZoomRef.current = zoom;
            
            if (boundsChanged) {
              onBoundsChangeRef.current(boundsArray);
            }
            
            // Update map state to trigger marker updates
            setMapState({ zoom, bounds: boundsArray });
          }
        }
        ignoreNextMoveRef.current = false;
      };

      mapInstance.current.on('moveend', handleMapChange);
      mapInstance.current.on('zoomend', handleMapChange);
        // Track popup lifecycle and clear selection on close
        mapInstance.current.on('popupopen', () => { popupOpenRef.current = true; });
        mapInstance.current.on('popupclose', () => {
          popupOpenRef.current = false;
          try { onServiceSelectRef.current && onServiceSelectRef.current(null); } catch {}
        });
      handleMapChange();
      };

      // Initialize map with default location (no automatic geolocation to avoid browser violations)
      initializeMap(); // Use default Australia location
    }

    return () => {
      if (mapInstance.current) {
        // Clean up event listeners
        if (mapInstance.current._cleanup) {
          mapInstance.current._cleanup();
        }
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Build supercluster index whenever services change (points only)
  const clusterIndexRef = useRef(null);
  useEffect(() => {
    if (!services || services.length === 0) {
      clusterIndexRef.current = null;
      return;
    }
    const points = services
      .filter(s => s.latitude != null && s.longitude != null)
      .map((s) => ({
        type: 'Feature',
        properties: { serviceKey: s.name + s.address },
        geometry: { type: 'Point', coordinates: [
          typeof s.longitude === 'string' ? parseFloat(s.longitude) : s.longitude,
          typeof s.latitude === 'string' ? parseFloat(s.latitude) : s.latitude,
        ] },
      }));

    const index = new Supercluster({ radius: 100, maxZoom: 13, minPoints: 30 });
    index.load(points);
    clusterIndexRef.current = index;
  }, [services]);

  // Update markers when services change - optimized to only update what's necessary
  useEffect(() => {
    if (mapInstance.current) {
      // If a popup is open, we can still update markers but need to be careful
      // about clearing existing markers that might have the popup open
      
      const currentMarkerKeys = Object.keys(markersRef.current);
      const newServiceKeys = new Set(serviceKeys);
      
      
      // Remove markers that are no longer needed (defensive checks)
      currentMarkerKeys.forEach(key => {
        if (!newServiceKeys.has(key)) {
          const marker = markersRef.current[key];
          if (marker && typeof marker.remove === 'function') {
            marker.remove();
          }
          delete markersRef.current[key];
          delete popupCacheRef.current[key];
        }
      });
      
      if (clusterIndexRef.current) {
        // Use mapState if available, otherwise fall back to direct map calls
        let bounds, zoom;
        if (mapState.bounds) {
          const [southwest, northeast] = mapState.bounds;
          const [swLat, swLng] = southwest;
          const [neLat, neLng] = northeast;
          bounds = [swLng, swLat, neLng, neLat];
          zoom = mapState.zoom;
        } else {
          const mapBounds = mapInstance.current.getBounds();
          bounds = [mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth()];
          zoom = mapInstance.current.getZoom();
        }
        
        const clusters = clusterIndexRef.current.getClusters(bounds, zoom);

        // When popup is open, be more selective about clearing markers
        if (popupOpenRef.current) {
          // Only remove markers that are no longer in the new clusters
          const newClusterKeys = new Set(clusters.map(feature => {
            const [lng, lat] = feature.geometry.coordinates;
            const isCluster = feature.properties.cluster;
            return isCluster ? `cluster_${feature.properties.cluster_id}` : (feature.properties.serviceKey || `${lat},${lng}`);
          }));
          
          Object.keys(markersRef.current).forEach(key => {
            if (!newClusterKeys.has(key)) {
              const marker = markersRef.current[key];
              if (marker && typeof marker.remove === 'function') {
                marker.remove();
              }
              delete markersRef.current[key];
              delete popupCacheRef.current[key];
            }
          });
        } else {
          // Clear all existing markers when clustering (fast and avoids diff complexity)
          Object.keys(markersRef.current).forEach(key => {
            const marker = markersRef.current[key];
            if (marker && typeof marker.remove === 'function') {
              marker.remove();
            }
            delete markersRef.current[key];
            delete popupCacheRef.current[key];
          });
        }

        clusters.forEach(feature => {
          const [lng, lat] = feature.geometry.coordinates;
          const isCluster = feature.properties.cluster;
          const key = isCluster ? `cluster_${feature.properties.cluster_id}` : (feature.properties.serviceKey || `${lat},${lng}`);
          if (markersRef.current[key]) return;

          let marker;
          if (isCluster) {
            const count = feature.properties.point_count;
            const html = `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:16px;background:#2563eb;color:#fff;font-weight:700;font-size:12px;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${count}</div>`;
            const icon = L.divIcon({ html, className: '', iconSize: [32, 32] });
            marker = L.marker([lat, lng], { icon }).addTo(mapInstance.current);
            marker.on('click', () => {
              const nextZoom = clusterIndexRef.current.getClusterExpansionZoom(feature.properties.cluster_id);
              mapInstance.current.setView([lat, lng], nextZoom);
            });
          } else {
            const service = services.find(s => (s.name + s.address) === feature.properties.serviceKey);
            if (!service) return;
            const icon = getRatingIcon(service.rating, keys, L);
            marker = L.marker([lat, lng], { icon }).addTo(mapInstance.current);
            const popupContent = generatePopupContent(service);
            marker.bindPopup(popupContent, { 
              autoPan: true, 
              autoPanPadding: [20, 100], 
              keepInView: false,
              maxWidth: window.innerWidth < 640 ? 300 : 400, // Smaller popup on mobile
              className: 'mobile-popup'
            });
            marker.on('click', () => {
              ignoreNextMoveRef.current = true; // opening popup will autoPan
              onServiceSelectRef.current(service);
              marker.openPopup();
            });
          }
          markersRef.current[key] = marker;
        });
      } else {
        // Fallback to individual markers
        services.forEach(service => {
          const { latitude: lat, longitude: lng } = service;
          const serviceKey = service.name + service.address;
          if (lat && lng && !markersRef.current[serviceKey]) {
            const icon = getRatingIcon(service.rating, keys, L);
            const marker = L.marker([lat, lng], { icon }).addTo(mapInstance.current);
            const popupContent = generatePopupContent(service);
            marker.bindPopup(popupContent, { 
              autoPan: true, 
              autoPanPadding: [20, 100], 
              keepInView: false,
              maxWidth: window.innerWidth < 640 ? 300 : 400, // Smaller popup on mobile
              className: 'mobile-popup'
            });
            marker.on('click', () => onServiceSelectRef.current(service));
            markersRef.current[serviceKey] = marker;
          }
        });
      }
      
    }
  }, [services, serviceKeys, keys, defs, generatePopupContent, mapState]);

  // Handle selected service from list
  useEffect(() => {
    if (!selectedService || !mapInstance.current) return;

    let attempts = 0;
    const maxAttempts = 10; // ~1s with 100ms cadence
    const tryOpen = () => {
      const key = selectedService.name + selectedService.address;
      const marker = markersRef.current[key];
      if (marker && typeof marker.openPopup === 'function') {
        // Set flag to ignore the next move event that might be triggered by popup opening
        ignoreNextMoveRef.current = true;
        marker.openPopup();
        return; // success
      }
      if (++attempts < maxAttempts) {
        setTimeout(tryOpen, 100);
      }
    };
    tryOpen();
  }, [selectedService]);


  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      <Legend keys={keys} />
    </div>
  );
};

export default Map;

