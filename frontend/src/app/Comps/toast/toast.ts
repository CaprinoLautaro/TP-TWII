import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toastService/toast-service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent {
  public toastService = inject(ToastService);
}