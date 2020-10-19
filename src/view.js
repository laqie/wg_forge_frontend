import Event from './event';


class View {
  constructor() {
    /** @type {HTMLElement | null} */
    this.root = null;
    /** @type {HTMLElement[] | null} */
    this.statistic = null;
    /** @type {HTMLElement[]} */
    this.orders = [];

    this.events = new Map([
      ['user-clicked', new Event()],
      ['filter-oninput', new Event()],
      ['sortable-clicked', new Event()],
      ['currency-selected', new Event()],
    ]);

    this.input = el('input.form-control.form-control-sm', {
      type: 'text',
      id: 'input',
      oninput: (e) => {
        this.events.get('filter-oninput').emit(e.target.value);
      },
      attrs: {
        'placeholder': 'Search',
      },
    });

    this.select = el('select.form-control.form-control-sm', {
      disabled: true,
      id: 'currency-selector',
      onchange: (e) => {
        this.events.get('currency-selected').emit(e.target.value);
      },
    }, [
      el('option', { value: 'USD', selected: true }, 'USD'),
    ]);

    this.header = el('h1.text-center.mt-4.mb-5', {}, 'WG Forge Test');

    this.tableBody = el('tbody');
    this.tableHeader = el('thead.thead-light');

    this.table = el('table.table', {}, [
      this.tableHeader,
      this.tableBody,
    ]);

    this.headerRow = this.renderHeaderRow();

    this.tableHeader.appendChild(el('tr', {}, [
      ...this.renderSearch(),
      ...this.renderCurrencySelector(),
    ]));

    this.tableHeader.appendChild(this.headerRow);
    // this.currencySelector = this.renderCurrencySelector();


    this.template = el('div.container-fluid', {}, [
      el('div.row', {}, [
        el('div.col', {}, [
          this.header,
          this.table,
        ]),
      ]),
    ]);


    // Statistic
    this.statCount = document.createTextNode('-');
    this.statTotal = document.createTextNode('-');
    this.statMedian = document.createTextNode('-');
    this.statAverage = document.createTextNode('-');
    this.femaleAverage = document.createTextNode('-');
    this.maleAverage = document.createTextNode('-');

    this.nothingFound = el('tr', {}, [
      el('td.text-center.p-4', { colSpan: 7 }, 'Nothing Found'),
    ]);

    // Loading status
    this.loadingRow = this.renderLoadingRow();
    this.tableBody.appendChild(this.loadingRow);
  }

  /**
   * @returns {HTMLTableRowElement}
   */
  renderLoadingRow() {
    return el('tr', {}, [
      el('td.loading', { colSpan: 7 }, 'Loading...'),
    ]);
  }

  /**
   * @returns {HTMLTableHeaderCellElement[]}
   */
  renderCurrencySelector() {
    return [
      el('th.text-right', { attrs: { scope: 'row' } }, [
        el('label', { attrs: { for: this.select.id } }, [
          'Currency:',
        ]),
      ]),
      el('th', { colSpan: 2 }, this.select),
    ];
  }

  /**
   * @returns {HTMLTableHeaderCellElement[]}
   */
  renderSearch() {
    return [
      el('th.text-right', { attrs: { scope: 'row' } }, [
        el('label', { attrs: { for: this.input.id } }, [
          'Search:',
        ]),
      ]),
      el('th', { colSpan: 3 }, this.input),
    ];
  }

  /**
   * @returns {HTMLTableRowElement}
   */
  renderHeaderRow() {
    return el('tr', {}, [
      this.renderColumnTitle('#', 'transaction'),
      this.renderColumnTitle('User Info', 'user-info'),
      this.renderColumnTitle('Order Date', 'date', 'text-center'),
      this.renderColumnTitle('Order Amount', 'amount', 'text-right'),
      this.renderColumnTitle('Card Number', null, 'text-center'),
      this.renderColumnTitle('Card Type', 'card-type'),
      this.renderColumnTitle('Location', 'location'),
    ]);
  }

