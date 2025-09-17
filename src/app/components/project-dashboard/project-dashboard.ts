import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../../services/project';

export type ProjectType = 'truck-fleet' | 'general-problem';

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
    type: 'truck-fleet' as ProjectType
  };

  constructor(private router: Router, private projectService: ProjectService, private http: HttpClient) {}

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
      } else {
        // Regular truck fleet project
        const newProject: Project = {
          id: Date.now().toString(),
          title: this.projectData.title,
          description: this.projectData.description,
          type: 'truck-fleet',
          createdAt: new Date(),
          trucks: []
        };
        this.projects.push(newProject);
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
      type: project.type || 'truck-fleet'
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
      type: 'truck-fleet'
    };
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
}