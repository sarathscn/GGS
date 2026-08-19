const WebSocket = require('ws');

async function testWebSocket() {
  console.log('Testing WebSocket functionality...');

  // 1. Login user
  const loginRes = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@ggs.com', password: 'user123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const user = loginData.user;

  // 2. Get/create conversation
  const convRes = await fetch('http://localhost:8000/api/conversations', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const convs = await convRes.json();
  let convId = null;

  if (convs && convs.length > 0) {
    convId = convs[0].id;
  } else {
    // get a listing
    const listingsRes = await fetch('http://localhost:8000/api/listings');
    const listings = await listingsRes.json();
    const listing = listings[0];

    const createConvRes = await fetch('http://localhost:8000/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        listing_id: listing.id,
        seller_id: listing.seller_id
      })
    });
    const newConv = await createConvRes.json();
    convId = newConv.id;
  }

  console.log(`Using Conversation ID: ${convId}`);

  // 3. Connect via WebSocket
  const wsUrl = `ws://localhost:8000/ws/chat/${convId}?token=${token}`;
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      ws.send(JSON.stringify({ type: 'typing', is_typing: true }));
      console.log('✅ Sent typing event over WebSocket');
      setTimeout(() => {
        ws.close();
        resolve();
      }, 500);
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err);
      reject(err);
    });
  });

  console.log('🎉 WebSocket Test Passed!');
}

testWebSocket().catch((err) => {
  console.error('WebSocket test failed:', err);
  process.exit(1);
});
