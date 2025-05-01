const os = require('os');

// Function to get local IP addresses
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

// Get and display local IP addresses
const localIps = getLocalIpAddresses();

console.log('\n=== LOCAL IP ADDRESSES ===');
console.log('Use one of these IP addresses to connect from physical devices:');
console.log('--------------------------------------------------');

if (localIps.length === 0) {
    console.log('No local network interfaces found!');
} else {
    localIps.forEach(ip => {
        console.log(`Interface: ${ip.interface}`);
        console.log(`IP Address: ${ip.address}`);
        console.log(`Use in your app: http://${ip.address}:5000`);
        console.log('--------------------------------------------------');
    });
}

console.log('\nIn app/config/constants.js, update the API_URL to:');
console.log(`export const API_URL = 'http://YOUR_IP_HERE:5000';`);
console.log('\n'); 