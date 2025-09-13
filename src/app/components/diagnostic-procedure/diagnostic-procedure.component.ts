import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  DiagnosticStep, 
  FaultCode, 
  FaultSeverity,
  UrgencyLevel 
} from '../../models/truck.model';

@Component({
  selector: 'app-diagnostic-procedure',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostic-procedure.component.html',
  styleUrls: ['./diagnostic-procedure.component.scss']
})
export class DiagnosticProcedureComponent {
  @Input() faultCode?: FaultCode;
  @Input() steps: DiagnosticStep[] = [];
  @Output() stepCompleted = new EventEmitter<DiagnosticStep>();
  @Output() procedureCompleted = new EventEmitter<void>();

  completedSteps: Set<number> = new Set();
  currentStep = 1;
  activeTab: 'overview' | 'steps' | 'tools' | 'safety' = 'overview';

  get progressPercentage(): number {
    if (!this.steps.length) return 0;
    return (this.completedSteps.size / this.steps.length) * 100;
  }

  get estimatedTimeRemaining(): string {
    if (!this.faultCode?.repairActions) return 'Unknown';
    
    const remainingSteps = this.steps.filter(
      step => !this.completedSteps.has(step.stepNumber)
    );
    
    // Calculate based on average time per step
    const avgMinutes = 15; // Default 15 minutes per step
    const totalMinutes = remainingSteps.length * avgMinutes;
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  }

  getSeverityClass(severity?: FaultSeverity): string {
    if (!severity) return '';
    return severity.toLowerCase();
  }

  getUrgencyClass(urgency?: UrgencyLevel): string {
    if (!urgency) return '';
    switch (urgency) {
      case UrgencyLevel.IMMEDIATE_STOP:
        return 'critical';
      case UrgencyLevel.URGENT:
        return 'high';
      case UrgencyLevel.SCHEDULED:
        return 'medium';
      case UrgencyLevel.MONITOR:
        return 'low';
      default:
        return '';
    }
  }

  markStepComplete(step: DiagnosticStep): void {
    this.completedSteps.add(step.stepNumber);
    this.stepCompleted.emit(step);
    
    if (this.completedSteps.size === this.steps.length) {
      this.procedureCompleted.emit();
    } else {
      // Auto-advance to next step
      const nextStep = this.steps.find(
        s => s.stepNumber === step.stepNumber + 1
      );
      if (nextStep) {
        this.currentStep = nextStep.stepNumber;
      }
    }
  }

  isStepComplete(stepNumber: number): boolean {
    return this.completedSteps.has(stepNumber);
  }

  isStepActive(stepNumber: number): boolean {
    return this.currentStep === stepNumber;
  }

  selectStep(stepNumber: number): void {
    this.currentStep = stepNumber;
  }

  setActiveTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }

  formatSPN(spn?: number): string {
    if (!spn) return 'N/A';
    return `SPN ${spn}`;
  }

  formatFMI(fmi?: number): string {
    if (!fmi) return 'N/A';
    return `FMI ${fmi}`;
  }
}