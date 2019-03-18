// ============================
//        Constants
// ============================

const MAX_CHOSEN_COINS = 5;
const DIGITS_AFTER_DECIMAL = 3;
const MILI_TO_SEC_DIVISOR = 60000; // miliseconds
const MINUTES_TO_FETCH_INFO_AGAIN = 2;

const ALL_COINS_API_URL = 'https://api.coingecko.com/api/v3/coins/list';
const ONE_COIN_API_URL = 'https://api.coingecko.com/api/v3/coins/';// + {id}
const ONE_COIN_API_PARAMS = 'localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
const MULTI_PRICE_API_URL = 'https://min-api.cryptocompare.com/data/pricemulti?tsyms=USD&fsyms=';// + {=BTC,ETH&'}
// ============================
//        Global Variables
// ============================

let coins = [];
let chosenCoinsMap = new Map();
let moreInfoMap = new Map();
let chart;
let interval;


const coinsLimit = 20;// Dev related


$(() => {
    // window.localStorage.clear();// DELETE ON SENDING PROJECT!
    // getCoins();
    populateCoins();
    cardToggleHandler();
    moreInfoHandler();
    frontLinkHandler(); //Change Name
    routesLinksHandler();
    searchCoin()
});

class Coin {
    constructor(createdTime, id, name, image, price) {
        this.created = createdTime,
            this.id = id,
            this.name = name,
            this.image = image,
            this.price = price //object (usd, eur, ils)
    }

    isTimeExpired() {
        let now = new Date().getTime();

        let elapsed = (now - this.created) / MILI_TO_SEC_DIVISOR;// elapsed time in milliseconds converted to seconds

        return elapsed >= MINUTES_TO_FETCH_INFO_AGAIN;
    }
}

// ============================
//        Event Handlers
// ============================

const moreInfoHandler = () => {
    $('.card-info-link').click(event => {
        let id = event.target.dataset.id;

        if (window.localStorage.moreInfoMap) {
            moreInfoMap = new Map(JSON.parse(window.localStorage.moreInfoMap));
            // Fix Lose of prototype after JSON.parse
            attachCoinPrototype();
            // Check if coin already exists in Map
            if (moreInfoMap.has(id)) {
                let coin = moreInfoMap.get(id);
                // Check if time of last fetch exceeds MINUTES_TO_FETCH_INFO_AGAIN
                if (coin.isTimeExpired()) {
                    coin = getMoreInfo(id)
                } else {
                    populateMoreInfo(coin, true)
                }
            } else {
                getMoreInfo(id)
            }
        } else {
            getMoreInfo(id)
        }
    })
};

const frontLinkHandler = () => {
    $('.card-general-link').click(event => {
        let id = event.target.dataset.id;

        toggleCardTabs(id);
        toggleCardContent(id, 'front')
    })
};

const cardToggleHandler = () => {
    $('.switch').change(event => {
        let coin = {
            id: event.target.dataset.id,
            name: event.target.dataset.name,
            symbol: event.target.dataset.symbol
        }

        // add to chosenCoins
        if (event.target.checked) {
            if (chosenCoinsMap.size === MAX_CHOSEN_COINS) {
                event.target.checked = false;
                populateCoinsModal();
            } else {
                chosenCoinsMap.set(coin.id, coin);
                console.log(chosenCoinsMap)
            }
            // remove from chosenCoinsSet
        } else {
            chosenCoinsMap.delete(coin.id);
            console.log(chosenCoinsMap)
        }
    })
};

const modalDeleteHandler = () => {
    $('.modal-delete').click(event => {
        let id = event.target.dataset.id;
        const coinToggleElement = $('#' + id).find('.switch').find('input');
        coinToggleElement.prop('checked', false);
        chosenCoinsMap.delete(id);
        console.log(chosenCoinsMap);
        populateCoinsModal()
    })
};

