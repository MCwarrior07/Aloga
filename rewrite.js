import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Convert ALL app route handlers to async
content = content.replace(/app\.(get|post)\("([^"]+)", \((req: any, res(: any)?|req, res)\) => \{/g, 'app.$1("$2", async ($3) => {');
content = content.replace(/app\.(get|post)\("([^"]+)", authenticate, \((req: any, res(: any)?|req, res)\) => \{/g, 'app.$1("$2", authenticate, async ($3) => {');
content = content.replace(/app\.(get|post)\("([^"]+)", optionalAuthenticate, \((req: any, res(: any)?|req, res)\) => \{/g, 'app.$1("$2", optionalAuthenticate, async ($3) => {');
content = content.replace(/app\.post\("([^"]+)", authenticate, uploadMiddleware\.fields\([^)]+\), \((req: any, res(: any)?|req, res)\) => \{/g, 'app.post("$1", authenticate, uploadMiddleware.fields([{ name: \'video\', maxCount: 1 }, { name: \'thumbnail\', maxCount: 1 }]), async ($2) => {');

// 2. Add await to all db.get, db.all, db.run, db.exec
content = content.replace(/(?<!await )db\.(get|all|run|exec)\(/g, 'await db.$1(');

fs.writeFileSync('server.ts', content);
console.log("Rewrite complete");
