import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { supabase } from './supabaseClient'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    console.log('🛡️ AuthGuard: Checking authentication...')
    
    try {
      const { data, error } = await supabase.auth.getSession()
      
      console.log('🛡️ AuthGuard: Session check result:', { data, error })

      if (data.session && data.session.user) {
        console.log('✅ AuthGuard: User authenticated:', data.session.user.email)
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