const routesLinksHandler = () => {
    $('.route-link').click(event => {
        console.log("HERE");
        let route = event.target.dataset.route;
        console.log(route);

        switch (route) {
            case 'home':
                $('#home').removeClass('d-none').addClass('d-flex');
                $('#live-reports').removeClass('d-flex').addClass('d-none');
                $('#about').removeClass('d-flex').addClass('d-none');
                $('#home-link').removeClass('').addClass('active');
                $('#live-link').removeClass('active').addClass('');
                $('#about-link').removeClass('active').addClass('');
                destroyChart();
                break;
            case 'live-reports':
                $('#home').removeClass('d-flex').addClass('d-none');
                $('#live-reports').removeClass('d-none').addClass('d-flex');
                $('#about').removeClass('d-flex').addClass('d-none');
                $('#home-link').removeClass('active').addClass('');
                $('#live-link').removeClass('').addClass('active');
                $('#about-link').removeClass('active').addClass('');
                if(chosenCoinsMap.size > 0){
                    createChart();
                } else {
                    noCoinsSelected();
                }
                break;
            case 'about':
                $('#home').removeClass('d-flex').addClass('d-none');
                $('#live-reports').removeClass('d-flex').addClass('d-none');
                $('#about').removeClass('d-none').addClass('d-flex');
                $('#home-link').removeClass('active').addClass('');
                $('#live-link').removeClass('active').addClass('');
                $('#about-link').removeClass('').addClass('active');
                destroyChart();
                break;
            default:
                break;
        }
    })
};

// ============================
//          AJAX Calls
// ============================

function getCoins() {
    $.ajax({
        type: 'GET',
        datatype: 'json',
        url: ALL_COINS_API_URL,
        async: false,
        success: function (data) {
            coins = data;
            // console.log(coins)
            window.localStorage.coins = JSON.stringify(data)
        },
        error: function (error) {
            console.log("error : ", error)
        }
    })
}

function getMoreInfo(id) {
    let url = `${ONE_COIN_API_URL}${id}?${ONE_COIN_API_PARAMS}`;
    let newCoin = {};

    $.ajax({
        type: 'GET',
        datatype: 'json',
        url: url,
        async: true,
        beforeSend: () => {
            toggleCardContent(id, 'spinner')
        },
        success: (coin) => {
            let created = new Date().getTime();
            newCoin = new Coin(
                created,
                coin.id,
                coin.name,
                coin.image.small, {
                    usd: coin.market_data.current_price.usd.toFixed(DIGITS_AFTER_DECIMAL),
                    eur: coin.market_data.current_price.eur.toFixed(DIGITS_AFTER_DECIMAL),
                    ils: coin.market_data.current_price.ils.toFixed(DIGITS_AFTER_DECIMAL)
                })
        },
        error: (error) => {
            console.log("error : ", error)
        },
        complete: () => {
            populateMoreInfo(newCoin, false);
            moreInfoMap.set(id, newCoin);
            window.localStorage.moreInfoMap = JSON.stringify(Array.from(moreInfoMap));
            return newCoin
        }
    })
}

function getCoinsRates(chart) {
    let coinsRates = {};
    let url = `${MULTI_PRICE_API_URL}`;

    for (let coin of chosenCoinsMap.values()) {
        url += `${coin.symbol},`
    }
    console.log("URL", url);

    $.ajax({
        type: 'GET',
        datatype: 'json',
        url: url,
        async: true,
        beforeSend: () => {

        },
        success: (data) => {
            console.log(data);
            coinsRates = data;
        },
        error: (error) => {
            console.log("error : ", error)
        },
        complete: () => {
            updateChartData(chart, coinsRates)
        }
    })
}

// ============================
//        Print Functions
// ============================

