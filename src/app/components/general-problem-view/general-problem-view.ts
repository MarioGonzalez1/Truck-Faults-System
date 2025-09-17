import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../services/project';
import { GeneralProblemProject, MediaItem } from '../project-dashboard/project-dashboard';

@Component({
  selector: 'app-general-problem-view',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './general-problem-view.html',
  styleUrl: './general-problem-view.scss'
})
export class GeneralProblemViewComponent implements OnInit {
  project: GeneralProblemProject | null = null;
  isEditing = false;
  editData = {
    title: '',
    problemDescription: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'open' as 'open' | 'investigating' | 'resolved',
    tags: [] as string[]
  };
  newTag = '';
  selectedFiles: File[] = [];
  showMediaModal = false;
  selectedMedia: MediaItem | null = null;
  currentMediaIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const projectId = params['id'];
      if (projectId) {
        this.loadProject(projectId);
      }
    });
  }

  private loadProject(projectId: string) {
    const savedProjects = localStorage.getItem('truck-fault-projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const project = projects.find((p: any) => p.id === projectId && p.type === 'general-problem');
      if (project) {
        this.project = {
          ...project,
          createdAt: new Date(project.createdAt)
        };
        this.projectService.setCurrentProject(this.project);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  startEditing() {
    if (!this.project) return;

    this.isEditing = true;
    this.editData = {
      title: this.project.title,
      problemDescription: this.project.problemDescription,
      severity: this.project.severity || 'medium',
      status: this.project.status || 'open',
      tags: [...(this.project.tags || [])]
    };
  }

  cancelEditing() {
    this.isEditing = false;
    this.editData = {
      title: '',
      problemDescription: '',
      severity: 'medium',
      status: 'open',
      tags: []
    };
    this.newTag = '';
    this.selectedFiles = [];
  }

  saveChanges() {
    if (!this.project) return;

    const updatedProject: GeneralProblemProject = {
      ...this.project,
      title: this.editData.title,
      problemDescription: this.editData.problemDescription,
      severity: this.editData.severity,
      status: this.editData.status,
      tags: this.editData.tags
    };

    // Update in localStorage
    const savedProjects = localStorage.getItem('truck-fault-projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const index = projects.findIndex((p: any) => p.id === this.project!.id);
      if (index >= 0) {
        projects[index] = updatedProject;
        localStorage.setItem('truck-fault-projects', JSON.stringify(projects));
        this.project = updatedProject;
        this.projectService.setCurrentProject(this.project);
      }
    }

    this.isEditing = false;
  }

  addTag() {
    if (this.newTag.trim() && !this.editData.tags.includes(this.newTag.trim())) {
      this.editData.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    this.editData.tags = this.editData.tags.filter(t => t !== tag);
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.selectedFiles = Array.from(files);
    }
  }

  uploadMedia() {
    if (!this.project || this.selectedFiles.length === 0) return;

    // Simulate file upload - in real app, this would upload to server
    const newMediaItems: MediaItem[] = this.selectedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      filename: file.name,
      url: URL.createObjectURL(file), // In real app, this would be server URL
      description: '',
      uploadDate: new Date(),
      fileSize: file.size
    }));

    const updatedProject: GeneralProblemProject = {
      ...this.project,
      mediaContent: [...this.project.mediaContent, ...newMediaItems]
    };

    // Update in localStorage
    const savedProjects = localStorage.getItem('truck-fault-projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const index = projects.findIndex((p: any) => p.id === this.project!.id);
      if (index >= 0) {
        projects[index] = updatedProject;
        localStorage.setItem('truck-fault-projects', JSON.stringify(projects));
        this.project = updatedProject;
      }
    }

    this.selectedFiles = [];
  }

  removeMedia(mediaId: string) {
    if (!this.project) return;

    const updatedProject: GeneralProblemProject = {
      ...this.project,
      mediaContent: this.project.mediaContent.filter(m => m.id !== mediaId)
    };

    // Update in localStorage
    const savedProjects = localStorage.getItem('truck-fault-projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const index = projects.findIndex((p: any) => p.id === this.project!.id);
      if (index >= 0) {
        projects[index] = updatedProject;
        localStorage.setItem('truck-fault-projects', JSON.stringify(projects));
        this.project = updatedProject;
      }
    }
  }


  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'open': return '#ef4444';
      case 'investigating': return '#f59e0b';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  }

  openMediaModal(media: MediaItem) {
    if (!this.project) return;

    this.currentMediaIndex = this.project.mediaContent.findIndex(item => item.id === media.id);
    this.selectedMedia = media;
    this.showMediaModal = true;

    // Add keyboard event listener
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  closeMediaModal() {
    this.showMediaModal = false;
    this.selectedMedia = null;
    this.currentMediaIndex = 0;

    // Remove keyboard event listener
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  nextMedia() {
    if (!this.project || this.project.mediaContent.length === 0) return;

    this.currentMediaIndex = (this.currentMediaIndex + 1) % this.project.mediaContent.length;
    this.selectedMedia = this.project.mediaContent[this.currentMediaIndex];
  }

  previousMedia() {
    if (!this.project || this.project.mediaContent.length === 0) return;

    this.currentMediaIndex = this.currentMediaIndex === 0
      ? this.project.mediaContent.length - 1
      : this.currentMediaIndex - 1;
    this.selectedMedia = this.project.mediaContent[this.currentMediaIndex];
  }

  handleKeyPress(event: KeyboardEvent) {
    switch(event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.nextMedia();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousMedia();
        break;
      case 'Escape':
        event.preventDefault();
        this.closeMediaModal();
        break;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
