function fetchData(path) {
  return fetch(path)
    .then(res => res.json());
}

export function fetchOrders() {
  return fetchData('/api/orders.json');
}

export function fetchUsers() {
  return fetchData('/api/users.json');
}

export function fetchCompanies() {
  return fetchData('/api/companies.json');
}

export function fetchExchangeRates() {
  return fetchData('https://api.exchangeratesapi.io/latest?base=USD');
}
