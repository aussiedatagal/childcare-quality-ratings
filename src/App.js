import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import ServiceList from './components/ServiceList';
import Filter from './components/Filter';
import { useData } from './hooks/useData';

// Hook to detect if screen is large (desktop)
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isDesktop;
};

function App() {
  const { services, keys, defs, dataRanges, loading, error, spatialIndex } = useData();
  const isDesktop = useIsDesktop();
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleBoundsChange = useCallback((newBounds) => {
    setMapBounds(newBounds);
  }, []);

  useEffect(() => {
    if (services) {
      setFilteredServices(services);
    }
  }, [services]);

  const servicesInView = useMemo(() => {
    if (!mapBounds || !Array.isArray(mapBounds) || mapBounds.length !== 2) {
      return [];
    }
    
    if (!Array.isArray(mapBounds[0]) || !Array.isArray(mapBounds[1]) || 
        mapBounds[0].length !== 2 || mapBounds[1].length !== 2) {
      return [];
    }

    try {
      const [southwest, northeast] = mapBounds;
      const [swLat, swLng] = southwest;
      const [neLat, neLng] = northeast;
      
      if (typeof swLat !== 'number' || typeof swLng !== 'number' || 
          typeof neLat !== 'number' || typeof neLng !== 'number' ||
          isNaN(swLat) || isNaN(swLng) || isNaN(neLat) || isNaN(neLng)) {
        return [];
      }

      // If spatial index is available, query it first to get candidates in bbox
      let candidateServices = filteredServices;
      if (spatialIndex) {
        const ids = spatialIndex.search(swLng, swLat, neLng, neLat);
        candidateServices = ids.map(i => filteredServices[i]).filter(Boolean);
      }

      // Performance optimization: limit processing for very large datasets
      const maxServicesToProcess = 10000;
      const servicesToProcess = filteredServices.length > maxServicesToProcess 
        ? filteredServices.slice(0, maxServicesToProcess)
        : filteredServices;
      
      const servicesInBounds = (spatialIndex ? candidateServices : servicesToProcess).filter(service => {
        const { latitude: lat, longitude: lng } = service;
        
        const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
        const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
        
        if (latNum != null && lngNum != null && !isNaN(latNum) && !isNaN(lngNum)) {
          const latInBounds = latNum >= swLat && latNum <= neLat;
          const lngInBounds = lngNum >= swLng && lngNum <= neLng;
          return latInBounds && lngInBounds;
        }
        return false;
      });
      
      return servicesInBounds;
    } catch (e) {
      console.error("App.js: Error in servicesInView calculation:", e);
      return [];
    }
  }, [mapBounds, filteredServices, spatialIndex]);
  
  const handleServiceSelect = useCallback((service) => {
    setSelectedService(service);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  
  if (loading || !services || !keys || !defs || !dataRanges) {
    return <div className="p-4 text-center text-gray-600">Loading data viz...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-center text-red-500">Error loading data: {error.message}</div>;
  }

  return (
    <div className="flex flex-col h-[100dvh] font-sans">
      {!isFullscreen && <Header isFullscreen={isFullscreen} onToggleFullscreen={handleToggleFullscreen} />}
      <div className="flex flex-grow flex-col lg:flex-row overflow-hidden">
        {/* Left sidebar with services list only - hidden on mobile */}
        {isDesktop && !isFullscreen && (
          <div className="w-1/3 xl:w-1/4 flex flex-col bg-gray-50">
            {/* Services list section */}
            <div className="flex-1 p-4 overflow-y-auto">
              <ServiceList 
                services={servicesInView} 
                keys={keys} 
                defs={defs} 
                onServiceSelect={handleServiceSelect}
              />
            </div>
          </div>
        )}
        {/* Map section with overlapping filter */}
        <div className="flex-grow h-64 lg:h-auto relative">
          <Map 
            services={filteredServices} 
            onBoundsChange={handleBoundsChange} 
            keys={keys} 
            defs={defs} 
            selectedService={selectedService}
            onServiceSelect={handleServiceSelect}
          />
          {/* Overlapping filter panel (doesn't block map gestures) */}
          <div 
            className={`absolute top-4 right-4 w-72 sm:w-80 max-w-[calc(100vw-2rem)] overflow-y-auto pointer-events-none ${
              isFullscreen ? 'top-2 right-2' : ''
            }`}
            style={{ zIndex: 1000, bottom: '200px', maxHeight: 'none' }}
          >
            <div className="pointer-events-auto">
              <Filter 
                services={services} 
                keys={keys}
                defs={defs}
                dataRanges={dataRanges}
                onFilterChange={setFilteredServices} 
              />
            </div>
          </div>
          {/* Fullscreen toggle button when in fullscreen mode */}
          {isFullscreen && (
            <button
              onClick={handleToggleFullscreen}
              className="absolute top-2 left-2 p-2 bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md shadow-lg transition-colors z-20"
              title="Exit fullscreen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Compact Attribution Footer */}
      <div className="bg-gray-100 text-xs text-gray-500 px-2 py-1 border-t">
        <div className="flex flex-wrap gap-2 justify-center">
          <span>Data: <a href="https://www.acecqa.gov.au/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ACECQA</a></span>
          <span className="hidden sm:inline">•</span>
          <span>Geo: <a href="https://hub.geoscape.com.au/batch" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Geoscape</a></span>
          <span className="hidden sm:inline">•</span>
          <span>Maps: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OSM</a></span>
        </div>
      </div>
    </div>
  );
}

export default App;

