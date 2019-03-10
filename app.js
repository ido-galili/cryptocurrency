// ============================
//        Constants
// ============================

const MAX_CHOSEN_COINS = 5;
const DIGITS_AFTER_DECIMAL = 3;
const MILI_TO_SEC_DIVISOR = 60000; // miliseconds
const MINUTES_TO_FETCH_INFO_AGAIN = 2;

const ALL_COINS_API_URL = 'https://api.coingecko.com/api/v3/coins/list';
const ONE_COIN_API_URL = 'https://api.coingecko.com/api/v3/coins/';// + {id}
const MULTI_PRICE_API_URL = 'https://min-api.cryptocompare.com/data/pricemulti?tsyms=USD,EUR,ILS&';// + {fsyms=BTC,ETH&'}

// ============================
//        Global Variables
// ============================

let coins = [];
let chosenCoinsSet = new Set();
let moreInfoMap = new Map();


const coinsLimit = 20;// Dev related




$().ready(() => {
  window.localStorage.clear();// DELETE ON SENDING PROJECT!
  getCoins();
  displayCoins();
  switchListener();
  moreInfoListener();
  frontLinkListener() //Change Name
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

    if (elapsed < MINUTES_TO_FETCH_INFO_AGAIN) {
      return false
    }

    return true
  }
}

// ============================
//        Event Listeners
// ============================

function moreInfoListener() {
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
          displayMoreInfo(coin, true)
        }
      } else {
        getMoreInfo(id)
      }
    } else {
      getMoreInfo(id)
    }
  })
}

function frontLinkListener() {
  $('.card-general-link').click(event => {
    let id = event.target.dataset.id;

    toggleCardTabs(id);
    toggleCardContent(id, 'front')
  })
}

function switchListener() {
  $('.switch').change(event => {
    let id = event.target.dataset.id;

    // Set Version

    // add to chosenCoins
    if (event.target.checked) {
      if (chosenCoinsSet.size === 5) {
        event.target.checked = false;
        alert('Too many') // CHANGE THIS
      } else {
        chosenCoinsSet.add(id)
      }
      // remove from chosenCoinsSet
    } else {
      chosenCoinsSet.delete(id)
    }
  })
}

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
      console.log(coins)
      // window.localStorage.coins = JSON.stringify(data)
    },
    error: function (error) {
      console.log("error : ", error)
    }
  })
}

function getMoreInfo(id) {
  let url = `${ONE_COIN_API_URL}${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
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
      displayMoreInfo(newCoin, false);
      moreInfoMap.set(id, newCoin);
      window.localStorage.moreInfoMap = JSON.stringify(Array.from(moreInfoMap));
      return newCoin
    }
  })
}

// ============================
//        Print Functions
// ============================

function displayCoins() {
  $('#home').html('');

  let str = ``;

  var BreakException = {};

  // let coinsLocal = JSON.parse(window.localStorage.coins) // Later change to all coins from API

  try {
    // coinsLocal.forEach((coin, index) => {
    coins.forEach((coin, index) => {
      if (index === coinsLimit) throw BreakException;

      str += `<div class="col-sm-4 p-0 m-0">`;
      str += `<div id="${coin.id}" class="card text-center text-primary border-primary m-2">`;
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
      str += `<input data-id="${coin.id}" type="checkbox">`;
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

function displayMoreInfo(coin, isLocal) {
  let str = ``;
  let moreInfoDiv = document.getElementById(coin.id).querySelector('.card-body').querySelector('.card-body-info');

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
      break
    case 'info':
      // frontDiv.classList.remove('d-flex')
      infoDiv.classList.remove('d-none');
      spinner.classList.remove('d-flex-inline');
      // frontDiv.classList.add('d-none')
      infoDiv.classList.add('d-flex');
      spinner.classList.add('d-none');
      break
    case 'spinner':
      frontDiv.classList.remove('d-flex');
      // infoDiv.classList.remove('d-flex')
      spinner.classList.remove('d-none');
      frontDiv.classList.add('d-none');
      // infoDiv.classList.add('d-none')
      spinner.classList.add('d-flex-inline');
      break
    case 'info-exist':
      frontDiv.classList.remove('d-flex');
      infoDiv.classList.remove('d-none');
      // spinner.classList.remove('d-flex-inline')
      frontDiv.classList.add('d-none');
      infoDiv.classList.add('d-flex');
    // spinner.classList.add('d-none')
    default:
      break
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


// Array Version

// if (event.target.checked) {
//     if (chosenCoins.length === 5) {
//         event.target.checked = false
//         alert('Too many') // CHANGE THIS
//     } else {
//         chosenCoins.push(id)
//     }
//     // remove from chosenCoins
// } else {
//     let removeIdx = chosenCoins.indexOf(id)
//     chosenCoins.splice(removeIdx, 1)
// }