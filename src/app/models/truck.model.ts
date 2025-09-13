// Urgency levels for fault codes
export enum UrgencyLevel {
  IMMEDIATE_STOP = 'IMMEDIATE_STOP',      // Stop driving immediately, safety risk
  URGENT = 'URGENT',                      // Repair within 24-48 hours
  SCHEDULED = 'SCHEDULED',                // Can be scheduled at next maintenance
  MONITOR = 'MONITOR'                     // Monitor condition, no immediate action
}

// Fault code severity
export enum FaultSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

// System categories for fault codes
export enum SystemCategory {
  ENGINE = 'ENGINE',
  AFTERTREATMENT = 'AFTERTREATMENT',
  TRANSMISSION = 'TRANSMISSION',
  BRAKES = 'BRAKES',
  ELECTRICAL = 'ELECTRICAL',
  COOLING = 'COOLING',
  FUEL = 'FUEL',
  PNEUMATIC = 'PNEUMATIC',
  BODY_CHASSIS = 'BODY_CHASSIS'
}

// Truck manufacturer enum
export enum TruckManufacturer {
  KENWORTH = 'KENWORTH',
  INTERNATIONAL = 'INTERNATIONAL',
  VOLVO = 'VOLVO',
  PETERBILT = 'PETERBILT',
  FREIGHTLINER = 'FREIGHTLINER',
  MACK = 'MACK',
  WESTERN_STAR = 'WESTERN_STAR'
}

// Engine manufacturer enum
export enum EngineManufacturer {
  CUMMINS = 'CUMMINS',
  DETROIT_DIESEL = 'DETROIT_DIESEL',
  PACCAR = 'PACCAR',
  VOLVO = 'VOLVO',
  NAVISTAR = 'NAVISTAR',
  CATERPILLAR = 'CATERPILLAR'
}

// Diagnostic step interface
export interface DiagnosticStep {
  stepNumber: number;
  description: string;
  toolsRequired?: string[];
  warningNotes?: string;
  expectedOutcome?: string;
}

// Repair action interface
export interface RepairAction {
  action: string;
  estimatedTime: string;
  partsRequired?: string[];
  specialTools?: string[];
  technicianLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
}

// Fault code interface
export interface FaultCode {
  id: string;
  spn: number;                          // Suspect Parameter Number
  fmi: number;                          // Failure Mode Identifier
  manufacturerCode?: string;            // Manufacturer-specific code
  description: string;
  meaning: string;
  systemCategory: SystemCategory;
  affectedComponents: string[];
  possibleCauses: string[];
  symptoms: string[];
  urgencyLevel: UrgencyLevel;
  severity: FaultSeverity;
  diagnosticSteps: DiagnosticStep[];
  repairActions: RepairAction[];
  requiredTools: string[];
  preventiveMeasures: string[];
  estimatedRepairCost?: {
    min: number;
    max: number;
    currency: string;
  };
  commonOnModels?: string[];            // Truck models where this is common
  relatedCodes?: string[];              // Related fault codes
  technicalBulletins?: string[];        // OEM technical bulletin references
  safetyWarnings?: string[];
  canContinueDriving: boolean;
  distanceToService?: string;           // e.g., "50 miles max", "Immediate"
}

// Truck model specifications
export interface TruckModel {
  id: string;
  manufacturer: TruckManufacturer;
  modelName: string;
  modelYear: number;
  engineOptions: EngineSpecification[];
  transmissionOptions: string[];
  commonFaultCodes?: string[];          // IDs of common fault codes
  technicalSpecs?: {
    gvwr?: number;
    wheelbase?: string;
    fuelCapacity?: number;
  };
}

// Engine specification
export interface EngineSpecification {
  manufacturer: EngineManufacturer;
  model: string;
  displacement: number;
  horsepower: number;
  torque: number;
  emissionStandard: string;             // e.g., "EPA 2017", "EPA 2021"
}

// Video content interface
export interface VideoContent {
  id: string;
  type: 'UPLOADED';
  url: string;                          // Blob URL for uploaded videos
  fileName: string;                     // Original filename for uploaded videos
  fileSize: number;                     // File size in bytes
  duration?: number;                    // Video duration in seconds
  uploadDate: Date;
  thumbnail?: string;                   // Thumbnail image blob URL
}

// Failure module interface
export interface FailureModule {
  id: string;
  title: string;
  description: string;
  videoContent: VideoContent[];        // Video content system
  isExpanded?: boolean;
  faultCode?: FaultCode;               // Link to detailed fault code
  detectedDate?: Date;
  resolvedDate?: Date;
  technicianNotes?: string;
}

// Enhanced truck interface
export interface Truck {
  id?: string;
  manufacturer?: TruckManufacturer;
  model: string;
  modelYear?: number;
  vin: string;
  engineNumber: string;
  engineManufacturer?: EngineManufacturer;
  engineModel?: string;
  odometerReading: number;
  engineHours: number;
  failures: FailureModule[];
  maintenanceHistory?: MaintenanceRecord[];
  lastServiceDate?: Date;
  nextServiceDue?: Date;
  fleetId?: string;
  unitNumber?: string;
}

// Maintenance record interface
export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION';
  description: string;
  performedBy: string;
  cost?: number;
  faultCodesResolved?: string[];
  partsReplaced?: string[];
  nextServiceRecommended?: Date;
}

// Diagnostic session interface
export interface DiagnosticSession {
  id: string;
  truckId: string;
  startTime: Date;
  endTime?: Date;
  technicianId: string;
  faultCodesFound: FaultCode[];
  diagnosticToolsUsed: string[];
  recommendations: string[];
  estimatedRepairTime?: string;
  urgencyAssessment: UrgencyLevel;
}