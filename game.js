const { v4: uuidv4 } = require('uuid');
const RULES = require('./rules')
const Player = require('./player')

var STATUS = {
    WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
    STARTED: 'STARTED',
    FINISHED: 'FINISHED'
}

var CARD_RULES = {
    ALL_EVEN: 'ALL_EVEN',
    UP_TO: 'UP_TO'
}

module.exports = class Game {

    id = null;
    operatorHash = null;

    status = STATUS.WAITING_FOR_PLAYERS;

    name = 'Unnamed';
    players = {};

    leftNumbers = [];
    calledNumbers = [];
    lastCalledNumber;

    rule = RULES.ONE_LINE;

    cardLimit = 3;
    cardRule = CARD_RULES.ALL_EVEN;

    winner;

    constructor(name) {
        this.id = uuidv4();
        this.name = name;
        this.operatorHash = uuidv4();
        this.leftNumbers = [];
        for (let i = 1; i <= 75; i++) {
            this.leftNumbers.push(i);
        }
        this.leftNumbers = this.leftNumbers.sort((a, b) => Math.random() - 0.5);
    }


    subscribe(playerName, cards) {
        const player = new Player(playerName);
        if (!cards) {
            cards = 1;
        }
        if (CARD_RULES.ALL_EVEN == this.cardRule) {
            cards = this.cardLimit;
        } else if (CARD_RULES.UP_TO == this.cardRule) {
            if (cards > this.cardLimit) {
                cards = this.cardLimit;
            }
        }
        player.createBingoCards(cards);
        this.players[player.id] = player;
        return player;
    }

    operatorCall(operatorHash) {
        return new Promise((resolve, reject) => {
            if (this.operatorHash === operatorHash) {
                if (this.leftNumbers.length > 0) {
                    const operatorCall = this.leftNumbers.pop();

                    if (this.calledNumbers.indexOf(operatorCall) > -1) {
                        reject('allready-called')
                    }
                    if (this.status === STATUS.FINISHED) {
                        reject('game-already-finished')
                    }
                    if (this.status === STATUS.WAITING_FOR_PLAYERS) {
                        reject('game-is-not-started')
                    }
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
                this.status = STATUS.STARTED;
                resolve();
            } else {
                reject('not-an-operator');
            }
        })

    }

    callBingo(playerId, cardId) {
        return new Promise((resolve, reject) => {
            try {
                const player = this.players[playerId];
                if (!player) {
                    throw 'no-such-player'
                }

                if (player.getCard(cardId).checkBingo(this.rule, this.calledNumbers)) {
                    this.status = STATUS.FINISHED;
                    this.winner = {
                        cardId: cardId,
                        player: player,
                    }
                    resolve(this.winner);
                } else {
                    throw 'not-a-bingo';
                }
            } catch (e) {
                reject(e);
            }

        })
    }

    markCardForPlayer(playerId, cardId, row, col) {
        try {
            this.players[playerId] && this.players[playerId].getCard(cardId).mark(row, col);
        } catch (e) {
            console.warn(e);
        }

    }

    getPlayer(playerId) {
        return new Promise((resolve, reject) => {
            const player = this.players[playerId];
            player ? resolve(player) : reject('no-such-player');
        })
    }

    getPlayerCount() {
        const playerIds = Object.keys(this.players);
        return {
            total: playerIds.length,
            online: playerIds.filter(playerId => this.players[playerId].isOnline()).length
        }
    }



}