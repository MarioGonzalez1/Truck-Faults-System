import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TruckService } from '../../services/truck';
import { Truck } from '../../models/truck.model';
import { TruckFormComponent } from '../truck-form/truck-form';

@Component({
  selector: 'app-truck-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressBarModule,
    TruckFormComponent
  ],
  templateUrl: './truck-list.html',
  styleUrl: './truck-list.scss'
})
export class TruckListComponent implements OnInit {
  @Input() isCollapsed = false;
  
  trucks: Truck[] = [];
  filteredTrucks: Truck[] = [];
  searchTerm: string = '';
  
  showForm = false;
  editingTruck: Truck | null = null;
  isEditMode = false;
  showSettingsPanel = false;

  constructor(private truckService: TruckService, private router: Router) {}

  ngOnInit() {
    this.loadTrucks();
    
    // Listen to search term changes from header
    this.truckService.searchTerm.subscribe(term => {
      this.searchTerm = term;
      this.onSearch();
    });

    // Listen to truck updates to refresh list
    this.truckService.truckUpdated.subscribe(updatedTruck => {
      if (updatedTruck) {
        this.loadTrucks();
      }
    });
  }

  loadTrucks() {
    this.truckService.getTrucks().subscribe(trucks => {
      this.trucks = trucks;
      this.filteredTrucks = trucks;
    });
  }

  onSearch() {
    this.truckService.searchTrucks(this.searchTerm).subscribe(trucks => {
      this.filteredTrucks = trucks;
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.onSearch();
  }

  addTruck() {
    this.editingTruck = null;
    this.isEditMode = false;
    this.showForm = true;
  }

  editTruck(truck: Truck, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.editingTruck = truck;
    this.isEditMode = true;
    this.showForm = true;
  }

  deleteTruck(truck: Truck, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete truck ${truck.vin}?`)) {
      try {
        this.truckService.deleteTruck(truck.vin).subscribe(() => {
          this.loadTrucks();
          // Navigate to home if we deleted the currently viewed truck
          const currentPath = window.location.pathname;
          if (currentPath.includes(truck.vin)) {
            this.router.navigate(['/']);
          }
        });
      } catch (error: any) {
        alert('Error deleting truck: ' + error.message);
      }
    }
  }

  onSaveTruck(truckData: Truck) {
    try {
      if (this.isEditMode && this.editingTruck) {
        // Update existing truck
        this.truckService.updateTruck(this.editingTruck.vin, truckData).subscribe(() => {
          this.loadTrucks();
          this.closeForm();
          // Navigate to updated truck if VIN changed
          if (this.editingTruck!.vin !== truckData.vin) {
            const currentPath = window.location.pathname;
            if (currentPath.includes(this.editingTruck!.vin)) {
              this.router.navigate(['/truck', truckData.vin]);
            }
          }
        });
      } else {
        // Add new truck
        this.truckService.addTruck(truckData).subscribe(() => {
          this.loadTrucks();
          this.closeForm();
          // Small delay to ensure truck is saved before navigation
          setTimeout(() => {
            this.router.navigate(['/truck', truckData.vin]);
          }, 100);
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

  // Helper methods for the improved design
  getFailureSeverity(truck: Truck): string {
    if (truck.failures.length === 0) return 'none';
    if (truck.failures.length >= 3) return 'high';
    if (truck.failures.length >= 2) return 'medium';
    return 'low';
  }

  getFailureSeverityLabel(truck: Truck): string {
    const severity = this.getFailureSeverity(truck);
    switch (severity) {
      case 'high': return 'Critical';
      case 'medium': return 'Attention';
      case 'low': return 'Minor';
      default: return 'Operational';
    }
  }

  getEngineUsagePercentage(truck: Truck): number {
    // Assuming 10,000 hours is typical engine life for calculation
    return Math.min((truck.engineHours / 10000) * 100, 100);
  }

  getOdometerStatus(truck: Truck): string {
    if (truck.odometerReading > 500000) return 'high-mileage';
    if (truck.odometerReading > 200000) return 'medium-mileage';
    return 'low-mileage';
  }

  getOdometerPercentage(truck: Truck): number {
    // Assuming 1,000,000 km is maximum expected life
    return Math.min((truck.odometerReading / 1000000) * 100, 100);
  }

  viewTruckDetails(truck: Truck) {
    this.router.navigate(['/truck', truck.vin]);
  }

  selectedTruckVin: string | null = null;

  selectTruck(truck: Truck) {
    this.selectedTruckVin = truck.vin;
    // Use Angular Router for better navigation handling
    this.router.navigate(['/truck', truck.vin]);
  }

  isSelected(truck: Truck): boolean {
    const currentPath = window.location.pathname;
    return currentPath.includes(truck.vin);
  }

  toggleSettingsPanel() {
    this.showSettingsPanel = !this.showSettingsPanel;
  }

  closeSettingsPanel() {
    this.showSettingsPanel = false;
  }
}
