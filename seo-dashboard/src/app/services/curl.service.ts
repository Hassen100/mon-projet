import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiBaseUrl } from '../api-base';

export interface CurlCommand {
  command: string;
  url: string;
  method: string;
  headers: { [key: string]: string };
  params?: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class CurlService {
  private readonly apiUrl = getApiBaseUrl();

  constructor(private http: HttpClient) {}

  /**
   * Génère une commande cURL pour appeler l'API analytics
   */
  generateAnalyticsCurl(period: number, token: string): CurlCommand {
    const url = `${this.apiUrl}/analytics/`;
    const params = `?period=${period}`;
    
    return {
      command: this.buildCurlCommand('GET', url + params, {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }),
      url: url,
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        'period': period.toString()
      }
    };
  }

  /**
   * Génère une commande cURL pour n'importe quel endpoint
   */
  generateCurlCommand(
    method: string,
    endpoint: string,
    token: string,
    params?: { [key: string]: string },
    body?: any
  ): CurlCommand {
    const url = `${this.apiUrl}${endpoint}`;
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    
    const headers = {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    };

    const command = this.buildCurlCommand(method, url + queryString, headers, body);

    return {
      command,
      url,
      method,
      headers,
      params
    };
  }

  /**
   * Construit la commande cURL complète
   */
  private buildCurlCommand(
    method: string,
    url: string,
    headers: { [key: string]: string },
    body?: any
  ): string {
    let command = `curl -X ${method} "${url}" \\\n`;

    // Ajouter les headers
    Object.entries(headers).forEach(([key, value]) => {
      command += `  -H "${key}: ${value}" \\\n`;
    });

    // Ajouter le body si présent
    if (body) {
      const bodyStr = JSON.stringify(body);
      command += `  -d '${bodyStr}' \\\n`;
    }

    // Retirer le dernier \\\n
    command = command.replace(/ \\\\\\n$/, '');

    return command;
  }

  /**
   * Teste l'endpoint analytics avec le token
   */
  testAnalyticsEndpoint(period: number, token: string): Observable<any> {
    const url = `${this.apiUrl}/analytics/?period=${period}`;
    const headers = {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    };

    return this.http.get(url, { headers });
  }

  /**
   * Copie le texte dans le presse-papier
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Erreur lors de la copie dans le presse-papier:', err);
      return false;
    }
  }
}
