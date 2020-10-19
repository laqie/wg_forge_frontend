import Event from './event';


/**
 * @typedef {Object} Order
 * @property {number} id
 * @property {string} transaction_id
 * @property {string} created_at
 * @property {number} user_id
 * @property {string} total
 * @property {string} card_type
 * @property {string} card_number
 * @property {string} order_country
 * @property {string} order_ip
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} gender
 * @property {string} birthday
 * @property {string} avatar
 * @property {number} company_id
 */

/**
 * @typedef {Object} Company
 * @property {number} id
 * @property {string} title
 * @property {string} industry
 * @property {string} market_cap
 * @property {string} sector
 * @property {string} url
 */

/**
 * @typedef {User} NormalizedUser
 * @property {Company | null} company
 * @property {boolean} showInfo
 */


/**
 * @typedef {Order} NormalizedOrder
 * @property {NormalizedUser} user
 */

/**
 * @typedef {Object} Statistic
 * @property {string} averageCheck
 * @property {string} total
 * @property {string} median
 * @property {string} count
 * @property {string} femaleAverage
 * @property {string} maleAverage
 */

/**
 * @typedef {Object} Ordering
 * @property {string | null} field
 * @property {boolean} reversed
 */

const COMPARATORS = {
  'transaction': (a, b) => a.transaction_id.localeCompare(b.transaction_id),
  'user-info': (a, b) => (a.user.first_name + a.user.last_name).localeCompare(b.user.first_name + b.user.last_name),
  'date': (a, b) => parseInt(a.created_at) - parseInt(b.created_at),
  'amount': (a, b) => parseFloat(a.total) - parseFloat(b.total),
  'card-type': (a, b) => a.card_type.localeCompare(b.card_type),
  'location': (a, b) => (a.order_country + a.order_ip).localeCompare(b.order_country + b.order_ip),
};


class Model {

  constructor() {
    /** @type {NormalizedOrder[]} */
    this.data = [];
    this.filter = '';

    /** @type {Ordering} */
    this.ordering = {
      field: null,
      reversed: false,
    };

    /** @type {null | number} */
    this.timeoutId = null;

    this.events = new Map([
      ['orders-updated', new Event()],
      ['statistic-updated', new Event()],
      ['order-updated', new Event()],
      ['ordering-changed', new Event()],
      ['currencies-changed', new Event()],
      ['filter-changed', new Event()],
    ]);

    this.currency = 'USD';

    /** @type {null | Object.<string, number>} */
    this.rates = null;
  }

  /**
   * @param {Order[]} orders
   * @param {User[]} users
   * @param {Company[]} companies
   */
  setData(orders, users, companies) {
    this.data = normalizeData(orders, users, companies);
    const newOrders = this.getOrders();
    this.events.get('orders-updated').emit(newOrders.map(this.prepareOrder.bind(this)));
    this.events.get('statistic-updated').emit(this.getStatistic(newOrders));
  }

  /**
   * @param {Object.<string, number>} rates
   */
  setExchangeRates(rates) {
    this.rates = rates;

    this.events.get('currencies-changed').emit(Object.keys(this.rates));
  }

  /**
   * @param {string} currency
   */
  setCurrency(currency) {
    this.currency = currency;

    const orders = this.getOrders();
    this.events.get('orders-updated').emit(orders.map(this.prepareOrder.bind(this)));
    this.events.get('statistic-updated').emit(this.getStatistic(orders));
  }

  /**
   * @returns {NormalizedOrder[]}
   */
  getOrders() {
    let result = [...this.data];
    if (this.filter) {
      const regex = new RegExp(this.filter, 'i');
      result = result.filter(order => this.isValidOrder(order, regex));
    }

    if (this.ordering.field) {
      const comparator = COMPARATORS[this.ordering.field];
      result.sort(this.ordering.reversed ? (a, b) => 0 - comparator(a, b) : comparator);
    }

    return result;
  }

  /**
   * @param {NormalizedOrder} order
   * @param {RegExp} regex
   * @returns {boolean}
   */
  isValidOrder(order, regex) {
    const fields = [
      order.user.first_name,
      order.user.last_name,
      `${order.user.first_name} ${order.user.last_name}`,
      order.transaction_id,
      this.toCurrency(parseFloat(order.total)),
      order.card_type,
      order.order_country,
      order.order_ip,
    ];

    return Boolean(fields.some(f => regex.test(f)));
  }

