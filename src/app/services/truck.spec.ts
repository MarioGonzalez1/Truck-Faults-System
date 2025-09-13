import { TestBed } from '@angular/core/testing';

import { Truck } from './truck';

describe('Truck', () => {
  let service: Truck;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Truck);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
