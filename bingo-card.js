const RandomNumberProvider = require('./random-number-provider');
const { v4: uuidv4 } = require('uuid');

module.exports = class BingoCard {

    id = '';
    numbers = [];
    playerName = '';

    constructor(playerName) {
        this.id = uuidv4();
        this.playerName = playerName;

        for (var i = 0; i < 5; i++) {

            var gen = new RandomNumberProvider(i * 15 + 1, (i + 1) * 15);
            for (var j = 0; j < 5; j++) {
                if (!this.numbers[j]) {
                    this.numbers[j] = [];
                }
                this.numbers[j][i] = (i == 2 && j == 2) ? null : gen.getRandomNumber();
            }
        }
        console.log(this.numbers);
    }

    checkBingo() {
        return Math.random() > 0.5;
    }

}