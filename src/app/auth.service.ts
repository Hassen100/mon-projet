import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { supabase } from './supabaseClient'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$ = new BehaviorSubject<any>(null)

  constructor() {
    supabase.auth.onAuthStateChange((event, session) => {
      this.user$.next(session?.user ?? null)
    })
  }

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  async logout() {
    await supabase.auth.signOut()
  }

  async getUser() {
    const { data } = await supabase.auth.getUser()
    return data
  }

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  }
}
