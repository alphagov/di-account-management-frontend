"use strict";

var launchWebchatButton = document.querySelector("[data-launch-webchat]");

launchWebchatButton.addEventListener("click", function () {
  const webchatWindow = document.querySelector(".sa-chat-slideout");
  if (window._sa && webchatWindow) {
    try {
      window._sa.toggleChat();
      // setTimeout is only necessary here because the toggleChat() function uses setTimeout when setting focus and toggling the isOpen state
      setTimeout(() => {
        if (window._sa.isOpen()) {
          // when the webchat is opened using the "Use webchat" button, move focus to the first focusable element in the window
          webchatWindow.querySelector("button").focus();
        } else {
          // when the webchat is closed using the "Use webchat" button, move focus back to the "Use webchat" button
          launchWebchatButton.focus();
        }
      }, 0);
    } catch (err) {
      console.error(err);
    }
  }
});

function waitForSaEvents() {
  // if saEvents does not exist, chat has not loaded yet
  if (typeof window.saEvents !== "undefined") {
    window.saEvents.subscribe(function (event) {
      if (event.type === "CHAT_LOADED") {
        // as soon as a CHAT_LOADED event is received from the webchat, make the "Use webchat" toggle visible and stop listening for chat events
        launchWebchatButton.removeAttribute("hidden");
        clearInterval(webchatInterval);
        clearTimeout(cancelInterval);
      }
    });
  }
}

// the webchat script injects other scripts and assets into the page
// therefore the "saEvents" object is not immediately available to subscribe to
// this checks whether "saEvents" is available every 200ms
var webchatInterval = setInterval(waitForSaEvents, 200);
var cancelInterval = setTimeout(function () {
  // if webchat events still unavailable after 10s, clear the interval
  clearInterval(webchatInterval);
}, 10000);
