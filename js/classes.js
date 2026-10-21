/**
 * Classes Page - Check subscription before allowing access
 */

// Redirect to games page with subscription check
async function goToGames(classNumber) {
  // Check if user is authenticated
  if (!localStorage.getItem('jwtToken')) {
    alert('Please login to access classes');
    window.location.href = 'signin.html';
    return;
  }

  // Check subscription status
  const subResult = await subscriptionManager.checkSubscription();
  
  if (!subResult.isActive) {
    // Show payment modal
    subscriptionManager.showPaymentModal();
    return;
  }

  // User has active subscription - proceed to games
  window.location.href = "games.html?class=" + classNumber;
}

function goBack() {
  window.location.href = "index.html";
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  // Make sure subscription manager is ready
  if (window.subscriptionManager) {
    // Setup payment form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
      paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const utrInput = document.getElementById('utrInput');
        const amount = '1'; // Fixed ₹1 for now
        
        const success = await subscriptionManager.submitPayment(amount, utrInput.value);
        if (success) {
          // Form will be cleared and modal closed automatically
        }
      });
    }
  }
});

