import React, { useState } from 'react';
import { getRatingColor } from '../utils/helpers';

const Legend = ({ keys }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const ratingOrder = ['E', 'X', 'M', 'W', 'S']; // Define the order for the legend

  return (
    <div className="leaflet-bottom leaflet-right" style={{ bottom: '20px' }}>
      <div className="leaflet-control leaflet-bar bg-white rounded-md shadow-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 text-left font-bold text-xs sm:text-sm text-gray-700 flex justify-between items-center"
        >
          <span>Rating Legend</span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isExpanded && (
          <div className="px-2 pb-2">
            <ul>
              {ratingOrder.map(ratingKey => (
                <li key={ratingKey} className="flex items-center text-xs text-gray-600 mb-1">
                  {ratingKey === 'E' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={getRatingColor(ratingKey)} className="w-3 h-3 sm:w-4 sm:h-4 mr-2">
                       <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" />
                     </svg>
                  ) : (
                    <span
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 inline-block"
                      style={{ backgroundColor: getRatingColor(ratingKey) }}
                    ></span>
                  )}
                  <span className="text-xs">{keys.ratings[ratingKey]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Legend;
