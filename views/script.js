console.log('you are awesome');
console.log('eat more pizza');
for (var i = 0; i < 9; i++) {
    console.log(i*2)
}

var ws = new WebSocket('ws://localhost:8080');

ws.onopen = function () {
    console.log('websocket is connected ...')
    // sending a send event to websocket server
    ws.send('connected')
}

// event emmited when receiving message 
ws.onmessage = function (ev) {
    console.log(ev);
}
