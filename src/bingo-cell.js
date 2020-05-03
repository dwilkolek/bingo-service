module.exports = class BingoCell {
    constructor(value) {
        this.value = value;
        this.marked = value == null ? true : false;
    }
}