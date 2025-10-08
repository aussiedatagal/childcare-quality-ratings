import React, { memo } from 'react';
import QualityAreaRating from './QualityAreaRating';
import { getRatingColor, getRatingTextColor, stripNQS } from '../utils/helpers';

const ServiceCard = memo(({ service, keys, defs, onServiceSelect, isPopup = false }) => {
  if (!service || !keys || !defs) return null;

  const rating = service.rating || 'N/A';
  const ratingLabel = stripNQS(keys.ratings?.[rating]) || 'Not Available';
  const ratingColor = getRatingColor(rating);
  const ratingTextColor = getRatingTextColor(rating);

  // Generate ACECQA URL from service name
  const generateACECQAUrl = (serviceName) => {
    if (!serviceName) return '#';
    
    // Strip punctuation but preserve hyphens, then replace spaces with hyphens
    const urlSlug = serviceName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove punctuation except hyphens, keep letters, numbers, spaces, and hyphens
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
    
    return `https://www.acecqa.gov.au/resources/national-registers/services/${urlSlug}`;
  };

  // Convert text to title case
  const toTitleCase = (text) => {
    if (!text) return '';
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format address with suburb
  const formatAddress = (address, suburb) => {
    const titleCaseSuburb = toTitleCase(suburb);
    return suburb ? `${address}, ${titleCaseSuburb}` : address;
  };

  const cardClasses = isPopup
    ? 'w-72 sm:w-80 bg-white p-3 sm:p-4 rounded-lg shadow-sm max-h-96 sm:max-h-none overflow-y-auto sm:overflow-visible' // Only scroll on mobile
    : 'bg-white p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow';

  const titleClasses = isPopup
    ? 'text-sm sm:text-lg font-bold text-blue-800' // Responsive title sizing
    : 'text-sm sm:text-lg font-bold text-blue-800';

  return (
    <div
      onClick={!isPopup ? () => onServiceSelect(service) : undefined}
      className={cardClasses}
    >
      <h3 className={titleClasses}>
        <a 
          href={generateACECQAUrl(service.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-800 hover:text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking link
        >
          {service.name}
        </a>
      </h3>
      <div className="text-xs text-gray-500 mt-0.5">{formatAddress(service.address, service.suburb)}</div>
      <div className="mt-1.5 border-t pt-1.5">
        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">Overall Rating</div>
            <span
              className="px-2 py-1 text-xs font-semibold rounded-full text-white"
              style={{ backgroundColor: ratingColor }}
            >
              {ratingLabel}
            </span>
          </div>
          <div className="flex flex-col">
            <div className="text-xs text-gray-500 mb-1">Service Type</div>
            <div className="flex flex-wrap gap-1">
              {service.types && service.types.length > 0 ? (
                service.types.map((type, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {keys.types?.[type] || type}
                  </span>
                ))
              ) : (
                <span className="text-xs font-medium text-gray-800">N/A</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">Approved Places</div>
            <div className="text-xs font-medium text-gray-800">{service.places || 'N/A'}</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">Opening Hours</div>
            <div className="text-xs font-medium text-gray-800">
              {service.start_time && service.end_time 
                ? `${service.start_time} - ${service.end_time}`
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>
      <div className="mt-1.5">
        <h4 className="text-xs font-semibold text-gray-700 mb-0.5">Quality Area Ratings</h4>
        <div className="space-y-0.5">
          {Object.keys(defs.quality_areas || {}).map(qaKey => {
            const rating = service[qaKey];
            const ratingLabel = stripNQS(keys.ratings?.[rating]) || 'Not Available';
            const ratingColor = getRatingColor(rating);
            return (
              <div key={qaKey} className="flex justify-between items-center">
                <div 
                  className="text-xs text-gray-500" 
                  title={defs.quality_areas[qaKey]?.description || ''}
                >
                  {defs.quality_areas[qaKey]?.label || 'Unknown'}
                </div>
                <span
                  className="px-1 py-0.5 text-xs font-semibold rounded text-white"
                  style={{ backgroundColor: ratingColor }}
                >
                  {ratingLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* FIX: Removed redundant button from popup view */}
    </div>
  );
});

ServiceCard.displayName = 'ServiceCard';

export default ServiceCard;

