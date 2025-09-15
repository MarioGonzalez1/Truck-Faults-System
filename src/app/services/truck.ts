import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Truck, FailureModule, VideoContent, DistanceUnit } from '../models/truck.model';

@Injectable({
  providedIn: 'root'
})
export class TruckService {
  public searchTerm = new BehaviorSubject<string>('');
  public truckUpdated = new BehaviorSubject<Truck | null>(null);

  private trucks: Truck[] = [];
  private readonly STORAGE_KEY = 'truck_fleet_data';

  constructor() {
    this.loadTrucksFromStorage();
  }

  private loadTrucksFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.trucks = parsedData.map((truck: any) => ({
          ...truck,
          lastServiceDate: truck.lastServiceDate ? new Date(truck.lastServiceDate) : undefined,
          nextServiceDue: truck.nextServiceDue ? new Date(truck.nextServiceDue) : undefined,
          failures: truck.failures.map((failure: any) => ({
            ...failure,
            detectedDate: failure.detectedDate ? new Date(failure.detectedDate) : undefined,
            resolvedDate: failure.resolvedDate ? new Date(failure.resolvedDate) : undefined,
            videoContent: failure.videoContent.map((video: any) => ({
              ...video,
              uploadDate: new Date(video.uploadDate)
            }))
          }))
        }));
      }
    } catch (error) {
      console.warn('Error loading trucks from localStorage:', error);
      this.trucks = [];
    }
  }

  private saveTrucksToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.trucks));
    } catch (error) {
      console.error('Error saving trucks to localStorage:', error);
    }
  }

  getTrucks(): Observable<Truck[]> {
    return of(this.trucks);
  }

  getTruckByVin(vin: string): Observable<Truck | undefined> {
    const truck = this.trucks.find(t => t.vin === vin);
    return of(truck);
  }

  searchTrucks(searchTerm: string): Observable<Truck[]> {
    if (!searchTerm.trim()) {
      return this.getTrucks();
    }
    
    const filtered = this.trucks.filter(truck => 
      truck.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.engineNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (truck.unitNumber && truck.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return of(filtered);
  }

  addTruck(truck: Truck): Observable<Truck> {
    // Check if VIN already exists
    if (this.trucks.some(t => t.vin === truck.vin)) {
      throw new Error('A truck with this VIN already exists');
    }
    
    // Ensure truck has a unique ID (use VIN as primary identifier)
    const truckWithId: Truck = {
      ...truck,
      id: truck.vin
    };
    
    this.trucks.push(truckWithId);
    this.saveTrucksToStorage();
    return of(truckWithId);
  }

  updateTruck(vin: string, updatedTruck: Truck): Observable<Truck> {
    const index = this.trucks.findIndex(t => t.vin === vin);
    
    if (index === -1) {
      throw new Error('Truck not found');
    }
    
    // Check if new VIN conflicts with existing trucks (excluding current)
    if (updatedTruck.vin !== vin && this.trucks.some(t => t.vin === updatedTruck.vin)) {
      throw new Error('A truck with this VIN already exists');
    }
    
    this.trucks[index] = updatedTruck;
    this.saveTrucksToStorage();
    // Notify all components that this truck was updated
    this.truckUpdated.next(updatedTruck);
    return of(updatedTruck);
  }

  deleteTruck(vin: string): Observable<boolean> {
    const index = this.trucks.findIndex(t => t.vin === vin);
    
    if (index === -1) {
      throw new Error('Truck not found');
    }
    
    this.trucks.splice(index, 1);
    this.saveTrucksToStorage();
    return of(true);
  }

  generateVin(): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = 'WDB9630421L';
    for (let i = 0; i < 6; i++) {
      vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
  }

  generateEngineNumber(): string {
    const chars = '0123456789';
    let engineNumber = 'OM471LA-';
    for (let i = 0; i < 3; i++) {
      engineNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return engineNumber;
  }

  exportFleetData(): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      totalTrucks: this.trucks.length,
      trucks: this.trucks
    };
    return JSON.stringify(exportData, null, 2);
  }

  importFleetData(jsonData: string): Observable<boolean> {
    try {
      const importData = JSON.parse(jsonData);
      if (importData.trucks && Array.isArray(importData.trucks)) {
        this.trucks = importData.trucks.map((truck: any) => ({
          ...truck,
          lastServiceDate: truck.lastServiceDate ? new Date(truck.lastServiceDate) : undefined,
          nextServiceDue: truck.nextServiceDue ? new Date(truck.nextServiceDue) : undefined,
          failures: truck.failures.map((failure: any) => ({
            ...failure,
            detectedDate: failure.detectedDate ? new Date(failure.detectedDate) : undefined,
            resolvedDate: failure.resolvedDate ? new Date(failure.resolvedDate) : undefined,
            videoContent: failure.videoContent.map((video: any) => ({
              ...video,
              uploadDate: new Date(video.uploadDate)
            }))
          }))
        }));
        this.saveTrucksToStorage();
        return of(true);
      }
      throw new Error('Invalid data format');
    } catch (error) {
      console.error('Error importing fleet data:', error);
      return of(false);
    }
  }

  clearAllData(): Observable<boolean> {
    this.trucks = [];
    this.saveTrucksToStorage();
    return of(true);
  }

  generateDummyFleetData(): Observable<Truck[]> {
    const dummyTrucks: Truck[] = [
      // Peterbilt 579
      {
        id: this.generateVin(),
        manufacturer: 'PETERBILT' as any,
        model: '579',
        modelYear: 2019,
        vin: this.generateVin(),
        engineNumber: this.generateEngineNumber(),
        engineManufacturer: 'CUMMINS' as any,
        engineModel: 'X15',
        odometerReading: 301000, // ~485,000 km converted to miles
        odometerUnit: DistanceUnit.MILES,
        engineHours: 8500,
        unitNumber: '1001',
        failures: [],
        fleetId: 'FLEET001'
      },
      // Freightliner Cascadia
      {
        id: this.generateVin(),
        manufacturer: 'FREIGHTLINER' as any,
        model: 'Cascadia',
        modelYear: 2020,
        vin: this.generateVin(),
        engineNumber: this.generateEngineNumber(),
        engineManufacturer: 'DETROIT_DIESEL' as any,
        engineModel: 'DD15',
        odometerReading: 199000, // ~320,000 km converted to miles
        odometerUnit: DistanceUnit.MILES,
        engineHours: 6200,
        unitNumber: '1002',
        failures: [],
        fleetId: 'FLEET001'
      },
      // International LoneStar
      {
        id: this.generateVin(),
        manufacturer: 'INTERNATIONAL' as any,
        model: 'LoneStar',
        modelYear: 2018,
        vin: this.generateVin(),
        engineNumber: this.generateEngineNumber(),
        engineManufacturer: 'CUMMINS' as any,
        engineModel: 'ISX15',
        odometerReading: 385000, // ~620,000 km converted to miles
        odometerUnit: DistanceUnit.MILES,
        engineHours: 12000,
        unitNumber: '1003',
        failures: [],
        fleetId: 'FLEET001'
      },
      // International LT625
      {
        id: this.generateVin(),
        manufacturer: 'INTERNATIONAL' as any,
        model: 'LT625',
        modelYear: 2021,
        vin: this.generateVin(),
        engineNumber: this.generateEngineNumber(),
        engineManufacturer: 'CUMMINS' as any,
        engineModel: 'X15',
        odometerReading: 112000, // ~180,000 km converted to miles
        odometerUnit: DistanceUnit.MILES,
        engineHours: 3500,
        unitNumber: '1004',
        failures: [],
        fleetId: 'FLEET001'
      },
      // Kenworth T660
      {
        id: this.generateVin(),
        manufacturer: 'KENWORTH' as any,
        model: 'T660',
        modelYear: 2017,
        vin: this.generateVin(),
        engineNumber: this.generateEngineNumber(),
        engineManufacturer: 'PACCAR' as any,
        engineModel: 'MX-13',
        odometerReading: 466000, // ~750,000 km converted to miles
        odometerUnit: DistanceUnit.MILES,
        engineHours: 15000,
        unitNumber: '1005',
        failures: [],
        fleetId: 'FLEET001'
      },
      // Kenworth T680
      {
        id: this.generateVin(),
        manufacturer: 'KENWORTH' as any,
        model: 'T680',
        modelYear: 2022,
        vin: this.generateVin(),
        engineNumber: this.generateEngineNumber(),
        engineManufacturer: 'PACCAR' as any,
        engineModel: 'MX-13',
        odometerReading: 59000, // ~95,000 km converted to miles
        odometerUnit: DistanceUnit.MILES,
        engineHours: 1800,
        unitNumber: '1006',
        failures: [],
        fleetId: 'FLEET001'
      },
      // Volvo VNL64T
      {
        id: this.generateVin(),
        manufacturer: 'VOLVO' as any,
        model: 'VNL64T',
        modelYear: 2019,
        vin: this.generateVin(),
        engineNumber: this.generateEngineNumber(),
        engineManufacturer: 'VOLVO' as any,
        engineModel: 'D13',
        odometerReading: 255000, // ~410,000 km converted to miles
        odometerUnit: DistanceUnit.MILES,
        engineHours: 7800,
        unitNumber: '1007',
        failures: [],
        fleetId: 'FLEET001'
      },
      // Volvo VNL760
      {
        id: this.generateVin(),
        manufacturer: 'VOLVO' as any,
        model: 'VNL760',
        modelYear: 2020,
        vin: this.generateVin(),
        engineNumber: this.generateEngineNumber(),
        engineManufacturer: 'VOLVO' as any,
        engineModel: 'D13',
        odometerReading: 180000, // ~290,000 km converted to miles
        odometerUnit: DistanceUnit.MILES,
        engineHours: 5600,
        unitNumber: '1008',
        failures: [],
        fleetId: 'FLEET001'
      }
    ];

    // Add trucks to the current fleet
    dummyTrucks.forEach(truck => {
      if (!this.trucks.some(t => t.vin === truck.vin)) {
        this.trucks.push(truck);
      }
    });

    this.saveTrucksToStorage();
    return of(this.trucks);
  }
}
