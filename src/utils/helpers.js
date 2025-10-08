export const getRatingColor = (rating) => {
    switch (rating) {
        case 'E': // Excellent
        case 'X': // Exceeding
            return '#34D399'; // Green-400
        case 'M': // Meeting
            return '#60A5FA'; // Blue-400
        case 'W': // Working Towards
            return '#FBBF24'; // Amber-400
        case 'S': // Significant Improvement Required
            return '#F87171'; // Red-400
        default:
            return '#9CA3AF'; // Gray-400
    }
};

export const getRatingTextColor = (rating) => {
    // This is a placeholder for if you need text colors that contrast with the background
    return '#FFFFFF';
};

// Helper function to strip "NQS" from rating labels
export const stripNQS = (label) => {
    if (!label) return label;
    return label.replace(/\s+NQS\s*$/i, '').trim();
};

// NEW FUNCTION to create map icons
export const getRatingIcon = (rating, keys, L) => {
    const color = getRatingColor(rating);
    const isExcellent = rating === 'E';

    // SVG for the star icon
    const starSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24px" height="24px" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
    `;
    
    // HTML for the standard dot icon
    const dotHtml = `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></div>`;

    return L.divIcon({
        html: isExcellent ? starSvg : dotHtml,
        className: 'custom-map-icon', // An empty class name is needed
        iconSize: isExcellent ? [24, 24] : [20, 20],
        iconAnchor: isExcellent ? [12, 24] : [10, 10],
        popupAnchor: isExcellent ? [0, -24] : [0, -10]
    });
};

