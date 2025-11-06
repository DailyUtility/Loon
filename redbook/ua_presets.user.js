// ==UserScript==
// @name         UA Presets (iOS / Mac / iPad / Android / Windows / Linux)
// @namespace    https://example.local/
// @version      1.2
// @description  在页面 JS 可见层面伪造设备信息，提供 6 个预设（ios, mac, ipad, android, windows, linux）。覆盖 navigator.*、屏幕尺寸、触摸支持、媒体查询、硬件信息等，用于绕过网站的设备检测（仅影响页面 JS，不改变 HTTP 请求头）
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
  
    // 判断平台类型
    const MOBILE_PLATFORMS = ['ios', 'ipad', 'android'];
    const PC_PLATFORMS = ['mac', 'windows', 'linux'];
    const isMobilePlatform = MOBILE_PLATFORMS.includes(SELECT_TARGET);
    const isPCPlatform = PC_PLATFORMS.includes(SELECT_TARGET);
  
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
  
    function overrideScreenPropertiesForPC() {
      try {
        // PC端：大屏幕尺寸
        Object.defineProperty(screen, 'width', { get: () => 1920, configurable: true });
        Object.defineProperty(screen, 'height', { get: () => 1080, configurable: true });
        Object.defineProperty(screen, 'availWidth', { get: () => 1920, configurable: true });
        Object.defineProperty(screen, 'availHeight', { get: () => 1040, configurable: true });
        Object.defineProperty(window, 'innerWidth', { get: () => 1920, configurable: true });
        Object.defineProperty(window, 'innerHeight', { get: () => 1080, configurable: true });
        Object.defineProperty(window, 'outerWidth', { get: () => 1920, configurable: true });
        Object.defineProperty(window, 'outerHeight', { get: () => 1080, configurable: true });
        // 设备像素比（PC通常为1或2）
        Object.defineProperty(window, 'devicePixelRatio', { get: () => 1, configurable: true });
      } catch (e) {}
    }
  
    function overrideScreenPropertiesForMobile() {
      try {
        // 移动端：小屏幕尺寸（根据设备类型设置）
        let width = 375, height = 667; // iPhone 默认尺寸
        if (SELECT_TARGET === 'ipad') {
          width = 768; height = 1024;
        } else if (SELECT_TARGET === 'android') {
          width = 412; height = 915; // 常见 Android 尺寸
        }
        Object.defineProperty(screen, 'width', { get: () => width, configurable: true });
        Object.defineProperty(screen, 'height', { get: () => height, configurable: true });
        Object.defineProperty(screen, 'availWidth', { get: () => width, configurable: true });
        Object.defineProperty(screen, 'availHeight', { get: () => height - 44, configurable: true }); // 减去状态栏高度
        Object.defineProperty(window, 'innerWidth', { get: () => width, configurable: true });
        Object.defineProperty(window, 'innerHeight', { get: () => height, configurable: true });
        Object.defineProperty(window, 'outerWidth', { get: () => width, configurable: true });
        Object.defineProperty(window, 'outerHeight', { get: () => height, configurable: true });
        // 设备像素比（移动端通常为2或3）
        Object.defineProperty(window, 'devicePixelRatio', { get: () => 2, configurable: true });
      } catch (e) {}
    }
  
    function overrideTouchSupportForPC() {
      try {
        // PC端：移除触摸相关属性
        Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });
        // 覆盖触摸事件检测（不阻止事件，但标记为不支持）
        try {
          // 这些属性在PC端应该是undefined
          if (window.ontouchstart !== undefined) {
            delete window.ontouchstart;
          }
          if (window.ontouchmove !== undefined) {
            delete window.ontouchmove;
          }
          if (window.ontouchend !== undefined) {
            delete window.ontouchend;
          }
        } catch (e) {}
      } catch (e) {}
    }
  
    function overrideTouchSupportForMobile() {
      try {
        // 移动端：保留触摸支持
        Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5, configurable: true });
      } catch (e) {}
    }
  
    function overrideMediaQueriesForPC() {
      try {
        // PC端：覆盖媒体查询
        const origMatchMedia = window.matchMedia;
        window.matchMedia = function(query) {
          const result = origMatchMedia.call(this, query);
          // 如果查询包含移动端相关的媒体查询，返回false
          if (query && typeof query === 'string') {
            const q = query.toLowerCase();
            if (q.includes('max-width') && q.includes('768')) {
              // 移动端媒体查询，返回不匹配
              return {
                matches: false,
                media: query,
                onchange: null,
                addListener: function() {},
                removeListener: function() {},
                addEventListener: function() {},
                removeEventListener: function() {},
                dispatchEvent: function() { return false; }
              };
            }
          }
          return result;
        };
      } catch (e) {}
    }
  
    function overrideHardwareConcurrencyForPC() {
      try {
        // PC端通常有更多CPU核心
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });
      } catch (e) {}
    }
  
    function overrideHardwareConcurrencyForMobile() {
      try {
        // 移动端：较少的CPU核心
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4, configurable: true });
      } catch (e) {}
    }
  
    function overrideConnectionForPC() {
      try {
        // PC端通常是有线连接
        if (navigator.connection) {
          Object.defineProperty(navigator.connection, 'type', { get: () => 'ethernet', configurable: true });
        }
      } catch (e) {}
    }
  
    function overrideConnectionForMobile() {
      try {
        // 移动端：通常是 wifi 或 cellular
        if (navigator.connection) {
          Object.defineProperty(navigator.connection, 'type', { get: () => 'wifi', configurable: true });
        }
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
  
    // run overrides asap - 根据选择的平台判断是否调用
    overrideNavigatorSimple();
    overrideUserAgentData();
    
    // 根据平台类型调用相应的覆盖函数
    if (isPCPlatform) {
      overrideScreenPropertiesForPC();
      overrideTouchSupportForPC();
      overrideMediaQueriesForPC();
      overrideHardwareConcurrencyForPC();
      overrideConnectionForPC();
    } else if (isMobilePlatform) {
      overrideScreenPropertiesForMobile();
      overrideTouchSupportForMobile();
      overrideHardwareConcurrencyForMobile();
      overrideConnectionForMobile();
    }
    
    // iframe 劫持始终执行
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
  