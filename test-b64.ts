const base64String = 'BN0Z3nqz3OLK1q2RuvukfLMAffOncCrBsvMw7GncY_9EK8u6-W0OzfIsRElejTlC-TM2uNDXCZkicnJX47pNGdc';
const padding = '='.repeat((4 - base64String.length % 4) % 4);
const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
console.log(atob(base64));
