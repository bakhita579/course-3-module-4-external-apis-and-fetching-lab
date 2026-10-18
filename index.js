const stateInput = document.getElementById('state-input');
const fetchButton = document.getElementById('fetch-alerts');
const alertsDisplay = document.getElementById('alerts-display');
const errorMessage = document.getElementById('error-message');
// Use the #loading element if the page has one; otherwise create it
let loadingIndicator = document.getElementById('loading');

if (!loadingIndicator) {
  loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading';
  loadingIndicator.className = 'hidden';
  loadingIndicator.setAttribute('role', 'status');

  const spinner = document.createElement('span');
  spinner.className = 'spinner';

  loadingIndicator.append(spinner, ' Loading alerts…');
  alertsDisplay.before(loadingIndicator);
}

/* ---------- Step 4 + 5: error display and styling ---------- */

// Show a message in the error div; type is 'error' or 'warning'
function showError(message, type = 'error') {
  errorMessage.textContent = message;
  errorMessage.className = `message ${type}`;
}

// Hide the error div and clear its text
function clearError() {
  errorMessage.textContent = '';
  errorMessage.className = 'hidden';
}

/* ---------- Step 5: loading indicator and input validation ---------- */

// Show or hide the spinner, and lock the button while loading
function setLoading(isLoading) {
  loadingIndicator.classList.toggle('hidden', !isLoading);
  fetchButton.disabled = isLoading;
}

// Exactly two capital letters
function isValidState(state) {
  return /^[A-Z]{2}$/.test(state);
}

/* ---------- Step 2: display the alerts on the page ---------- */

function displayAlerts(data) {
  // Remove any previous data
  alertsDisplay.replaceChildren();

  // Summary: title + number of alerts
  const summary = document.createElement('h2');
  summary.textContent = `${data.title}: ${data.features.length}`;
  alertsDisplay.appendChild(summary);

  // No alerts is not an error, so say so politely
  if (data.features.length === 0) {
    const none = document.createElement('p');
    none.textContent = 'There are no active alerts for this state right now.';
    alertsDisplay.appendChild(none);
    return;
  }

  // List of alert headlines, one bullet per alert
  const list = document.createElement('ul');

  data.features.forEach(function (alert) {
    const item = document.createElement('li');
    item.textContent = alert.properties.headline;
    list.appendChild(item);
  });

  alertsDisplay.appendChild(list);
}

/* ---------- Step 1: fetch the weather alerts ---------- */

async function fetchWeatherAlerts(state) {
  setLoading(true);

  try {
    const response = await fetch(`https://api.weather.gov/alerts/active?area=${state}`);

    if (!response.ok) {
      throw new Error(`No alerts found for "${state}". Check the state abbreviation (status ${response.status}).`);
    }

    const data = await response.json();
    console.log(data); // Step 1: log the data for testing

    clearError(); // Step 4: hide and clear the error after a successful request
    displayAlerts(data);
  } catch (errorObject) {
    console.log(errorObject.message); // Step 1: log errors for testing
    showError(errorObject.message, 'error'); // Step 4: show the message on the page
  } finally {
    setLoading(false);
  }
}

/* ---------- Step 3: clear and reset the UI on each submit ---------- */

function handleSubmit() {
  const state = stateInput.value.trim().toUpperCase();

  // Clear the input field, the old results, and any old error
  stateInput.value = '';
  alertsDisplay.replaceChildren();
  clearError();

  // Step 4 + 5: empty or invalid input
  if (!isValidState(state)) {
    stateInput.classList.add('invalid');
    showError('Please enter a two-letter state abbreviation, such as MN.', 'warning');
    return;
  }

  fetchWeatherAlerts(state);
}

// Remove the red border as soon as the user starts typing again
stateInput.addEventListener('input', function () {
  stateInput.classList.remove('invalid');
});

// Submit with the Enter key as well as the button
stateInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    handleSubmit();
  }
});

fetchButton.addEventListener('click', handleSubmit);