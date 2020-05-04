
const Game = require('./game');
const VirtualOperator = require('./virtual-operator');
const constats = require('./constats');
module.exports = class GameController {

    constructor(callCallback, startCallback) {
        this.games = {};
        this.callCallback = callCallback;
        this.startCallback = startCallback;
        this.virtualOperators = {};
    }

    hasGame(gameId) {
        return !!this.games[gameId];
    }


    createGame(name, pattern, winBy, cardLimit, cardRule, asOperator) {
        const game = new Game(name, pattern, winBy, cardLimit, cardRule)
        this.games[game.id] = game;
        if (!asOperator) {
            this.virtualOperators[game.operatorHash] = new VirtualOperator(
                () => {
                    this.startGame(game.id, game.operatorHash);
                },
                () => {
                    this.nextCall(game.id, game.operatorHash);
                },
                3000 * game.cardLimit)
        }
        return asOperator ? game.forOperator() : game.forPlayer();
    }

    getListOfGames() {
        return Object.keys(this.games).map(id => {
            return this.games[id].forPlayer();
        }).filter(game => game.status == constats.STATUS.WAITING_FOR_PLAYERS);
    }

    getGame(gameId, operatorHash) {
        if (this.hasGame(gameId)) {
            if (operatorHash) {
                if (this.isGameOperator(gameId, operatorHash)) {
                    return this.games[gameId].forOperator();
                }
                throw 'not-an-operator';
            } else {
                return this.games[gameId].forPlayer();
            }
        }
        throw 'no-such-game';
    }
    getPlayerFromGame(gameId, playerId) {
        if (this.hasGame(gameId)) {
            return this.games[gameId].getPlayer(playerId);
        }
        throw 'no-such-game';
    }

    subscribeToGame(gameId, playerName) {
        if (this.hasGame(gameId)) {
            return this.games[gameId].subscribe(playerName);
        }
        throw 'no-such-game';
    }
    startGame(gameId, operatorHash) {
        if (this.hasGame(gameId)) {
            this.games[gameId].startGame(operatorHash).then(() => {
                this.startCallback(gameId, this.games[gameId].status);
            }).catch(reason => console.error(reason));
        }
    }
    nextCall(gameId, operatorHash) {
        if (this.hasGame(gameId)) {
            this.games[gameId].nextCall(operatorHash).then(call => {
                this.callCallback(gameId, call);
            }).catch(reason => {
                if (reason == 'game-has-no-active-players' || reason == 'no-numbers-left-to-call') {
                    this.closeUpGame(gameId, operatorHash);
                }
                console.error(reason)
            })
        }
    }

    closeUpGame(gameId, operatorHash) {
        if (this.virtualOperators[operatorHash]) {
            this.virtualOperators[operatorHash].stop();
            delete this.virtualOperators[operatorHash];
        }
        setTimeout(() => {
            console.warn('deleting game ', gameId);
            delete this.games[gameId];
        }, 15 * 60 * 1000);
    }

    callBingo(gameId, playerId, cardId) {
        return new Promise((resolve, reject) => {
            try {
                if (this.hasGame(gameId)) {
                    const result = this.games[gameId].callBingo(playerId, cardId);
                    if (result.isWin) {
                        this.closeUpGame(gameId, this.games[gameId].operatorHash);
                    }
                    resolve(result);
                } else {
                    throw 'no-such-game';
                }
            } catch (e) {
                reject(e)
            }
        });
    }

    getPlayerCount(gameId) {
        if (this.hasGame(gameId)) {
            return this.games[gameId].getPlayerCount()
        }
    }

    isGameOperator(gameId, operatorHash) {
        return this.hasGame(gameId) && this.games[gameId].isOperator(operatorHash);
    }

    addSocketToPlayer(gameId, playerId, socketId) {
        if (this.hasGame(gameId)) {
            return this.games[gameId].addSocketToPlayer(playerId, socketId);
        }
        return false;
    }
    removeSocketFromPlayer(gameId, playerId, socketId) {
        if (this.hasGame(gameId)) {
            return this.games[gameId].removeSocketFromPlayer(playerId, socketId);
        }
        return false;
    }

    getWinnerMessage(gameId) {
        return this.hasGame(gameId) ? this.games[gameId].getWinnerMessage() : null;
    }

    getGameStatus(gameId) {
        return this.hasGame(gameId) ? this.games[gameId].status : null;
    }
    getLastCall(gameId) {
        return this.hasGame(gameId) ? this.games[gameId].lastCalledNumber : null;
    }
    getPlayerPoints(gameId, playerId) {
        return this.hasGame(gameId) ? this.games[gameId].getPlayerPoints(playerId) : 0;
    }

    markCardForPlayer(gameId, playerId, cardId, row, col) {
        if (this.hasGame(gameId)) {
            this.games[gameId].markCardForPlayer(playerId, cardId, row, col);
        }
    }


}