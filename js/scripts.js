//Reusable Fields
const getSellFields = function () {
  let fields = []
  for (var i = 2; i < 14; i++) {
    fields.push($("#sell_" + i)[0])
  }
  return fields
}

const sell_inputs = getSellFields()
const buy_input = $("#buy")
const first_buy_field = $("#first_buy");
const previous_pattern_input = $("#previous_pattern");

//Functions
const fillFields = function (prices, first_buy, previous_pattern) {
  first_buy_field.prop("checked", first_buy);
  previous_pattern_input.val(previous_pattern);

  buy_input.focus();
  buy_input.val(prices[0] || '')
  buy_input.blur();
  const sell_prices = prices.slice(2)

  sell_prices.forEach((price, index) => {
    if (!price) {
      return
    } else {
      const element = $("#sell_" + (index + 2));
      element.focus();
      element.val(price);
      element.blur();
    }
  })
}

const initialize = function () {
  try {
    const prices = getPrices()
    const first_buy = getFirstBuyState();
    const previous_pattern = getPreviousPatternState();
    if (prices === null) {
      fillFields([], first_buy, previous_pattern)
    } else {
      fillFields(prices, first_buy, previous_pattern)
    }
    $(document).trigger("input");
  } catch (e) {
    console.error(e);
  }

  $("#reset").on("click", function () {
    first_buy_field.prop('checked', false);
    $("select").val(null);
    $("input").val(null).trigger("input");
  })

  $('select').formSelect();
}

const updateLocalStorage = function (prices, first_buy, previous_pattern) {
  try {
    if (prices.length !== 14) throw "The data array needs exactly 14 elements to be valid"
    localStorage.setItem("sell_prices", JSON.stringify(prices))
    localStorage.setItem("first_buy", JSON.stringify(first_buy));
    localStorage.setItem("previous_pattern", JSON.stringify(previous_pattern));
  } catch (e) {
    console.error(e)
  }
}

const isEmpty = function (arr) {
  const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value))
  return filtered.length == 0
}

const getFirstBuyState = function () {
  return JSON.parse(localStorage.getItem('first_buy'))
}

const getPreviousPatternState = function () {
  return JSON.parse(localStorage.getItem('previous_pattern'))
}

const getPricesFromLocalstorage = function () {
  try {
    const sell_prices = JSON.parse(localStorage.getItem("sell_prices"));

    if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
      return null;
    }

    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPricesFromQuery = function () {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const sell_prices = params.get("prices").split(".").map((x) => parseInt(x, 10));

    if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
      return null;
    }

    window.price_from_query = true;
    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPrices = function () {
  return getPricesFromQuery() || getPricesFromLocalstorage();
};

const getSellPrices = function () {
  //Checks all sell inputs and returns an array with their values
  return res = sell_inputs.map(function (input) {
    return parseInt(input.value || '');
  })
}

function zhName(pattern_description) {
 if (pattern_description === 'Decreasing') {return '持續下跌'} 
 if (pattern_description === 'Fluctuating') {return '波動型'} 
 if (pattern_description === 'Small spike') {return '四期型'} 
 if (pattern_description === 'Large spike') {return '三期型'} 
 if (pattern_description === 'All patterns') {return '合計'} 
 return pattern_description
}
const calculateOutput = function (data, first_buy, previous_pattern) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }
  let output_possibilities = "";
  for (let poss of analyze_possibilities(data, first_buy, previous_pattern)) {
    var out_line = "<tr><td>" + zhName(poss.pattern_description) + "</td>"
    out_line += `<td>${Number.isFinite(poss.probability) ? ((poss.probability * 100).toPrecision(3) + '%') : '—'}</td>`;
    for (let day of poss.prices.slice(1)) {
      var isReachMax = day.max === poss.weekMax;
      var tdClass = isReachMax ? 'highlight' : '';
      if (day.min !== day.max) {
        out_line += `<td class="${tdClass}">${day.min}~${day.max}</td>`;
      } else {
        out_line += `<td class="one">${day.min}</td>`;
      }
    }
    out_line += `<td class="one">${poss.weekGuaranteedMinimum}</td><td class="one">${poss.weekMax}</td></tr>`;
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)
}

const update = function () {
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const first_buy = first_buy_field.is(":checked");
  const previous_pattern = parseInt(previous_pattern_input.val());

  buy_input.prop('disabled', first_buy);

  const prices = [buy_price, buy_price, ...sell_prices];
  if (!window.price_from_query) {
    updateLocalStorage(prices, first_buy, previous_pattern);
  }
  calculateOutput(prices, first_buy, previous_pattern);
}

$(document).ready(initialize);
$(document).on("input", update);
$(previous_pattern_input).on("change", update);
