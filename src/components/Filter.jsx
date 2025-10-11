import React, { useState, useEffect, useCallback, memo } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { stripNQS } from '../utils/helpers';

const Filter = memo(({ services, keys, defs, dataRanges, onFilterChange }) => {
  
  // Set initial expanded state - closed by default on all devices
  const [isExpanded, setIsExpanded] = useState(false);

  // Hooks are at the top level. Initialize state directly from props, which are now guaranteed to exist.
  const [overallRatings, setOverallRatings] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [qualityAreaRatings, setQualityAreaRatings] = useState({});
  const [approvedPlaces, setApprovedPlaces] = useState(dataRanges.places);
  const [openHours, setOpenHours] = useState({ min: 900, max: 1500 }); // Default to 9am-3pm
  const [includeUnknownPlaces, setIncludeUnknownPlaces] = useState(true); // Include services with unknown/empty approved places
  const [includeUnknownHours, setIncludeUnknownHours] = useState(true); // Include services with unknown/empty opening hours
  const [includeUnknownRatings, setIncludeUnknownRatings] = useState(true); // Include services with unknown/empty overall ratings
  const [filterByTime, setFilterByTime] = useState(false); // Default to "Any time" (no time filtering)
  const [conditionsFilter, setConditionsFilter] = useState('all'); // 'all', 'with', 'without'
  const [initialized, setInitialized] = useState(false);

  // Initialize default selections
  useEffect(() => {
    if (keys && defs && !initialized) {
      // Set default overall ratings (all available options)
      const defaultOverallRatings = [
        { value: 'E', label: 'Excellent' },
        { value: 'X', label: 'Exceeding' },
        { value: 'M', label: 'Meeting' },
        { value: 'W', label: 'Working Towards' },
        { value: 'S', label: 'Significant Improvement Required' },
        { value: '', label: 'Unknown' }
      ];
      setOverallRatings(defaultOverallRatings);

      // Set default service types (all)
      const defaultServiceTypes = [
        ...Object.entries(keys.types).map(([value, label]) => ({ value, label })),
        { value: '', label: 'Unknown' }
      ];
      setServiceTypes(defaultServiceTypes);

      // Set default quality area ratings (all available options)
      const defaultQARatings = {};
      Object.keys(defs.quality_areas).forEach(qaKey => {
        defaultQARatings[qaKey] = [
          { value: 'X', label: 'Exceeding' },
          { value: 'M', label: 'Meeting' },
          { value: 'W', label: 'Working Towards' },
          { value: 'S', label: 'Significant Improvement Required' },
          { value: '', label: 'Unknown' }
        ];
      });
      setQualityAreaRatings(defaultQARatings);

      // Set default conditions filter to 'all'
      setConditionsFilter('all');

      setInitialized(true);
    }
  }, [keys, defs, initialized]);

  // Sync slider state if dataRanges prop ever changes.
  useEffect(() => {
      setApprovedPlaces(dataRanges.places);
      // Keep default open hours (9am-3pm) instead of using dataRanges.hours
  }, [dataRanges]);


  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // Memoize filter calculations to avoid expensive operations
  const applyFilters = useCallback((filters) => {
    const debouncedFilter = debounce((filterData) => {
    // Pre-calculate values to avoid repeated calculations
    const overallRatingValues = filters.overallRatings.length > 0 
      ? new Set(filters.overallRatings.map(r => r.value))
      : null;
    
    const serviceTypeValues = filters.serviceTypes.length > 0
      ? new Set(filters.serviceTypes.map(t => t.value))
      : null;

    const qualityAreaFilters = Object.entries(filters.qualityAreaRatings)
      .filter(([_, ratings]) => ratings.length > 0)
      .map(([qa, ratings]) => ({
        qa,
        values: new Set(ratings.map(r => r.value))
      }));

    const conditionsFilter = filters.conditionsFilter;

    // Use more efficient filtering with early returns
    const filtered = services.filter(service => {
      // Overall Rating filter - handle unknown ratings as catch-all for any value not in known list
      const knownRatingValues = new Set(['E', 'X', 'M', 'W', 'S']);
      const hasValidRating = service.rating && service.rating.trim() !== '';
      const isKnownRating = hasValidRating && knownRatingValues.has(service.rating);
      
      if (isKnownRating && overallRatingValues && !overallRatingValues.has(service.rating)) {
        return false;
      }
      
      // If rating is unknown (empty/null or not in known list), check if we should include it
      if (!isKnownRating && !filters.includeUnknownRatings) {
        return false;
      }

      // Service Type filter - intersection logic (service must have at least one selected type)
      if (serviceTypeValues && serviceTypeValues.size > 0) {
        // Check if service has at least one matching type
        const hasMatchingType = service.types && service.types.some(type => serviceTypeValues.has(type));
        const hasUnknownSelected = serviceTypeValues.has('');
        const hasNoTypes = !service.types || service.types.length === 0;
        
        
        // Include if: (has matching type) OR (unknown selected AND no types)
        if (!hasMatchingType && !(hasUnknownSelected && hasNoTypes)) {
          return false;
        }
      } else if (serviceTypeValues && serviceTypeValues.size === 0) {
        // If service type filter is empty (nothing selected), return no results
        return false;
      }

      // Approved Places filter - handle empty/null places based on checkbox
      const places = parseInt(service.places, 10);
      const hasValidPlaces = !isNaN(places) && service.places && service.places.toString().trim() !== '';
      
      if (hasValidPlaces && (places < filters.approvedPlaces.min || places > filters.approvedPlaces.max)) {
        return false;
      }
      
      // If places is empty/null/NaN, check if we should include it
      if (!hasValidPlaces && !filters.includeUnknownPlaces) {
        return false;
      }
      
      // Open Hours filter - only apply if time filtering is enabled
      if (filters.filterByTime) {
        const serviceStart = service.start_time ? parseInt(service.start_time.replace(':', ''), 10) : 0;
        const serviceEnd = service.end_time ? parseInt(service.end_time.replace(':', ''), 10) : 2400;
        const hasValidHours = service.start_time && service.end_time && service.start_time.trim() !== '' && service.end_time.trim() !== '';
        
        if (hasValidHours && (serviceStart > filters.openHours.min || serviceEnd < filters.openHours.max)) {
          return false;
        }
        
        // If hours are empty/null, check if we should include it
        if (!hasValidHours && !filters.includeUnknownHours) {
          return false;
        }
      }

      // Quality Areas filter
      for (const { qa, values } of qualityAreaFilters) {
        const qaRating = service[qa];
        const hasValidQARating = qaRating && qaRating.trim() !== '';
        
        if (hasValidQARating && !values.has(qaRating)) {
          return false;
        }
        
        // If rating is empty/null, check if "Unknown" is selected
        if (!hasValidQARating && !values.has('')) {
          return false;
        }
      }

      // Conditions filter
      if (conditionsFilter !== 'all') {
        const hasConditions = service.conditions && service.conditions.trim() !== '' && service.conditions.trim().length > 0;
        if (conditionsFilter === 'with' && !hasConditions) {
          return false;
        }
        if (conditionsFilter === 'without' && hasConditions) {
          return false;
        }
      }

      return true;
    });


      onFilterChange(filtered);
    }, 150);
    
    debouncedFilter(filters);
  }, [services, onFilterChange]); // Reduced debounce time for better responsiveness

  useEffect(() => {
    applyFilters({
      overallRatings,
      serviceTypes,
      qualityAreaRatings,
      approvedPlaces,
      openHours,
      includeUnknownPlaces,
      includeUnknownHours,
      includeUnknownRatings,
      filterByTime,
      conditionsFilter
    });
  }, [overallRatings, serviceTypes, qualityAreaRatings, approvedPlaces, openHours, includeUnknownPlaces, includeUnknownHours, includeUnknownRatings, filterByTime, conditionsFilter, applyFilters]);

  const handleQARatingChange = (qa, selectedOptions) => {
    setQualityAreaRatings(prev => ({ ...prev, [qa]: selectedOptions }));
  };
  
  // Options for multi-select dropdowns. These are now safe to define.
  const ratingOptions = [
    { value: 'E', label: 'Excellent' },
    { value: 'X', label: 'Exceeding' },
    { value: 'M', label: 'Meeting' },
    { value: 'W', label: 'Working Towards' },
    { value: 'S', label: 'Significant Improvement Required' }
  ];
  const qualityAreaRatingOptions = [
    { value: 'X', label: 'Exceeding' },
    { value: 'M', label: 'Meeting' },
    { value: 'W', label: 'Working Towards' },
    { value: 'S', label: 'Significant Improvement Required' },
    { value: '', label: 'Unknown' }
  ];
  const typeOptions = [
    ...Object.entries(keys.types).map(([value, label]) => ({ value, label })),
    { value: '', label: 'Unknown' }
  ];

  // Don't render until initialized to prevent flash
  if (!initialized || !keys || !defs) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">Loading filters...</div>
      </div>
    );
  }

  return (
    <div className={isExpanded ? "bg-white rounded-lg shadow-lg border" : "bg-white rounded-lg shadow-lg border"}>
      <div className="p-3 sm:p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left font-bold text-sm sm:text-lg text-gray-700 flex justify-between items-center py-2"
        >
          Filter Options
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-4 sm:space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
            <div className="space-y-1">
              {ratingOptions.map(option => (
                <label key={option.value} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={overallRatings.some(r => r.value === option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setOverallRatings(prev => [...prev, option]);
                      } else {
                        setOverallRatings(prev => prev.filter(r => r.value !== option.value));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{stripNQS(option.label)}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={includeUnknownRatings}
                  onChange={(e) => setIncludeUnknownRatings(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Unknown
              </label>
            </div>
          </div>

          {/* Quality Areas */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-700">Quality Area Ratings</h3>
            {Object.entries(defs.quality_areas).map(([qaKey, qaDef]) => {
              // Map quality area keys to exact ACECQA URLs
              const qaUrls = {
                'qa1': 'https://www.acecqa.gov.au/national-quality-framework/guide-nqf/section-3-national-quality-standard-and-assessment-and-rating/quality-area-1-educational-program-and-practice',
                'qa2': 'https://www.acecqa.gov.au/national-quality-framework/guide-nqf/section-3-national-quality-standard-and-assessment-and-rating/quality-area-2-childrens-health-and-safety',
                'qa3': 'https://www.acecqa.gov.au/national-quality-framework/guide-nqf/section-3-national-quality-standard-and-assessment-and-rating/quality-area-3-physical-environment',
                'qa4': 'https://www.acecqa.gov.au/national-quality-framework/guide-nqf/section-3-national-quality-standard-and-assessment-and-rating/quality-area-4-staffing-arrangements',
                'qa5': 'https://www.acecqa.gov.au/national-quality-framework/guide-nqf/section-3-national-quality-standard-and-assessment-and-rating/quality-area-5-relationships-children',
                'qa6': 'https://www.acecqa.gov.au/national-quality-framework/guide-nqf/section-3-national-quality-standard-and-assessment-and-rating/quality-area-6-collaborative-partnerships-families-and-communities',
                'qa7': 'https://www.acecqa.gov.au/national-quality-framework/guide-nqf/section-3-national-quality-standard-and-assessment-and-rating/quality-area-7-governance-and-leadership'
              };
              
              return (
                <div key={qaKey}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{qaDef.label}</label>
                  <p className="text-xs text-gray-500 mb-2">
                    {qaDef.description}{' '}
                    <a 
                      href={qaUrls[qaKey]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Learn more
                    </a>
                  </p>
                <div className="space-y-1">
                  {qualityAreaRatingOptions.map(option => (
                    <label key={option.value} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={(qualityAreaRatings[qaKey] || []).some(r => r.value === option.value)}
                        onChange={(e) => {
                          const currentRatings = qualityAreaRatings[qaKey] || [];
                          if (e.target.checked) {
                            handleQARatingChange(qaKey, [...currentRatings, option]);
                          } else {
                            handleQARatingChange(qaKey, currentRatings.filter(r => r.value !== option.value));
                          }
                        }}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{stripNQS(option.label)}</span>
                    </label>
                  ))}
                </div>
              </div>
              );
            })}
          </div>

          {/* Service Type */}
          <h3 className="text-md font-semibold text-gray-700">Other Filters</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <div className="space-y-1">
              {typeOptions.map(option => (
                <label key={option.value} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={serviceTypes.some(t => t.value === option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setServiceTypes(prev => [...prev, option]);
                      } else {
                        setServiceTypes(prev => prev.filter(t => t.value !== option.value));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditions Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Regulatory Conditions</label>
            <p className="text-xs text-gray-500 mb-2">
              Filter by whether services have regulatory conditions imposed
            </p>
            <div className="space-y-1">
              {[
                { value: 'all', label: 'All Services' },
                { value: 'with', label: 'With Conditions' },
                { value: 'without', label: 'Without Conditions' }
              ].map(option => (
                <label key={option.value} className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="conditionsFilter"
                    value={option.value}
                    checked={conditionsFilter === option.value}
                    onChange={(e) => setConditionsFilter(e.target.value)}
                    className="mr-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Approved Places */}
          <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approved Places: {approvedPlaces.min} - {approvedPlaces.max}
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Number of children that can be accommodated
              </p>
              <div className="px-2">
                <Slider
                    range
                    min={dataRanges.places.min}
                    max={dataRanges.places.max}
                    value={[approvedPlaces.min, approvedPlaces.max]}
                    onChange={([min, max]) => setApprovedPlaces({ min, max })}
                    step={5}
                />
              </div>
              <div className="mt-2">
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={includeUnknownPlaces}
                    onChange={(e) => setIncludeUnknownPlaces(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Include services with unknown approved places
                </label>
              </div>
          </div>

          {/* Opening Hours */}
          <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Opening Hours</label>
              <div className="mb-2">
                <label className="flex items-center text-sm text-gray-700 mb-1">
                  <input
                    type="radio"
                    name="timeFilter"
                    checked={!filterByTime}
                    onChange={() => setFilterByTime(false)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Any time
                </label>
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="radio"
                    name="timeFilter"
                    checked={filterByTime}
                    onChange={() => setFilterByTime(true)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {filterByTime 
                    ? `Open during: ${Math.floor(openHours.min / 100).toString().padStart(2, '0')}:${(openHours.min % 100).toString().padStart(2, '0')} - ${Math.floor(openHours.max / 100).toString().padStart(2, '0')}:${(openHours.max % 100).toString().padStart(2, '0')}`
                    : 'Open during specific hours'
                  }
                </label>
              </div>
              
              {filterByTime && (
                <p className="text-xs text-gray-500 mb-2">
                  Must be open for the entire selected time range
                </p>
              )}
              <div className="px-2">
                <Slider
                    range
                    min={dataRanges.hours.min}
                    max={dataRanges.hours.max}
                    value={[openHours.min, openHours.max]}
                    onChange={filterByTime ? ([min, max]) => setOpenHours({ min, max }) : undefined}
                    step={30} // 30 minute increments
                    disabled={!filterByTime}
                />
              </div>
              <div className="mt-2">
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={includeUnknownHours}
                    onChange={(e) => setIncludeUnknownHours(e.target.checked)}
                    disabled={!filterByTime}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  Include services with unknown opening hours
                </label>
              </div>
          </div>
        </div>
      )}
    </div>
  );
});

Filter.displayName = 'Filter';

export default Filter;

