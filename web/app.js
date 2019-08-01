
var App = {};

App.init = function() {

    $('.credits').innerHTML += ' - v1.0';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');

        var refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            if(refreshing){
                return;
            }
            console.log('reloading');
            refreshing = true;
            window.location.reload(); 
        });
    }

    App.name = $('.title').textContent;
    App.puzzleNum = 0;

    App.sounds = {};

    App.sounds['ding'] = Object.assign(new Audio(), {
        src: './assets/ding.mp3',
        volume: 0.1,
        loop: false
    });

    App.sounds['sweep'] = Object.assign(new Audio(), {
        src: './assets/sweep.mp3',
        volume: 0.2,
        loop: false
    });

    App.timerEl = $('.timer');

    App.homeView.init();
    App.puzzleView.init();

    window.addEventListener('hashchange', App.doCheckHash);

    if(navigator.share){
        $('.titlenum').addEventListener('touchend', function(e) {
            e.preventDefault();
            if($('.titlenum').textContent !== ''){
                navigator.share({
                    title: '9990 Words puzzle #' + App.puzzleNum,
                    text: 'Check out this word puzzle!',
                    url: document.location.href,
                });
            }
        });
    }




    App.doCheckHash();

};

App.doCheckHash = function(e) {
    if(e){
        e.preventDefault();
    }
    var hash = window.location.hash.substr(1);
    if (hash === App.prevHash) {
        return;
    }
    App.prevHash = hash;

    App.route(hash);
};

