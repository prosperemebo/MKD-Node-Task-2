function getTimezones() {
  var now = new Date();
  var utcTime = now.getTime() + now.getTimezoneOffset() * 60000;

  var timeZones = {
    london: 0,
    est: -5,
    nigeria: 1,
    pakistan: 5,
  };

  var londonTime = new Date(utcTime + timeZones.london * 3600000);
  var estTime = new Date(utcTime + timeZones.est * 3600000);
  var nigeriaTime = new Date(utcTime + timeZones.nigeria * 3600000);
  var pakistanTime = new Date(utcTime + timeZones.pakistan * 3600000);

  return {
    london: londonTime,
    est: estTime,
    nigeria: nigeriaTime,
    pakistan: pakistanTime,
  };
}

function formatTime(date) {
  var hours = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');
  var seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

module.exports = {
  getTimezones,
  formatTime,
};