  /**
   * @param orders
   * @returns {Statistic}
   */
  getStatistic(orders) {
    const count = orders.length;
    const amounts = orders.map(order => ({
      gender: order.user.gender,
      total: parseFloat(order.total),
    })).sort(COMPARATORS['amount']);

    const total = amounts.reduce((a, b) => a + b.total, 0);
    const median = amounts.length ? getMedianValue(amounts.map(a => a.total)) : 0;
    const averageCheck = count ? total / count : 0;
    const femaleAmounts = amounts.filter(o => o.gender === 'Female');
    const maleAmounts = amounts.filter(o => o.gender === 'Male');
    const femaleAverage = femaleAmounts.length ? femaleAmounts.reduce((a, b) => a + b.total, 0) / femaleAmounts.length : 0;
    const maleAverage = maleAmounts.length ? maleAmounts.reduce((a, b) => a + b.total, 0) / maleAmounts.length : 0;

    return {
      count: count.toFixed(0),
      total: this.toCurrency(total),
      median: this.toCurrency(median),
      averageCheck: this.toCurrency(averageCheck),
      femaleAverage: this.toCurrency(femaleAverage),
      maleAverage: this.toCurrency(maleAverage),
    };
  }

  /**
   * @param {string} newFilter
   */
  setFilter(newFilter) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.filter = newFilter.trim();
      const orders = this.getOrders();
      this.events.get('orders-updated').emit(orders.map(this.prepareOrder.bind(this)));
      this.events.get('statistic-updated').emit(this.getStatistic(orders));
    }, 100);
  }


  /**
   * @param {string} fieldName
   */
  setOrdering(fieldName) {
    if (this.ordering.field === fieldName) {
      if (this.ordering.reversed) {
        this.ordering = {
          field: null,
          reversed: false,
        };
      } else {
        this.ordering = {
          field: fieldName,
          reversed: true,
        };
      }

    } else {
      this.ordering = {
        field: fieldName,
        reversed: false,
      };
    }

    this.events.get('ordering-changed').emit(this.ordering);
    this.events.get('orders-updated').emit(this.getOrders().map(this.prepareOrder.bind(this)));
  }


  /**
   * @param {number} orderId
   */
  toggleUserShowInfo(orderId) {
    const order = this.data.find(order => order.id === orderId);
    order.user.showInfo = !order.user.showInfo;
    this.events.get('order-updated').emit(this.prepareOrder(order));
  }

  /**
   * @param {string} eventName
   * @param {function} handler
   */
  on(eventName, handler) {
    if (this.events.has(eventName)) {
      this.events.get(eventName).subscribe(handler);
    }
  }

  /**
   * @param {NormalizedOrder} order
   * @returns {NormalizedOrder}
   */
  prepareOrder(order) {
    const result = { ...order };

    result.card_number = maskCardNumber(order.card_number);
    result.total = this.toCurrency(parseFloat(order.total));
    result.created_at = new Date(parseInt(order.created_at) * 1000).toLocaleString('en-GB');

    return result;
  }

  /**
   * @param {number} n
   * @returns {string}
   */
  toCurrency(n) {
    const rate = this.rates ? this.rates[this.currency] : 1;
    return (n * rate).toLocaleString('en-US', {
      style: 'currency',
      currency: this.currency,
      useGrouping: false,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}


/**
 * @param {Company[]} companies
 * @returns {Object.<number, Company>}
 */
function normalizeCompanies(companies) {
  const result = {};

  for (const company of companies) {
    result[company.id] = company;
  }

  return result;
}

/**
 * @param {User[]} users
 * @param {Object.<number, Company>} normalizedCompanies
 * @returns {Object.<number, NormalizedUser>}
 */
function normalizeUsers(users, normalizedCompanies) {
  const result = {};

  for (const user of users) {
    user.company = user.company_id ? normalizedCompanies[user.company_id] : null;
    user.showInfo = false;
    user.birthday = user.birthday ? new Date(parseInt(user.birthday) * 1000).toLocaleDateString('en-GB') : null;
    result[user.id] = user;
  }

  return result;
}

/**
 * @param {string} cardNumber
 * @returns {string}
 */
function maskCardNumber(cardNumber) {
  const l = cardNumber.length;

  return cardNumber.substr(0, 2) + '*'.repeat(l - 6) + cardNumber.substr(-4);
}

/**
 * @param {Order[]} orders
 * @param {User[]} users
 * @param {Company[]} companies
 * @returns {NormalizedOrder[]}
 */
function normalizeData(orders, users, companies) {
  const normalizedCompanies = normalizeCompanies(companies);
  const normalizedUsers = normalizeUsers(users, normalizedCompanies);

  return orders.map(order => {
    order.user = { ...normalizedUsers[order.user_id] };
    return order;
  });
}

/**
 *
 * @param {number[]} values
 */
function getMedianValue(values) {
  const l = values.length;
  if (l % 2 === 0) {
    return (values[l / 2] + values[l / 2 - 1]) / 2;
  } else {
    return values[Math.trunc(l / 2)];
  }
}


export default Model;
