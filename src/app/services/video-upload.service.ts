import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { VideoContent } from '../models/truck.model';

@Injectable({
  providedIn: 'root'
})
export class VideoUploadService {
  
  private maxFileSize = 500 * 1024 * 1024; // 500MB limit
  private allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime'];

  constructor() { }

  /**
   * Validates if the file is acceptable for upload
   */
  validateVideoFile(file: File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }

    if (!this.allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: `Unsupported file type. Allowed types: ${this.allowedTypes.join(', ')}` 
      };
    }

    if (file.size > this.maxFileSize) {
      return { 
        isValid: false, 
        error: `File size too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB` 
      };
    }

    return { isValid: true };
  }

  /**
   * Creates a video content object from uploaded file
   */
  createVideoContent(file: File): Observable<VideoContent> {
    return from(this.processVideoFile(file));
  }

  /**
   * Processes the video file and creates a VideoContent object
   */
  private async processVideoFile(file: File): Promise<VideoContent> {
    const url = URL.createObjectURL(file);
    const thumbnail = await this.generateThumbnail(file);
    const duration = await this.getVideoDuration(url);

    const videoContent: VideoContent = {
      id: this.generateId(),
      type: 'UPLOADED',
      url: url,
      fileName: file.name,
      fileSize: file.size,
      duration: duration,
      uploadDate: new Date(),
      thumbnail: thumbnail
    };

    return videoContent;
  }

  /**
   * Generates a thumbnail from the video file
   */
  private generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.preload = 'metadata';
      video.addEventListener('loadedmetadata', () => {
        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to 10% of video duration for thumbnail
        video.currentTime = video.duration * 0.1;
      });

      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailUrl);
        } else {
          reject('Failed to create thumbnail');
        }
      });

      video.addEventListener('error', () => {
        reject('Failed to load video for thumbnail generation');
      });

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Gets the duration of a video
   */
  private getVideoDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.addEventListener('loadedmetadata', () => {
        resolve(video.duration);
      });

      video.addEventListener('error', () => {
        reject('Failed to load video metadata');
      });

      video.src = url;
    });
  }


  /**
   * Formats file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formats duration for display
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Cleans up blob URLs to prevent memory leaks
   */
  cleanupBlobUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Generates a unique ID for video content
   */
  private generateId(): string {
    return 'video_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}