import { TestBed } from '@angular/core/testing';

import { Sheets } from './sheets';

describe('Sheets', () => {
  let service: Sheets;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sheets);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
