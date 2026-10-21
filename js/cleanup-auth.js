/**
 * Clear old/stale localStorage data from pre-JWT era
 * This should run once when user first uses new JWT system
 */

function cleanupOldAuthData() {
  // Remove old auth format data (pre-JWT)
  const oldKeys = [
    'currentUser',      // old format
    'studentName',      // old format
    'className',        // old format (if not from JWT)
    'schoolName',       // old format (if not from JWT)
  ];

  console.log('🧹 Cleaning up old auth data...');
  
  let cleaned = 0;
  oldKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`   Removing old key: ${key}`);
      localStorage.removeItem(key);
      cleaned++;
    }
  });

  if (cleaned > 0) {
    console.log(`✅ Cleaned up ${cleaned} old auth keys`);
  }

  // Log current localStorage for debugging
  console.log('📦 Current localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`   ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
  }
}

// Run cleanup on signin page only
if (window.location.pathname.includes('signin')) {
  cleanupOldAuthData();
}
