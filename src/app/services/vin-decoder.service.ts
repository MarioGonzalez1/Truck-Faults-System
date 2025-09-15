import { Injectable } from '@angular/core';
import { TruckManufacturer } from '../models/truck.model';

export interface VinDecodedData {
  manufacturer?: TruckManufacturer;
  model?: string;
  modelYear?: number;
  engineType?: string;
  isValid: boolean;
  country?: string;
  checkDigit?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VinDecoderService {

  constructor() { }

  decodeVIN(vin: string): VinDecodedData {
    if (!vin || vin.length !== 17) {
      return { isValid: false };
    }

    // Basic VIN validation
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinRegex.test(vin.toUpperCase())) {
      return { isValid: false };
    }

    const result: VinDecodedData = { isValid: true };

    try {
      // World Manufacturer Identifier (WMI) - First 3 characters
      const wmi = vin.substring(0, 3).toUpperCase();
      result.manufacturer = this.getManufacturerFromWMI(wmi);

      // Vehicle Descriptor Section (VDS) - positions 4-9
      const vds = vin.substring(3, 9);

      // Model decoding based on manufacturer and VDS
      result.model = this.getModelFromVDS(result.manufacturer, vds);

      // Model Year - 10th position
      const yearCode = vin.charAt(9).toUpperCase();
      result.modelYear = this.getYearFromCode(yearCode);

      // Country of manufacture
      result.country = this.getCountryFromWMI(wmi);

      // Check digit - 9th position
      result.checkDigit = vin.charAt(8);

      // Engine type estimation based on VDS (Vehicle Descriptor Section)
      result.engineType = this.estimateEngineType(result.manufacturer, vds);

    } catch (error) {
      console.error('Error decoding VIN:', error);
      return { isValid: false };
    }

    return result;
  }

  private getManufacturerFromWMI(wmi: string): TruckManufacturer | undefined {
    // Heavy-duty truck manufacturer WMI codes
    const manufacturerMap: { [key: string]: TruckManufacturer } = {
      // Kenworth
      '1XK': TruckManufacturer.KENWORTH,

      // Peterbilt
      '1NP': TruckManufacturer.PETERBILT,
      '1XP': TruckManufacturer.PETERBILT,

      // Freightliner
      '1FU': TruckManufacturer.FREIGHTLINER,
      '1FV': TruckManufacturer.FREIGHTLINER,
      '3AK': TruckManufacturer.FREIGHTLINER,

      // International/Navistar
      '1HT': TruckManufacturer.INTERNATIONAL,
      '1HS': TruckManufacturer.INTERNATIONAL,
      '3HM': TruckManufacturer.INTERNATIONAL,

      // Volvo
      '4V4': TruckManufacturer.VOLVO,
      '4V1': TruckManufacturer.VOLVO,
      '4VL': TruckManufacturer.VOLVO,
    };

    return manufacturerMap[wmi];
  }

  private getYearFromCode(yearCode: string): number | undefined {
    const yearMap: { [key: string]: number } = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
      'Y': 2030,
      '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
      '6': 2006, '7': 2007, '8': 2008, '9': 2009
    };

