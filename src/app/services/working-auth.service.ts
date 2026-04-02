import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  refresh: string;
  access: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class WorkingAuthService {
  private apiUrl = environment.apiUrl + '/auth';
  
  currentUser: User | null = null;
  accessToken: string | null = null;
  refreshToken: string | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  private saveToStorage(): void {
    if (this.accessToken) {
      localStorage.setItem('access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('refresh_token', this.refreshToken);
    }
    if (this.currentUser) {
      localStorage.setItem('current_user', JSON.stringify(this.currentUser));
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser = null;
  }

  isLoggedIn(): boolean {
    return this.accessToken !== null && this.currentUser !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async login(email: string, password: string): Promise<any> {
    console.log('🔐 Login attempt:', email);
    console.log('🔐 API URL:', this.apiUrl);
    console.log('🔐 Full URL:', `${this.apiUrl}/login/`);
    
    if (!email || !password) {
      console.error('❌ Email or password is empty');
      throw new Error('Email and password are required');
    }
    
    try {
      console.log('📡 Sending HTTP POST request...');
      
      const response = await this.http.post<any>(`${this.apiUrl}/login/`, {
        email,
        password
      }).toPromise();
      
      console.log('� Login response received:', response);
      
      if (response && response.access && response.user) {
        this.accessToken = response.access;
        this.refreshToken = response.refresh;
        this.currentUser = response.user;
        this.saveToStorage();
        console.log('✅ Login successful, user saved:', this.currentUser);
        return response;
      } else {
        console.error('❌ Invalid response format:', response);
        // Créer une erreur avec les détails du backend
        const error = new Error('Invalid response from server');
        (error as any).status = 400;
        (error as any).error = response;
        throw error;
      }
    } catch (error: any) {
      console.error('❌ Login error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        url: `${this.apiUrl}/login/`
      });
      
      // Ajouter des informations supplémentaires à l'erreur
      if (error.status === undefined && error.error) {
        // Erreur HTTP avec réponse du backend
        (error as any).status = error.error.status || 400;
        (error as any).message = error.error.message || 'Login failed';
      } else if (error.status === 0) {
        // Erreur de connexion (CORS, serveur indisponible)
        (error as any).message = 'Erreur de connexion au serveur';
      }
      
      throw error;
    }
  }

  async register(email: string, username: string, first_name: string, last_name: string, password: string, password_confirm: string): Promise<any> {
    console.log('🔐 Register attempt:', { email, username });
    
    try {
      const response = await this.http.post<any>(`${this.apiUrl}/register/`, {
        email,
        username,
        first_name,
        last_name,
        password,
        password_confirm
      }).toPromise();
      
      console.log('🔐 Register response:', response);
      
      if (response && response.access && response.user) {
        this.accessToken = response.access;
        this.refreshToken = response.refresh;
        this.currentUser = response.user;
        this.saveToStorage();
        console.log('🔐 Register successful, user saved:', this.currentUser);
        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('🔐 Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    console.log('🔐 Logout attempt');
    this.clearStorage();
    console.log('🔐 Logout completed');
  }

  async handleLoginResponse(response: LoginResponse): Promise<void> {
    console.log('🔐 Handling login response:', response);
    this.accessToken = response.access;
    this.refreshToken = response.refresh;
    this.currentUser = response.user;
    this.saveToStorage();
    console.log('🔐 Login handled successfully');
  }

  async handleRegisterResponse(response: RegisterResponse): Promise<void> {
    console.log('🔐 Handling register response:', response);
    this.accessToken = response.access;
    this.refreshToken = response.refresh;
    this.currentUser = response.user;
    this.saveToStorage();
    console.log('🔐 Register handled successfully');
  }

  async isSessionValid(): Promise<boolean> {
    console.log('🔍 Checking session validity...');
    return this.isLoggedIn();
  }
}
