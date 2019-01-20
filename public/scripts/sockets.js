var ws = new WebSocket('ws://localhost:8080');

ws.onopen = function () {
    console.log('websocket is connected ...')
    // sending a send event to websocket server
    ws.send('connected')
}

ws.onmessage = function (messageEvent) {
    console.log(messageEvent);
    if (messageEvent.type === 'message') {
        var element = document.getElementById('foo');
        element.innerHTML = messageEvent.data;
    }
}
