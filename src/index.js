
const Game = require('./game');
const constats = require('./constats');

const express = require('express')
const app = express()
const port = 8080
const bodyParser = require('body-parser');

var http = require('http').createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var io = require('socket.io')(http);

const games = {};

io.on('connection', socket => {
    let gameId;
    let playerId;
    let operatorHash;
    console.log('connected')
    socket.on('join-game', msg => {
        console.log('join-game', msg);
        if (games[msg.gameId]) {
            gameId = msg.gameId;
            socket.join(gameId);
        }

        playerId = msg.playerId;
        operatorHash = msg.operatorHash;

        if (gameId && games[gameId] && playerId && games[gameId].players[playerId]) {
            console.log('adding socket ', playerId, socket.id);
            games[gameId].players[playerId].addSocket(socket.id);
            console.log('player-count', games[gameId].getPlayerCount())
            io.in(gameId).emit('player-count', games[gameId].getPlayerCount())
        }
    });
    socket.on('get-winner', () => {
        if (games[gameId]) {
            socket.emit('winner', games[gameId].getWinnerMessage());
        }
    });
    socket.on('get-status', () => {
        if (games[gameId]) {
            socket.emit('status', games[gameId].status)
        }
    });
    socket.on('get-player-count', () => {
        if (games[gameId]) {
            socket.emit('player-count', games[gameId].getPlayerCount())
        }
    });
    socket.on('get-last-call', () => {
        if (games[gameId]) {
            socket.emit('call', games[gameId].lastCalledNumber)
        }
    });
    socket.on('get-points', () => {
        console.log('get-points', gameId, playerId)
        if (games[gameId]) {
            socket.emit('points', games[gameId].getPlayerPoints(playerId));
        }
    });
    socket.on('disconnecting', () => {
        if (gameId && playerId && games[gameId] && games[gameId].players[playerId]) {
            games[gameId].players[playerId].removeSocket(socket.id);
            io.in(gameId).emit('player-count', games[gameId].getPlayerCount())
        }
    })

    socket.on('toggle-mark', (msg) => {
        console.log('toggle-mark', msg);
        if (gameId && playerId) {
            games[gameId].markCardForPlayer(playerId, msg.cardId, msg.row, msg.col);
        }
    });
    socket.on('bingo', (msg) => {
        console.log('bingo', msg)
        if (gameId && playerId) {
            games[gameId].callBingo(playerId, msg.cardId, msg.pattern).then((result) => {
                if (result.isBingo) {
                    socket.emit('points', games[gameId].getPlayerPoints(playerId));

                    if (result.isWin) {
                        io.in(`${gameId}`).emit('status', games[gameId].status);
                        io.in(`${gameId}`).emit('winner', games[gameId].getWinnerMessage());
                    }
                }
            }).catch(reason => {
                console.error(reason);
            });
        }
    });
    socket.on('start-game', () => {
        games[gameId].startGame(operatorHash).then(() => {
            io.in(`${gameId}`).emit('status', games[gameId].status)
        }).catch((reason) => {
            console.error(reason);
        })
    })
    socket.on('next-call', () => {
        console.log('next-call')
        games[gameId].operatorCall(operatorHash).then((calledNumber) => {
            console.log('call', calledNumber)
            io.in(`${gameId}`).emit('call', calledNumber);
        }).catch(reason => {
            console.error(reason)
        });
    })
})

app.post('/api/game', (req, res) => {
    const game = new Game(req.body.name, req.body.pattern, req.body.winBy, req.body.cardLimit, req.body.cardRule);
    games[game.id] = game;
    res.send(game.forOperator());
})

app.get('/api/game/:gameId/:operatorHash', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        res.status(500).send('no-such-game');
    }
    const operatorHash = req.params.operatorHash;
    if (games[gameId].operatorHash == operatorHash) {
        res.send(games[gameId].forOperator());
    } else {
        res.status(500).send('you-are-not-an-operator');
    }
})
app.get('/api/game/:gameId/', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        res.status(500).send('no-such-game');
    }
    res.send(games[gameId].forPlayer());
})
app.get('/api/game', (req, res) => {
    res.send(Object.keys(games).map(id => {
        return games[id].forPlayer();
    }).filter(game => game.status == constats.STATUS.WAITING_FOR_PLAYERS));
})

app.get('/api/game/:gameId/player/:playerId', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    games[gameId].getPlayer(req.params.playerId).then(player => {
        res.send(player)
    }).catch(reason => {
        res.status(500).send(reason);
    });
})

app.post('/api/game/:gameId/subscribe', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    const playerName = req.body.playerName;
    res.send(games[gameId].subscribe(playerName));
})

http.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))