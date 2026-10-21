/**
 * Subscription Manager
 * Handles subscription checks, payment modal, and admin button visibility
 */

class SubscriptionManager {
  constructor() {
    this.baseURL = window.API_BASE_URL;
    this.init();
  }

  async init() {
    // Check admin button visibility on page load
    await this.setupAdminButton();
  }

  /**
   * Get JWT token from localStorage
   */
  getToken() {
    return localStorage.getItem('jwtToken');
  }

  /**
   * Get user role from localStorage
   */
  getUserRole() {
    return localStorage.getItem('role') || 'student';
  }

  /**
   * Setup Admin Button - Show only for admin users
   */
  async setupAdminButton() {
    const role = this.getUserRole();
    
    // Create admin button if it doesn't exist
    if (!document.getElementById('adminBtn')) {
      const adminBtn = document.createElement('button');
      adminBtn.id = 'adminBtn';
      adminBtn.className = 'admin-btn';
      adminBtn.innerHTML = '<i class="fas fa-lock-open"></i> Admin';
      
      // Find the top-right container and insert before user-info
      const topRight = document.querySelector('.top-right');
      if (topRight) {
        // Insert before the user-info div
        const userInfo = topRight.querySelector('.user-info');
        if (userInfo) {
          topRight.insertBefore(adminBtn, userInfo);
        } else {
          topRight.appendChild(adminBtn);
        }
      } else {
        // Fallback: append to header
        const header = document.querySelector('header');
        if (header) {
          header.appendChild(adminBtn);
        }
      }
      
      // Add click handler
      adminBtn.addEventListener('click', () => {
        window.location.href = 'admin.html';
      });
    }

    // Show/hide based on role
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
      if (role === 'admin') {
        adminBtn.style.display = 'block';
      } else {
        adminBtn.style.display = 'none';
      }
    }
  }

  /**
   * Check if user has active subscription
   * Returns: { isActive: boolean, subscription: object or null }
   */
  async checkSubscription() {
    try {
      const token = this.getToken();
      if (!token) {
        return { isActive: false, subscription: null };
      }

      const response = await fetch(`${this.baseURL}/subscriptions/my-subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return { isActive: false, subscription: null };
      }

      const data = await response.json();

      // GET /subscriptions/my-subscription returns the subscription document
      // itself, not { subscription: ... }. Reading data.subscription alone
      // was always undefined, so isActive never became true even for users
      // with an approved subscription. Accept either shape.
      const sub = data && data.subscription ? data.subscription : data;

      // Check if subscription exists and is active
      if (sub && sub.status === 'active') {
        // Also check if not expired
        const endDate = new Date(sub.endDate);
        const now = new Date();

        if (endDate > now) {
          return {
            isActive: true,
            subscription: sub,
            daysRemaining: Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
          };
        }
      }

      return { isActive: false, subscription: sub || null };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { isActive: false, subscription: null };
    }
  }

  /**
   * Show payment modal for non-subscribed users
   */
  showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Hide payment modal
   */
  hidePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Submit payment for subscription
   */
  async submitPayment(amount, utr) {
    try {
      const token = this.getToken();
      if (!token) {
        this.showToast('Please login first', 'error');
        window.location.href = 'signin.html';
        return false;
      }

      // Determine plan based on amount
      let plan = 'monthly'; // Default
      if (amount >= 5000) {
        plan = 'yearly';
      }

      const response = await fetch(`${this.baseURL}/payments/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          utr: utr.trim(),
          plan: plan
        })
      });

      const data = await response.json();

      if (!response.ok) {
        this.showToast(data.message || 'Payment submission failed', 'error');
        return false;
      }

      // Success
      this.showToast('✅ Payment submitted successfully!\\nAwait admin approval.', 'success');
      
      // Clear form
      const form = document.getElementById('paymentForm');
      if (form) {
        form.reset();
      }

      // Hide modal after 2 seconds
      setTimeout(() => {
        this.hidePaymentModal();
      }, 2000);

      return true;
    } catch (error) {
      console.error('Error submitting payment:', error);
      this.showToast('Error: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.payment-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `payment-toast payment-toast-${type}`;
    toast.innerHTML = message;

    document.body.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Get user info from localStorage
   */
  getUserInfo() {
    return {
      username: localStorage.getItem('loggedInUser') || 'User',
      role: localStorage.getItem('role') || 'student',
      className: localStorage.getItem('className') || 'N/A'
    };
  }
}

// Initialize subscription manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.subscriptionManager = new SubscriptionManager();
  });
} else {
  window.subscriptionManager = new SubscriptionManager();
}