function populateCoins() {
    $('#home').html('');

    let str = ``;

    var BreakException = {};

    let coinsLocal = JSON.parse(window.localStorage.coins) // Later change to all coins from API

    try {
        coinsLocal.forEach((coin, index) => {
            // coins.forEach((coin, index) => {
            if (index === coinsLimit) throw BreakException;

            str += `<div class="col-sm-4 p-0 m-0">`;
            str += `<div id="${coin.symbol}" class="card text-center text-primary border-primary m-2">`;
            str += `<div class="card-header">`;
            str += `<ul class="nav nav-tabs card-header-tabs justify-content-between">`;
            str += `<div class="d-flex">`;
            str += `<li class="nav-item">`;
            str += `<a class="nav-link card-general-link active" data-id="${coin.id}">Coin</a>`;
            str += `</li>`;
            str += `<li class="nav-item">`;
            str += `<a class="nav-link card-info-link" data-id="${coin.id}">More Info</a>`;
            str += `</li>`;
            str += `</div>`;
            str += `<div>`;
            str += `<li class="nav-item">`;
            str += `<label class="switch">`;
            str += `<input data-id="${coin.id}" data-name="${coin.name}" data-symbol="${coin.symbol.toUpperCase()}" type="checkbox">`;
            str += `<span class="slider round"></span>`;
            str += `</label>`;
            str += `</li>`;
            str += `</div>`;
            str += `</ul>`;
            str += `</div>`;
            str += `<div class="card-body">`;
            str += `<div class="card-body-front flex-column align-items-center justify-content-center d-flex">`;
            str += `<p class="card-title">${coin.symbol}</p>`;
            str += `<p class="card-subtitle mb-2 text-muted">${coin.name}</p>`;
            str += `</div>`;
            str += `<div class="card-body-info align-items-start justify-content-around d-none">`;
            str += `</div>`;
            str += `<div class="card-body-spinner spinner-border text-primary mt-4 d-none" role="status">`;
            str += `</div>`;
            str += `</div>`;
            str += `</div>`;
            str += `</div>`;
        })
    } catch (e) {
        if (e !== BreakException) throw e
    }

    $('#home').append(str)
}

function populateMoreInfo(coin, isLocal) {
    let str = ``;
    const moreInfoDiv = document.getElementById(coin.id).querySelector('.card-body').querySelector('.card-body-info');

    str += `<div>`;
    str += `<img class="p-2" src="${coin.image}" alt="thumbnail">`;
    str += `<p class="card-title">${coin.name}</p>`;
    str += `</div>`;
    str += `<div class="more-info-currency">`;
    str += `<p>${coin.price.usd}<span class="currency-symbol">$</span></p>`;
    str += `<p>${coin.price.eur}<span class="currency-symbol">€</span></p>`;
    str += `<p>${coin.price.ils}<span class="currency-symbol">₪</span></p>`;
    str += `</div>`;

    moreInfoDiv.innerHTML = str;

    toggleCardTabs(coin.id);

    if (isLocal) {
        toggleCardContent(coin.id, 'info-exist')
    } else {
        toggleCardContent(coin.id, 'info')
    }
}

function populateCoinsModal() {
    $('.modal-body').html('');
    let str = ``;

    for (let [id, coin] of chosenCoinsMap) {
        str += `<div class="modal-row d-flex justify-content-between">`;
        str += `<p>${coin.name}</p>`;
        str += `<i class="modal-delete far fa-trash-alt text-danger" data-id="${id}"></i>`;
        str += `</div>`;
    }

    $('.modal-body').html(str);
    modalDeleteHandler()
    $('#chosenCoinsModal').modal('show')
}

// ============================
//        Helper Functions
// ============================

