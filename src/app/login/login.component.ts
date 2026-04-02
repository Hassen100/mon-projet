import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { WorkingAuthService, User } from '../services/working-auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = ''
  password = ''
  username = ''
  first_name = ''
  last_name = ''
  isLoginMode = true
  loading = false

  constructor(
    private workingAuthService: WorkingAuthService,
    private router: Router
  ) {}

  async login() {
    console.log('🔑 Login button clicked')
    console.log('📧 Email:', this.email)
    console.log('🔒 Password:', this.password ? '***' : 'empty')
    
    if (!this.email || !this.password) {
      alert('Veuillez remplir tous les champs')
      return
    }
    
    this.loading = true

    try {
      const response = await this.workingAuthService.login(this.email, this.password)
      
      console.log('📊 Login response:', response)

      if (response) {
        console.log('✅ Login success:', response)
        await this.workingAuthService.handleLoginResponse(response)
        console.log('🔐 Tokens handled, navigating to dashboard...')
        await this.router.navigate(['/dashboard'])
        console.log('🎯 Navigation to dashboard completed')
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      console.error('❌ Error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      })
      
      // Gestion améliorée des erreurs
      if (error.status === 400 || error.status === 401) {
        // Erreur du backend
        if (error.error && typeof error.error === 'object') {
          if (error.error.detail) {
            alert(`Erreur: ${error.error.detail}`)
          } else if (error.error.error) {
            alert(`Erreur: ${error.error.error}`)
          } else if (error.error.email) {
            alert(`Erreur email: ${error.error.email[0]}`)
          } else if (error.error.password) {
            alert(`Erreur mot de passe: ${error.error.password[0]}`)
          } else {
            alert('E-mail ou mot de passe incorrect.')
          }
        } else {
          alert('E-mail ou mot de passe incorrect.')
        }
      } else if (error.status === 0) {
        alert('Erreur de connexion au serveur. Vérifiez que le backend est démarré.')
      } else {
        alert(`Erreur: ${error.message || 'Erreur de connexion'}`)
      }
    } finally {
      this.loading = false
    }
  }

  async signUp() {
    console.log('� Sign up button clicked')
    console.log('📧 Email:', this.email)
    console.log('👤 Username:', this.username)
    console.log('� First name:', this.first_name)
    console.log('👤 Last name:', this.last_name)
    
    if (!this.email || !this.username || !this.first_name || !this.last_name || !this.password) {
      alert('Veuillez remplir tous les champs')
      return
    }
    
    this.loading = true

    try {
      const response = await this.workingAuthService.register(
        this.email,
        this.username,
        this.first_name,
        this.last_name,
        this.password,
        this.password
      )
      
      console.log('📊 Sign up response:', response)

      if (response) {
        console.log('✅ Sign up success:', response)
        await this.workingAuthService.handleRegisterResponse(response)
        console.log('🔐 Tokens handled, navigating to dashboard...')
        await this.router.navigate(['/dashboard'])
        console.log('🎯 Navigation to dashboard completed')
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error)
      if (error.status === 400) {
        const errorData = error.error
        if (errorData.email) {
          alert(`Erreur email: ${errorData.email[0]}`)
        } else if (errorData.username) {
          alert(`Erreur username: ${errorData.username[0]}`)
        } else if (errorData.password) {
          alert(`Erreur mot de passe: ${errorData.password[0]}`)
        } else {
          alert('Erreur: ' + JSON.stringify(errorData))
        }
      } else {
        alert(`Erreur: ${error.message || 'Erreur lors de l\'inscription'}`)
      }
    } finally {
      this.loading = false
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode
  }
}
