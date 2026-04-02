class CustomCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Gérer les requêtes OPTIONS (preflight)
        if request.method == 'OPTIONS' and request.path.startswith('/api/'):
            response = type('MockResponse', (), {})()
            response.status_code = 200
            
            # Autoriser localhost, IP locale et Vercel
            allowed_origins = [
                "http://localhost:4200",
                "http://127.0.0.1:4200", 
                "http://192.168.1.162:4201",
                "https://project-final.vercel.app",
                "https://mon-projet123.vercel.app"
            ]
            
            origin = request.headers.get('Origin')
            if origin in allowed_origins:
                response["Access-Control-Allow-Origin"] = origin
            
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response["Access-Control-Allow-Credentials"] = "true"
            
            return response
        
        response = self.get_response(request)
        
        # Ajouter les en-têtes CORS pour les requêtes API
        if request.path.startswith('/api/'):
            # Autoriser localhost, IP locale et Vercel
            allowed_origins = [
                "http://localhost:4200",
                "http://127.0.0.1:4200", 
                "http://192.168.1.162:4201",
                "https://project-final.vercel.app",
                "https://mon-projet123.vercel.app"
            ]
            
            origin = request.headers.get('Origin')
            if origin in allowed_origins:
                response["Access-Control-Allow-Origin"] = origin
            
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response["Access-Control-Allow-Credentials"] = "true"
        
        return response
