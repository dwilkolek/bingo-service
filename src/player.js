const BingoCard = require('./bingo-card');
var short = require('short-uuid');

module.exports = class Player {

    constructor(playerName) {
        this.bingoCards = {};
        this.sockets = [];
        this.id = short.generate();
        this.name = playerName;
    }

    points() {
        return Object.keys(this.bingoCards).map(cardId => this.bingoCards[cardId].points).reduce((a, b) => a + b, 0);
    }

    createBingoCards(n, availablePatterns) {
        for (let i = 0; i < n; i++) {
            const card = new BingoCard(this.id, availablePatterns);
            this.bingoCards[card.id] = card;
        }
    }

    getCard(cardId) {
        if (this.bingoCards[cardId]) {
            return this.bingoCards[cardId]
        }
        throw 'no-such-card';
    }

    addSocket(socketId) {
        this.sockets.push(socketId);
    }

    removeSocket(socketId) {
        this.sockets = this.sockets.filter(sid => sid != socketId);
    }

    isOnline() {
        return this.sockets.length > 0;
    }

}