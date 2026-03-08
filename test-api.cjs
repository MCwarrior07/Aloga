const fs = require('fs');
async function run() {
    try {
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@vibestream.com', password: 'password123' })
        });
        const loginData = await loginRes.json();

        const likeRes = await fetch('http://localhost:3000/api/videos/1/like', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        const likeData = await likeRes.json();

        const commentRes = await fetch('http://localhost:3000/api/videos/1/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${loginData.token}` },
            body: JSON.stringify({ content: "test comment" })
        });
        const commentData = await commentRes.json();

        fs.writeFileSync('test-results.json', JSON.stringify({ login: loginData, like: likeData, comment: commentData }, null, 2));
    } catch (e) { console.error(e); }
}
run();
