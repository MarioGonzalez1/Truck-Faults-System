import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { Truck, FailureModule, VideoContent, TruckManufacturer, getModelsForManufacturer, DistanceUnit, convertMilesToKm, convertKmToMiles, formatDistance } from '../../models/truck.model';
import { TruckService } from '../../services/truck';
import { VideoUploadComponent } from '../video-upload/video-upload';
import { VinDecoderService, VinDecodedData } from '../../services/vin-decoder.service';

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
    odometerUnit: DistanceUnit.MILES,
    engineHours: 0,
    unitNumber: '',
    modelYear: undefined,
    failures: []
  };

  errors: { [key: string]: string } = {};
  availableModels: string[] = [];
  vinDecodedInfo: VinDecodedData | null = null;
  vinDecodeTimeout: any;

  constructor(
    private truckService: TruckService,
    private vinDecoderService: VinDecoderService
  ) {}

  ngOnInit() {
    if (this.truck && this.isEdit) {
      this.formData = { ...this.truck, failures: [...this.truck.failures] };
      // Set available models based on existing manufacturer
      if (this.formData.manufacturer) {
        this.availableModels = getModelsForManufacturer(this.formData.manufacturer as TruckManufacturer);
      }
    } else {
      // New truck - start with empty form
      // No default values generated
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

    if (!this.formData.manufacturer) {
      this.errors['manufacturer'] = 'Manufacturer is required';
    }

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


  // Handle manufacturer change
  onManufacturerChange() {
    if (this.formData.manufacturer) {
      this.availableModels = getModelsForManufacturer(this.formData.manufacturer as TruckManufacturer);
      // Clear model selection when manufacturer changes
      this.formData.model = '';
    } else {
      this.availableModels = [];
      this.formData.model = '';
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  // VIN Decoder Methods
  onVinChange(event: any) {
    const vin = event.target.value.toUpperCase();
    this.formData.vin = vin;

    // Clear previous timeout
    if (this.vinDecodeTimeout) {
      clearTimeout(this.vinDecodeTimeout);
    }

    // Decode VIN after user stops typing (debounce)
    this.vinDecodeTimeout = setTimeout(() => {
      this.decodeVin(vin);
    }, 500);
  }

  onVinBlur() {
    if (this.formData.vin) {
      this.decodeVin(this.formData.vin);
    }
  }

  private decodeVin(vin: string) {
    if (vin && vin.length >= 10) {
      this.vinDecodedInfo = this.vinDecoderService.decodeVIN(vin);
    } else {
      this.vinDecodedInfo = null;
    }
  }

  getVinDisplayInfo(): string {
    if (!this.vinDecodedInfo || !this.vinDecodedInfo.isValid) {
      return '';
    }

    const info = [];
    if (this.vinDecodedInfo.manufacturer) {
      info.push(this.vinDecodedInfo.manufacturer);
    }
    if (this.vinDecodedInfo.model) {
      info.push(this.vinDecodedInfo.model);
    }
    if (this.vinDecodedInfo.modelYear) {
      info.push(this.vinDecodedInfo.modelYear.toString());
    }
    if (this.vinDecodedInfo.country) {
      info.push(this.vinDecodedInfo.country);
    }

    return info.join(' • ');
  }

  canAutoFill(): boolean {
    return !!(this.vinDecodedInfo &&
             this.vinDecodedInfo.isValid &&
             (this.vinDecodedInfo.manufacturer || this.vinDecodedInfo.model || this.vinDecodedInfo.modelYear));
  }

  autoFillFromVin() {
    if (!this.vinDecodedInfo || !this.vinDecodedInfo.isValid) {
      return;
    }

    // Auto-fill manufacturer
    if (this.vinDecodedInfo.manufacturer && !this.formData.manufacturer) {
      this.formData.manufacturer = this.vinDecodedInfo.manufacturer as any;
      this.onManufacturerChange();
    }

    // Auto-fill model
    if (this.vinDecodedInfo.model && !this.formData.model) {
      this.formData.model = this.vinDecodedInfo.model;
    }

    // Auto-fill model year
    if (this.vinDecodedInfo.modelYear && !this.formData.modelYear) {
      this.formData.modelYear = this.vinDecodedInfo.modelYear;
    }

    // Show confirmation
    alert('Vehicle information has been auto-filled from VIN!');
  }

  // Distance unit conversion methods
  onDistanceUnitChange() {
    // This method can be used to trigger conversion if needed
    // Currently, we just let the user manually adjust the value
  }

  getDistanceConversion(): string {
    if (!this.formData.odometerReading || this.formData.odometerReading === 0) {
      return '';
    }

    const currentUnit = this.formData.odometerUnit || DistanceUnit.MILES;
    const otherUnit = currentUnit === DistanceUnit.MILES ? DistanceUnit.KILOMETERS : DistanceUnit.MILES;

    let convertedValue: number;
    if (currentUnit === DistanceUnit.MILES) {
      convertedValue = convertMilesToKm(this.formData.odometerReading);
    } else {
      convertedValue = convertKmToMiles(this.formData.odometerReading);
    }

    return `≈ ${formatDistance(convertedValue, otherUnit, 1)}`;
  }
}
