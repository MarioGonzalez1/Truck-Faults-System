import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { VideoContent } from '../../models/truck.model';
import { VideoUploadService } from '../../services/video-upload.service';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule
  ],
  templateUrl: './video-upload.html',
  styleUrls: ['./video-upload.scss']
})
export class VideoUploadComponent {
  @Input() existingVideos: VideoContent[] = [];
  @Output() videoAdded = new EventEmitter<VideoContent>();
  @Output() videoRemoved = new EventEmitter<VideoContent>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isUploading = false;
  uploadProgress = 0;

  constructor(
    private videoUploadService: VideoUploadService,
    private snackBar: MatSnackBar
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadVideoFile(file);
    }
  }

  private uploadVideoFile(file: File): void {
    const validation = this.videoUploadService.validateVideoFile(file);
    
    if (!validation.isValid) {
      this.snackBar.open(validation.error || 'Invalid file', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 90) {
        clearInterval(progressInterval);
      }
    }, 200);

    this.videoUploadService.createVideoContent(file).subscribe({
      next: (videoContent) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.videoAdded.emit(videoContent);
          this.snackBar.open('Video uploaded successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Reset file input
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
        }, 500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;
        this.snackBar.open('Failed to upload video: ' + error, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }


  removeVideo(video: VideoContent): void {
    this.videoRemoved.emit(video);
    
    // Clean up blob URL
    this.videoUploadService.cleanupBlobUrl(video.url);
    
    this.snackBar.open('Video removed', 'Close', {
      duration: 2000
    });
  }

  getVideoDisplayName(video: VideoContent): string {
    return video.fileName;
  }

  getVideoSize(video: VideoContent): string {
    return this.videoUploadService.formatFileSize(video.fileSize);
  }

  getVideoDuration(video: VideoContent): string {
    if (video.duration) {
      return this.videoUploadService.formatDuration(video.duration);
    }
    return '';
  }


  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
}