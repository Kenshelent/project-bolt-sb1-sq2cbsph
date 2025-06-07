// ngrok-tunnel.js
const ngrok = require('ngrok');

(async function() {
  try {
    const url = await ngrok.connect({
      addr: 19000,
      proto: 'http',
    });
    console.log(`\n🔗 Ngrok tunnel is ready: ${url}\n`);
  } catch (err) {
    console.error('Error starting ngrok', err);
    process.exit(1);
  }
})();
