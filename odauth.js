// instructions:
// - host a copy of callback.html and odauth.js on your domain.
// - embed odauth.js in your app like this:
//   <script id="odauth" src="odauth.js"
//           clientId="YourClientId" scopes="ScopesYouNeed"
//           redirectUri="YourUrlForCallback.html"></script>
// - define the onAuthenticated(token) function in your app to receive the auth token.
// - call odauth() to begin, as well as whenever you need an auth token
//   to make an API call. if you're making an api call in response to a user's
//   click action, call odAuth(true), otherwise just call odAuth(). the difference
//   is that sometimes odauth needs to pop up a window so the user can sign in,
//   grant your app permission, etc. the pop up can only be launched in response
//   to a user click, otherwise the browser's popup blocker will block it. when
//   odauth isn't called in click mode, it'll put a sign-in button at the top of
//   your page for the user to click. when it's done, it'll remove that button.
//
// how it all works:
// when you call odauth(), we first check if we have the user's auth token stored
// in a cookie. if so, we read it and immediately call your onAuthenticated() method.
// if we can't find the auth cookie, we need to pop up a window and send the user
// to Microsoft Account so that they can sign in or grant your app the permissions
// it needs. depending on whether or not odauth() was called in response to a user
// click, it will either pop up the auth window or display a sign-in button for
// the user to click (which results in the pop-up). when the user finishes the
// auth flow, the popup window redirects back to your hosted callback.html file,
// which calls the onAuthCallback() method below. it then sets the auth cookie
// and calls your app's onAuthenticated() function, passing in the optional 'window'
// argument for the popup window. your onAuthenticated function should close the
// popup window if it's passed in.
//
// subsequent calls to odauth() will usually complete immediately without the
// popup because the cookie is still fresh.
function odauth(wasClicked) {
  ensureHttps();
  var token = getTokenFromCookie();
  if (token) {
    onAuthenticated(token);
  }
  else if (wasClicked) {
    challengeForAuth();
  }
  else {
    showLoginButton();
  }
}

// for added security we require https
function ensureHttps() {
  if (window.location.protocol != "https:" && window.location.protocol != "file:" && window.location.hostname != "localhost") {
    window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
  }
}

function onAuthCallback() {
  var authInfo = getAuthInfoFromUrl();
  var token = authInfo["access_token"];
  var expiry = parseInt(authInfo["expires_in"]);
  if (token)
  {
    setCookie(token, expiry);
    window.opener.onAuthenticated(token, window);
  }
}

