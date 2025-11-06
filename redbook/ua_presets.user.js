// ==UserScript==
// @name         UA Spoof Presets (iOS / Mac / iPad / Android / Windows / Linux)
// @namespace    https://example.local/
// @version      1.1
// @description  在页面 JS 可见层面伪造 navigator.*，提供 6 个预设（ios, mac, ipad, android, windows, linux），修改 SELECT_TARGET 即可切换（仅影响页面 JS，不改变 HTTP 请求头）
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
  
    // ------------------ 修改这里（6 个预设） ------------------
    // 每个 preset 包含: ua, platform, appVersion, vendor, userAgentData (brands/mobile/platform + highEntropy)
    const UA_PRESETS = {
      ios: {
        ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
        platform: "iPhone",
        appVersion: "5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        vendor: "Apple Computer, Inc.",
        uaData: {
          brands: [{ brand: "Safari", version: "17" }],
          mobile: true,
          platform: "iPhone",
          highEntropy: {
            architecture: "arm64",
            model: "iPhone14,5",
            platformVersion: "17.0",
            fullVersionList: [{ brand: "Safari", version: "17.0" }]
          }
        }
      },
  
      mac: {
        ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        platform: "MacIntel",
        appVersion: "5.0 (Macintosh; Intel Mac OS X 14_0)",
        vendor: "Apple Computer, Inc.",
        uaData: {
          brands: [{ brand: "Safari", version: "17" }],
          mobile: false,
          platform: "macOS",
          highEntropy: {
            architecture: "x86",
            model: "",
            platformVersion: "14.0",
            fullVersionList: [{ brand: "Safari", version: "17.0" }]
          }
        }
      },
  
      ipad: {
        ua: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
        platform: "iPad",
        appVersion: "5.0 (iPad; CPU OS 17_0 like Mac OS X)",
        vendor: "Apple Computer, Inc.",
        uaData: {
          brands: [{ brand: "Safari", version: "17" }],
          mobile: true,
          platform: "iPad",
          highEntropy: {
            architecture: "arm64",
            model: "iPad13,6",
            platformVersion: "17.0",
            fullVersionList: [{ brand: "Safari", version: "17.0" }]
          }
        }
      },
  
      android: {
        ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        platform: "Linux armv8l",
        appVersion: "5.0 (Linux; Android 14)",
        vendor: "Google Inc.",
        uaData: {
          brands: [{ brand: "Chromium", version: "120" }, { brand: "Google Chrome", version: "120" }],
          mobile: true,
          platform: "Android",
          highEntropy: {
            architecture: "arm64",
            model: "Pixel 8",
            platformVersion: "14",
            fullVersionList: [{ brand: "Chromium", version: "120.0.0.0" }]
          }
        }
      },
  
      windows: {
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Win32",
        appVersion: "5.0 (Windows)",
        vendor: "Google Inc.",
        uaData: {
          brands: [{ brand: "Chromium", version: "120" }, { brand: "Google Chrome", version: "120" }],
          mobile: false,
          platform: "Windows",
          highEntropy: {
            architecture: "x86",
            model: "",
            platformVersion: "10.0",
            fullVersionList: [{ brand: "Chromium", version: "120.0.0.0" }]
          }
        }
      },
  
      linux: {
        ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        platform: "Linux x86_64",
        appVersion: "5.0 (X11; Linux x86_64)",
        vendor: "Google Inc.",
        uaData: {
          brands: [{ brand: "Chromium", version: "120" }, { brand: "Google Chrome", version: "120" }],
          mobile: false,
          platform: "Linux",
          highEntropy: {
            architecture: "x86",
            model: "",
            platformVersion: "",
            fullVersionList: [{ brand: "Chromium", version: "120.0.0.0" }]
          }
        }
      }
    };
    // ------------------------------------------------------------
  
    // --------------- 选择/自动选择（修改这里） ------------------
    // 可把 SELECT_TARGET 改为 'ios'/'mac'/'ipad'/'android'/'windows'/'linux'
    // 或把 AUTO_SELECT = true 让脚本尝试根据原始 navigator 自动选择一个最接近的 preset（best-effort）
    const AUTO_SELECT = true;
    let SELECT_TARGET = 'ios'; // 默认，如果 AUTO_SELECT = true 则可能被覆盖
    // ------------------------------------------------------------
  
    function autoPickPreset() {
      try {
        const uaLower = (navigator.userAgent || "").toLowerCase();
        if (/iphone|ipad|ipod|ios/.test(uaLower)) {
          return uaLower.includes('ipad') ? 'ipad' : 'ios';
        }
        if (/macintosh|mac os x/.test(uaLower)) return 'mac';
        if (/android/.test(uaLower)) return 'android';
        if (/windows/.test(uaLower)) return 'windows';
        if (/linux/.test(uaLower)) return 'linux';
      } catch (e) {}
      return SELECT_TARGET;
    }
  
    if (AUTO_SELECT) {
      SELECT_TARGET = autoPickPreset();
    }
  
    const preset = UA_PRESETS[SELECT_TARGET] || UA_PRESETS.mac;
  
    // ----------------- 覆盖函数（尽早执行） -----------------
    function defineProp(obj, name, valueGetter) {
      try {
        Object.defineProperty(obj, name, {
          get: valueGetter,
          configurable: true
        });
      } catch (e) {
        try { obj[name] = valueGetter(); } catch (e2) {}
      }
    }
  
    function overrideNavigatorSimple() {
      try {
        // navigator is a host object; prefer prototype descriptor if available
        defineProp(navigator, 'userAgent', () => preset.ua);
        defineProp(navigator, 'platform', () => preset.platform);
        defineProp(navigator, 'appVersion', () => preset.appVersion);
        defineProp(navigator, 'vendor', () => preset.vendor);
        // language kept as-is unless you want to override:
        // defineProp(navigator, 'language', () => 'en-US');
      } catch (e) {}
    }
  
    function overrideUserAgentData() {
      try {
        const fakeUAD = {
          getHighEntropyValues: (keys) => {
            const res = {};
            keys.forEach(k => {
              if (preset.uaData.highEntropy && (k in preset.uaData.highEntropy)) {
                res[k] = preset.uaData.highEntropy[k];
              } else {
                res[k] = "";
              }
            });
            return Promise.resolve(res);
          },
          brands: preset.uaData.brands || [],
          mobile: !!preset.uaData.mobile,
          platform: preset.uaData.platform || ""
        };
        defineProp(navigator, 'userAgentData', () => fakeUAD);
      } catch (e) {}
    }
  
    function hijackIframes() {
      try {
        const origCreate = Document.prototype.createElement;
        Document.prototype.createElement = function(tagName, options) {
          const el = origCreate.call(this, tagName, options);
          if (String(tagName).toLowerCase() === 'iframe') {
            el.addEventListener('load', () => {
              try {
                const win = el.contentWindow;
                if (!win) return;
                try {
                  Object.defineProperty(win.navigator, 'userAgent', { get: () => preset.ua, configurable: true });
                  Object.defineProperty(win.navigator, 'platform', { get: () => preset.platform, configurable: true });
                  Object.defineProperty(win.navigator, 'appVersion', { get: () => preset.appVersion, configurable: true });
                  Object.defineProperty(win.navigator, 'vendor', { get: () => preset.vendor, configurable: true });
                  Object.defineProperty(win.navigator, 'userAgentData', {
                    get: () => ({
                      getHighEntropyValues: keys => Promise.resolve(Object.fromEntries(keys.map(k => [k, preset.uaData.highEntropy[k] || ""]))),
                      brands: preset.uaData.brands,
                      mobile: preset.uaData.mobile,
                      platform: preset.uaData.platform
                    }),
                    configurable: true
                  });
                } catch (e) {}
              } catch (e) {}
            }, { passive: true });
          }
          return el;
        };
      } catch (e) {}
    }
  
    // run overrides asap
    overrideNavigatorSimple();
    overrideUserAgentData();
    hijackIframes();
  
    // expose a marker for debugging
    try {
      window.__UA_SPOOFED__ = {
        preset: SELECT_TARGET,
        ua: preset.ua,
        time: Date.now()
      };
    } catch (e) {
       console.error(e)
    }
  
  })();
  