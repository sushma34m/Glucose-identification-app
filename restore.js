const { execSync } = require('child_process');
try {
  execSync('git checkout src/App.tsx', { stdio: 'inherit' });
  console.log('App.tsx restored successfully.');
} catch (err) {
  console.error('Failed to restore App.tsx:', err.message);
}
