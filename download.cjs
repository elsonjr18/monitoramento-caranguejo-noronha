const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'upload.wikimedia.org',
  path: '/wikipedia/en/8/87/Edinburgh_Napier_University_logo.svg',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    fs.writeFileSync('public/napier-logo.svg', data);
    console.log('SVG Downloaded!');
  });
}).on('error', (err) => {
  console.log('Error: ', err.message);
});
