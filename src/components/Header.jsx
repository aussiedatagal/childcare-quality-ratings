import React from 'react';

const Header = ({ isFullscreen, onToggleFullscreen }) => {
  return (
    <header className="bg-white shadow-md px-4 py-2 z-10">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-base sm:text-lg font-bold text-gray-800">Childcare Quality Map</h1>
          <p className="text-xs sm:text-sm text-gray-600">
            A tool for exploring the quality standards ratings for childcare services using data from the <a href="https://www.acecqa.gov.au/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Australian Children's Education & Care Quality Authority (ACECQA)</a>.
          </p>
        </div>
        <button
          onClick={onToggleFullscreen}
          className="ml-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;

