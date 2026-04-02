import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { WorkingAuthService } from './services/working-auth.service'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private workingAuthService: WorkingAuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    console.log('🛡️ AuthGuard: Checking authentication...')
    console.log('🛡️ Current user:', this.workingAuthService.getCurrentUser())
    console.log('🛡️ Access token exists:', !!this.workingAuthService.isLoggedIn())
    
    // Temporairement désactivé pour le debug
    console.log('🔓 AuthGuard: Temporarily disabled for debugging')
    return true
    
    try {
      const isValid = await this.workingAuthService.isSessionValid()
      
      console.log('🛡️ AuthGuard: Session check result:', isValid)

      if (isValid) {
        console.log('✅ AuthGuard: User authenticated, allowing access')
        return true
      }

      console.log('❌ AuthGuard: No valid session, redirecting to login')
      this.router.navigate(['/login'])
      return false
    } catch (err) {
      console.error('❌ AuthGuard: Error checking session:', err)
      this.router.navigate(['/login'])
      return false
    }
  }
}
