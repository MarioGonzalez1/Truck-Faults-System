# Truck Failure Reports Application

A professional Angular web application for displaying detailed truck failure reports. Built with Angular 20, featuring a clean, responsive design with truck specifications, failure modules, and embedded YouTube video guides.

![Application Screenshot](public/Forza%20dorado%20tipo%20foil%20png.png)

## Features

- **Truck Management**: View detailed truck specifications including VIN, engine number, odometer reading, and engine hours
- **Failure Reports**: Comprehensive failure modules with detailed descriptions and repair videos
- **Search & Filter**: Quick search functionality to find trucks by VIN or engine number
- **Video Integration**: Embedded YouTube videos for repair guidance with error handling
- **Responsive Design**: Professional UI that works on desktop and mobile devices
- **Collapsible Modules**: Expandable failure sections for better organization
- **Static Data**: No backend required - all data stored in TypeScript objects

## Technical Stack

- **Angular 20** - Modern standalone components architecture
- **TypeScript** - Type-safe development
- **SCSS** - Professional styling with responsive design
- **Angular Router** - Client-side routing
- **RxJS** - Reactive programming for data management

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── home/              # Welcome page
│   │   ├── truck-list/        # Sidebar truck navigation
│   │   └── truck-details/     # Main truck details view
│   ├── models/
│   │   └── truck.model.ts     # TypeScript interfaces
│   ├── services/
│   │   └── truck.ts           # Data service with static data
│   ├── app.ts                 # Main app component
│   ├── app.html               # App layout template
│   ├── app.scss               # App-wide styles
│   └── app.routes.ts          # Routing configuration
├── styles.scss                # Global styles
└── public/
    └── Forza dorado tipo foil png.png  # Company logo
```

## Getting Started

### Prerequisites

- Node.js (version 18 or later)
- npm (comes with Node.js)

### Installation

1. **Clone or extract the project**
   ```bash
   cd truck-failures
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200/`

The application will automatically reload when you make changes to the source files.

### Building for Production

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory and can be deployed to any web server.

## Usage

### Navigation
- **Sidebar**: Browse all trucks with search functionality
- **Truck Selection**: Click on any truck to view detailed failure reports
- **Home**: Welcome page showing statistics and features

### Truck Details
- View comprehensive truck specifications
- Expand/collapse failure modules
- Watch embedded repair videos
- Navigate back to truck list

### Search
- Search trucks by VIN number
- Search trucks by engine number
- Real-time filtering as you type

## Data Structure

### Truck Interface
```typescript
interface Truck {
  vin: string;              // Vehicle identification number
  engineNumber: string;     // Engine serial number
  odometerReading: number;  // Kilometers driven
  engineHours: number;      // Total engine hours
  failures: FailureModule[]; // Array of failure reports
}
```

### Failure Module Interface
```typescript
interface FailureModule {
  id: string;              // Unique identifier
  title: string;           // Short failure description
  description: string;     // Detailed failure explanation
  youtubeUrls: string[];   // Array of repair video URLs
  isExpanded?: boolean;    // UI state for collapsible content
}
```

## Sample Data

The application includes sample data for 3 trucks with various failure types:
- Engine overheating
- Transmission fluid leaks
- Air brake system malfunctions
- DPF (Diesel Particulate Filter) errors
- Fuel injector problems

## Customization

### Adding New Trucks
Edit `src/app/services/truck.ts` and add new truck objects to the `trucks` array.

### Styling
- Global styles: `src/styles.scss`
- Component styles: Individual `.scss` files in component folders
- Color scheme: Professional blue/gray palette, easily customizable

### Logo
Replace `public/Forza dorado tipo foil png.png` with your company logo.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Commands

- `ng serve` - Development server
- `ng build` - Production build  
- `ng test` - Unit tests
- `ng lint` - Code linting
- `ng generate component <name>` - Generate new component

## Responsive Design

The application is fully responsive with breakpoints:
- Desktop: 1024px and above
- Tablet: 768px - 1023px
- Mobile: Below 768px

## Security Features

- YouTube URL validation
- Safe resource URL handling
- XSS protection through Angular's sanitization

## Performance Optimizations

- Lazy loading of components
- Optimized images and assets
- Efficient change detection
- Minimal bundle size

## Contributing

1. Follow Angular style guide
2. Use TypeScript strict mode
3. Maintain responsive design principles
4. Add proper error handling
5. Include unit tests for new features

## License

This project is licensed under the MIT License.