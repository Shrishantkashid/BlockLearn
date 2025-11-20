// Simple test to verify peer service exports
import peer from './peer';

console.log('Peer service test:');
console.log('Peer object:', peer);
console.log('Peer connection:', peer.peer);
console.log('Has getOffer method:', typeof peer.getOffer === 'function');
console.log('Has getAnswer method:', typeof peer.getAnswer === 'function');
console.log('Has setLocalDescription method:', typeof peer.setLocalDescription === 'function');