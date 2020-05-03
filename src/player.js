const { v4: uuidv4 } = require('uuid');
const BingoCard = require('./bingo-card');
module.exports = class Player {

    constructor(playerName) {
        this.bingoCards = {};
        this.sockets = [];
        this.id = uuidv4();
        this.name = playerName;
    }

    createBingoCards(n) {
        for (let i = 0; i < n; i++) {
            const card = new BingoCard(this.id);
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