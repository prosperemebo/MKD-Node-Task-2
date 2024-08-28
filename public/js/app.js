let timer;
let weatherPolling;
let analyticPolling;
let map;
let markerVectorLayer;

const searchAirport = document.getElementById('input-group-search');
const searchAirportResults = document.getElementById('airport-search-results');
const dashboard = document.getElementById('dashboard');
const exportAnalyticBtn = document.getElementById('export-analytic');
const calculateCoinsBtn = document.getElementById('calculate-coins');
const uploadImageForm = document.getElementById('image-upload-form');

async function startTimer() {
  try {
    const response = await fetch('/timezones');
    const responseData = await response.json();
    const data = responseData.data;

    document.getElementById('nigeria-time').textContent = formatTime(
      new Date(data.nigeria)
    );
    document.getElementById('pakistan-time').textContent = formatTime(
      new Date(data.pakistan)
    );
    document.getElementById('london-time').textContent = formatTime(
      new Date(data.london)
    );
    document.getElementById('est-time').textContent = formatTime(
      new Date(data.est)
    );
  } catch (error) {
    console.error('Error fetching time data:', error);
  } finally {
    if (!timer) {
      timer = setInterval(startTimer, 1000);
    }
  }
}

async function startWeatherPolling() {
  try {
    const response = await fetch('/weather');
    const responseData = await response.json();
    const data = responseData.data;

    document.getElementById('temperature').textContent = data.current?.temp_c;
    document.getElementById(
      'weatherIcon'
    ).src = `https:${data.current?.condition.icon}`;
  } catch (error) {
    console.error('Error fetching weather data:', error);
  } finally {
    if (!weatherPolling) {
      weatherPolling = setInterval(startWeatherPolling, 500000);
    }
  }
}

