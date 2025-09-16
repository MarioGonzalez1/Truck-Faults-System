import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Project } from '../components/project-dashboard/project-dashboard';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private currentProjectSubject = new BehaviorSubject<Project | null>(null);
  public currentProject$ = this.currentProjectSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentProject();
  }

  private loadCurrentProject() {
    const projectData = localStorage.getItem('current-project');
    if (projectData) {
      const project = JSON.parse(projectData);
      // Always sync with the latest version from projects list
      this.setCurrentProject(project);
    } else {
      // If no current project, try to load from fallback JSON file
      this.loadFallbackProject();
    }
  }

  private loadFallbackProject() {
    this.http.get<Project>('/assets/Current-project.json').subscribe({
      next: (project) => {
        if (project && project.id) {
          // Save the fallback project to localStorage
          this.setCurrentProject(project);

          // Also save to projects list if it doesn't exist
          const savedProjects = localStorage.getItem('truck-fault-projects');
          const projects = savedProjects ? JSON.parse(savedProjects) : [];

          // Check if project already exists
          if (!projects.some((p: Project) => p.id === project.id)) {
            projects.push(project);
            localStorage.setItem('truck-fault-projects', JSON.stringify(projects));
          }
        }
      },
      error: (error) => {
        console.warn('Could not load fallback project data:', error);
      }
    });
  }

  reloadCurrentProject() {
    const currentProject = this.getCurrentProject();
    if (currentProject) {
      this.setCurrentProject(currentProject);
    }
  }

  setCurrentProject(project: Project | null) {
    if (project && project.id) {
      // Always get the latest version from projects list
      const savedProjects = localStorage.getItem('truck-fault-projects');
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        const latestProject = projects.find((p: any) => p.id === project!.id);
        if (latestProject) {
          project = latestProject;
        }
      }
      localStorage.setItem('current-project', JSON.stringify(project));
      this.currentProjectSubject.next(project);
    } else {
      localStorage.removeItem('current-project');
      this.currentProjectSubject.next(null);
    }
  }

  getCurrentProject(): Project | null {
    return this.currentProjectSubject.value;
  }

  updateCurrentProject(updates: Partial<Project>) {
    const currentProject = this.getCurrentProject();
    if (currentProject) {
      const updatedProject = { ...currentProject, ...updates };
      this.setCurrentProject(updatedProject);

      // Also update in projects list
      this.updateProjectInList(updatedProject);
    }
  }

  private updateProjectInList(updatedProject: Project) {
    const savedProjects = localStorage.getItem('truck-fault-projects');
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const index = projects.findIndex(p => p.id === updatedProject.id);
      if (index >= 0) {
        projects[index] = updatedProject;
        localStorage.setItem('truck-fault-projects', JSON.stringify(projects));
      }
    }
  }

  addTruckToCurrentProject(truck: any) {
    const currentProject = this.getCurrentProject();
    if (currentProject) {
      if (!currentProject.trucks) {
        currentProject.trucks = [];
      }
      currentProject.trucks.push(truck);
      this.updateCurrentProject({ trucks: currentProject.trucks });
    }
  }

  removeTruckFromCurrentProject(truckVin: string) {
    const currentProject = this.getCurrentProject();
    if (currentProject && currentProject.trucks) {
      currentProject.trucks = currentProject.trucks.filter(truck => truck.vin !== truckVin);
      this.updateCurrentProject({ trucks: currentProject.trucks });
    }
  }

  updateTruckInCurrentProject(truckVin: string, updatedTruck: any) {
    const currentProject = this.getCurrentProject();
    if (currentProject && currentProject.trucks) {
      const index = currentProject.trucks.findIndex(truck => truck.vin === truckVin);
      if (index >= 0) {
        currentProject.trucks[index] = updatedTruck;
        this.updateCurrentProject({ trucks: currentProject.trucks });
      }
    }
  }

  getProjectTrucks(): any[] {
    const currentProject = this.getCurrentProject();
    return currentProject?.trucks || [];
  }
}