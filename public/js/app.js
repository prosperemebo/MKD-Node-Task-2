let timer;
let weatherPolling;

async function startTimer() {
	try {
		const response = await fetch('/timezones');
		const responseData = await response.json();
		const data = responseData.data;

		document.getElementById('nigeria-time').textContent = formatTime(new Date(data.nigeria));
		document.getElementById('pakistan-time').textContent = formatTime(new Date(data.pakistan));
		document.getElementById('london-time').textContent = formatTime(new Date(data.london));
		document.getElementById('est-time').textContent = formatTime(new Date(data.est));
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
		document.getElementById('weatherIcon').src = `https:${data.current?.condition.icon}`;
	} catch (error) {
		console.error('Error fetching weather data:', error);
	} finally {
		if (!weatherPolling) {
			weatherPolling = setInterval(startWeatherPolling, 50000);
		}
	}
}

function formatTime(date) {
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');

	return `${hours}:${minutes}:${seconds}`;
}

function init() {
	startTimer();
	startWeatherPolling();
}

init()
