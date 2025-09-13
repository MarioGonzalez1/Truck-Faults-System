import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Truck, FailureModule, VideoContent } from '../models/truck.model';

@Injectable({
  providedIn: 'root'
})
export class TruckService {
  public searchTerm = new BehaviorSubject<string>('');
  public truckUpdated = new BehaviorSubject<Truck | null>(null);

  private trucks: Truck[] = [];

  constructor() { }

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
}
