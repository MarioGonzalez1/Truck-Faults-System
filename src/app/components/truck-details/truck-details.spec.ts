import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckDetails } from './truck-details';

describe('TruckDetails', () => {
  let component: TruckDetails;
  let fixture: ComponentFixture<TruckDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TruckDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruckDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
