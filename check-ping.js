import https from 'https';
import fs from 'fs';

https.get('https://aloga.vercel.app/api/ping', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('vercel-error.json', data);
        console.log('Saved to vercel-error.json');
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
