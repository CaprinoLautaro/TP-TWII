import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  imports: [ReactiveFormsModule, CommonModule],
  selector: 'app-signin',
  styleUrl: './signin.css',
  templateUrl: './signin.html',
})
export class Signin {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }
  onSubmit(): void{
    console.log('Se presiono iniciar sesion')
  };
}