  /**
   * @returns {HTMLTableHeaderCellElement}
   */
  renderColumnTitle(name, fieldName = null, className = '') {
    const options = {};

    if (fieldName) {
      options.className = 'sortable';
      options.attrs = {
        'scope': 'col',
        'data-field-name': fieldName,
      };

      options.onclick = () => {
        this.events.get('sortable-clicked').emit(fieldName);
      };
    }

    if (className) {
      options.className += ' ' + className;
    }

    return el('th', options, name);
  }

  /**
   * @returns {HTMLTableRowElement[]}
   */
  renderStatistic() {

    return [
      el('tr.statistic-header', {}, [
        el('td.pt-4', { colSpan: 1 }, el('h4', {}, 'Statistic')),
        el('td', { colSpan: 6 }),
      ]),
      this.renderStatisticRow('Orders Count', this.statCount),
      this.renderStatisticRow('Orders Total', this.statTotal),
      this.renderStatisticRow('Median Value', this.statMedian),
      this.renderStatisticRow('Average Check', this.statAverage),
      this.renderStatisticRow('Average Check (Female)', this.femaleAverage),
      this.renderStatisticRow('Average Check (Male)', this.maleAverage),
    ];
  }

  /**
   * @param {string} title
   * @param {Text} value
   * @returns {HTMLTableRowElement}
   */
  renderStatisticRow(title, value) {
    return el('tr.statistic-row', {}, [
      el('td.font-weight-bold', { colSpan: 1 }, title),
      el('td.text-right', { colSpan: 1 }, value),
      el('td', { colSpan: 5 }),
    ]);
  }

  /**
   * @param {string[]} currencies
   */
  updateCurrencies(currencies) {

    const options = currencies.sort().map(currency => el(
      'option',
      {
        value: currency,
        selected: currency === 'USD',
      },

      currency),
    );

    this.select.innerHTML = '';

    this.select.append(...options);
    this.select.disabled = false;
  }

  /**
   * @param {Statistic} statistic
   */
  updateStatistic(statistic) {
    this.statCount.nodeValue = statistic.count;
    this.statTotal.nodeValue = statistic.total;
    this.statMedian.nodeValue = statistic.median;
    this.statAverage.nodeValue = statistic.averageCheck;
    this.femaleAverage.nodeValue = statistic.femaleAverage;
    this.maleAverage.nodeValue = statistic.maleAverage;

    if (this.statistic === null && statistic.count !== '0') {
      this.statistic = this.renderStatistic();
      this.tableBody.append(...this.statistic);
    }

    if (this.statistic && statistic.count === '0') {
      while (this.statistic.length) {
        this.tableBody.removeChild(this.statistic.pop());
      }
      this.statistic = null;
    }
  }

  /**
   * @param {Ordering} ordering
   */
  updateOrdering(ordering) {
    // Clear old ordering arrows
    for (const node of this.headerRow.querySelectorAll('span.arrow')) {
      node.parentNode.removeChild(node);
    }

    if (ordering.field) {
      const arrow = el('span.arrow', {
        innerHTML: ordering.reversed ? '&#8593;' : '&#8595;',
      });

      const node = this.headerRow.querySelector(`[data-field-name="${ordering.field}"]`);

      if (node) {
        node.appendChild(arrow);
      }

    }
  }

  /**
   * @param {NormalizedOrder} updatedOrder
   */
  updateOrder(updatedOrder) {
    const id = `order_${updatedOrder.id}`;
    this.orders = this.orders.map(orderNode => {
      if (orderNode.id === id) {
        const newNode = this.renderOrder(updatedOrder);
        orderNode.replaceWith(newNode);
        return newNode;
      }
      return orderNode;
    });

  }