async function fetchAirports(event) {
  const query = event.target.value;

  if (query.length <= 3) {
    searchAirportResults.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(
      `/airports?search=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json();
    const airports = responseData.data;

    displayAirportResults(airports);
  } catch (error) {
    console.error('Failed to fetch airports:', error);
  }
}

function displayAirportResults(airports) {
  if (airports.length === 0) {
    searchAirportResults.innerHTML =
      '<li class="text-gray-300">No results found.</li>';
    return;
  }

  const TEMPLATE = `
		<li class="cursor-pointer airport-search-result" data-lon=":LON" data-lat=":LAT">
		  <div class="flex items-center ps-2 rounded bg-gray-600 mb-1 hover--bg-gray-800">
		    <span
		      class="w-full py-2 ms-2 text-sm font-medium text-gray-900 rounded dark--text-gray-300"
		      for="checkbox-item-11"
		      >:NAME</span
		    >
		  </div>
		</li>
	`;

  airports.forEach((airport) => {
    let airportElement = TEMPLATE;

    airportElement = airportElement.replace(
      ':NAME',
      `${airport.name} (${airport.iata_code || airport.ident})`
    );
    airportElement = airportElement.replace(':LAT', airport.latitude_deg);
    airportElement = airportElement.replace(':LON', airport.longitude_deg);

    searchAirportResults.insertAdjacentHTML('beforeend', airportElement);
  });
}

function onSelectAirport(event) {
  event.stopPropagation();

  const airportElement = event.target.closest('.airport-search-result');

  if (!airportElement) return;

  const data = airportElement.dataset;

  calculateDistanceFromArtic(data.lat, data.lon);
}

function calculateDistanceFromArtic(lat, lon) {
  const distance = getDistanceFromArtic(lat, lon);

  document.getElementById(
    'distance-from-artic'
  ).innerHTML = `${distance.toFixed(2)} KM`;

  if (map) {
    const newCoords = ol.proj.fromLonLat([lon, lat]);

    map.getView().setCenter(newCoords);
    map.getView().setZoom(6);

    const markerFeature = markerVectorLayer.getSource().getFeatures()[0];
    markerFeature.setGeometry(new ol.geom.Point(newCoords));
  }
}

async function handleWidgetAnalytics(event) {
  const widget = event.target.closest('.dashboard-widget');

  if (!widget) return;

  const data = widget.dataset;
  const browserType = navigator.userAgent;

  const payload = JSON.stringify({
    widget_name: data.name,
    browser_type: browserType,
  });

  try {
    const analyticResponse = await fetch('/analytic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (!analyticResponse.ok) return;

    const responseData = await analyticResponse.json();

    document.getElementById('analytics-count').innerHTML = responseData.count;
  } catch (error) {
    console.error('Failed to save analytic:', error);
  }
}

function exportAnalyticsHandler(event) {
  event.stopPropagation();

  window.open(`${window.location.href}analytic/export`, '_blank');
}

async function startAnalyticPolling() {
  try {
    const response = await fetch('/analytic/count');
    const responseData = await response.json();

    document.getElementById('analytics-count').innerHTML = responseData.count;
  } catch (error) {
    console.error('Error fetching analytic data:', error);
  } finally {
    if (!analyticPolling) {
      analyticPolling = setInterval(startAnalyticPolling, 100000);
    }
  }
}

async function getPopularPosts() {
  try {
    const response = await fetch('/posts');
    const responseData = await response.json();

    if (response.ok) {
      renderPopularPosts(responseData.data);
    }
  } catch (error) {
    console.error('Error fetching posts data:', error);
  }
}

function renderPopularPosts(posts) {
  const TEMPLATE = `
    <a class="block w-full bg-white rounded mb-4 p-4 border-solid border-2 border-gray-400 hover--bg-gray-200 ease-in-out cursor-pointer duration-500"
      href=":URL" target="_blank"><span class="text-muted">Posted by :AUTHOR</span>
      <h2 class="text-lg text-black-700 font-bold mb-2">:TITLE</h2>
      <span class="text-orange-500 text-sm truncate block w-full pr-10">:URL</span>
    </a>
  `;

  posts.forEach((post) => {
    let postElement = TEMPLATE;

    postElement = postElement.replace(':TITLE', post.title);
    postElement = postElement.replace(':AUTHOR', post.author);
    postElement = postElement.replaceAll(':URL', post.url);

    document
      .getElementById('posts-container')
      .insertAdjacentHTML('beforeend', postElement);
  });
}

async function calculateCoins(event) {
  event.stopPropagation();

  const amount = parseFloat(document.getElementById('coins-input').value);

  if (isNaN(amount) || amount < 0) {
    alert('Please enter a valid amount.');

    return;
  }

  try {
    const response = await fetch('/calculate-coins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate coins');
    }

    const data = await response.json();

    displayResult(data.data);
  } catch (error) {
    console.error('Error:', error);

    alert('An error occurred while calculating coins. Please try again.');
  }
}

function displayResult(data) {
  const resultContainer = document.getElementById('calculate-coins-results');

  const HEADER_ELEMENT = `
    <p class="text-xl mb-6">You need:</p>
  `;
  const EMPTY_ELEMENT = `
    <p class="text-xl mb-6">No bills or coins needed for the entered amount.</p>
  `;
  const RESULT_ELEMENT = `
    <p class="text-xl mb-2">:DATA</p>
  `;

  resultContainer.innerHTML = '';

  if (Object.keys(data).length === 0) {
    resultContainer.innerHTML = EMPTY_ELEMENT;
  } else {
    resultContainer.insertAdjacentHTML('beforeend', HEADER_ELEMENT);

    data.forEach((item) => {
      let resultElement = RESULT_ELEMENT;

      resultElement = resultElement.replace(':DATA', item);

      resultContainer.insertAdjacentHTML('beforeend', resultElement);
    });
  }

  resultContainer.classList.remove('hidden');
}

async function getLatestImage() {
  const response = await fetch('/images/recent');

  if (response.ok) {
    const responseData = await response.json();

    if (!responseData.data) return;

    const container = document.getElementById('recent-image-container');
    const IMAGE_ELEMENT = `
      <img src="${responseData.data.imageUrl}" alt="Recent Upload" class="w-full h-64 object-contain mb-4" />
    `;

    container.innerHTML = IMAGE_ELEMENT;
  }
}

async function uploadImageHandler(event) {
  event.preventDefault();

  const formData = new FormData();

  formData.append('image', document.getElementById('dropzone-file').files[0]);
  formData.append('name', 'prosper');

  const response = await fetch('/images/upload', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    getLatestImage();
  }
}

// UTILITIES
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

function debounce(func, delay) {
  let timeout;

  return function (...args) {
    const context = this;

    clearTimeout(timeout);

    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getDistanceFromArtic(lat, lon) {
  const arcticCircleLat = 66.5;
  const arcticCircleLon = 0;

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat - arcticCircleLat); // deg2rad below
  const dLon = deg2rad(lon - arcticCircleLon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(arcticCircleLat)) *
      Math.cos(deg2rad(lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function renderMap(lat = 0, lon = 0) {
  const key = 'qsxnEZeKtLPd52YH2YHb';

  const source = new ol.source.TileJSON({
    url: `https://api.maptiler.com/maps/streets-v2/tiles.json?key=${key}`,
    tileSize: 512,
    crossOrigin: 'anonymous',
  });

  map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: source,
      }),
    ],
    target: 'airport-map',
    view: new ol.View({
      constrainResolution: true,
      center: ol.proj.fromLonLat([lon, lat]),
      zoom: 3,
    }),
  });

  const marker = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
  });

  const vectorSource = new ol.source.Vector({
    features: [marker],
  });

  markerVectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });

  map.addLayer(markerVectorLayer);
}

// Main APP
function init() {
  startTimer();
  startWeatherPolling();
  startAnalyticPolling();
  renderMap();
  getPopularPosts();
  getLatestImage();

  searchAirport.addEventListener('input', fetchAirports);
  searchAirportResults.addEventListener('click', onSelectAirport);
  dashboard.addEventListener('click', handleWidgetAnalytics);
  exportAnalyticBtn.addEventListener('click', exportAnalyticsHandler);
  exportAnalyticBtn.addEventListener('click', exportAnalyticsHandler);
  calculateCoinsBtn.addEventListener('click', calculateCoins);
  uploadImageForm.addEventListener('submit', uploadImageHandler);
}

init();
