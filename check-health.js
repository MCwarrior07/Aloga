import https from 'https';

https.get('https://aloga.vercel.app/api/health', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('--- BODY ---');
        console.log(data);
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
