import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { slideAnimation } from './auth.animations';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  animations: [slideAnimation]
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  showPassword = false;
  showConfirmPassword = false;
  loginForm: FormGroup;
  signUpForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });

    this.signUpForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  // Custom password validator
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
    return valid ? null : { passwordStrength: true };
  }

  // Password match validator
  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Toggle between login and signup
  toggleMode(mode: 'login' | 'signup'): void {
    this.isLoginMode = mode === 'login';
    // Reset forms when switching
    if (mode === 'login') {
      this.signUpForm.reset();
    } else {
      this.loginForm.reset();
    }
  }

  // Toggle password visibility
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Handle login
  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      console.log('Login data:', this.loginForm.value);
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        // Navigate to dashboard on success
        this.router.navigate(['/dashboard']);
      }, 1500);
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  // Handle signup
  onSignUp(): void {
    if (this.signUpForm.valid) {
      this.isLoading = true;
      console.log('Signup data:', this.signUpForm.value);
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        // Switch to login mode after successful registration
        this.toggleMode('login');
      }, 1500);
    } else {
      this.markFormGroupTouched(this.signUpForm);
    }
  }

  // Mark all controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // Get error messages
  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    
    if (errors['required']) {
      return 'Ce champ est obligatoire';
    }
    
    if (errors['email']) {
      return 'Veuillez entrer une adresse email valide';
    }
    
    if (errors['minlength']) {
      return `Minimum ${errors['minlength'].requiredLength} caractères requis`;
    }
    
    if (errors['passwordStrength']) {
      return 'Le mot de passe doit contenir majuscules, minuscules, chiffres et caractères spéciaux';
    }
    
    if (fieldName === 'confirmPassword' && this.signUpForm.errors?.['passwordMismatch']) {
      return 'Les mots de passe ne correspondent pas';
    }
    
    return '';
  }

  // Check if field has error
  hasError(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  // Forgot password handler
  onForgotPassword(): void {
    console.log('Forgot password clicked');
    // Navigate to forgot password page or show modal
  }
}
