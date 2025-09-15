import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TruckService } from '../../services/truck';
import { Truck, FailureModule, VideoContent, getManufacturerLogo, DistanceUnit } from '../../models/truck.model';
import { TruckFormComponent } from '../truck-form/truck-form';

@Component({
  selector: 'app-truck-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    TruckFormComponent
  ],
  templateUrl: './truck-details.html',
  styleUrl: './truck-details.scss'
})
export class TruckDetailsComponent implements OnInit {
  truck: Truck | null = null;
  loading = true;
  expandedFailures: Set<string> = new Set();
  isEditing = false;
  showVideoPlayer = false;
  currentVideo: VideoContent | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private truckService: TruckService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Listen to route parameter changes to handle navigation between different trucks
    this.route.paramMap.subscribe(params => {
      const vin = params.get('vin');
      if (vin) {
        this.loadTruck(vin);
      } else {
        this.router.navigate(['/']);
      }
    });

    // Listen to truck updates to refresh current truck data
    this.truckService.truckUpdated.subscribe(updatedTruck => {
      if (updatedTruck && this.truck && updatedTruck.vin === this.truck.vin) {
        this.truck = updatedTruck;
      }
    });
  }

  loadTruck(vin: string) {
    this.loading = true;
    this.truckService.getTruckByVin(vin).subscribe(truck => {
      this.truck = truck || null;
      this.loading = false;
      if (!truck) {
        // Try one more time after a brief delay in case truck was just added
        setTimeout(() => {
          this.truckService.getTruckByVin(vin).subscribe(retryTruck => {
            if (retryTruck) {
              this.truck = retryTruck;
            } else {
              // Still not found, navigate back to home
              this.router.navigate(['/']);
            }
          });
        }, 200);
      }
    });
  }

  toggleFailure(failureId: string) {
    if (this.expandedFailures.has(failureId)) {
      this.expandedFailures.delete(failureId);
    } else {
      this.expandedFailures.add(failureId);
    }
  }

  isFailureExpanded(failureId: string): boolean {
    return this.expandedFailures.has(failureId);
  }

  getSafeVideoUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  isValidYouTubeUrl(url: string): boolean {
    const youtubePattern = /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+$/;
    return youtubePattern.test(url);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // Video management methods removed - videos now only managed through Settings

  // Edit mode methods
  enableEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    // Reload truck data to cancel changes
    if (this.truck) {
      this.loadTruck(this.truck.vin);
    }
  }

  saveTruck(updatedTruck: Truck) {
    if (this.truck) {
      this.truckService.updateTruck(this.truck.vin, updatedTruck).subscribe(
        (truck) => {
          this.truck = truck;
          this.isEditing = false;
        },
        (error) => {
          console.error('Error updating truck:', error);
        }
      );
    }
  }

  // Helper methods for video content
  getVideoThumbnail(video: VideoContent): string {
    return video.thumbnail || '';
  }

  playVideo(video: VideoContent) {
    this.currentVideo = video;
    this.showVideoPlayer = true;
  }

  closeVideoPlayer() {
    this.showVideoPlayer = false;
    this.currentVideo = null;
  }

  // Get manufacturer logo path
  getManufacturerLogo(): string {
    return this.truck?.manufacturer ? getManufacturerLogo(this.truck.manufacturer) : '';
  }

  // Distance formatting methods
  getFormattedDistance(): string {
    if (!this.truck) return '0';

    const unit = this.truck.odometerUnit || DistanceUnit.MILES;
    const reading = this.truck.odometerReading;

    return reading.toLocaleString();
  }

  getDistanceUnit(): string {
    if (!this.truck) return 'mi';

    const unit = this.truck.odometerUnit || DistanceUnit.MILES;
    return unit === DistanceUnit.MILES ? 'mi' : 'km';
  }

  // Helper method for failure severity (same as truck-list component)
  getFailureSeverity(truck: Truck): string {
    if (truck.failures.length === 0) return 'none';
    if (truck.failures.length >= 3) return 'high';
    if (truck.failures.length >= 2) return 'medium';
    return 'low';
  }
}
