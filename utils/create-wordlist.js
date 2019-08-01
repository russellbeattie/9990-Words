/*
    create-wordlist.js

    Imports and cleans dictionary files provided by WordNet 3.0

    Download dictionary file (look for "DATABASE FILES ONLY" package):

    http://wordnet.princeton.edu/wordnet/download/current-version/

    Decompress and copy data.adj, data.adv, data.noun and data.verb files 
    to same directory as this script, then run:
    
    $ node create-wordlist.js 
    
    This will produce a words.json dictionary file of 4-10 letter words 
    to be used by create-puzzle.js puzzle generator.

*/

var fs = require('fs');

var files = ['data.adj','data.adv','data.verb','data.noun'];

var text = '';

var popularText = fs.readFileSync('./popular.json');
var popular = JSON.parse(popularText);

for(var f = 0; f < files.length; f++){
    text += fs.readFileSync('./' + files[f]).toString()
}

var lines = text.split('\n');

var allWords = {};

for (var i = 0; i < lines.length; i++) {

    if(lines[i].substr(0, 2) == '  '){
        continue;
    }

    var line = lines[i].trim();
    var ln = line.split('|');
    var wordPartStr = ln[0].trim();
    var wordPart = wordPartStr.split(' ');

    if(wordPart[4]){
        var word = wordPart[4].trim().toLowerCase();

        if(word.includes('(')){
            word = word.slice(0, word.indexOf('('));
        }

        var def = ln[1].trim();

        if(word.includes('\'') || word.includes('/') || word.includes('-') || word.includes('_') || word.includes('(') ){
            continue;
        }

        if(word.length < 4 || word.length > 10){
            continue;
        }

        if(def.includes(';')){
            def = def.substr(0, def.indexOf(';'));
        }

        if(!def.endsWith('.')){
            def = def + '.';
        }

        if(def.toLowerCase().includes(word)){
            continue;
        }

        if(def.startsWith('(')){
            def = def.slice(def.indexOf(')') + 2);
        }

        if(wordPart[2] == 'v'){
            if(def.substr(0,3) !== 'to '){
                def = 'To ' + def;
            }
        }

        if(!popular.includes(word)){
            continue;
        }

        def = def.charAt(0).toUpperCase() + def.slice(1);

        if(allWords[word]){
            allWords[word].push(def);
        } else {
            allWords[word] = [];
            allWords[word].push(def);
        }

    }

}

var defCount = 0;
var sortedWords = {};

Object.keys(allWords).sort().forEach((key) => {
    sortedWords[key] = allWords[key];
    defCount += allWords[key].length;
});

fs.writeFileSync('./words.json', JSON.stringify(sortedWords, null, 2));

console.log(Object.keys(sortedWords).length + ' words, ' + defCount + ' definitions.');