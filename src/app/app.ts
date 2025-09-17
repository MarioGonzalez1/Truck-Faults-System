import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TruckListComponent } from './components/truck-list/truck-list';
import { TruckFormComponent } from './components/truck-form/truck-form';
import { TruckService } from './services/truck';
import { Truck, DistanceUnit } from './models/truck.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TruckListComponent, TruckFormComponent, FormsModule, CommonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  title = 'Fleet Management System';
  isCollapsed = false;
  searchTerm: string = '';
  showSettingsPanel = false;
  showForm = false;
  editingTruck: any = null;
  isEditMode = false;
  trucks: any[] = [];
  filteredTrucks: any[] = [];
  manageTruckSearchTerm: string = '';
  showFullInterface = false;
  isGeneralProblemView = false;
  currentProject: any = null;

  constructor(private router: Router, private truckService: TruckService) {
    // Listen to route changes to show/hide interface
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showFullInterface = event.url.startsWith('/project/') || event.url.startsWith('/general-problem/');
      this.isGeneralProblemView = event.url.startsWith('/general-problem/');

      // Load current project if we're in project view
      if (this.showFullInterface) {
        this.loadCurrentProject();
      }
    });
  }
  
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
  
  goToDashboard() {
    if (this.currentProject) {
      this.router.navigate(['/project', this.currentProject.id]);
    }
  }

  goToProjects() {
    this.router.navigate(['/']);
  }
  
  toggleSettingsPanel() {
    this.showSettingsPanel = !this.showSettingsPanel;
    if (this.showSettingsPanel) {
      this.loadTrucks(); // Refresh trucks when opening settings
    }
  }
  
  closeSettingsPanel() {
    this.showSettingsPanel = false;
  }
  
  ngOnInit() {
    this.loadTrucks();
    // Check initial route
    this.showFullInterface = this.router.url.startsWith('/project/') || this.router.url.startsWith('/general-problem/');
    this.isGeneralProblemView = this.router.url.startsWith('/general-problem/');
    if (this.showFullInterface) {
      this.loadCurrentProject();
    }
  }

  loadCurrentProject() {
    const projectData = localStorage.getItem('current-project');
    if (projectData) {
      this.currentProject = JSON.parse(projectData);
      this.title = this.currentProject.title;
    }
  }

  loadTrucks() {
    this.truckService.getTrucks().subscribe(trucks => {
      this.trucks = trucks;
      this.filteredTrucks = trucks;
    });
  }

  addTruck() {
    this.editingTruck = null;
    this.isEditMode = false;
    this.showForm = true;
    this.closeSettingsPanel();
  }

  onSaveTruck(truckData: any) {
    try {
      if (this.isEditMode && this.editingTruck) {
        this.truckService.updateTruck(this.editingTruck.vin, truckData).subscribe(() => {
          this.loadTrucks();
          this.closeForm();
        });
      } else {
        this.truckService.addTruck(truckData).subscribe(() => {
          this.loadTrucks();
          this.closeForm();
        });
      }
    } catch (error: any) {
      alert('Error saving truck: ' + error.message);
    }
  }

  closeForm() {
    this.showForm = false;
    this.editingTruck = null;
    this.isEditMode = false;
  }
  
  onSearch() {
    // Emit search event to truck list component
    this.truckService.searchTerm.next(this.searchTerm);
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.onSearch();
  }

  onManageTruckSearch() {
    if (!this.manageTruckSearchTerm.trim()) {
      this.filteredTrucks = this.trucks;
    } else {
      this.filteredTrucks = this.trucks.filter(truck =>
        truck.model.toLowerCase().includes(this.manageTruckSearchTerm.toLowerCase()) ||
        truck.vin.toLowerCase().includes(this.manageTruckSearchTerm.toLowerCase()) ||
        truck.engineNumber.toLowerCase().includes(this.manageTruckSearchTerm.toLowerCase()) ||
        (truck.unitNumber && truck.unitNumber.toLowerCase().includes(this.manageTruckSearchTerm.toLowerCase()))
      );
    }
  }

  clearManageTruckSearch() {
    this.manageTruckSearchTerm = '';
    this.onManageTruckSearch();
  }

  editTruck(truck: any) {
    this.editingTruck = truck;
    this.isEditMode = true;
    this.showForm = true;
    this.closeSettingsPanel();
  }

  deleteTruck(truck: any) {
    const confirmDelete = confirm(`Are you sure you want to remove truck ${truck.model} (${truck.vin})?`);
    if (confirmDelete) {
      this.truckService.deleteTruck(truck.vin).subscribe(() => {
        this.loadTrucks();
      });
    }
  }

  // Distance formatting methods
  getFormattedDistance(truck: Truck): string {
    const unit = truck.odometerUnit || DistanceUnit.MILES;
    const reading = truck.odometerReading;

    if (reading >= 1000) {
      return (reading / 1000).toFixed(1) + 'K';
    }

    return reading.toString();
  }

  getDistanceUnit(truck: Truck): string {
    const unit = truck.odometerUnit || DistanceUnit.MILES;
    return unit === DistanceUnit.MILES ? 'mi' : 'km';
  }
}
