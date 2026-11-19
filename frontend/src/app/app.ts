import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './Comps/navbar/navbar';
import { ToastComponent } from './Comps/toast/toast';

@Component({
  imports: [RouterOutlet, Navbar, ToastComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('TP-TWII');
}
