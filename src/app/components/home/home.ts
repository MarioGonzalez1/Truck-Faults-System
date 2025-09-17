import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TruckService } from '../../services/truck';
import { ProjectService } from '../../services/project';
import { Truck, getManufacturerLogo } from '../../models/truck.model';

interface FailureCategory {
  name: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  totalTrucks = 0;
  totalFailures = 0;
  avgFailuresPerTruck = 0;
  criticalFailures = 0;
  highMileageTrucks = 0;
  highEngineHours = 0;
  maintenanceDue = 0;
  failureCategories: FailureCategory[] = [];
  trucks: Truck[] = [];

  constructor(
    private truckService: TruckService,
    private projectService: ProjectService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get project ID from route and load project
    this.route.params.subscribe(params => {
      const projectId = params['id'];
      if (projectId) {
        this.loadProjectAndTrucks(projectId);
      } else {
        this.loadTrucks();
      }
    });
  }

  private loadProjectAndTrucks(projectId: string) {
    // Load project from localStorage by ID
    const savedProjects = localStorage.getItem('truck-fault-projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const currentProject = projects.find((p: any) => p.id === projectId);
      if (currentProject) {
        this.projectService.setCurrentProject(currentProject);
        this.loadTrucks();
      }
    }
  }

  private loadTrucks() {
    this.truckService.getTrucks().subscribe(trucks => {
      this.trucks = trucks;
      this.calculateStats(trucks);
      this.categorizeFailures(trucks);
    });
  }

  private calculateStats(trucks: Truck[]) {
    this.totalTrucks = trucks.length;
    this.totalFailures = trucks.reduce((total, truck) => total + truck.failures.length, 0);
    this.avgFailuresPerTruck = this.totalTrucks > 0 ? Math.round((this.totalFailures / this.totalTrucks) * 10) / 10 : 0;
    
    this.criticalFailures = trucks.reduce((total, truck) => 
      total + truck.failures.filter(failure => 
        failure.title.toLowerCase().includes('brake') ||
        failure.title.toLowerCase().includes('engine') ||
        failure.title.toLowerCase().includes('overheating')
      ).length, 0
    );

    this.highMileageTrucks = trucks.filter(truck => truck.odometerReading > 200000).length;
    this.highEngineHours = trucks.filter(truck => truck.engineHours > 5000).length;
    this.maintenanceDue = trucks.filter(truck => 
      truck.odometerReading > 150000 || truck.engineHours > 4000
    ).length;
  }

  private categorizeFailures(trucks: Truck[]) {
    const categories: { [key: string]: number } = {};

    trucks.forEach(truck => {
      truck.failures.forEach(failure => {
        const title = failure.title.toLowerCase();
        if (title.includes('engine') || title.includes('overheating') || title.includes('camshaft')) {
          categories['Engine Issues'] = (categories['Engine Issues'] || 0) + 1;
        } else if (title.includes('brake')) {
          categories['Brake System'] = (categories['Brake System'] || 0) + 1;
        } else if (title.includes('transmission') || title.includes('fluid') || title.includes('mainshaft') || title.includes('seal')) {
          categories['Transmission'] = (categories['Transmission'] || 0) + 1;
        } else if (title.includes('exhaust') || title.includes('dpf')) {
          categories['Exhaust System'] = (categories['Exhaust System'] || 0) + 1;
        } else if (title.includes('fuel') || title.includes('injector')) {
          categories['Fuel System'] = (categories['Fuel System'] || 0) + 1;
        } else {
          // Use the actual failure title instead of "Other"
          const categoryName = failure.title;
          categories[categoryName] = (categories[categoryName] || 0) + 1;
        }
      });
    });

    this.failureCategories = Object.entries(categories)
      .map(([name, count]) => ({
        name,
        count,
        percentage: this.totalFailures > 0 ? Math.round((count / this.totalFailures) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Get manufacturer logo path
  getManufacturerLogo(truck: Truck): string {
    return truck.manufacturer ? getManufacturerLogo(truck.manufacturer) : '';
  }

  // Get CSS class for failure category bars
  getBarClass(categoryName: string): string {
    switch (categoryName.toLowerCase()) {
      case 'engine issues':
        return 'bar-critical';
      case 'brake system':
        return 'bar-warning';
      case 'transmission':
        return 'bar-attention';
      case 'exhaust system':
        return 'bar-moderate';
      case 'fuel system':
        return 'bar-info';
      default:
        return 'bar-default';
    }
  }

  // Track by function for performance
  trackByVin(index: number, truck: Truck): string {
    return truck.vin;
  }

  // Distance formatting methods
  getFormattedDistance(truck: Truck): string {
    const reading = truck.odometerReading;
    if (reading >= 1000) {
      return (reading / 1000).toFixed(1) + 'K';
    }
    return reading.toString();
  }

  getDistanceUnit(truck: Truck): string {
    const unit = truck.odometerUnit || 'MILES';
    return unit === 'MILES' ? 'mi' : 'km';
  }
}
