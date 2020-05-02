
const Game = require('./game');
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');

var http = require('http').createServer(app);

var ios = {};

// io.on('operatorCall', (msg) => {
//     console.log('operatorCall', msg);
// })
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var io = require('socket.io')(http);

io.on('connection', socket => {
    console.log('connected');
    socket.on('join-game', gameId => {
        console.log('joining game', gameId);
        socket.join(gameId);
    });
})
const games = {};



app.get('/api/game', (req, res) => {
    res.send(Object.keys(games).map(id => {
        return { id, name: games[id].name };
    }));
})

app.post('/api/game', (req, res) => {
    const game = new Game(req.body.name);
    games[game.id] = game;

    res.send({ id: game.id, name: game.name, operatorHash: game.operatorHash });
})

app.post('/api/game/:gameId/call', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    console.log(req.body)
    const operatorHash = req.body.operatorHash;
    const operatorCall = req.body.operatorCall;
    games[gameId].operatorCall(operatorHash, operatorCall).then((msg) => {
        io.in(`${gameId}`).emit('operatorCalled', operatorCall);
        res.send(msg);
    }).catch((reason) => {
        res.send(reason);
    });

})


app.get('/api/game/:gameId/card/:cardId', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    res.send(games[gameId].getCard(req.params.cardId));
})

app.post('/api/game/:gameId/subscribe', (req, res) => {
    const gameId = req.params.gameId;
    console.log('q', req.params)
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    const playerName = req.body.playerName;
    res.send(games[gameId].subscribe(playerName));
})

app.post('/api/game/:gameId/card/:cardId/bingo', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    const cardId = req.params.cardId;
    res.send(games[gameId].callBingo(cardId));
})

http.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))