App.route = function(page) {

    if (App.currentView) {
        hide(App.currentView.el);
    }

    var hash = '#' + page;
    var newUrl = window.location.href.replace(/#(.*)$/, '') + hash;
    window.history.replaceState(null, document.title, newUrl);

    if (page == '' || page == 'home') {

        document.title = App.name;
        $('.titlenum').textContent = '';

        App.homeView.render();

        App.currentView = App.homeView;

    } else {

        var pageNum = parseInt(page);
        if(isNaN(pageNum) || pageNum < 1 || pageNum > 999){
            App.route('home');
            return;
        }

        document.title = App.name + ' / Puzzle ' + page;
        $('.titlenum').textContent = '#' + page;

        App.puzzleView.render(page);

        App.currentView = App.puzzleView;

    }

    fadeIn(App.currentView.el);

};

App.play = function(sound) {
    if (App.sounds) {
        var snd = App.sounds[sound];
        try {
            snd.pause();
            snd.currentTime = 0;
        } catch (err) {}
        snd.play();
    }
};

App.addWin = function(puzNum) {
    if (window['localStorage']) {
        var wins = localStorage[App.name + '-wins'];
        if (!wins) {
            wins = [];
        } else {
            wins = JSON.parse(wins);
        }
        wins.push(puzNum);
        localStorage[App.name + '-wins'] = JSON.stringify(wins);
    }
};

App.getWins = function() {
    if (window['localStorage']) {
        var wins = localStorage[App.name + '-wins'];
        if (wins) {
            wins = JSON.parse(wins);
            wins = wins.filter(function(puz, index, arr) { 
                return arr.indexOf(puz) == index;
            });
            wins.sort(function(a, b) {
                return (b - a)
            });


        } else {
            wins = [];
        }
        return wins;
    } else {
        return [];
    }
};

App.view = {

    render: function() {},
    events: {},
    init: function() {
        for (var key in this.events) {
            var event = key.split(' ');
            var el = $(event[1]);
            if (el) {
                el.addEventListener(event[0], this[this.events[key]].bind(this));
            }
        }
    }

};

App.homeView = Object.assign({}, App.view, {

    el: $('.home'),

    events: {
        'submit .puz-form': 'doLoadPuzzle',
        'touchend .go-btn': 'doLoadPuzzle',
        'touchend .random-btn': 'doRandomPuzzle',
        'click .go-btn': 'doLoadPuzzle',
        'click .random-btn': 'doRandomPuzzle'
    },

    render: function() {

        hide(App.timerEl);

        if (App.puzzleNum == 0) {
            $('.puznum').value = '';
        } else {
            $('.puznum').value = App.puzzleNum + '';
        }

        var wins = App.getWins();

        var nextNum = 1;

        for(var i = 1; i < 1000; i++){
            if(!wins.includes(i)){
                nextNum = i;
                break;
            }
        }

        $('.puznum').value = nextNum;

        if (wins.length > 0) {

            var winsEl = $('.wins');
            winsEl.setAttribute('style', '');
            winsEl.innerHTML = '';

            var winLabel = document.createElement('span');
            winLabel.textContent = 'Wins: ';
            winsEl.appendChild(winLabel);

            for (var i = 0; i < wins.length; i++) {
                var win = wins[i];
                var a = document.createElement('a');
                a.href = '#' + win;
                a.textContent = win;
                winsEl.appendChild(a);
                if(i < wins.length - 1){
                    winsEl.appendChild(document.createTextNode(', '));
                }
            }
        }

        $('.puznum').focus();

    },

    doLoadPuzzle: function(e) {
        e.preventDefault();

        var puzNum = parseInt($('.puznum').value);

        if (isNaN(puzNum) || puzNum < 1 || puzNum > 999) {

            $('.puznum').value = '';
            App.puzzleNum = 0;

        } else {
            App.puzzleNum = puzNum;
            App.route(puzNum);
        }

    },

    doRandomPuzzle: function(e) {
        e.preventDefault();

        App.puzzleNum = Math.floor(Math.random() * (1001));

        $('.puznum').value = App.puzzleNum;

    },

});

App.puzzleView = Object.assign({}, App.view, {

    el: $('.puzzle'),

    secs: 0,
    stop: false,
    intervalID: null,
    guessing: false,
    count: 0,
    total: 0,
    puzNum: 0,
    data: null,
    hinting: false,
    squares: [],

    events: {
        'touchend .shuffle': 'doReorder',
        'touchend .sort': 'doReorder',
        'touchend .squares': 'doSquare',
        'touchend .reset': 'doReset',
        'touchend .clear': 'doReset',
        'touchend .restart': 'doRestart',
        'touchend .gohome': 'doHome',
        'touchend .next': 'doNext',
        'click .shuffle': 'doReorder',
        'click .sort': 'doReorder',
        'click .squares': 'doSquare',
        'click .reset': 'doReset',
        'click .clear': 'doReset',
        'click .restart': 'doRestart',
        'click .gohome': 'doHome',
        'click .next': 'doNext',
    },

    render: function(puzNum) {

        this.guessing = false;
        this.count = 0;

        puzNum = parseInt(puzNum);

        if (isNaN(puzNum) || puzNum < 1 || puzNum > 1000) {
            App.route('home');
            return;
        }

        App.puzzleNum = puzNum;

        hide($('.gameover'));

        show($('.squares'));
        show($('.answer'));
        show($('.shuffle'));
        show($('.sort'));
        show($('.clear'));

        $('.answertext').innerHTML = '';

        this.start = new Date();
        this.secs = 0;
       
        this.puzzle = puzzles[puzNum];

        this.total = puzzles[puzNum]['clues'].length;

        var ul = document.createElement('ul');

        var clues = this.puzzle['clues'];

        for (var i = 0; i < clues.length; i++) {
            var clue = clues[i]

            var li = document.createElement('li');
            li.className = 'clue';
            li.dataset.answer = clue['word'];
            li.dataset.id = i;

            var word = document.createElement('span');
            word.className = 'word';
            word.textContent = clue['word'].length + ' letters';

            word.addEventListener('touchend', this.doHint.bind(this));
            word.addEventListener('click', this.doHint.bind(this));

            var def = document.createElement('span');
            def.className = 'def';
            def.textContent = clue['def'];

            var clueNum = document.createElement('span');
            clueNum.className = 'clue-num';
            clueNum.textContent = i + 1 + '.';

            li.appendChild(clueNum);
            li.appendChild(word);
            li.appendChild(def);

            ul.appendChild(li);
        }

        var cluesEl = $('.clues');
        cluesEl.innerHTML = '';
        cluesEl.appendChild(ul);
        setTimeout(function(){
            cluesEl.scroll(0, 0);
        },0);

        var squares = this.puzzle['squares'];

        squares.sort();

        var table = document.createElement('table');
        var tr = document.createElement('tr');

        for (var i = 0; i < squares.length; i++) {
            var sq = squares[i]

            var td = document.createElement('td');
            td.id = 'p' + i;
            var div = document.createElement('div');
            div.classList.add('square');
            div.classList.add('letters');
            div.setAttribute('tabindex','0');
            div.textContent = sq;
            td.appendChild(div);
            tr.appendChild(td);

            if ((i + 1) % 6 == 0) {
                table.appendChild(tr);
                tr = document.createElement('tr');
            }

        }
        $('.squares').innerHTML = '';
        $('.squares').appendChild(table);

        this.squares = $$('.square');

        this.startTimer();

    },

    doHome: function(e) {
        e.preventDefault();
        this.stopTimer();
        App.route('home');
    },

    doNext: function(e) {
        e.preventDefault();
        App.route((App.puzzleNum + 1));
    },

    doShare: function(e) {
        e.preventDefault();
        if(navigator.share){
            navigator.share({
<<<<<<< HEAD
                title: 'Clever.io puzzle solved!',
=======
                title: '999 Words puzzle solved!',
>>>>>>> First commit
                text: 'I finished this word puzzle in ' + App.formatTime(this.secs) + ' minutes. Try it for yourself! ',
                url: document.location.href,
            });
        }
    },

    doReorder: function(e) {
        e.preventDefault();

        var order = 'sort';
        if(e.target.classList.contains('shuffle')){
            order = 'shuffle';
        }

        var squares = Array.from($$('.square'));

        if (order == 'sort') {
            squares.sort(function(a, b) {
                if (a.textContent > b.textContent) {
                    return 1;
                }
                if (a.textContent < b.textContent) {
                    return -1;
                }
                if (a.textContent == b.textContent) {
                    return 0;
                }
            });

        } else {
            squares = App.shuffle(squares);
        }

        for (var i = 0; i < squares.length; i++) {
            var pos = $('#p' + i);
            pos.innerHTML = '';
            pos.appendChild(squares[i]);
        }

    },

    doHint: function(e) {
        e.stopPropagation();

        if (this.hinting) {
            return;
        }

        this.doReset();

        this.secs = this.secs + 30;

        var clue = e.currentTarget.parentElement

        if (clue.dataset.answer == '') {
            return;
        }

        var answer = clue.dataset.answer;

        var start3 = answer.slice(0,3);
        var start2 = answer.slice(0,2);

        var view = this;

        
        // check first 3
        for (var i = 0; i < this.squares.length; i++) {

            var square = this.squares[i];

            if (square.dataset.guessed !== 'true' && square.style.display !== 'none') {

                var s = square.textContent;

                if (start3 == s) {
                    view.hinting = true;
                    clue.classList.toggle('hint');
                    square.classList.toggle('hint');
                    setTimeout(function() {
                        clue.classList.toggle('hint');
                        square.classList.toggle('hint');
                        view.hinting = false;
                    }, 2500);
                    return;
                    break;
                }
            }
        }

        //check first 2

        for (var i = 0; i < this.squares.length; i++) {

            var square = this.squares[i];

            if (square.dataset.guessed !== 'true' && square.style.display !== 'none') {

                var s = square.textContent;

                if (start2 == s) {
                    view.hinting = true;
                    clue.classList.toggle('hint');
                    square.classList.toggle('hint');
                    setTimeout(function() {
                        clue.classList.toggle('hint');
                        square.classList.toggle('hint');
                        view.hinting = false;
                    }, 2500);
                    return;
                    break;
                }
            }
        }

    },

    doSquare: function(e) {

        e.stopPropagation();
        e.preventDefault();

        if (this.guessing == false) {

            var sq = e.target;

            if(sq.nodeName == 'TD'){
                return;
            }

            if(sq.dataset.guessed == 'true'){
                return;
            }

            var answertextEl = $('.answertext');

            var a = answertextEl.textContent;

            a = a + sq.textContent;

            if (a.length > 10) {
                return;
            } else {
                sq.dataset.guessed = true;
                fadeOut(sq);
                answertextEl.textContent = a;
                this.guessWord(a);
            }
        }

    },

    guessWord: function(a) {

        if (a == '') {
            return;
        }

        var clues = $$('.clues li');

        this.guessing = true;

        for (var i = 0; i < clues.length; i++) {

            var clue = clues[i];

            var b = clue.dataset.answer;

            if (a.toLowerCase() == b.toLowerCase()) {

                App.play('ding');

                clue.dataset.answer = '';

                $('.answertext').textContent = '';

                fadeOut(clue, false);

                setTimeout(function() {
                    clue.querySelector('.word').classList.add('correct');
                    clue.querySelector('.word').textContent = a.toLowerCase();
                    clue.querySelector('.def').classList.add('crossed-out');
                    fadeIn(clue);
                }, 400);

                $$('.square').forEach(function(square) {
                    square.dataset.guessed = '';
                });

                this.count++;

                if (this.count == this.total) {
                    this.winGame();
                    return;
                }

                break;

            }

        }

        this.guessing = false;

    },

    winGame: function() {

        var secs = this.secs;

        this.stopTimer();

        App.addWin(App.puzzleNum);

        App.play('sweep');

        setTimeout(function() {

            $('.yourtime').textContent = 'Your time: ' + App.formatTime(secs);

            var shareEl = $('.share-link');
            if (navigator.share) {
                shareEl.innerHTML = 'Share';
                shareEl.addEventListener('touchend', this.doShare.bind(this));
                shareEl.addEventListener('click', this.doShare.bind(this));
            } else {
                shareEl.querySelector('a').href = document.location.href;
            }

            hide($('.squares'));
            hide($('.answer'));
            hide($('.shuffle'));
            hide($('.sort'));
            hide($('.clear'));
            fadeIn($('.gameover'));

        }.bind(this), 1000);

    },

    doRestart: function(e) {
        if(e){
            e.preventDefault();
        }
        this.secs = 0;
        this.render(App.puzzleNum);
    },

    doReset: function(e) {
        if(e){
            e.preventDefault();
        }
        $('.answertext').innerHTML = '';

        $$('.square').forEach(function(square) {
            if (square.dataset.guessed == 'true') {
                square.dataset.guessed = '';
                fadeIn(square);
            }
        });
    },

    stopTimer: function() {
        clearInterval(this.intervalID);
        this.intervalID = null;
        hide(App.timerEl);
    },

    startTimer: function() {
        this.secs = 0;
        App.timerEl.textContent = App.formatTime(this.secs);
        show(App.timerEl);
        
        clearInterval(this.intervalID);
        this.intervalID = setInterval(function() {
            if(!document.hidden){
                this.secs++;
            }
            App.timerEl.textContent = App.formatTime(this.secs);
        }.bind(this), 1000);

    },

});

// ----- misc functions

App.formatTime = function(seconds) {

    var hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    if (hours == '00') {
        hours = '';
    } else {
        hours = hours + ':';
    }

    return hours + minutes + ':' + seconds;

};

App.shuffle = function(arr) {
    for (var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
    return arr;
};

// function helpers

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function hide(el) {
    el.style.display = 'none';
    el.style.opacity = 0;
}

function show(el) {
    el.style.display = '';
    el.style.opacity = 1;
}

function fadeOut(el, hide) {
    if(hide == undefined){
        hide = true;
    }
    el.style.opacity = 1;

    (function fade() {
        if ((el.style.opacity -= .1) < 0) {
            if (hide) {
                el.style.display = 'none';
            }
        } else {
            requestAnimationFrame(fade);
        }
    })();
}

function fadeIn(el) {
    el.style.opacity = 0;
    el.style.display = '';

    (function fade() {
        var val = parseFloat(el.style.opacity);
        var proceed = ((val += 0.1) > 1) ? false : true;

        if (proceed) {
            el.style.opacity = val;
            requestAnimationFrame(fade);
        }
    })();
}