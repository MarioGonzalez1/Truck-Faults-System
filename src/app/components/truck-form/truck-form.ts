import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { Truck, FailureModule, VideoContent } from '../../models/truck.model';
import { TruckService } from '../../services/truck';
import { VideoUploadComponent } from '../video-upload/video-upload';

@Component({
  selector: 'app-truck-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    VideoUploadComponent
  ],
  templateUrl: './truck-form.html',
  styleUrl: './truck-form.scss'
})
export class TruckFormComponent implements OnInit {
  @Input() truck: Truck | null = null;
  @Input() isEdit = false;
  @Output() save = new EventEmitter<Truck>();
  @Output() cancel = new EventEmitter<void>();

  formData: Truck = {
    model: '',
    vin: '',
    engineNumber: '',
    odometerReading: 0,
    engineHours: 0,
    unitNumber: '',
    failures: []
  };

  errors: { [key: string]: string } = {};

  constructor(private truckService: TruckService) {}

  ngOnInit() {
    if (this.truck && this.isEdit) {
      this.formData = { ...this.truck, failures: [...this.truck.failures] };
    } else {
      // Generate default values for new truck
      this.formData.vin = this.truckService.generateVin();
      this.formData.engineNumber = this.truckService.generateEngineNumber();
    }
  }

  onSubmit() {
    if (this.validateForm()) {
      this.save.emit(this.formData);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formData.model.trim()) {
      this.errors['model'] = 'Truck model is required';
    }

    if (!this.formData.vin.trim()) {
      this.errors['vin'] = 'VIN is required';
    } else if (this.formData.vin.length < 10) {
      this.errors['vin'] = 'VIN must be at least 10 characters';
    }

    if (!this.formData.engineNumber.trim()) {
      this.errors['engineNumber'] = 'Engine number is required';
    }

    if (this.formData.odometerReading < 0) {
      this.errors['odometerReading'] = 'Odometer reading cannot be negative';
    }

    if (this.formData.engineHours < 0) {
      this.errors['engineHours'] = 'Engine hours cannot be negative';
    }

    return Object.keys(this.errors).length === 0;
  }

  addFailure() {
    const newFailure: FailureModule = {
      id: Date.now().toString(),
      title: '',
      description: '',
      videoContent: []
    };
    this.formData.failures.push(newFailure);
  }

  removeFailure(index: number) {
    this.formData.failures.splice(index, 1);
  }

  // Video management methods
  onVideoAdded(failureIndex: number, video: VideoContent) {
    if (!this.formData.failures[failureIndex].videoContent) {
      this.formData.failures[failureIndex].videoContent = [];
    }
    this.formData.failures[failureIndex].videoContent.push(video);
  }

  onVideoRemoved(failureIndex: number, video: VideoContent) {
    const failure = this.formData.failures[failureIndex];
    if (failure.videoContent) {
      const index = failure.videoContent.findIndex(v => v.id === video.id);
      if (index !== -1) {
        failure.videoContent.splice(index, 1);
      }
    }
  }


  trackByIndex(index: number): number {
    return index;
  }
}
