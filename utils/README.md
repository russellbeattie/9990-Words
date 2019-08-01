# Utils

The utils directory contain Node.js Javascript files to create a word dictionary and generate a puzzle.

* create-wordlist.js - Imports Princeton's WordNet open dictionary database files into a words.json file
* create-puzzle.js - Creates a new puzzle.js file containing 999 word puzzles from the words.json file created above.



# create-wordlist.js instructions

Imports and cleans dictionary files provided by WordNet 3.0

Download dictionary file (look for "DATABASE FILES ONLY" package):

http://wordnet.princeton.edu/wordnet/download/current-version/

Decompress and copy data.adj, data.adv, data.noun and data.verb files 
to same directory as this script, then run:

	$ node create-wordlist.js 

This will produce a words.json dictionary file of 4-10 letter words 
to be used by create-puzzle.js puzzle generator.



# create-puzzle.js instructions

After creating a words.json dictionary, run:

	$ node create-puzzle.js

This will create a puzzles.js file in the root directory of the project.