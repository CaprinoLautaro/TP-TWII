import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { OrderService } from './order-service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderService, provideHttpClient()]
    });
    service = TestBed.inject(OrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});