function toggleCardContent(id, show) {
    let infoDiv = document.getElementById(id).querySelector('.card-body').querySelector('.card-body-info');
    let frontDiv = document.getElementById(id).querySelector('.card-body').querySelector('.card-body-front'); //.getElementById('.card-body').getElementById('.card-body-front')
    let spinner = document.getElementById(id).querySelector('.card-body').querySelector('.card-body-spinner');

    switch (show) {
        case 'front':
            frontDiv.classList.remove('d-none');
            infoDiv.classList.remove('d-flex');
            // spinner.classList.remove('d-flex-inline')
            frontDiv.classList.add('d-flex');
            infoDiv.classList.add('d-none');
            // spinner.classList.add('d-none')
            break;
        case 'info':
            // frontDiv.classList.remove('d-flex')
            infoDiv.classList.remove('d-none');
            spinner.classList.remove('d-flex-inline');
            // frontDiv.classList.add('d-none')
            infoDiv.classList.add('d-flex');
            spinner.classList.add('d-none');
            break;
        case 'spinner':
            frontDiv.classList.remove('d-flex');
            // infoDiv.classList.remove('d-flex')
            spinner.classList.remove('d-none');
            frontDiv.classList.add('d-none');
            // infoDiv.classList.add('d-none')
            spinner.classList.add('d-flex-inline');
            break;
        case 'info-exist':
            frontDiv.classList.remove('d-flex');
            infoDiv.classList.remove('d-none');
            // spinner.classList.remove('d-flex-inline')
            frontDiv.classList.add('d-none');
            infoDiv.classList.add('d-flex');
        // spinner.classList.add('d-none')
            break;
        default:
            break;
    }
}

function toggleCardTabs(id) {
    let generalTab = $(`#${id}`).children('.card-header').children('ul').children('div').children('li').children('.card-general-link');
    let moreTab = $(`#${id}`).children('.card-header').children('ul').children('div').children('li').children('.card-info-link');
    generalTab.toggleClass('active');
    moreTab.toggleClass('active');
}

function attachCoinPrototype() {
    moreInfoMap.forEach((coin) => {
        if (coin) {
            coin.__proto__ = Coin.prototype;
        } else {
            console.log("Coin object null");
        }
    })
}

// ============================
//        Coins Chart
// ============================

function createChart() {
    $('#live-reports').html('<canvas id="coins-chart" width="800" height="450"></canvas>')
    var ctx = document.getElementById('coins-chart').getContext('2d');


    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title: {
                display: true,
                text: 'Chosen Coins Rates - USD'
            }
        }
    });

    for (let coin of chosenCoinsMap.values()) {
        chart.data.datasets.push({
            label: `${coin.symbol}`,
            borderColor: getRandomColor(),
            data: [],
            fill: false
        })
    }

    chart.update();

    getCoinsRates(chart);

    interval = setInterval(() => {getCoinsRates(chart)}, 2000);
}

function destroyChart(){
    if(chart){
        chart.destroy();
    }

    if(interval){
        clearInterval(interval);
    }
}

const updateChartData = (chart, data) => {
    let date = new Date();
    let dateStr = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    chart.data.labels.push(dateStr);
    chart.data.datasets.forEach((dataset, i) => {
        if(data.hasOwnProperty(dataset.label)) {
            dataset.data.push(data[dataset.label]['USD']);
        }
    });

    chart.update({
            duration: 800,
            easing: 'linear'
    });
};

const noCoinsSelected = () => {
    let str = '';

    str += '<div class="d-flex justify-content-center align-items-center w-50">';
    str += '<div class="jumbotron border border-danger">';
    str += '<h1 class="display-4">No Coins Selected</h1>';
    str += '<hr class="my-4">';
    str += '<p>Please return to Home and select coins</p>';
    str += '</div>';
    str += '</div>';

    $('#live-reports').html(str);
};

const searchCoin = () => {
    $("#search-btn").click(function() {
        let value = $('#search-box').val().toLowerCase();
        $("#home .card").filter(function() {
            $(this).toggle($(this).attr('id').toLowerCase().indexOf(value) > -1)
        });
    });
};

// Returns RGB random color
function getRandomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);

    return "rgb(" + r + ", " + g + ", " + b + ")"
}