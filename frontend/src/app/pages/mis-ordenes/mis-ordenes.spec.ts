import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisOrdenes } from './mis-ordenes';

describe('MisOrdenes', () => {
  let component: MisOrdenes;
  let fixture: ComponentFixture<MisOrdenes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisOrdenes],
    }).compileComponents();

    fixture = TestBed.createComponent(MisOrdenes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
