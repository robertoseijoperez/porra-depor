import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JornadaDetail } from './jornada-detail';

describe('JornadaDetail', () => {
  let component: JornadaDetail;
  let fixture: ComponentFixture<JornadaDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JornadaDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(JornadaDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
