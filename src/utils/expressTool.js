import express from 'express';
import open from 'open'; // 用於自動打開瀏覽器
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
const PORT = 8787;

// 允許跨來源請求（因為書籤是從 leetcode.com 發出請求過來的）
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://leetcode.com');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/auth-callback', (req, res) => {
    const { session, csrf } = req.query;

    if (!session || !csrf) {
        return res.status(400).send('漏失憑證資料');
    }

    // 儲存憑證
    const configPath = path.join(os.homedir(), '.config', 'mylc', 'config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ session, csrf }, null, 2));

    // 回傳給瀏覽器看成功畫面
    res.send('<h1>🎉 登入成功！您可以關閉此分頁並回到終端機了。</h1>');

    console.log('\n🎉 成功接收憑證，CLI 已儲存設定！');
    process.exit(0); // 關閉 CLI 程式與 Server
});

async function startLoginFlow() {
    app.listen(PORT, async () => {
        console.log(`請在瀏覽器中點擊您的 LeetCode 登入書籤...`);
        // 自動幫使用者打開 LeetCode 頁面
        await open('https://leetcode.com');
    });
}

// startLoginFlow();