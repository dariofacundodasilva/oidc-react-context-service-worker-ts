const _self = self;
const id = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3).toString();

const handleInstall = (event) => {
  console.log("[OidcServiceWorker] service worker installed " + id);
  event.waitUntil(_self.skipWaiting());
};
const handleActivate = (event) => {
  console.log("[OidcServiceWorker] service worker activated " + id);
  event.waitUntil(_self.clients.claim());
};

const database = {};

const handleMessage = (event) => {
    const port = event.ports[0];
    const data = event.data;
    const configurationName = data.configurationName;
    let currentDatabase = database[configurationName];

    if (!currentDatabase) {
      database[configurationName] = {
      };
      currentDatabase = database[configurationName];
    }
    switch (data.type) {
      case "init": {

        port.postMessage({
          tokens: null,
          status: currentDatabase.status,
          configurationName
        });

        return;
      }

      case "getItem": {
        const key = data.data.key;
        const item = currentDatabase[key];
        port.postMessage({ item: item });
        return;
      }
      case "clear": {
        currentDatabase = {};
        port.postMessage({ configurationName });
        return;
      }
      case "key": {
        return;
      }
      case "removeItem": {
        const key = data.data.key;
        currentDatabase[key] = null;
        port.postMessage({ configurationName });
        return;
      }
      case "setItem": {
        const key = data.data.key;
        const value = data.data.value;
        currentDatabase[key] = value;
        port.postMessage({ configurationName });
        return;
      }
      default:
        currentDatabase.items = { ...data.data };
        port.postMessage({ configurationName });
    }
  };


_self.addEventListener("install", handleInstall);
_self.addEventListener("activate", handleActivate);
_self.addEventListener("message", handleMessage);