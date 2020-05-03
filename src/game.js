var short = require('short-uuid');
const Player = require('./player')
const constats = require('./constats');

module.exports = class Game {


    constructor(name, pattern, winBy, cardLimit) {
        this.status = constats.STATUS.WAITING_FOR_PLAYERS;
        this.players = {};
        this.leftNumbers = [];
        this.calledNumbers = [];
        this.lastCalledNumber = null;
        this.createdAt = new Date();
        this.finishingPattern = constats.PATTERN_NAMES[pattern];
        this.winnerResolution = constats.WINNER_RESOLUTION[winBy];

        this.availablePatterns = constats.AVAILABLE_BINGO_PATTERNS[winBy][pattern];

        this.cardLimit = cardLimit;
        this.winner = null;



        this.id = short.generate();
        this.name = name;
        this.operatorHash = short.generate();

        for (let i = 1; i <= 75; i++) {
            this.leftNumbers.push(i);
        }
        this.leftNumbers = this.leftNumbers.sort((a, b) => Math.random() - 0.5);
    }


    subscribe(playerName) {
        const player = new Player(playerName);
        player.createBingoCards(this.cardLimit, this.availablePatterns);
        this.players[player.id] = player;
        return player;
    }

    operatorCall(operatorHash) {
        return new Promise((resolve, reject) => {
            if (this.operatorHash === operatorHash) {
                if (this.leftNumbers.length > 0) {
                    if (this.status === constats.STATUS.FINISHED) {
                        reject('game-already-finished')
                    }
                    if (this.status === constats.STATUS.WAITING_FOR_PLAYERS) {
                        reject('game-is-not-started')
                    }
                    const operatorCall = this.leftNumbers.pop();
                    this.calledNumbers.push(operatorCall);
                    this.lastCalledNumber = operatorCall;
                    resolve(operatorCall);
                } else {
                    reject('no-numbers-left-to-call');
                }
            } else {
                reject('not-an-operator')
            }
        })

    }

    startGame(operatorHash) {
        return new Promise((resolve, reject) => {
            if (this.operatorHash === operatorHash) {
                this.status = constats.STATUS.STARTED;
                resolve();
            } else {
                reject('not-an-operator');
            }
        })
    }

    callBingo(playerId, cardId, patternName) {
        return new Promise((resolve, reject) => {
            try {

                const pattern = constats.PATTERN[patternName]
                const player = this.players[playerId];

                if (!player) {
                    throw 'no-such-player'
                }
                if (!pattern) {
                    throw 'no-such-pattern'
                }
                const isBingo = player.getCard(cardId).checkPattern(pattern, this.calledNumbers);
                console.log('isBingo', isBingo);
                if (isBingo) {
                    if (pattern.name === this.finishingPattern) {
                        this.status = constats.STATUS.FINISHED;
                        if (this.winnerResolution === constats.WINNER_RESOLUTION.PATTERN) {
                            this.winner = player
                        } else {
                            this.winner = this.players[this.getWinnersPlayerIdByPoints()];
                        }
                        this.status = constats.STATUS.FINISHED;
                    }
                }
                resolve({
                    isWin: !!this.winner,
                    isBingo: isBingo
                });
            } catch (e) {
                reject(e);
            }

        })
    }

    pointsPerPlayer() {
        return Object.keys(this.players).map(playerId => {
            const player = this.players[playerId];
            return { id: player.id, name: player.name, points: player.points() }
        }).sort((a, b) => a.points - b.points);
    }

    markCardForPlayer(playerId, cardId, row, col) {
        try {
            this.players[playerId] && this.players[playerId].getCard(cardId).mark(row, col);
        } catch (e) {
            console.warn(e);
        }

    }



    getWinnersPlayerIdByPoints() {
        console.log('getWinnerByPoints', this.pointsPerPlayer())
        return this.pointsPerPlayer()[0].id;
    }

    getPlayer(playerId) {
        return new Promise((resolve, reject) => {
            const player = this.players[playerId];
            player ? resolve(player) : reject('no-such-player');
        })
    }

    getPlayerPoints(playerId) {
        if (this.winnerResolution == constats.WINNER_RESOLUTION.POINTS) {
            console.log(this.players, playerId);
            return this.players[playerId] ? this.players[playerId].points() : 0;
        }
        return -1
    }

    getPlayerCount() {
        const playerIds = Object.keys(this.players);
        return {
            total: playerIds.length,
            online: playerIds.filter(playerId => this.players[playerId].isOnline()).length
        }
    }

    getWinnerMessage() {
        if (constats.STATUS.FINISHED == this.status) {
            return {
                player: this.winner,
                scorePoints: constats.WINNER_RESOLUTION.POINTS == this.winnerResolution ? this.pointsPerPlayer() : null
            }
        }
        return null;

    }

    forOperator() {
        return Object.assign({}, this.forPlayer(), { operatorHash: this.operatorHash, calledNumbers: this.calledNumbers });
    }

    forPlayer() {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            lastCalledNumber: this.lastCalledNumber,
            finishingPattern: this.finishingPattern,
            winnerResolution: this.winnerResolution,
            cardLimit: this.cardLimit,
            playersCount: this.getPlayerCount(),
            createdAt: this.createdAt
        }
    }

}