import { useState, useEffect } from 'react';
import { csvParse } from 'd3-dsv';
import Flatbush from 'flatbush';

// Function to convert HH:MM string to a number (e.g., '06:30' -> 630)
const timeToNumber = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
    return parseInt(timeStr.replace(':', ''), 10);
};

export const useData = () => {
  const [data, setData] = useState({
    services: null,
    keys: null,
    defs: null,
    loading: true,
    error: null,
    dataRanges: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesCsvText, keysData, defsData] = await Promise.all([
          fetch('./acecqa_processed_data.csv').then(res => res.text()),
          fetch('./acecqa_key.json').then(res => res.json()),
          fetch('./acecqa_rating_definitions.json').then(res => res.json()),
        ]);
        
        const servicesData = csvParse(servicesCsvText);
        
        // Parse multi-type field into arrays
        servicesData.forEach(service => {
          service.types = (service.type || '').split(';').filter(Boolean);
        });
        
        
        // Calculate min/max ranges for sliders
        const places = servicesData.map(s => parseFloat(s.places)).filter(p => !isNaN(p));
        const startTimes = servicesData.map(s => timeToNumber(s.start_time)).filter(t => t !== null);
        const endTimes = servicesData.map(s => timeToNumber(s.end_time)).filter(t => t !== null);

        const dataRanges = {
            places: {
                min: Math.min(...places),
                max: Math.max(...places),
            },
            hours: {
                min: Math.min(...startTimes),
                max: Math.max(...endTimes),
            }
        };

        // Try to fetch prebuilt spatial index
        let spatialIndex = null;
        try {
          const [binRes, metaRes] = await Promise.all([
            fetch('./services.index.bin'),
            fetch('./services.index.meta.json')
          ]);
          if (binRes.ok && metaRes.ok) {
            const [binBuf, meta] = [await binRes.arrayBuffer(), await metaRes.json()];
            spatialIndex = new Flatbush(meta.count, undefined, undefined, binBuf);
          }
        } catch (err) {
          // Spatial index not available - this is expected and handled gracefully
        }

        setData({
          services: servicesData,
          keys: keysData,
          defs: defsData,
          dataRanges: dataRanges,
          loading: false,
          error: null,
          spatialIndex,
        });

      } catch (e) {
        console.error("useData.js: Failed to fetch or process data.", e);
        setData({
          services: null,
          keys: null,
          defs: null,
          dataRanges: null,
          loading: false,
          error: e.message,
        });
      }
    };

    fetchData();
  }, []);

  return data;
};

