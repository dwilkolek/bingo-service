const { v4: uuidv4 } = require('uuid');
const BingoCard = require('./bingo-card');
module.exports = class Game {
    
    id = null;
    operatorHash = null;
    
    name = 'Unnamed';
    bingoCards = {};
    calledNumbers = [];

    constructor(name) {
        this.id = uuidv4();
        this.name = name;
        this.operatorHash = uuidv4();
    }


    subscribe(playerName) {
        const card = new BingoCard(playerName);
        this.bingoCards[card.id] = card;
        return card;
    }

    operatorCall(operatorHash, operatorCall) {
        if (this.operatorHash === operatorHash) {
            if (this.calledNumbers.indexOf(operatorCall) > -1) {
                throw 'already-called';
            }
            this.calledNumbers.push(operatorCall)
        } else {
            throw 'not-an-operator';
        }
    }

    callBingo(cardId) {
        const card = this.bingoCards[cardId];
        if (!card) {
            throw 'no-such-card-in-this-game';
        }
        return card.checkBingo();
    }

    getCard(cardId) {
        const card = this.bingoCards[cardId];
        if (!card) {
            throw 'no-such-card-in-this-game';
        }
        return card;
    }

}