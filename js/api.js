/**
 * API Service - Handles JWT authentication and API requests
 * 
 * SECURITY NOTE on Token Storage:
 * - localStorage: Vulnerable to XSS attacks but convenient for SPA
 * - sessionStorage: Lost on tab close, also vulnerable to XSS
 * - Memory (variable): Safest from XSS but lost on page refresh
 * - httpOnly Cookies: MOST SECURE (recommended for production - set by backend)
 * 
 * PRODUCTION RECOMMENDATION: Use httpOnly, Secure, SameSite cookies set by backend
 */

class APIService {
  constructor() {
    this.baseURL = window.API_BASE_URL; // Update based on your backend URL
  }

  /**
   * Store JWT token in localStorage
   * In production, the backend should set httpOnly cookies instead
   */
  setToken(token) {
    localStorage.setItem('jwtToken', token);
  }

  /**
   * Retrieve stored JWT token
   */
  getToken() {
    return localStorage.getItem('jwtToken');
  }

  /**
   * Remove token (logout)
   */
  clearToken() {
    localStorage.removeItem('jwtToken');
  }

  /**
   * Check if token exists and is not expired
   * Decodes token without verifying signature (verification happens on backend)
   */
  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT payload (doesn't verify signature, that's backend's job)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token is not expired (exp is in seconds, Date.now() is in ms)
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Generic fetch wrapper with JWT attachment
   * Automatically handles authorization header, 401/403 errors
   */
  async fetch(endpoint, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Attach JWT to Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login.html';
        throw new Error('Unauthorized - session expired. Please login again.');
      }

      // Handle 403 Forbidden - insufficient permissions
      if (response.status === 403) {
        throw new Error('Access denied - insufficient permissions');
      }

      const data = await response.json();
      
      // Check if response is not OK BEFORE returning
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }

  // ============= AUTH ENDPOINTS =============

  /**
   * Register a new user
   */
  async register(username, email, password, className, schoolName, role = 'student') {
    const data = await this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, className, schoolName, role })
    });
    this.setToken(data.token);
    return data;
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    const data = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  /**
   * Logout (clears token on frontend and notifies backend)
   */
  async logout() {
    try {
      await this.fetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout notification failed:', error);
    } finally {
      this.clearToken();
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    return this.fetch('/auth/me');
  }

  // ============= PROTECTED ROUTE EXAMPLES =============

  /**
   * Example: Get user's progress (protected route)
   */
  async getProgress() {
    return this.fetch('/progress/me');
  }

  /**
   * Example: Update user's progress (protected route)
   */
  async updateProgress(topicId, score) {
    return this.fetch('/progress/update', {
      method: 'POST',
      body: JSON.stringify({ topicId, score })
    });
  }

  /**
   * Example: Get classes (protected route)
   */
  async getClasses() {
    return this.fetch('/classes');
  }

  /**
   * Example: Admin-only endpoint
   */
  async getAdminUsers() {
    return this.fetch('/auth/admin/users');
  }
}

// Export singleton instance
const api = new APIService();
