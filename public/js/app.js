let timer;
let weatherPolling;
let map;
let markerVectorLayer;

const searchAirport = document.getElementById('input-group-search');
const searchAirportResults = document.getElementById('airport-search-results');

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
      weatherPolling = setInterval(startWeatherPolling, 50000);
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
  //   startTimer();
  //   startWeatherPolling();
  renderMap();

  searchAirport.addEventListener('input', fetchAirports);
  searchAirportResults.addEventListener('click', onSelectAirport);
}

init();
