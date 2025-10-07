import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Truck, DistanceUnit, TruckManufacturer, EngineManufacturer } from '../models/truck.model';
import { VinDecoderService } from './vin-decoder.service';
import { CsvTemplateService } from './csv-template.service';

export interface CsvParseResult {
  success: boolean;
  trucks: Truck[];
  errors: CsvParseError[];
  totalRows: number;
  validRows: number;
}

export interface CsvParseError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CsvParserService {

  constructor(
    private vinDecoderService: VinDecoderService,
    private csvTemplateService: CsvTemplateService
  ) { }

  /**
   * Parses CSV file content and converts to Truck objects
   */
  parseCsvToTrucks(csvContent: string): Observable<CsvParseResult> {
    try {
      const lines = csvContent.trim().split('\n');

      if (lines.length < 2) {
        return of({
          success: false,
          trucks: [],
          errors: [{ row: 0, message: 'CSV file must contain headers and at least one data row' }],
          totalRows: 0,
          validRows: 0
        });
      }

      // Parse headers and remove asterisks
      const headers = lines[0].split(',').map(h => h.trim().replace('*', ''));

      // Validate headers
      const expectedHeaders = [
        'unitNumber', 'vin', 'engineNumber', 'engineManufacturer',
        'engineModel', 'odometerReading', 'odometerUnit', 'engineHours',
        'lastServiceDate', 'nextServiceDue'
      ];

      const requiredHeaders = ['unitNumber', 'vin', 'engineNumber', 'odometerReading', 'engineHours'];
      const missingRequired = requiredHeaders.filter(h => !headers.includes(h));

      if (missingRequired.length > 0) {
        return of({
          success: false,
          trucks: [],
          errors: [{
            row: 0,
            message: `Missing required headers: ${missingRequired.join(', ')}`
          }],
          totalRows: 0,
          validRows: 0
        });
      }

      const trucks: Truck[] = [];
      const errors: CsvParseError[] = [];
      const dataRows = lines.slice(1);

      // Process each data row
      dataRows.forEach((line, index) => {
        const rowNum = index + 2; // +2 because index is 0-based and we skip header

        if (line.trim() === '') return; // Skip empty lines

        const values = line.split(',').map(v => v.trim());

        // Create row object
        const rowData: any = {};
        headers.forEach((header, i) => {
          rowData[header] = values[i] || '';
        });

        // Validate row
        const validation = this.csvTemplateService.validateCsvRow(rowData);

        if (!validation.isValid) {
          validation.errors.forEach(error => {
            errors.push({
              row: rowNum,
              message: error,
              data: rowData
            });
          });
          return;
        }

        // Check for duplicate VIN in current batch
        if (trucks.some(t => t.vin === rowData.vin)) {
          errors.push({
            row: rowNum,
            field: 'vin',
            message: `Duplicate VIN found in CSV: ${rowData.vin}`,
            data: rowData
          });
          return;
        }

        try {
          // Convert to Truck object
          const truck = this.convertRowToTruck(rowData);
          trucks.push(truck);
        } catch (error: any) {
          errors.push({
            row: rowNum,
            message: `Error processing row: ${error.message}`,
            data: rowData
          });
        }
      });

      const result: CsvParseResult = {
        success: errors.length === 0,
        trucks,
        errors,
        totalRows: dataRows.filter(line => line.trim() !== '').length,
        validRows: trucks.length
      };

      return of(result);

    } catch (error: any) {
      return of({
        success: false,
        trucks: [],
        errors: [{ row: 0, message: `Failed to parse CSV: ${error.message}` }],
        totalRows: 0,
        validRows: 0
      });
    }
  }

  /**
   * Converts CSV row data to Truck object
   */
  private convertRowToTruck(rowData: any): Truck {
    // Decode VIN to get manufacturer, model, year
    const vinDecoded = this.vinDecoderService.decodeVIN(rowData.vin);

    // Parse dates
    const lastServiceDate = rowData.lastServiceDate ? new Date(rowData.lastServiceDate) : undefined;
    const nextServiceDue = rowData.nextServiceDue ? new Date(rowData.nextServiceDue) : undefined;

    // Parse distance unit
    const odometerUnit = rowData.odometerUnit &&
      Object.values(DistanceUnit).includes(rowData.odometerUnit.toUpperCase())
      ? rowData.odometerUnit.toUpperCase() as DistanceUnit
      : DistanceUnit.MILES;

    // Parse engine manufacturer
    let engineManufacturer: EngineManufacturer | undefined;
    if (rowData.engineManufacturer &&
        Object.values(EngineManufacturer).includes(rowData.engineManufacturer.toUpperCase())) {
      engineManufacturer = rowData.engineManufacturer.toUpperCase() as EngineManufacturer;
    }

    const truck: Truck = {
      id: rowData.vin, // Use VIN as ID
      vin: rowData.vin,
      unitNumber: rowData.unitNumber,
      manufacturer: vinDecoded.manufacturer,
      model: vinDecoded.model || 'Unknown',
      modelYear: vinDecoded.modelYear,
      engineNumber: rowData.engineNumber,
      engineManufacturer,
      engineModel: rowData.engineModel || undefined,
      odometerReading: parseInt(rowData.odometerReading),
      odometerUnit,
      engineHours: parseInt(rowData.engineHours),
      lastServiceDate,
      nextServiceDue,
      failures: [] // Initialize with empty failures array
    };

    return truck;
  }

  /**
   * Reads file content as text
   */
  readFileAsText(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        observer.next(result);
        observer.complete();
      };

      reader.onerror = (e) => {
        observer.error(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validates file before processing
   */
  validateCsvFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      errors.push('File must be a CSV file (.csv)');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      errors.push('File size must be less than 5MB');
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}