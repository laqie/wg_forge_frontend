import { fetchCompanies, fetchExchangeRates, fetchOrders, fetchUsers } from './api';


class Controller {

  /**
   * @param {Model} model
   * @param {View} view
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;

    this.model.on('orders-updated', this.onOrdersUpdated.bind(this));
    this.model.on('statistic-updated', this.onStatisticUpdated.bind(this));
    this.model.on('order-updated', this.onOrderUpdated.bind(this));
    this.model.on('ordering-changed', this.onOrderingChanged.bind(this));
    this.model.on('currencies-changed', this.onCurrenciesChanged.bind(this));


    this.view.on('user-clicked', this.onUserClicked.bind(this));
    this.view.on('filter-oninput', this.onFilterOninput.bind(this));
    this.view.on('sortable-clicked', this.onSortableClicked.bind(this));
    this.view.on('currency-selected', this.onCurrencySelected.bind(this));
  }

  /**
   * @param {string} fieldName
   */
  onSortableClicked(fieldName) {
    this.model.setOrdering(fieldName);
  }

  /**
   * @param {string} value
   */
  onFilterOninput(value) {
    this.model.setFilter(value);
  }

  /**
   * @param {number} orderId
   */
  onUserClicked(orderId) {
    this.model.toggleUserShowInfo(orderId);
  }

  /**
   * @param {Ordering} ordering
   */
  onOrderingChanged(ordering) {
    this.view.updateOrdering(ordering);
  }

  /**
   * @param {string} currency
   */
  onCurrencySelected(currency) {
    this.model.setCurrency(currency);
  }

  /**
   * @param {string[]} currencies
   */
  onCurrenciesChanged(currencies) {
    this.view.updateCurrencies(currencies);
  }

  /**
   * @param {NormalizedOrder} order
   */
  onOrderUpdated(order) {
    this.view.updateOrder(order);
  }

  /**
   * @param {Statistic} statistic
   */
  onStatisticUpdated(statistic) {
    this.view.updateStatistic(statistic);
  }

  /**
   * @param {NormalizedOrder[]} orders
   */
  onOrdersUpdated(orders) {
    this.view.updateOrders(orders);
  }

  /**
   * @param {HTMLElement} root
   */
  mount(root) {
    this.view.render(root);

    Promise.all([fetchOrders(), fetchUsers(), fetchCompanies()])
      .then(([orders, users, companies]) => {
        this.model.setData(orders, users, companies);
      });


    fetchExchangeRates().then(data => {
      this.model.setExchangeRates(data.rates);
    });
  }
}


export default Controller;
