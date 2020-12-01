
const GameController = require('./game-controller');


const express = require('express')
const app = express()
const port = 8080
const bodyParser = require('body-parser');

var http = require('http').createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var io = require('socket.io')(http);

const gameController = new GameController(
    (gameId, call) => io.in(`${gameId}`).emit('call', call),
    (gameId, status) => io.in(`${gameId}`).emit('status', status)
);

io.on('connection', socket => {
    let gameId;
    let playerId;
    let operatorHash;

    socket.on('join-game', msg => {
        if (gameController.addSocketToPlayer(msg.gameId, msg.playerId, socket.id)) {
            gameId = msg.gameId;
            playerId = msg.playerId;
            socket.join(gameId);
            io.in(gameId).emit('player-count', gameController.getPlayerCount(gameId))
        }
        if (gameController.isGameOperator(msg.gameId, msg.operatorHash)) {
            gameId = msg.gameId;
            operatorHash = msg.operatorHash;
            socket.join(gameId);
        }
    });
    socket.on('get-winner', () => {
        socket.emit('winner', gameController.getWinnerMessage(gameId));
    });
    socket.on('get-status', () => {
        socket.emit('status', gameController.getGameStatus(gameId));
    });
    socket.on('get-player-count', () => {
        socket.emit('player-count', gameController.getPlayerCount(gameId))
    });
    socket.on('get-last-call', () => {
        socket.emit('call', gameController.getLastCall(gameId))
    });
    socket.on('get-points', () => {
        socket.emit('points', gameController.getPlayerPoints(playerId));
    });
    socket.on('disconnecting', () => {
        if (gameController.removeSocketFromPlayer(gameId, playerId, socket.id)) {
            io.in(gameId).emit('player-count', gameController.getPlayerCount(gameId))
        }
    })

    socket.on('toggle-mark', (msg) => {
        gameController.markCardForPlayer(gameId, playerId, msg.cardId, msg.row, msg.col)
    });
    socket.on('bingo', (msg) => {
        gameController.callBingo(gameId, playerId, msg.cardId).then((result) => {
            if (result.isBingo) {
                socket.emit('points', gameController.getPlayerPoints(gameId, playerId));
                if (result.isWin) {
                    io.in(`${gameId}`).emit('status', gameController.getGameStatus(gameId));
                    io.in(`${gameId}`).emit('winner', gameController.getWinnerMessage(gameId));
                }
            }
            if (result.strike) {
                socket.emit('strike', result.strike);
            }
        }).catch(reason => {
            console.error(reason);
        });
    });
    socket.on('start-game', () => {
        gameController.startGame(gameId, operatorHash);
    })
    socket.on('next-call', () => {
        gameController.nextCall(gameId, operatorHash);
    })
})

app.post('/api/game', (req, res) => {
    res.send(gameController.createGame(req.body.name, req.body.pattern, req.body.winBy, req.body.cardLimit, req.body.cardRule, req.body.asOperator));
})

app.get('/api/game/:gameId/:operatorHash?', (req, res) => {
    try {
        res.send(gameController.getGame(req.params.gameId, req.params.operatorHash))
    } catch (e) {
        res.status(500).send(e);
    }
})
// app.get('/api/game/:gameId/', (req, res) => {
//     const gameId = req.params.gameId;
//     if (!games[gameId]) {
//         res.status(500).send('no-such-game');
//     }
//     res.send(games[gameId].forPlayer());
// })
app.get('/api/game', (req, res) => {
    res.send(gameController.getListOfGames())
})

app.get('/api/game/:gameId/player/:playerId', (req, res) => {
    try {
        res.send(gameController.getPlayerFromGame(req.params.gameId, req.params.playerId))
    } catch (e) {
        res.status(500).send(e);
    }
})

app.post('/api/game/:gameId/subscribe', (req, res) => {
    const playerName = req.body.playerName;
    try {
        res.send(gameController.subscribeToGame(req.params.gameId, playerName))
    } catch (e) {
        res.status(500).send(e);
    }
})

http.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))