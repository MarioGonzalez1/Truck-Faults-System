import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../../services/project';

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  trucks: any[];
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
    description: ''
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
        createdAt: new Date(p.createdAt)
      }));
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
          // Convert date strings to Date objects
          this.projects = projects.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt)
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
          description: this.projectData.description
        };
      }
    } else {
      // Create new project
      const newProject: Project = {
        id: Date.now().toString(),
        title: this.projectData.title,
        description: this.projectData.description,
        createdAt: new Date(),
        trucks: []
      };
      this.projects.push(newProject);
    }

    this.saveProjects();
    this.filterProjects();
    this.closeModal();
  }

  openProject(project: Project) {
    // Set the current project in the service (this will trigger updates)
    this.projectService.setCurrentProject(project);
    // Navigate to the truck fault analysis system
    this.router.navigate(['/project', project.id]);
  }

  editProject(project: Project, event: Event) {
    event.stopPropagation();
    this.editingProject = project;
    this.projectData = {
      title: project.title,
      description: project.description || ''
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
      description: ''
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