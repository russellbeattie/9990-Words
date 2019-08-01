/*
    create-puzzle.js

    Generates puzzles.js file to be imported by the main puzzle app. 

    Requires words.json file generated by the create-wordlist.js script.

    $ node create-puzzle.js


*/
var fs = require('fs');

// List out the possible ways to divide a word into squares with 2 or 3 letters.
var squaresList = {};
squaresList[2] = [
    {wordlen: 4, squares: [2,2] },
    {wordlen: 5, squares: [2,3] },
    {wordlen: 5, squares: [3,2] },
    {wordlen: 6, squares: [3,3] }
];
squaresList[3] = [
    {wordlen: 6, squares: [2,2,2] },
    {wordlen: 7, squares: [2,2,3] },
    {wordlen: 7, squares: [2,3,2] },
    {wordlen: 7, squares: [3,2,2] },
    {wordlen: 8, squares: [3,3,2] },
    {wordlen: 8, squares: [3,2,3] },
    {wordlen: 8, squares: [2,3,3] },
    {wordlen: 9, squares: [3,3,3] },
];
squaresList[4] = [
    {wordlen: 8, squares: [2,2,2,2] },
    {wordlen: 9, squares: [2,2,2,3] },
    {wordlen: 9, squares: [2,2,3,2] },
    {wordlen: 9, squares: [2,3,2,2] },
    {wordlen: 9, squares: [3,2,2,2] },
    {wordlen: 10, squares: [3,3,2,2]},
    {wordlen: 10, squares: [3,2,3,2]},
    {wordlen: 10, squares: [3,2,2,3]},
    {wordlen: 10, squares: [2,2,3,3]},
    {wordlen: 10, squares: [2,3,2,3]}
];

// To fill 30 squares with
var squaresWordLengths = [
    [4, 4, 3, 3, 3, 3, 3, 3, 2, 2],
    [4, 4, 4, 3, 3, 3, 3, 2, 2, 2]
];


// pull in the word list, divide into lists by word length
var jsonText = fs.readFileSync('./words.json');

var wordDefs = JSON.parse(jsonText);

var allWords = Object.keys(wordDefs);

var words = {};

allWords.forEach((word) => {
    var wordLength = word.length;
    if(!words[wordLength]){
        words[wordLength] = [];
    }
    words[wordLength].push({
        word: word,
        def: wordDefs[word]
    });

});

var usedWords = [];
var usedDefs = [];

var wordCheck = [];

// generate puzzles
var puzzles = [];

for(var p = 1; p <= 1000; p++){

    var puzzle = {};
    var cwords = [];
    var csquares = [];

    var squaresNeeded = squaresWordLengths[Math.floor(Math.random() * squaresWordLengths.length)];

    for (var i = 0; i < squaresNeeded.length; i++) {

        var squareTypes = squaresList[squaresNeeded[i]];

        var squareType = squareTypes[Math.floor((Math.random() * squareTypes.length))];
        
        var wordlist = words[squareType.wordlen];
        
        var flag = true;
        var attempt = 0;
        var defattempt = 0;
        var entry = '';
        var def = '';

        entry = wordlist[Math.floor((Math.random() * wordlist.length))];
        def = entry.def[Math.floor((Math.random() * entry.def.length))];

        while(flag){
            
            var entrydef = entry.word + def;

            if(usedWords.includes(entrydef)){
                defattempt++;
                if(defattempt > 3){
                    attempt++;
                    if(attempt > 5){
                        flag = false;
                        usedWords.push(entrydef);
                    } else {
                        entry = wordlist[Math.floor((Math.random() * wordlist.length))];
                        def = entry.def[Math.floor((Math.random() * entry.def.length))];
                    }
                } else {
                    def = entry.def[Math.floor((Math.random() * entry.def.length))];
                }
                console.log('retrying... ', entry.word);
            } else {
                flag = false;
                usedWords.push(entrydef);

            }
            
        }

        cwords.push({
            word: entry.word,
            def: def
        });

        wordCheck.push(entrydef);

        var start = 0;

        var squares = squareType.squares;

        for (var x = 0; x < squares.length; x++) {
            var letnum = squares[x];

            csquares.push(entry.word.substr(start, letnum));
            
            start += letnum;
            
        }

    }

    cwords = shuffle(cwords);
    csquares = shuffle(csquares);

    puzzle['clues'] = cwords;
    puzzle['squares'] = csquares;

    puzzles.push(puzzle);

}

var json = JSON.stringify(puzzles, null, 2);

fs.writeFileSync('./puzzles.json', json);

json = JSON.stringify(puzzles);

var js = 'var puzzles = ' + json;

fs.writeFileSync('./puzzles.js', js);

    
function shuffle(arr) {
    for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
    return arr;
}


var a = [...new Set(wordCheck)];
console.log(a.length + ' unique words + definitions.');