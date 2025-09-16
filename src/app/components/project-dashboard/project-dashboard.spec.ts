import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDashboard } from './project-dashboard';

describe('ProjectDashboard', () => {
  let component: ProjectDashboard;
  let fixture: ComponentFixture<ProjectDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
