import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { PresentationProject } from '../project-dashboard/project-dashboard';

@Component({
  selector: 'app-presentation-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './presentation-viewer.html',
  styleUrl: './presentation-viewer.scss'
})
export class PresentationViewerComponent implements OnInit {
  project: PresentationProject | null = null;
  safeUrl: SafeResourceUrl | null = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    } else {
      this.showError('Project ID not found');
    }
  }

  loadProject(projectId: string) {
    try {
      // Load project from localStorage
      const projects = JSON.parse(localStorage.getItem('truck-fault-projects') || '[]');
      const project = projects.find((p: any) => p.id === projectId && p.type === 'presentation');

      if (project) {
        this.project = project;
        this.setupPresentationUrl();
      } else {
        this.showError('Presentation project not found');
      }
    } catch (error) {
      this.showError('Error loading presentation project');
    }
  }

  setupPresentationUrl() {
    if (!this.project?.presentationUrl) {
      this.showError('No presentation URL provided');
      return;
    }

    try {
      // Sanitize the URL for iframe usage
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.project.presentationUrl);
      this.isLoading = false;
    } catch (error) {
      this.showError('Invalid presentation URL');
    }
  }

  showError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  openInNewTab() {
    if (this.project?.presentationUrl) {
      window.open(this.project.presentationUrl, '_blank');
    }
  }

  reloadPresentation() {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // Small delay to show loading state
    setTimeout(() => {
      this.setupPresentationUrl();
    }, 500);
  }
}