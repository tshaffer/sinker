var ws = new WebSocket('ws://localhost:8080');

ws.onopen = function () {
    console.log('websocket is connected ...')
    // sending a send event to websocket server
    ws.send('connected')
}

ws.onmessage = function (messageEvent) {
    console.log(messageEvent);
    if (messageEvent.type === 'message') {
        const messageDataStr = messageEvent.data;
        const messageData = JSON.parse(messageDataStr);
        if (messageData.type === 'OverallStatus') {
            var element = document.getElementById('foo');
            element.innerHTML = messageData.data;
        }
        else if (messageData.type === 'ProgressItem') {
            const text = messageData.data;
            var ul = document.getElementById('progressItems');
            var li = document.createElement("li");
            li.setAttribute('id',text);
            li.appendChild(document.createTextNode(text));
            ul.appendChild(li);
        }
    }
}
