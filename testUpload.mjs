import fs from 'fs';
import path from 'path';

async function testUpload() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const data = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="media"; filename="test.txt"\r\n` +
    `Content-Type: text/plain\r\n\r\n` +
    `hello world\r\n` +
    `--${boundary}--\r\n`;

  try {
    const response = await fetch('http://localhost:3001/api/admin/global-media', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: data
    });
    
    const result = await response.json();
    console.log(response.status, result);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testUpload();
