/*
ua_presets.js
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
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    platform: "macOS",
    mobile: "0",
    brands: [{ brand: "Google Chrome", version: "141" }, { brand: "Not?A_Brand", version: "8" }, { brand: "Chromium", version: "141" }]
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
    brands: [{ brand: "Chromium", version: "120" }, { brand: "Google Chrome", version: "120" }]
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

  // 当使用 mac preset 时，修改 Cookie、sec-fetch-site 和请求体
  if (presetKey === 'mac') {
    try {
      // 处理 Cookie：HTTP/2 可能使用多个独立的 cookie header，需要合并处理
      let allCookies = [];
      let hasXsecappid = false;
      
      // 遍历所有 headers，找出所有 cookie 相关的 header（包括大小写变体）
      for (const key in headers) {
        if (key && key.toLowerCase() === 'cookie') {
          const cookieValue = headers[key];
          // 可能是单个合并的 cookie 字符串，也可能是数组（HTTP/2）
          if (Array.isArray(cookieValue)) {
            // 数组形式：每个元素可能是一个完整的 cookie 字符串或单个 cookie
            for (const item of cookieValue) {
              if (typeof item === 'string') {
                // 检查是否包含分号（可能是多个 cookie 合并的）
                if (item.includes(';')) {
                  const cookies = item.split(';').map(c => c.trim()).filter(c => c);
                  allCookies = allCookies.concat(cookies);
                } else {
                  // 单个 cookie
                  allCookies.push(item.trim());
                }
              }
            }
          } else if (typeof cookieValue === 'string') {
            // 单个 cookie 字符串，按分号分割
            const cookies = cookieValue.split(';').map(c => c.trim()).filter(c => c);
            allCookies = allCookies.concat(cookies);
          }
        }
      }
      
      // 处理每个 cookie，替换或添加 xsecappid
      const processedCookies = [];
      for (let cookie of allCookies) {
        cookie = cookie.trim();
        if (!cookie) continue;
        
        if (cookie.startsWith('xsecappid=')) {
          // 替换现有的 xsecappid
          processedCookies.push('xsecappid=xhs-pc-web');
          hasXsecappid = true;
        } else {
          processedCookies.push(cookie);
        }
      }
      
      // 如果没有 xsecappid，添加一个
      if (!hasXsecappid) {
        processedCookies.push('xsecappid=xhs-pc-web');
      }
      
      // 合并所有 cookie 为一个字符串
      const mergedCookie = processedCookies.join('; ');
      
      // 删除所有旧的 cookie header，然后设置新的合并后的 cookie
      for (const key in headers) {
        if (key && key.toLowerCase() === 'cookie') {
          delete headers[key];
        }
      }
      
      // 设置回 headers（使用小写，HTTP/2 通常使用小写）
      headers['cookie'] = mergedCookie;
      
      // 修改 sec-fetch-site
      // 对于导航请求（document），设为 none
      // 对于 API 请求（empty/其他），保持 same-site 或 same-origin
      const fetchDest = headers['sec-fetch-dest'] || headers['Sec-Fetch-Dest'] || '';
      if (fetchDest.toLowerCase() === 'document') {
        headers['sec-fetch-site'] = 'none';
        headers['Sec-Fetch-Site'] = 'none';
      } else {
        // API 请求保持 same-site（如果原来就是 same-site 或 same-origin）
        const currentSite = headers['sec-fetch-site'] || headers['Sec-Fetch-Site'] || 'same-site';
        if (currentSite === 'same-origin' || currentSite === 'same-site') {
          headers['sec-fetch-site'] = 'same-site';
          headers['Sec-Fetch-Site'] = 'same-site';
        }
      }
    } catch(e){}
  }

  // 处理请求体（如果需要修改 appId）
  let body = $request.body;
  if (presetKey === 'mac' && body) {
    try {
      // 尝试解析 JSON 请求体
      if (typeof body === 'string') {
        const bodyObj = JSON.parse(body);
        // 如果请求体中有 appId 字段且值为 "ranchi"，可能需要修改
        // 但根据用户提供的文件，PC 端的请求体 appId 仍然是 "ranchi"，所以暂时不修改
        // 如果需要修改，可以取消下面的注释：
        // if (bodyObj.appId === 'ranchi') {
        //   bodyObj.appId = 'xhs-pc-web';
        //   body = JSON.stringify(bodyObj);
        // }
      }
    } catch(e) {
      // 如果不是 JSON，忽略
    }
  }

  // 返回修改后的请求
  const result = { headers: headers };
  if (body !== undefined && body !== $request.body) {
    result.body = body;
  }
  $done(result);
})();

