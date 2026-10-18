/**
 * @jest-environment jsdom
 */

// The HTML that index.js expects to find on the page
const pageHTML = `
  <input id="state-input" type="text">
  <button id="fetch-alerts">Get Weather Alerts</button>
  <div id="error-message" class="hidden"></div>
  <div id="loading" class="hidden"></div>
  <section id="alerts-display"></section>
`;

// Waits for pending promises (the fetch and its .json()) to finish
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Builds a fake API response like the one from api.weather.gov
function mockSuccess(title, alertCount) {
  const features = Array.from({ length: alertCount }, (_, i) => ({
    properties: { headline: `Alert headline ${i + 1}` }
  }));

  return {
    ok: true,
    json: () => Promise.resolve({ title, features })
  };
}

let stateInput;
let fetchButton;
let alertsDisplay;
let errorMessage;

beforeEach(() => {
  // Fresh page and fresh copy of index.js for every test
  document.body.innerHTML = pageHTML;
  global.fetch = jest.fn();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.resetModules();
  require('./index.js');

  stateInput = document.getElementById('state-input');
  fetchButton = document.getElementById('fetch-alerts');
  alertsDisplay = document.getElementById('alerts-display');
  errorMessage = document.getElementById('error-message');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Weather alerts app', () => {
  test('the fetch request is made using the input state abbreviation', async () => {
    global.fetch.mockResolvedValue(mockSuccess('Alerts for New York', 1));

    stateInput.value = 'ny';
    fetchButton.click();
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.weather.gov/alerts/active?area=NY'
    );
  });

  test('a successful request displays the title and the number of alerts', async () => {
    const title = 'Current watches, warnings, and advisories for New York';
    global.fetch.mockResolvedValue(mockSuccess(title, 7));

    stateInput.value = 'NY';
    fetchButton.click();
    await flushPromises();

    expect(alertsDisplay.textContent).toContain(`${title}: 7`);
    expect(alertsDisplay.querySelectorAll('li')).toHaveLength(7);
  });

  test('clicking the button clears the input', () => {
    global.fetch.mockResolvedValue(mockSuccess('Alerts for New York', 1));

    stateInput.value = 'NY';
    fetchButton.click();

    expect(stateInput.value).toBe('');
  });

  test('an unsuccessful request displays the error message', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 400 });

    stateInput.value = 'ZZ';
    fetchButton.click();
    await flushPromises();

    expect(errorMessage.textContent).toContain('No alerts found for "ZZ"');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
  });

  test('a network failure displays the error message', async () => {
    global.fetch.mockRejectedValue(new Error('Failed to fetch'));

    stateInput.value = 'NY';
    fetchButton.click();
    await flushPromises();

    expect(errorMessage.textContent).toBe('Failed to fetch');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
  });

  test('error messages are cleared and hidden after a successful request', async () => {
    // First request fails and shows an error
    global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
    stateInput.value = 'ZZ';
    fetchButton.click();
    await flushPromises();
    expect(errorMessage.textContent).not.toBe('');

    // Second request succeeds
    global.fetch.mockResolvedValueOnce(mockSuccess('Alerts for New York', 3));
    stateInput.value = 'NY';
    fetchButton.click();
    await flushPromises();

    expect(errorMessage.textContent).toBe('');
    expect(errorMessage.classList.contains('hidden')).toBe(true);
  });
});