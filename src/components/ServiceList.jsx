import React, { useState, useEffect, useCallback, memo } from 'react';
import ServiceCard from './ServiceCard';

const ServiceList = memo(({ services, keys, defs, onServiceSelect }) => {
  const [visibleCount, setVisibleCount] = useState(20); // Start with 20 items
  const itemsPerLoad = 20; // Load 20 more items each time
  
  const visibleServices = services.slice(0, visibleCount);

  // Reset visible count when services change
  useEffect(() => {
    setVisibleCount(20);
  }, [services.length]);

  // Load more items when scrolling near bottom
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
    
    if (isNearBottom && visibleCount < services.length) {
      setVisibleCount(prev => Math.min(prev + itemsPerLoad, services.length));
    }
  }, [visibleCount, services.length, itemsPerLoad]);

  if (services.length === 0) {
    return <div className="text-center text-gray-500 mt-4">No services in current map view.</div>;
  }
  
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-sm sm:text-lg font-bold mb-2 text-gray-700 flex-shrink-0">
        Services in View ({services.length})
        {visibleCount < services.length && (
          <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2">
            (Showing {visibleCount} of {services.length})
          </span>
        )}
      </h2>
      
      <div 
        className="space-y-2 flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {visibleServices.map(service => (
          <ServiceCard
            key={service.name + service.address} // More unique key
            service={service}
            keys={keys}
            defs={defs}
            onServiceSelect={onServiceSelect}
          />
        ))}
        
        {visibleCount < services.length && (
          <div className="text-center text-gray-500 py-2">
            Scroll down to load more services...
          </div>
        )}
      </div>
    </div>
  );
});

ServiceList.displayName = 'ServiceList';

export default ServiceList;

