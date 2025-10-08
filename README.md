# Childcare Quality Rating Map

A data visualization web application that displays Australian childcare service quality ratings on an interactive map. Built with React and Leaflet, this tool helps parents and caregivers find and compare childcare services based on their National Quality Standard (NQS) ratings.

![Childcare Quality Rating Map](screenshot.png)

## Features

- **Interactive Map**: Browse childcare services across Australia with clustering for better performance
- **Quality Rating Visualization**: Color-coded markers showing NQS ratings (Excellent, Exceeding, Meeting, Working Towards, etc.)
- **Advanced Filtering**: Filter services by rating, service type, state, and other criteria
- **Service Details**: Click on any service to view detailed information including quality area ratings
- **Responsive Design**: Works on desktop and mobile devices
- **Performance Optimized**: Uses spatial indexing and clustering for smooth interaction with large datasets

## Data Sources

- **Childcare Data**: [Australian Children's Education and Care Quality Authority (ACECQA)](https://www.acecqa.gov.au/)
- **Geocoding Services**: [Geoscape Australia](https://hub.geoscape.com.au/batch)
- **Map Tiles**: [OpenStreetMap](https://www.openstreetmap.org/)

## Technology Stack

### Core Framework
- **React 18.2.0** - UI framework
- **React DOM 18.2.0** - DOM rendering

### Mapping & Visualization
- **Leaflet 1.9.4** - Interactive maps
- **Supercluster 8.0.1** - Point clustering for performance
- **D3-DSV 2.0.0** - Data parsing utilities

### UI Components
- **React Select 5.8.0** - Dropdown components
- **RC Slider 10.5.0** - Range sliders
- **Tailwind CSS 3.4.1** - Styling framework

### Development Tools
- **React Scripts 5.0.1** - Build tooling
- **Flatbush 4.0.0** - Spatial indexing
- **Testing Library** - Testing utilities

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd daycare-mapper-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Project Structure

```
src/
├── components/          # React components
│   ├── Filter.jsx      # Filtering interface
│   ├── Header.jsx      # App header
│   ├── Legend.jsx      # Map legend
│   ├── Map.jsx         # Main map component
│   ├── ServiceCard.jsx # Service detail cards
│   └── ServiceList.jsx # Service list view
├── hooks/
│   └── useData.js      # Data loading hook
├── utils/
│   └── helpers.js      # Utility functions
├── App.js              # Main app component
└── index.js            # App entry point

data_processing/         # Data processing scripts
├── acecqa_process.py   # Data processing pipeline
└── *.csv              # Raw and processed data files

public/                 # Static assets
├── *.csv              # Processed data files
└── *.json             # Configuration files
```

## Data Processing

The application uses processed data from ACECQA. The data processing pipeline:

1. **Raw Data**: ACECQA service export CSV
2. **Geocoding**: Addresses are geocoded using Geoscape Australia's batch service
3. **Processing**: Python script (`acecqa_process.py`) cleans and structures the data
4. **Spatial Index**: Build script creates spatial index for performance

To reprocess data:
```bash
cd data_processing
python acecqa_process.py
cd ..
npm run build-spatial-index
```

## Usage

### Filtering Services
- Use the filter panel to narrow down services by:
  - Overall quality rating
  - Service type (Long Day Care, Family Day Care, etc.)
  - State/territory
  - Quality area ratings
  - Capacity range

### Map Interaction
- **Zoom**: Use mouse wheel or zoom controls
- **Pan**: Click and drag to move around
- **Clusters**: Click on cluster markers to zoom in
- **Service Details**: Click on individual service markers to view details

### Mobile Usage
- On mobile devices, the service list is hidden by default
- Use the fullscreen toggle to maximize map view
- Tap markers to view service information

## Performance Considerations

- **Spatial Indexing**: Uses Flatbush for efficient spatial queries
- **Clustering**: Supercluster groups nearby services to reduce marker count
- **Lazy Loading**: Popup content is cached and generated on demand
- **Viewport Culling**: Only renders services visible in current map bounds

## Attribution

This application uses data and services from multiple sources:

- **Childcare Data**: Source: Australian Children's Education and Care Quality Authority (ACECQA)
- **Geocoding**: Geocoding services provided by Geoscape Australia
- **Map Data**: © OpenStreetMap contributors

For detailed attributions of all third-party libraries used, see [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

For information about data licensing and usage terms, see [DATA_LICENSE.md](DATA_LICENSE.md).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ACECQA for providing comprehensive childcare quality data
- Geoscape Australia for geocoding services
- OpenStreetMap contributors for map data
- The React and Leaflet communities for excellent libraries

## Support

For questions or issues, please open an issue on GitHub or contact the maintainers.
