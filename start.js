const { spawn } = require('child_process');
const path = require('path');

// Colors for different app outputs
const colors = {
  main: '\x1b[36m', // Cyan
  app1: '\x1b[32m', // Green
  app2: '\x1b[33m', // Yellow
  reset: '\x1b[0m'  // Reset
};

// Function to create a process
function startProcess(command, args, name, color) {
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true
  });

  proc.stdout.on('data', (data) => {
    console.log(`${color}[${name}] ${data.toString().trim()}${colors.reset}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`${color}[${name}] ${data.toString().trim()}${colors.reset}`);
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}] Process exited with code ${code}${colors.reset}`);
  });

  return proc;
}

// Start all applications
console.log('Starting all applications...');

// Start main app
const mainApp = startProcess('node', ['app.js'], 'Main App', colors.main);

// Start App1
const app1 = startProcess('node', ['app1/app.js'], 'App1', colors.app1);

// Start App2
const app2 = startProcess('node', ['app2/app.js'], 'App2', colors.app2);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  mainApp.kill();
  app1.kill();
  app2.kill();
  process.exit(0);
});

console.log('\nAll applications started!');
console.log('Main app running on http://localhost:3000');
console.log('App1 running on http://localhost:3001');
console.log('App2 running on http://localhost:3002');
console.log('\nPress Ctrl+C to stop all applications\n'); 