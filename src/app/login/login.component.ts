import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService } from '../auth.service'

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
  loading = false

  constructor(
    private authService: AuthService,
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
      const { data, error } = await this.authService.login(this.email, this.password)
      
      console.log('📊 Login response:', { data, error })

      if (error) {
        console.error('❌ Login error:', error)
        alert(`Erreur: ${error.message}`)
      } else {
        console.log('✅ Login success:', data)
        this.router.navigate(['/dashboard'])
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      alert(`Erreur inattendue: ${err.message}`)
    } finally {
      this.loading = false
    }
  }

  async signUp() {
    console.log('📝 Sign up button clicked')
    console.log('📧 Email:', this.email)
    console.log('🔒 Password:', this.password ? '***' : 'empty')
    
    if (!this.email || !this.password) {
      alert('Veuillez remplir tous les champs')
      return
    }
    
    this.loading = true

    try {
      const { data, error } = await this.authService.signUp(this.email, this.password)
      
      console.log('📊 Sign up response:', { data, error })

      if (error) {
        console.error('❌ Sign up error:', error)
        alert(`Erreur: ${error.message}`)
      } else {
        console.log('✅ Sign up success:', data)
        alert('Compte créé! Vous pouvez maintenant vous connecter.')
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      alert(`Erreur inattendue: ${err.message}`)
    } finally {
      this.loading = false
    }
  }
}
