const https = require('https');

https.get('https://aloga.vercel.app/api/videos', (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('BODY:', body));
}).on('error', (e) => {
    console.error(e);
});