  /**
   * @param {NormalizedOrder[]} orders
   */
  updateOrders(orders) {
    if (this.loadingRow) {
      this.tableBody.removeChild(this.loadingRow);
      this.loadingRow = null;
    }

    while (this.orders.length > 0) {
      this.tableBody.removeChild(this.orders.pop());
    }

    if (this.nothingFound.parentNode === this.tableBody) {
      this.tableBody.removeChild(this.nothingFound);
    }

    if (orders.length === 0) {
      this.tableBody.prepend(this.nothingFound);
    }

    this.orders = this.renderOrders(orders);

    this.tableBody.prepend(...this.orders);
  }

  /**
   * @param {NormalizedOrder[]} orders
   * @returns {HTMLTableRowElement[]}
   */
  renderOrders(orders) {
    return orders.map(this.renderOrder.bind(this));
  }

  /**
   * @param {NormalizedOrder} order
   * @returns {HTMLTableRowElement}
   */
  renderOrder(order) {
    return el('tr', { id: `order_${order.id}` }, [
      el('th', { attrs: { scope: 'row' } }, order.transaction_id),
      el('td.user_data', {}, this.renderUserData(order.user, order.id)),
      el('td.text-center', {}, order.created_at),
      el('td.text-right', {}, order.total),
      el('td.text-center', {}, order.card_number),
      el('td', {}, order.card_type),
      el('td', {}, [
        order.order_country,
        ' (',
        order.order_ip,
        ')',
      ]),
    ]);
  }

  /**
   * @param {NormalizedUser} user
   * @param {number} orderId
   * @returns {HTMLElement[]}
   */
  renderUserData(user, orderId) {
    const userFullName = `${user.gender === 'Male' ? 'Mr.' : 'Ms.'} ${user.first_name}  ${user.last_name}`;

    const result = [
      el('a', {
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          this.events.get('user-clicked').emit(orderId);
        },
      }, userFullName),
    ];

    if (user.showInfo) {
      result.push(this.renderUserDetails(user));
    }
    return result;
  }

  /**
   * @param {NormalizedUser} user
   * @returns {HTMLDivElement}
   */
  renderUserDetails(user) {
    const companyInfo = user.company ? [
      el('p', {}, [
        el('strong', {}, 'Company: '),
        el('a', { href: user.company.url, target: '_blank' }, user.company.title),
      ]),
      el('p', {}, [
        el('strong', {}, 'Industry: '),
        user.company.industry,
      ]),
    ] : [];

    return el('div.user-details', {}, [
      el('p', {}, [
        el('img.rounded-circle', { src: user.avatar, width: 60 }),
      ]),
      el('p', {}, [
        el('strong', {}, 'Birthday: '),
        user.birthday || 'n/a',
      ]),
      ...companyInfo,
    ]);
  }

  /**
   * @param {HTMLElement} root
   */
  render(root) {
    this.root = root;
    this.root.appendChild(this.template);
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
}

/**
 * @param {string} tag
 * @param {Object} options
 * @param children
 * @returns {*}
 */
function el(tag, options = {}, children = []) {
  const [tagName, ...classNames] = tag.split('.');

  const element = document.createElement(tagName);
  if (classNames.length) {
    element.className = classNames.join(' ');
  }


  for (const [key, value] of Object.entries(options)) {
    if (key === 'attrs' && typeof value === 'object') {
      for (const [attr, attrValue] of Object.entries(value)) {
        element.setAttribute(attr, `${attrValue}`);
      }
    } else {
      element[key] = value;
    }
  }
  if (children) {
    addChildren(element, children);
  }

  return element;
}

/**
 * @param element
 * @param children
 * @returns {*}
 */
function addChildren(element, children) {
  if (typeof children === 'string') {
    element.appendChild(document.createTextNode(children));
  } else if (typeof children === 'object' && !Array.isArray(children)) {
    element.appendChild(children);
  } else if (Array.isArray(children)) {
    for (const child of children) {
      element = addChildren(element, child);
    }
  }

  return element;
}


export default View;
