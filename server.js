
const Game = require('./game');
const express = require('express')
const app = express()
const port = 3000
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

        gameId = msg.gameId
        playerId = msg.playerId;
        operatorHash = msg.operatorHash;

        socket.join(gameId);

        if (gameId && games[gameId] && playerId && games[gameId].players[playerId]) {
            console.log('adding socket ', playerId, socket.id);
            games[gameId].players[playerId].addSocket(socket.id);
            console.log('player-count', games[gameId].getPlayerCount())
            io.in(gameId).emit('player-count', games[gameId].getPlayerCount())
        }
    });
    socket.on('get-winner', () => {
        if (games[gameId]) {
            socket.emit('winner', games[gameId].winner);
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
            socket.emit('last-call', games[gameId].lastCalledNumber)
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
    socket.on('bingo', (cardId) => {
        console.log('bingo', cardId)
        if (gameId && playerId) {
            games[gameId].callBingo(playerId, cardId).then(() => {
                io.in(`${gameId}`).emit('status', games[gameId].status)
                io.in(`${gameId}`).emit('winner', games[gameId].winner);
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


var gameToOperator = (game) => {
    return { id: game.id, name: game.name, operatorHash: game.operatorHash, status: game.status, playersCount: Object.keys(game.players).length, lastCalledNumber: game.lastCalledNumber, calledNumbers: game.calledNumbers }
}
var gameToPlayer = (game) => {
    return { id: game.id, name: game.name, status: game.status, playersCount: Object.keys(game.players).length, lastCalledNumber: game.lastCalledNumber }
}
app.post('/api/game', (req, res) => {
    const game = new Game(req.body.name);
    games[game.id] = game;
    res.send(gameToOperator(game));
})

app.get('/api/game/:gameId/:operatorHash', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    const operatorHash = req.params.operatorHash;
    if (games[gameId].operatorHash == operatorHash) {
        res.send(gameToOperator(games[gameId]));
    } else {
        res.status(500).send('you-are-not-an-operator');
    }
})
app.get('/api/game/:gameId/', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    res.send(gameToPlayer(games[gameId]));
})
app.get('/api/game', (req, res) => {
    res.send(Object.keys(games).map(id => {
        return gameToPlayer(games[id]);
    }));
})

app.post('/api/game/:gameId/call', (req, res) => {
    const gameId = req.params.gameId;
    if (!games[gameId]) {
        throw 'no-such-game';
    }
    const operatorHash = req.body.operatorHash;
    games[gameId].operatorCall(operatorHash).then((calledNumber) => {
        io.in(`${gameId}`).emit('operatorCalled', calledNumber);
        res.send(games[gameId].calledNumbers);
    }).catch((reason) => {
        console.error(reason)
        res.status(500).send(reason);
    });

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
    const cards = req.body.cards;
    res.send(games[gameId].subscribe(playerName, cards));
})

// app.post('/api/game/:gameId/player/:playerId/card/:cardId/bingo', (req, res) => {
//     const gameId = req.params.gameId;
//     if (!games[gameId]) {
//         throw 'no-such-game';
//     }
//     const cardId = req.params.cardId;
//     const playerId = req.params.cardId;
//     games[gameId].callBingo(cardId).then(() => {
//         io.in(`${gameId}`).emit('game-end', { cardId: cardId });
//         res.send();
//     }).catch((e) => {
//         res.status(500).send(e);
//     });
// });

http.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))