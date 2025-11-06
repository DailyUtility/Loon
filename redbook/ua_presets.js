/*
xiaohongshu_ua_presets.js
Loon http-request script
功能：替换 User-Agent 和 sec-ch-ua*，支持通过 Loon Settings 面板选择 preset
并且自动保存到 persistentStore，下次 Loon 启动后自动恢复选择
*/

const DEFAULT_PRESET = 'mac';
const STORE_KEY = 'XHS_UA_PRESET';

// 6 个预设
const PRESETS = {
  ios: {
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
    platform: "iPhone",
    mobile: "1",
    brands: [{ brand: "Safari", version: "17" }]
  },
  mac: {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    platform: "macOS",
    mobile: "0",
    brands: [{ brand: "Safari", version: "17" }]
  },
  ipad: {
    ua: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
    platform: "iPad",
    mobile: "1",
    brands: [{ brand: "Safari", version: "17" }]
  },
  android: {
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Android",
    mobile: "1",
    brands: [{ brand: "Chromium", version: "120" }, { brand: "Google Chrome", version: "120" }]
  },
  windows: {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "Windows",
    mobile: "0",
    brands: [{ brand: "Chromium", version: "120" }, { brand: "Google Chrome", version: "120" }]
  },
  linux: {
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "Linux",
    mobile: "0",
    brands: [{ brand: "Chromium", version: "120" }]
  }
};

// 构造 sec-ch-ua 字符串
function buildSecChUa(brands) {
  if (!Array.isArray(brands) || brands.length === 0) return '"Not A;Brand";v="99"';
  const parts = brands.map(b => `"${b.brand}";v="${String(b.version || '').split('.')[0] || '0'}"`);
  parts.push('";Not A Brand";v="99"');
  return parts.join(', ');
}

// Loon 脚本入口
(function () {
  if (typeof $request === 'undefined' || !$request) { $done({}); return; }

  // 读取用户在 Settings 面板选择的 preset
  let presetKey = DEFAULT_PRESET;
  try {
    if (typeof $argument !== 'undefined' && $argument && $argument.preset) {
      // 从参数中获取 preset 值
      presetKey = $argument.preset;
      if (presetKey && (presetKey in PRESETS)) {
        $persistentStore.write(presetKey, STORE_KEY);
      }
    } else if (typeof $persistentStore !== 'undefined' && $persistentStore.read) {
      // 从持久化存储中读取之前保存的值
      const v = $persistentStore.read(STORE_KEY);
      if (v && (v in PRESETS)) presetKey = v;
    }
  } catch(e){}

  const preset = PRESETS[presetKey] || PRESETS[DEFAULT_PRESET];

  // 复制原始请求头
  const headers = Object.assign({}, $request.headers || {});
  
  // 修改 User-Agent（统一使用小写，HTTP 头不区分大小写）
  headers['User-Agent'] = preset.ua;
  headers['user-agent'] = preset.ua;

  // 修改 sec-ch-ua* 相关请求头
  try {
    const scua = buildSecChUa(preset.brands);
    headers['sec-ch-ua'] = scua;
    headers['sec-ch-ua-mobile'] = preset.mobile === "1" ? "?1" : "?0";
    headers['sec-ch-ua-platform'] = '"' + preset.platform + '"';
    headers['sec-ch-ua-full-version-list'] = (preset.brands || []).map(b => `"${b.brand}";v="${b.version || '0'}"`).join(', ');
    
    // 同时设置大写版本（某些浏览器可能使用）
    headers['Sec-CH-UA'] = headers['sec-ch-ua'];
    headers['Sec-CH-UA-Mobile'] = headers['sec-ch-ua-mobile'];
    headers['Sec-CH-UA-Platform'] = headers['sec-ch-ua-platform'];
  } catch(e){}

  // 返回修改后的请求头
  $done({ headers: headers });
})();

