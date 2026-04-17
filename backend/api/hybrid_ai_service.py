"""
Hybrid AI Service - Uses Ollama locally with Gemini fallback
Allows switching between local and cloud-based AI models
"""
import os
import requests
import json
from django.conf import settings
from django.contrib.auth.models import User
from .ollama_service import OllamaService
from .gemini_seo_service import GeminiSEOService


class HybridAIService:
    """
    Hybrid AI service that:
    - Tries Ollama (local, free, unlimited) first
    - Falls back to Gemini (cloud, quota-limited) if Ollama fails
    - Allows manual selection of AI provider
    """
    
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'orca-mini')
    
    def __init__(self):
        self.ollama_service = OllamaService()
        self.gemini_service = GeminiSEOService()
        self.last_used_provider = None
    
    def is_ollama_available(self) -> bool:
        """Check if Ollama service is running"""
        try:
            response = requests.get(
                f'{self.OLLAMA_BASE_URL}/api/tags',
                timeout=2
            )
            return response.status_code == 200
        except Exception as e:
            print(f'[Ollama check] Not available: {str(e)[:100]}')
            return False
    
    def get_status(self) -> dict:
        """Get AI services status"""
        ollama_available = self.is_ollama_available()
        gemini_available = bool(os.getenv('GEMINI_API_KEY'))
        
        return {
            'ollama': {
                'available': ollama_available,
                'url': self.OLLAMA_BASE_URL,
                'model': self.OLLAMA_MODEL
            },
            'gemini': {
                'available': gemini_available,
                'provider': 'Google Gemini'
            },
            'last_used': self.last_used_provider
        }
    
    def analyze_seo_with_context(
        self,
        user: User,
        message: str,
        days: int = 30,
        ai_mode: str = 'auto'  # 'auto', 'ollama', 'gemini'
    ) -> dict:
        """
        Analyze SEO with AI (Ollama -> Gemini fallback by default)
        
        Args:
            user: Django User object
            message: User's question/message
            days: Number of days for analytics
            ai_mode: 'auto' (try Ollama first), 'ollama' (force), 'gemini' (force)
        
        Returns:
            dict with response and provider info
        """
        
        if ai_mode == 'auto':
            # Try Ollama first
            if self.is_ollama_available():
                try:
                    response = self.ollama_service.analyze_seo_with_context(
                        user, message, days
                    )
                    self.last_used_provider = 'ollama'
                    print(f'[AI] Using Ollama for query: {message[:50]}...')
                    return {
                        'response': response,
                        'provider': 'ollama',
                        'model': self.OLLAMA_MODEL
                    }
                except Exception as e:
                    print(f'[Ollama error] {str(e)[:100]}')
            
            # Fallback to Gemini
            print(f'[AI] Ollama unavailable, switching to Gemini')
            try:
                response = self.gemini_service.analyze_seo_with_context(
                    user, message, days
                )
                self.last_used_provider = 'gemini'
                return {
                    'response': response,
                    'provider': 'gemini',
                    'model': 'Gemini 2.5 Flash'
                }
            except Exception as e:
                raise RuntimeError(f'All AI services failed: {str(e)[:200]}')
        
        elif ai_mode == 'ollama':
            # Force Ollama
            if not self.is_ollama_available():
                raise RuntimeError('Ollama service is not available')
            try:
                response = self.ollama_service.analyze_seo_with_context(
                    user, message, days
                )
                self.last_used_provider = 'ollama'
                return {
                    'response': response,
                    'provider': 'ollama',
                    'model': self.OLLAMA_MODEL
                }
            except Exception as e:
                raise RuntimeError(f'Ollama error: {str(e)[:200]}')
        
        elif ai_mode == 'gemini':
            # Force Gemini
            if not os.getenv('GEMINI_API_KEY'):
                raise RuntimeError('Gemini API key not configured')
            try:
                response = self.gemini_service.analyze_seo_with_context(
                    user, message, days
                )
                self.last_used_provider = 'gemini'
                return {
                    'response': response,
                    'provider': 'gemini',
                    'model': 'Gemini 2.5 Flash'
                }
            except Exception as e:
                raise RuntimeError(f'Gemini error: {str(e)[:200]}')
        
        else:
            raise ValueError(f'Invalid ai_mode: {ai_mode}')
    
    def get_dashboard_context(self, user: User, days: int = 30) -> dict:
        """Get analytics context for dashboard"""
        try:
            if self.is_ollama_available():
                return self.ollama_service.get_dashboard_context(user, days)
        except Exception:
            pass
        
        # Fallback to Gemini service for context (if available)
        return self.gemini_service.get_dashboard_context(user, days)
    
    def quick_analysis(
        self,
        user: User,
        data_type: str,
        url: str = None,
        ai_mode: str = 'auto'
    ) -> dict:
        """Quick SEO analysis"""
        
        try:
            if ai_mode == 'ollama' or (ai_mode == 'auto' and self.is_ollama_available()):
                result = self.ollama_service.quick_analysis(
                    user, data_type, url
                )
                self.last_used_provider = 'ollama'
                return {
                    'analysis': result,
                    'provider': 'ollama'
                }
        except Exception as e:
            if ai_mode == 'ollama':
                raise RuntimeError(f'Ollama error: {str(e)[:200]}')
        
        # Fallback to Gemini
        if ai_mode in ['auto', 'gemini']:
            result = self.gemini_service.quick_analysis(
                user, data_type, url
            )
            self.last_used_provider = 'gemini'
            return {
                'analysis': result,
                'provider': 'gemini'
            }
        
        raise RuntimeError('No AI service available')