function getAuthInfoFromUrl() {
  if (window.location.hash) {
    var authResponse = window.location.hash.substring(1);
    var authInfo = JSON.parse(
      '{' + authResponse.replace(/([^=]+)=([^&]+)&?/g, '"$1":"$2",').slice(0,-1) + '}',
      function(key, value) { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
  }
  else {
    alert("failed to receive auth token");
  }
}

function getTokenFromCookie() {

  return "eyJ0eXAiOiJKV1QiLCJub25jZSI6IkFRQUJBQUFBQUFEUk5ZUlEzZGhSU3JtLTRLLWFkcENKS3JkMDBlekJuVGhvNmF2Y0hkUHl0NzZmSmdnMVl6SS1OdHhVN1F1Zl9iQjBDcUs1NlEtSmY1ZDNkeUNSQ0hzVTZWM1JDV2VaTDJBTUsybFRqSkV5RHlBQSIsImFsZyI6IlJTMjU2IiwieDV0IjoiX1VncVhHX3RNTGR1U0oxVDhjYUh4VTdjT3RjIiwia2lkIjoiX1VncVhHX3RNTGR1U0oxVDhjYUh4VTdjT3RjIn0.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNDg3OTA1MzUzLCJuYmYiOjE0ODc5MDUzNTMsImV4cCI6MTQ4NzkwOTI1MywiYWNyIjoiMSIsImFtciI6WyJwd2QiLCJtZmEiXSwiYXBwX2Rpc3BsYXluYW1lIjoiT25lRHJpdmUgdGVzdCBhcHAiLCJhcHBpZCI6IjM3ZWE1YjMyLTMxY2EtNDcxYS1iNTQ2LTE3ZGM0ZWZhYmJmMyIsImFwcGlkYWNyIjoiMSIsImZhbWlseV9uYW1lIjoiU3Bla3RvciIsImdpdmVuX25hbWUiOiJEYXJvbiIsImluX2NvcnAiOiJ0cnVlIiwiaXBhZGRyIjoiMTY3LjIyMC4xLjIyOSIsIm5hbWUiOiJEYXJvbiBTcGVrdG9yIiwib2lkIjoiYmY1YzgwZmUtYmZhMi00MWE3LWE1OTctMjhhOWViNjNhNGRjIiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxMjc1MjExODQtMTYwNDAxMjkyMC0xODg3OTI3NTI3LTI0NTQ2MTciLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwM0JGRkQ4MDFCRjA5QyIsInNjcCI6IkZpbGVzLlJlYWRXcml0ZSBGaWxlcy5SZWFkV3JpdGUuQWxsIFNpdGVzLlJlYWRXcml0ZS5BbGwgVXNlci5SZWFkIiwic2lnbmluX3N0YXRlIjpbImttc2kiXSwic3ViIjoiOGFFVU1lRF9QRXBaM25kdHFMcVFPMFQwcEtmMWpDUm40ZzItSG1kTEVwNCIsInRpZCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsInVuaXF1ZV9uYW1lIjoiZHNwZWt0b3JAbWljcm9zb2Z0LmNvbSIsInVwbiI6ImRzcGVrdG9yQG1pY3Jvc29mdC5jb20iLCJ2ZXIiOiIxLjAifQ.x3yrHCR7i5-vWb9qr6F1FtzprVqL44OKHglkh3dhz3-TVMwykumvhXWas1LeEiblkehnrkTjAq_KXRDvTXE5Y130s0xzSN8A1Q4ad0_6lwSDxLcDn2vGowTWy7JtRKBfreP_j1hqsof05jHZHRi7TCV0DFi2F0V3HkNmW6ujkAZy0482-sNYa1ddgVx_DnceQzv8bCr3OeEA2zo1LLMB-1Ai9nPb2I8AZ-LAY3NLBkFTCl8yyRQiX1jvSFLV5Afze2nVFTolwubbTcX_ZGEdk6MTLispQwsG3ItLzSkh13A0uKOe6JirhJEDla0Uvy4wOLCsjbpIjiLtJyA3K49jeA";

  var cookies = document.cookie;
  var name = "odauth=";
  var start = cookies.indexOf(name);
  if (start >= 0) {
    start += name.length;
    var end = cookies.indexOf(';', start);
    if (end < 0) {
      end = cookies.length;
    }
    else {
      postCookie = cookies.substring(end);
    }

    var value = cookies.substring(start, end);
    return value;
  }

  return "";
}

function setCookie(token, expiresInSeconds) {
  var expiration = new Date();
  expiration.setTime(expiration.getTime() + expiresInSeconds * 1000);
  var cookie = "odauth=" + token +"; path=/; expires=" + expiration.toUTCString();

  if (document.location.protocol.toLowerCase() == "https") {
    cookie = cookie + ";secure";
  }

  document.cookie = cookie;
}

function clearCookie()
{
  var expiration = new Date();
  var cookie = "odauth=; path=/; expires=" + expiration.toUTCString();
  document.cookie = cookie;
}

var storedAppInfo = null;

function provideAppInfo(obj)
{
  storedAppInfo = obj;
}

function getAppInfo() {

  if (storedAppInfo)
    return storedAppInfo;

  var scriptTag = document.getElementById("odauth");
  if (!scriptTag) {
    alert("the script tag for odauth.js should have its id set to 'odauth'");
  }

  var clientId = scriptTag.getAttribute("clientId");
  if (!clientId) {
    alert("the odauth script tag needs a clientId attribute set to your application id");
  }

  var scopes = scriptTag.getAttribute("scopes");
  // scopes aren't always required, so we don't warn here.

  var redirectUri = scriptTag.getAttribute("redirectUri");
  if (!redirectUri) {
    alert("the odauth script tag needs a redirectUri attribute set to your redirect landing url");
  }

  var resourceUri = scriptTag.getAttribute("resourceUri");

  var authServiceUri = scriptTag.getAttribute("authServiceUri");
  if (!authServiceUri) {
    alert("the odauth script tag needs an authServiceUri attribtue set to the oauth authentication service url");
  }

  var appInfo = {
    "clientId": clientId,
    "scopes": scopes,
    "redirectUri": redirectUri,
    "resourceUri": resourceUri,
    "authServiceUri": authServiceUri
  };

  storedAppInfo = appinfo;

  return appInfo;
}

// called when a login button needs to be displayed for the user to click on.
// if a showCustomLoginButton() function is defined by your app, it will be called
// with 'true' passed in to indicate the button should be added. otherwise, it
// will insert a textual login link at the top of the page. if defined, your
// showCustomLoginButton should call challengeForAuth() when clicked.
function showLoginButton() {
  if (typeof showCustomLoginButton === "function") {
    showCustomLoginButton(true);
    return;
  }

  var loginText = document.createElement('a');
  loginText.href = "#";
  loginText.id = "loginText";
  loginText.onclick = challengeForAuth;
  loginText.innerText = loginText.textContent = "[sign in]";
  document.body.insertBefore(loginText, document.body.children[0]);
}

// called with the login button created by showLoginButton() needs to be
// removed. if a customLoginButton() function is defined by your app, it will
// be called with 'false' passed in to indicate the button should be removed.
// otherwise it will remove the textual link that showLoginButton() created.
function removeLoginButton() {
  if (typeof showCustomLoginButton === "function") {
    showCustomLoginButton(false);
    return;
  }

  var loginText = document.getElementById("loginText");
  if (loginText) {
    document.body.removeChild(loginText);
  }
}

function challengeForAuth() {
  var appInfo = getAppInfo();
  var url =
    appInfo.authServiceUri +
    "?client_id=" + appInfo.clientId +
    "&response_type=token" +
    "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);

    if (appInfo.scopes)
      url = url + "&scope=" + encodeURIComponent(appInfo.scopes);
    if (appInfo.resourceUri)
      url = url + "&resource=" + encodeURIComponent(appInfo.resourceUri);

  popup(url);
}

function logoutOfAuth() {
  clearCookie();
  showLoginButton();
}

function popup(url) {
  var width = 525,
      height = 525,
      screenX = window.screenX,
      screenY = window.screenY,
      outerWidth = window.outerWidth,
      outerHeight = window.outerHeight;

  var left = screenX + Math.max(outerWidth - width, 0) / 2;
  var top = screenY + Math.max(outerHeight - height, 0) / 2;

  var features = [
              "width=" + width,
              "height=" + height,
              "top=" + top,
              "left=" + left,
              "status=no",
              "resizable=yes",
              "toolbar=no",
              "menubar=no",
              "scrollbars=yes"];
  var popup = window.open(url, "oauth", features.join(","));
  if (!popup) {
    alert("failed to pop up auth window");
  }

  popup.focus();
}
