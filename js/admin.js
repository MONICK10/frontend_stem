// Configuration
const API_BASE = window.API_BASE_URL;

// Modal management
let currentAction = null;
let currentPaymentId = null;

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabName = e.currentTarget.dataset.tab;
    switchTab(tabName);
  });
});

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Deactivate all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  document.getElementById(tabName).classList.add('active');

  // Activate selected button
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Load data for the tab
  if (tabName === 'pending-payments') {
    loadPendingPayments();
  } else if (tabName === 'all-payments') {
    loadAllPayments();
  } else if (tabName === 'subscriptions') {
    loadSubscriptions();
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
  loadPendingPayments();

  // Attach event listeners
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('refreshPendingBtn').addEventListener('click', loadPendingPayments);
  document.getElementById('refreshAllPaymentsBtn').addEventListener('click', loadAllPayments);
  document.getElementById('refreshSubscriptionsBtn').addEventListener('click', loadSubscriptions);
  document.getElementById('paymentStatusFilter').addEventListener('change', loadAllPayments);

  // Modal buttons
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('confirmBtn').addEventListener('click', executeAction);
});

// Check admin access
async function checkAdminAccess() {
  const token = localStorage.getItem('jwtToken');
  const username = localStorage.getItem('loggedInUser');

  if (!token) {
    window.location.href = '/signin.html';
    return;
  }

  // Verify token is valid by fetching user data
  try {
    const response = await fetch(`${API_BASE}/auth/current-user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      localStorage.removeItem('jwtToken');
      window.location.href = '/signin.html';
      return;
    }

    const data = await response.json();
    if (data.user.role !== 'admin') {
      showToast('Access Denied: Admin role required', 'error');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 2000);
      return;
    }

    document.getElementById('adminName').textContent = data.user.username || 'Admin User';
  } catch (error) {
    console.error('Error checking admin access:', error);
    showToast('Error verifying admin access', 'error');
  }
}

// Load pending payments
async function loadPendingPayments() {
  const token = localStorage.getItem('jwtToken');
  const container = document.getElementById('pendingPaymentsContainer');

  try {
    const response = await fetch(`${API_BASE}/payments/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payments = await response.json();

    if (payments.length === 0) {
      container.innerHTML = '<p class="empty-state">No pending payments</p>';
      return;
    }

    let html = '<table class="admin-table"><thead><tr>';
    html += '<th>Email</th><th>Plan</th><th>Amount</th><th>UTR</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';

    payments.forEach(payment => {
      const email = payment.userId.email || 'N/A';
      const date = new Date(payment.createdAt).toLocaleDateString();

      html += `<tr>
        <td>${escapeHtml(email)}</td>
        <td><span class="plan-badge ${payment.plan}">${payment.plan}</span></td>
        <td>₹${payment.amount}</td>
        <td class="utr">${escapeHtml(payment.utr)}</td>
        <td>${date}</td>
        <td class="actions">
          <button class="btn btn-success btn-sm" onclick="confirmApprove('${payment._id}')">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmReject('${payment._id}')">
            <i class="fas fa-times"></i> Reject
          </button>
        </td>
      </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading pending payments:', error);
    container.innerHTML = `<p class="error">Failed to load pending payments: ${error.message}</p>`;
  }
}

// Load all payments
async function loadAllPayments() {
  const token = localStorage.getItem('jwtToken');
  const container = document.getElementById('allPaymentsContainer');
  const statusFilter = document.getElementById('paymentStatusFilter').value;

  try {
    let url = `${API_BASE}/payments/all`;
    if (statusFilter) {
      url += `?status=${statusFilter}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payments = await response.json();

    if (payments.length === 0) {
      container.innerHTML = '<p class="empty-state">No payments found</p>';
      return;
    }

    let html = '<table class="admin-table"><thead><tr>';
    html += '<th>Email</th><th>Plan</th><th>Amount</th><th>UTR</th><th>Status</th><th>Date</th>';
    html += '</tr></thead><tbody>';

    payments.forEach(payment => {
      const email = payment.userId.email || 'N/A';
      const date = new Date(payment.createdAt).toLocaleDateString();
      const statusClass = payment.status;

      html += `<tr>
        <td>${escapeHtml(email)}</td>
        <td><span class="plan-badge ${payment.plan}">${payment.plan}</span></td>
        <td>₹${payment.amount}</td>
        <td class="utr">${escapeHtml(payment.utr)}</td>
        <td><span class="status-badge ${statusClass}">${payment.status}</span></td>
        <td>${date}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading all payments:', error);
    container.innerHTML = `<p class="error">Failed to load payments: ${error.message}</p>`;
  }
}

// Load subscriptions
async function loadSubscriptions() {
  const token = localStorage.getItem('jwtToken');
  const container = document.getElementById('subscriptionsContainer');

  try {
    const response = await fetch(`${API_BASE}/subscriptions/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const subscriptions = await response.json();

    if (subscriptions.length === 0) {
      container.innerHTML = '<p class="empty-state">No active subscriptions</p>';
      return;
    }

    let html = '<table class="admin-table"><thead><tr>';
    html += '<th>User Email</th><th>Plan</th><th>Start Date</th><th>End Date</th><th>Days Left</th><th>Status</th>';
    html += '</tr></thead><tbody>';

    subscriptions.forEach(sub => {
      const email = sub.userId.email || 'N/A';
      const startDate = new Date(sub.startDate).toLocaleDateString();
      const endDate = new Date(sub.endDate).toLocaleDateString();
      const daysLeft = Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      const daysClass = daysLeft < 7 ? 'warning' : 'normal';

      html += `<tr>
        <td>${escapeHtml(email)}</td>
        <td><span class="plan-badge ${sub.plan}">${sub.plan}</span></td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td><span class="days-badge ${daysClass}">${daysLeft} days</span></td>
        <td><span class="status-badge ${sub.status}">${sub.status}</span></td>
      </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    container.innerHTML = `<p class="error">Failed to load subscriptions: ${error.message}</p>`;
  }
}

// Modal functions
function openModal(title, message, action, paymentId) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  document.getElementById('confirmModal').classList.add('active');
  currentAction = action;
  currentPaymentId = paymentId;
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('active');
  currentAction = null;
  currentPaymentId = null;
}

function confirmApprove(paymentId) {
  openModal(
    'Approve Payment',
    'This will create a subscription for the user. Are you sure?',
    'approve',
    paymentId
  );
}

function confirmReject(paymentId) {
  openModal(
    'Reject Payment',
    'The user will be notified. This action cannot be undone. Continue?',
    'reject',
    paymentId
  );
}

// Execute modal action
async function executeAction() {
  if (!currentAction || !currentPaymentId) return;

  const token = localStorage.getItem('jwtToken');
  const action = currentAction;
  const paymentId = currentPaymentId;

  try {
    const endpoint = action === 'approve' ? 'approve' : 'reject';
    const response = await fetch(
      `${API_BASE}/payments/${paymentId}/${endpoint}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    closeModal();
    showToast(
      `Payment ${action}d successfully`,
      'success'
    );

    // Reload pending payments
    loadPendingPayments();

    // Also reload all payments if visible
    const allPaymentsSection = document.getElementById('all-payments');
    if (allPaymentsSection.classList.contains('active')) {
      loadAllPayments();
    }

    // Reload subscriptions if visible
    const subscriptionsSection = document.getElementById('subscriptions');
    if (subscriptionsSection.classList.contains('active')) {
      loadSubscriptions();
    }
  } catch (error) {
    console.error(`Error ${currentAction}ing payment:`, error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} active`;

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

// Logout
function logout() {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('loggedInUser');
  window.location.href = '/signin.html';
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
