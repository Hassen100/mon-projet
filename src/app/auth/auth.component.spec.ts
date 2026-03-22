import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [AuthComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with login mode', () => {
    expect(component.isLoginMode).toBe(true);
  });

  it('should toggle to signup mode', () => {
    component.toggleMode('signup');
    expect(component.isLoginMode).toBe(false);
  });

  it('should toggle back to login mode', () => {
    component.toggleMode('signup');
    component.toggleMode('login');
    expect(component.isLoginMode).toBe(true);
  });

  it('should toggle password visibility', () => {
    const initialShowPassword = component.showPassword;
    component.togglePasswordVisibility('password');
    expect(component.showPassword).toBe(!initialShowPassword);
  });

  it('should validate login form', () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    });
    expect(component.loginForm.valid).toBe(false); // Password too short
  });

  it('should validate signup form', () => {
    component.signUpForm.setValue({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    expect(component.signUpForm.valid).toBe(true);
  });

  it('should show error for mismatched passwords', () => {
    component.signUpForm.setValue({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword!'
    });
    expect(component.signUpForm.errors?.['passwordMismatch']).toBe(true);
  });
});
