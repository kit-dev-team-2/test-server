// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
app.get('/', (_, res) => res.send('WS server OK'));
const server = http.createServer(app);

// 원하는 전송 주기 설정
const time = 1000; 

// test.json 파일을 읽고 파싱합니다.
const testData = JSON.parse(fs.readFileSync('test.json', 'utf8'));
console.log('Loaded test data from test.json');

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log('WS connected:', ip);

    ws.on('message', (data, isBinary) => {
        if (!isBinary) {
            const msg = data.toString();
            let payload = null;

            // JSON 시도
            try {
                payload = JSON.parse(msg);
            } catch (e) {
                // JSON 아니면 그냥 문자열로 취급
            }

            // 🔹 수신 메시지는 로그에 기록하고 echo 응답
            console.log('RX:', msg);
            ws.send(JSON.stringify({ type: 'ack', t: Date.now(), echo: msg }));
        } else {
            console.log('RX bin:', data.length, 'bytes');
            ws.send(JSON.stringify({ type: 'ack-bin', bytes: data.length }));
        }
    });

    ws.on('close', () => console.log('WS closed', ip));

    const iv = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            // test.json에서 무작위 항목을 선택하여 전송
            const randomItem = testData[Math.floor(Math.random() * testData.length)];
            ws.send(JSON.stringify(randomItem));
            console.log('TX random item:', randomItem);
        } else clearInterval(iv); 
    }, time); 
});

server.listen(8080, '0.0.0.0', () => {
    console.log('HTTP/WS on http://0.0.0.0:8080');
});
