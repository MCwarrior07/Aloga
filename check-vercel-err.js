const https = require('https');

https.get('https://aloga.vercel.app/api/health', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
