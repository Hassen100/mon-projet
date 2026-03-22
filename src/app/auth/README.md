# 🔐 Authentication Component

Une page d'authentification moderne et responsive pour votre dashboard SEO.

## 📋 Fonctionnalités

### ✨ Caractéristiques principales
- **Deux modes**: Connexion et Inscription
- **Animations fluides** lors du changement de formulaire
- **Design responsive** (mobile + desktop)
- **Validation en temps réel** avec messages d'erreur
- **Interface moderne** de type SaaS dashboard
- **Support dark mode** automatique
- **Accessibilité** optimisée

### 🎨 Design
- **Carte centrée** avec effet glassmorphism
- **Arrière-plan** dégradé animé
- **Icônes** intégrées dans les champs
- **Ombres douces** et coins arrondis
- **Transitions** et micro-interactions

### 📱 Responsive
- **Mobile**: Adaptation optimale (< 480px)
- **Tablette**: Mise en page fluide
- **Desktop**: Expérience complète

## 🔧 Utilisation

### Import dans votre module principal
```typescript
import { AuthModule } from './auth/auth.module';

@NgModule({
  imports: [
    AuthModule
  ],
  // ...
})
export class AppModule { }
```

### Ajouter les routes
```typescript
import { AuthRoutingModule } from './auth/auth-routing.module';

@NgModule({
  imports: [
    AuthRoutingModule
  ],
  // ...
})
export class AppModule { }
```

### Utiliser le composant
```html
<app-auth></app-auth>
```

## 📝 Champs du formulaire

### Formulaire de connexion
- **Email** - Validation format email
- **Password** - Minimum 8 caractères
- **Remember me** - Checkbox optionnel
- **Forgot password** - Lien de récupération

### Formulaire d'inscription
- **Full name** - Minimum 2 caractères
- **Email** - Validation format email
- **Password** - Minimum 8 caractères, complexité requise
- **Confirm password** - Correspondance obligatoire

## ✅ Validation

### Règles de validation
- **Champs obligatoires** marqués comme required
- **Format email** avec regex
- **Complexité mot de passe**: majuscule, minuscule, chiffre, spécial
- **Correspondance** des mots de passe
- **Messages d'erreur** personnalisés en français

### Messages d'erreur
- Affichés en temps réel
- Positionnés sous chaque champ
- Animés pour meilleure UX
- Localisés en français

## 🎨 Personnalisation

### Couleurs principales
- **Primaire**: `#667eea` (indigo)
- **Secondaire**: `#764ba2` (purple)
- **Erreur**: `#f56565` (red)
- **Succès**: `#48bb78` (green)

### Modifier les couleurs
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --error-color: #f56565;
  --success-color: #48bb78;
}
```

## 🚀 Intégration avec le backend

### Connexion
```typescript
onLogin() {
  if (this.loginForm.valid) {
    this.isLoading = true;
    
    // Appel API
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        // Gérer erreur
      }
    });
  }
}
```

### Inscription
```typescript
onSignUp() {
  if (this.signUpForm.valid) {
    this.isLoading = true;
    
    // Appel API
    this.authService.register(this.signUpForm.value).subscribe({
      next: (response) => {
        this.toggleMode('login'); // Retour au login
      },
      error: (error) => {
        // Gérer erreur
      }
    });
  }
}
```

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablette**: 480px - 768px
- **Desktop**: > 768px

## 🌙 Dark Mode

Le composant supporte automatiquement le dark mode via `prefers-color-scheme: dark`.

## 🔧 Dépendances

```json
{
  "@angular/forms": "^17.0.0",
  "@angular/router": "^17.0.0",
  "@angular/common": "^17.0.0"
}
```

## 📁 Structure des fichiers

```
src/app/auth/
├── auth.component.ts      # Logique du composant
├── auth.component.html    # Template HTML
├── auth.component.css     # Styles CSS
├── auth.animations.ts    # Animations Angular
├── auth.module.ts        # Module Angular
├── auth-routing.module.ts # Routes
└── README.md           # Documentation
```

---

**Composant d'authentification moderne et complet pour votre dashboard!** 🔐✨
