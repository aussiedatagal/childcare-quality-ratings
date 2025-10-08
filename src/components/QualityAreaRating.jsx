import React, { memo } from 'react';

const QualityAreaRating = memo(({ areaNumber, ratingCode, ratingLabel, definition, color }) => {
    
    // Add validation to prevent undefined errors
    if (!definition || !definition.label) {
        console.warn(`QualityAreaRating: Missing definition for QA${areaNumber}`);
        return (
            <div className="text-xs">
                <p>
                    <span className="font-bold">QA{areaNumber}:</span> Unknown Quality Area
                </p>
                <p className="pl-5">
                    <span className="font-semibold" style={{ color: color }}>{ratingLabel || 'Unknown Rating'}</span>
                </p>
            </div>
        );
    }
    
    return (
        <div className="text-xs">
            <p>
                <span className="font-bold">QA{areaNumber}:</span> {definition.label}
            </p>
            <p className="pl-5">
                <span className="font-semibold" style={{ color: color }}>{ratingLabel || 'Unknown Rating'}</span>
            </p>
        </div>
    );
});

QualityAreaRating.displayName = 'QualityAreaRating';

export default QualityAreaRating;

