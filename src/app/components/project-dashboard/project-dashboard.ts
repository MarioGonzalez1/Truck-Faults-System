import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../../services/project';
import { CsvTemplateService } from '../../services/csv-template.service';
import { CsvParserService, CsvParseResult } from '../../services/csv-parser.service';

export type ProjectType = 'truck-fleet' | 'general-problem' | 'presentation';

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  type: ProjectType;
  trucks: any[];
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  filename: string;
  url: string;
  description?: string;
  uploadDate: Date;
  fileSize?: number;
}

export interface GeneralProblemProject extends Project {
  type: 'general-problem';
  problemDescription: string;
  mediaContent: MediaItem[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'investigating' | 'resolved';
  tags?: string[];
}

export interface PresentationProject extends Project {
  type: 'presentation';
  presentationUrl: string;
}


@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './project-dashboard.html',
  styleUrl: './project-dashboard.scss'
})
export class ProjectDashboardComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchTerm: string = '';
  showCreateProject = false;
  editingProject: Project | null = null;
  projectData = {
    title: '',
    description: '',
    type: 'truck-fleet' as ProjectType,
    presentationUrl: ''
  };

  // CSV Upload properties
  selectedCsvFile: File | null = null;
  csvParseResult: CsvParseResult | null = null;
  showCsvResults = false;
  isProcessingCsv = false;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private http: HttpClient,
    private csvTemplateService: CsvTemplateService,
    private csvParserService: CsvParserService
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    // Load projects from localStorage
    const savedProjects = localStorage.getItem('truck-fault-projects');
    if (savedProjects) {
      this.projects = JSON.parse(savedProjects).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        // Migrate legacy projects without type to truck-fleet
        type: p.type || 'truck-fleet'
      }));
      // Save migrated projects back to localStorage
      this.saveProjects();
      this.filterProjects();
    } else {
      // If no projects in localStorage, try to load from fallback JSON file
      this.loadFallbackProjects();
    }
  }

  private loadFallbackProjects() {
    this.http.get<Project[]>('/assets/Truck-fault-project.json').subscribe({
      next: (projects) => {
        if (projects && projects.length > 0) {
          // Convert date strings to Date objects and add type field
          this.projects = projects.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            type: p.type || 'truck-fleet'
          }));
          // Save the fallback projects to localStorage
          this.saveProjects();
          this.filterProjects();
        }
      },
      error: (error) => {
        console.warn('Could not load fallback projects data:', error);
        this.projects = [];
        this.filteredProjects = [];
      }
    });
  }

  saveProjects() {
    localStorage.setItem('truck-fault-projects', JSON.stringify(this.projects));
  }

  saveProject() {
    if (!this.projectData.title.trim()) return;

    if (this.editingProject) {
      // Update existing project
      const index = this.projects.findIndex(p => p.id === this.editingProject!.id);
      if (index >= 0) {
        this.projects[index] = {
          ...this.projects[index],
          title: this.projectData.title,
          description: this.projectData.description,
          type: this.projectData.type
        };
      }
    } else {
      // Create new project based on type
      if (this.projectData.type === 'general-problem') {
        const newProject: GeneralProblemProject = {
          id: Date.now().toString(),
          title: this.projectData.title,
          description: this.projectData.description,
          type: 'general-problem',
          createdAt: new Date(),
          trucks: [], // Keep for compatibility
          problemDescription: this.projectData.description || '',
          mediaContent: [],
          severity: 'medium',
          status: 'open',
          tags: []
        };
        this.projects.push(newProject);
      } else if (this.projectData.type === 'presentation') {
        const newProject: PresentationProject = {
          id: Date.now().toString(),
          title: this.projectData.title,
          description: this.projectData.description,
          type: 'presentation',
          createdAt: new Date(),
          trucks: [], // Keep for compatibility
          presentationUrl: this.projectData.presentationUrl
        };
        this.projects.push(newProject);
      } else {
        // Regular truck fleet project
        const trucks = this.csvParseResult?.success ? this.csvParseResult.trucks : [];

        const newProject: Project = {
          id: Date.now().toString(),
          title: this.projectData.title,
          description: this.projectData.description,
          type: 'truck-fleet',
          createdAt: new Date(),
          trucks: trucks
        };
        this.projects.push(newProject);

        // Show success message if CSV was processed
        if (this.csvParseResult?.success && trucks.length > 0) {
          setTimeout(() => {
            alert(`Project created successfully with ${trucks.length} trucks imported from CSV!`);
          }, 100);
        }
      }
    }

    this.saveProjects();
    this.filterProjects();
    this.closeModal();
  }

  openProject(project: Project) {
    // Add professional transition effect
    const dashboardContainer = document.querySelector('.dashboard-container');

    if (dashboardContainer) {
      // Add exit animation class
      dashboardContainer.classList.add('project-transition-exit');

      // Wait for exit animation to complete
      setTimeout(() => {
        // Set the current project in the service (this will trigger updates)
        this.projectService.setCurrentProject(project);

        // Navigate based on project type
        if (project.type === 'general-problem') {
          this.router.navigate(['/general-problem', project.id]);
        } else if (project.type === 'presentation') {
          this.router.navigate(['/presentation', project.id]);
        } else {
          // Navigate to the truck fault analysis system
          this.router.navigate(['/project', project.id]);
        }
      }, 300); // Match the CSS animation duration
    } else {
      // Fallback: immediate navigation if container not found
      this.projectService.setCurrentProject(project);

      if (project.type === 'general-problem') {
        this.router.navigate(['/general-problem', project.id]);
      } else if (project.type === 'presentation') {
        this.router.navigate(['/presentation', project.id]);
      } else {
        this.router.navigate(['/project', project.id]);
      }
    }
  }

  editProject(project: Project, event: Event) {
    event.stopPropagation();
    this.editingProject = project;
    this.projectData = {
      title: project.title,
      description: project.description || '',
      type: project.type || 'truck-fleet',
      presentationUrl: project.type === 'presentation' ? (project as PresentationProject).presentationUrl : ''
    };
    this.showCreateProject = true;
  }

  deleteProject(project: Project, event: Event) {
    event.stopPropagation();
    const confirmed = confirm(`Are you sure you want to delete the project "${project.title}"?`);
    if (confirmed) {
      this.projects = this.projects.filter(p => p.id !== project.id);
      this.saveProjects();
      this.filterProjects();
    }
  }

  closeModal() {
    this.showCreateProject = false;
    this.editingProject = null;
    this.projectData = {
      title: '',
      description: '',
      type: 'truck-fleet',
      presentationUrl: ''
    };
    // Clear CSV upload state
    this.clearCsvUpload();
  }

  // CSV Upload functionality
  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const validation = this.csvParserService.validateCsvFile(file);

      if (!validation.isValid) {
        alert('File validation failed:\n' + validation.errors.join('\n'));
        input.value = ''; // Clear the input
        return;
      }

      this.selectedCsvFile = file;
      this.processCsvFile();
    }
  }

  processCsvFile(): void {
    if (!this.selectedCsvFile) return;

    this.isProcessingCsv = true;
    this.csvParseResult = null;

    this.csvParserService.readFileAsText(this.selectedCsvFile).subscribe({
      next: (content) => {
        this.csvParserService.parseCsvToTrucks(content).subscribe({
          next: (result) => {
            this.csvParseResult = result;
            this.showCsvResults = true;
            this.isProcessingCsv = false;

            if (result.success) {
              console.log(`Successfully parsed ${result.validRows} trucks from CSV`);
            } else {
              console.warn(`CSV parsing completed with ${result.errors.length} errors`);
            }
          },
          error: (error) => {
            alert('Error processing CSV: ' + error.message);
            this.isProcessingCsv = false;
          }
        });
      },
      error: (error) => {
        alert('Error reading file: ' + error.message);
        this.isProcessingCsv = false;
      }
    });
  }

  clearCsvUpload(): void {
    this.selectedCsvFile = null;
    this.csvParseResult = null;
    this.showCsvResults = false;
    this.isProcessingCsv = false;

    // Clear file input
    const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeCsvFile(): void {
    this.clearCsvUpload();
  }

  getTotalIssues(project: Project): number {
    return project.trucks.reduce((total, truck) => {
      return total + (truck.failures ? truck.failures.length : 0);
    }, 0);
  }

  // Search functionality
  onSearchChange(): void {
    this.filterProjects();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterProjects();
  }

  private filterProjects(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProjects = [...this.projects];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredProjects = this.projects.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower))
      );
    }
  }

  // CSV Template functionality
  downloadCsvTemplate(): void {
    const filename = `truck_fleet_template_${Date.now()}.csv`;
    this.csvTemplateService.downloadFleetTemplate(filename);
  }

  getCsvTemplateInstructions(): string[] {
    return this.csvTemplateService.getTemplateInstructions();
  }

  getCsvFieldDescriptions(): { [key: string]: string } {
    return this.csvTemplateService.getFieldDescriptions();
  }

}