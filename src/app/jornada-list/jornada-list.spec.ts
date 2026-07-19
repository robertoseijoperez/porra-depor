import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JornadaList } from './jornada-list';

describe('JornadaList', () => {
  let component: JornadaList;
  let fixture: ComponentFixture<JornadaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JornadaList],
    }).compileComponents();

    fixture = TestBed.createComponent(JornadaList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
