/\*\* Return query parameter by \*key\*. \*/
function getQueryParameter(key) {
  var query = window.location.search.substring(1);
  var parameters = query.split('&');
  for (var i=0; i<parameters.length; i++) {
    var parameter = parameters[i].split('=');
    if (parameter[0] === key) {
      return parameter[1];
    }
  }
  return null;
}
/\*\* Load stylesheet \*href\*. \*/
function loadStyleSheet(href){
  var head = document.getElementsByTagName('head')[0];
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = href;
  head.appendChild(link);
}
// Get theme as set in ftrack from query parameter and inject a stylesheet.
var theme = getQueryParameter('theme') || 'light';
loadStyleSheet('theme-' + theme + '.css');