    return yearMap[yearCode];
  }

  private getCountryFromWMI(wmi: string): string {
    const firstChar = wmi.charAt(0);

    if (['1', '4', '5'].includes(firstChar)) {
      return 'United States';
    } else if (['2'].includes(firstChar)) {
      return 'Canada';
    } else if (['3'].includes(firstChar)) {
      return 'Mexico';
    } else if (['J'].includes(firstChar)) {
      return 'Japan';
    } else if (['K', 'L', 'M', 'N', 'P'].includes(firstChar)) {
      return 'Asia';
    } else if (['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].includes(firstChar)) {
      return 'Europe';
    }

    return 'Unknown';
  }

  private getModelFromVDS(manufacturer: TruckManufacturer | undefined, vds: string): string | undefined {
    if (!manufacturer || !vds) return undefined;

    // Model decoding based on manufacturer-specific VDS patterns
    switch (manufacturer) {
      case TruckManufacturer.KENWORTH:
        return this.getKenworthModel(vds);

      case TruckManufacturer.PETERBILT:
        return this.getPeterbiltModel(vds);

      case TruckManufacturer.FREIGHTLINER:
        return this.getFreightlinerModel(vds);

      case TruckManufacturer.INTERNATIONAL:
        return this.getInternationalModel(vds);

      case TruckManufacturer.VOLVO:
        return this.getVolvoModel(vds);

      default:
        return undefined;
    }
  }

  private getKenworthModel(vds: string): string | undefined {
    // Kenworth VDS model patterns
    const modelPatterns: { [key: string]: string } = {
      'T680': 'T680',
      'T880': 'T880',
      'W900': 'W900',
      'T800': 'T800',
      'T370': 'T370',
      'T270': 'T270',
      'C500': 'C500'
    };

    // Check for model patterns in VDS
    for (const [pattern, model] of Object.entries(modelPatterns)) {
      if (vds.includes(pattern.substring(0, 3))) {
        return model;
      }
    }

    // Default Kenworth models based on common VDS patterns
    if (vds.startsWith('T6')) return 'T680';
    if (vds.startsWith('T8')) return 'T880';
    if (vds.startsWith('W9')) return 'W900';
    if (vds.startsWith('T8')) return 'T800';

    return 'T680'; // Default popular model
  }

  private getPeterbiltModel(vds: string): string | undefined {
    // Peterbilt VDS model patterns
    const modelPatterns: { [key: string]: string } = {
      '579': '579',
      '389': '389',
      '367': '367',
      '348': '348',
      '337': '337',
      '220': '220'
    };

    // Check for model patterns in VDS
    for (const [pattern, model] of Object.entries(modelPatterns)) {
      if (vds.includes(pattern)) {
        return model;
      }
    }

    // Default based on common patterns
    if (vds.includes('57')) return '579';
    if (vds.includes('38')) return '389';
    if (vds.includes('36')) return '367';

    return '579'; // Default popular model
  }

  private getFreightlinerModel(vds: string): string | undefined {
    // Freightliner VDS model patterns
    const modelPatterns: { [key: string]: string } = {
      'CASC': 'Cascadia',
      'COLM': 'Columbia',
      'CORL': 'Coronado',
      'M2': 'M2 106',
      '114': '114SD',
      '108': '108SD'
    };

    // Check for model patterns in VDS
    for (const [pattern, model] of Object.entries(modelPatterns)) {
      if (vds.includes(pattern)) {
        return model;
      }
    }

    // Default based on common patterns
    if (vds.includes('CA') || vds.includes('SC')) return 'Cascadia';
    if (vds.includes('CO')) return 'Columbia';
    if (vds.includes('M2')) return 'M2 106';

    return 'Cascadia'; // Default popular model
  }

  private getInternationalModel(vds: string): string | undefined {
    // International VDS model patterns
    const modelPatterns: { [key: string]: string } = {
      'LT': 'LT',
      'RH': 'RH',
      'HX': 'HX',
      'LoneS': 'LoneStar',
      'ProS': 'ProStar',
      'WorkS': 'WorkStar'
    };

    // Check for model patterns in VDS
    for (const [pattern, model] of Object.entries(modelPatterns)) {
      if (vds.includes(pattern)) {
        return model;
      }
    }

    // Default based on common patterns
    if (vds.includes('LT')) return 'LT';
    if (vds.includes('RH')) return 'RH';
    if (vds.includes('HX')) return 'HX';

    return 'LT'; // Default popular model
  }

  private getVolvoModel(vds: string): string | undefined {
    // Volvo VDS model patterns
    const modelPatterns: { [key: string]: string } = {
      'VNL': 'VNL',
      'VNR': 'VNR',
      'VHD': 'VHD',
      'VAH': 'VAH'
    };

    // Check for model patterns in VDS
    for (const [pattern, model] of Object.entries(modelPatterns)) {
      if (vds.includes(pattern)) {
        return model;
      }
    }

    // Default based on common patterns
    if (vds.includes('VN')) return 'VNL';
    if (vds.includes('VH')) return 'VHD';

    return 'VNL'; // Default popular model
  }

  private estimateEngineType(manufacturer: TruckManufacturer | undefined, vds: string): string | undefined {
    if (!manufacturer) return undefined;

    // Basic engine type estimation based on manufacturer and VDS patterns
    switch (manufacturer) {
      case TruckManufacturer.KENWORTH:
      case TruckManufacturer.PETERBILT:
        // PACCAR trucks often use PACCAR MX engines or Cummins
        return 'PACCAR MX / Cummins';

      case TruckManufacturer.FREIGHTLINER:
        // Freightliner typically uses Detroit Diesel or other Daimler engines
        return 'Detroit Diesel';

      case TruckManufacturer.INTERNATIONAL:
        // International uses Navistar engines or Cummins
        return 'Navistar / Cummins';

      case TruckManufacturer.VOLVO:
        // Volvo uses their own D-series engines
        return 'Volvo D-Series';

      default:
        return undefined;
    }
  }

  validateVIN(vin: string): boolean {
    const decoded = this.decodeVIN(vin);
    return decoded.isValid;
  }

  formatVIN(vin: string): string {
    if (!vin) return '';
    return vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  }

  getVINInfo(vin: string): string {
    const decoded = this.decodeVIN(vin);
    if (!decoded.isValid) {
      return 'Invalid VIN format';
    }

    const info = [];
    if (decoded.manufacturer) info.push(`Manufacturer: ${decoded.manufacturer}`);
    if (decoded.model) info.push(`Model: ${decoded.model}`);
    if (decoded.modelYear) info.push(`Year: ${decoded.modelYear}`);
    if (decoded.country) info.push(`Country: ${decoded.country}`);

    return info.join(', ') || 'VIN decoded successfully';
  }
}