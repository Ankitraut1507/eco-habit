/**
 * Network Diagnostic Utility
 * 
 * This script helps diagnose network connectivity issues between 
 * the mobile app and the backend server.
 */

const http = require('http');
const https = require('https');
const os = require('os');
const dns = require('dns');
const net = require('net');

// Helper function to get local IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    
    for (const iface of networkInterface) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: interfaceName,
          address: iface.address
        });
      }
    }
  }
  
  return addresses;
}

// Function to check if a port is open on a given host
function checkPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;
    
    // Set a timeout of 3 seconds
    socket.setTimeout(3000);
    
    // Attempt to connect
    socket.connect(port, host, () => {
      status = true;
      socket.destroy();
    });
    
    // Handle connection timeout
    socket.on('timeout', () => {
      socket.destroy();
    });
    
    // Handle connection close
    socket.on('close', () => {
      resolve(status);
    });
    
    // Handle connection error
    socket.on('error', () => {
      socket.destroy();
    });
  });
}

// Function to resolve domain name to IP
function resolveDomain(domain) {
  return new Promise((resolve) => {
    dns.lookup(domain, (err, address) => {
      if (err) {
        resolve(null);
      } else {
        resolve(address);
      }
    });
  });
}

// Function to send HTTP request to URL and measure latency
async function testHttpEndpoint(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let result = {
      url,
      reachable: false,
      latency: null,
      error: null
    };
    
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      const endTime = Date.now();
      result.reachable = true;
      result.latency = endTime - startTime;
      result.statusCode = res.statusCode;
      
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          result.data = JSON.parse(rawData);
        } catch (e) {
          result.data = rawData;
        }
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      result.error = error.message;
      resolve(result);
    });
    
    // Set a timeout of 5 seconds
    req.setTimeout(5000, () => {
      req.abort();
      result.error = 'Request timed out';
      resolve(result);
    });
  });
}

// Main diagnostic function
async function runDiagnostics(port = 5000) {
  console.log('┌──────────────────────────────────┐');
  console.log('│    NETWORK DIAGNOSTIC UTILITY    │');
  console.log('└──────────────────────────────────┘');
  console.log('\n1. SYSTEM INFORMATION');
  console.log('----------------------');
  console.log('Hostname:', os.hostname());
  console.log('Platform:', os.platform());
  console.log('OS Release:', os.release());
  
  // Check local network interfaces
  console.log('\n2. NETWORK INTERFACES');
  console.log('---------------------');
  const localIps = getLocalIpAddresses();
  if (localIps.length === 0) {
    console.log('❌ No network interfaces found');
  } else {
    localIps.forEach(ip => {
      console.log(`✓ ${ip.interface}: ${ip.address}`);
    });
  }
  
  // Check common connection URLs
  console.log('\n3. CONNECTION TESTS');
  console.log('-------------------');
  
  // Tests for local connections
  const testUrls = [
    `http://localhost:${port}/health`,
    `http://127.0.0.1:${port}/health`
  ];
  
  // Add local IP addresses to the test
  localIps.forEach(ip => {
    testUrls.push(`http://${ip.address}:${port}/health`);
  });
  
  // Add Android emulator address
  testUrls.push(`http://10.0.2.2:${port}/health`);
  
  // Run tests sequentially
  for (const url of testUrls) {
    const result = await testHttpEndpoint(url);
    if (result.reachable) {
      console.log(`✓ ${url} - Reachable (${result.latency}ms)`);
    } else {
      console.log(`❌ ${url} - Not reachable: ${result.error}`);
    }
  }
  
  // Check if specific ports are open
  console.log('\n4. PORT CHECKS');
  console.log('--------------');
  
  for (const ip of ['localhost', ...localIps.map(i => i.address)]) {
    const isOpen = await checkPortOpen(ip, port);
    console.log(`${isOpen ? '✓' : '❌'} Port ${port} on ${ip} is ${isOpen ? 'open' : 'closed'}`);
  }
  
  // Check external connectivity
  console.log('\n5. EXTERNAL CONNECTIVITY');
  console.log('------------------------');
  
  const externalTests = [
    { name: 'Google DNS', url: 'https://8.8.8.8' },
    { name: 'Cloudflare DNS', url: 'https://1.1.1.1' },
    { name: 'Google.com', url: 'https://www.google.com' }
  ];
  
  for (const test of externalTests) {
    try {
      const result = await testHttpEndpoint(test.url);
      console.log(`${result.reachable ? '✓' : '❌'} ${test.name}: ${result.reachable ? 'Reachable' : 'Not reachable'}`);
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
    }
  }
  
  // DNS resolution test
  console.log('\n6. DNS RESOLUTION');
  console.log('-----------------');
  
  const domains = ['google.com', 'github.com', 'npmjs.com'];
  
  for (const domain of domains) {
    const ip = await resolveDomain(domain);
    console.log(`${ip ? '✓' : '❌'} ${domain} resolves to ${ip || 'Not resolved'}`);
  }
  
  console.log('\n7. MOBILE CONNECTION TIPS');
  console.log('------------------------');
  console.log('• Android Emulator: Use http://10.0.2.2:5000');
  console.log('• iOS Simulator: Use http://localhost:5000');
  console.log('• Physical Device:');
  localIps.forEach(ip => {
    console.log(`  - Use http://${ip.address}:${port}`);
  });
  
  console.log('\n8. TROUBLESHOOTING');
  console.log('------------------');
  console.log('• Ensure server is running: npm run dev in backend directory');
  console.log('• Check for firewall issues blocking port ' + port);
  console.log('• Make sure mobile device is on the same network as this computer');
  console.log('• Try disabling VPNs or network proxies');
  console.log('• Check API_URL in app/config/constants.js');
}

// Check if this script is run directly
if (require.main === module) {
  // Get port from command line arguments or use default (5000)
  const args = process.argv.slice(2);
  const port = args.length > 0 ? parseInt(args[0], 10) : 5000;
  
  runDiagnostics(port).catch(err => {
    console.error('Diagnostic error:', err);
  });
}

// Export functions for potential use in other scripts
module.exports = {
  getLocalIpAddresses,
  checkPortOpen,
  testHttpEndpoint,
  runDiagnostics
}; 