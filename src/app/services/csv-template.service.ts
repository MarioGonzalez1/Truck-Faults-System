import { Injectable } from '@angular/core';

export interface CsvFleetTemplate {
  unitNumber: string;
  vin: string;
  engineNumber: string;
  engineManufacturer?: string;
  engineModel?: string;
  odometerReading: number;
  odometerUnit?: string;
  engineHours: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CsvTemplateService {

  constructor() { }

  /**
   * Generates CSV template for truck fleet batch upload
   */
  generateFleetTemplate(): string {
    // Headers with asterisks for required fields
    const headers = [
      'unitNumber*',
      'vin*',
      'engineNumber*',
      'engineManufacturer',
      'engineModel',
      'odometerReading*',
      'odometerUnit',
      'engineHours*',
      'lastServiceDate',
      'nextServiceDue'
    ];

    // Create CSV content with headers only
    const csvContent = headers.join(',') + '\n';

    return csvContent;
  }

  /**
   * Downloads CSV template file
   */
  downloadFleetTemplate(filename: string = 'fleet_batch_upload_template.csv'): void {
    const csvContent = this.generateFleetTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Gets field descriptions for the CSV template
   */
  getFieldDescriptions(): { [key: string]: string } {
    return {
      unitNumber: 'Fleet unit number (required) - e.g., "1001"',
      vin: 'Vehicle Identification Number (required) - 17 characters, e.g., "1XKAD49X0LJ123456"',
      engineNumber: 'Engine serial number (required) - e.g., "ENG123456"',
      engineManufacturer: 'Engine manufacturer (optional) - CUMMINS, DETROIT_DIESEL, PACCAR, VOLVO, NAVISTAR, CATERPILLAR',
      engineModel: 'Engine model (optional) - e.g., "X15", "DD15", "D13"',
      odometerReading: 'Current odometer reading (required) - number only, e.g., "250000"',
      odometerUnit: 'Distance unit (optional) - MILES or KILOMETERS (default: MILES)',
      engineHours: 'Current engine hours (required) - number only, e.g., "8500"',
      lastServiceDate: 'Last service date (optional) - format: YYYY-MM-DD, e.g., "2024-01-15"',
      nextServiceDue: 'Next service due date (optional) - format: YYYY-MM-DD, e.g., "2024-07-15"'
    };
  }

  /**
   * Gets CSV template instructions
   */
  getTemplateInstructions(): string[] {
    return [
      '1. Fill in the required fields: unitNumber, vin, engineNumber, odometerReading, engineHours',
      '2. The VIN will be used to automatically detect manufacturer, model, and year',
      '3. Optional fields can be left empty if not available',
      '4. Use date format YYYY-MM-DD for service dates',
      '5. Engine manufacturer values: CUMMINS, DETROIT_DIESEL, PACCAR, VOLVO, NAVISTAR, CATERPILLAR',
      '6. Distance unit values: MILES or KILOMETERS (default: MILES)',
      '7. Save file as CSV format when uploading'
    ];
  }

  /**
   * Validates required fields in CSV data
   */
  validateCsvRow(row: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields = ['unitNumber', 'vin', 'engineNumber', 'odometerReading', 'engineHours'];

    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    // VIN validation
    if (row.vin && row.vin.length !== 17) {
      errors.push('VIN must be exactly 17 characters');
    }

    // Numeric validations
    if (row.odometerReading && isNaN(Number(row.odometerReading))) {
      errors.push('odometerReading must be a number');
    }

    if (row.engineHours && isNaN(Number(row.engineHours))) {
      errors.push('engineHours must be a number');
    }

    // Date validations
    if (row.lastServiceDate && !this.isValidDate(row.lastServiceDate)) {
      errors.push('lastServiceDate must be in YYYY-MM-DD format');
    }

    if (row.nextServiceDue && !this.isValidDate(row.nextServiceDue)) {
      errors.push('nextServiceDue must be in YYYY-MM-DD format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}