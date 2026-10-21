/**
 * Classes Page
 *
 * Subscriptions/payments are future work, so class selection goes straight
 * through to the games page. The subscription check that used to sit here
 * blocked every click: it could never return true (see the response-shape
 * note in subscription-manager.js) and the payment modal it fell back to
 * has no markup on any page, so the click silently did nothing.
 *
 * To re-enable the gate later, restore the checkSubscription() call below
 * and build the #paymentModal markup that css/payment-modal.css styles.
 */

function goToGames(classNumber) {
  // Still require a logged-in user; this is auth, not the paywall.
  if (!localStorage.getItem('jwtToken')) {
    alert('Please login to access classes');
    window.location.href = 'signin.html';
    return;
  }

  window.location.href = "games.html?class=" + classNumber;
}

function goBack() {
  window.location.href = "index.html";
}
