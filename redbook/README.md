# 小红书设备检测绕过方案

## 问题分析

小红书网站通过多种方式检测设备类型，不仅仅依赖 User-Agent。即使修改了 UA，网站仍可能提示"请使用 App 打开"，这是因为网站使用了综合检测机制。

## 小红书的设备检测方式

### 1. **User-Agent 检测**
- 检查 HTTP 请求头中的 `User-Agent`
- 检查 JavaScript 中的 `navigator.userAgent`

### 2. **sec-ch-ua* 请求头检测**
- `sec-ch-ua`: 浏览器品牌信息
- `sec-ch-ua-mobile`: 是否为移动设备（?1 或 ?0）
- `sec-ch-ua-platform`: 平台信息
- `sec-ch-ua-full-version-list`: 完整版本列表

### 3. **屏幕尺寸检测**
- `screen.width` / `screen.height`: 屏幕分辨率
- `window.innerWidth` / `window.innerHeight`: 视口大小
- `window.devicePixelRatio`: 设备像素比
- 移动端通常屏幕较小（< 768px），PC 端通常较大（≥ 1920px）

### 4. **触摸事件检测**
- `navigator.maxTouchPoints`: 最大触摸点数（移动端 > 0，PC 端 = 0）
- `window.ontouchstart` / `ontouchmove` / `ontouchend`: 触摸事件处理器
- 移动端支持触摸，PC 端通常不支持

### 5. **媒体查询检测**
- `window.matchMedia()`: CSS 媒体查询
- 检查 `@media (max-width: 768px)` 等移动端媒体查询

### 6. **Navigator 属性检测**
- `navigator.platform`: 平台信息
- `navigator.vendor`: 浏览器厂商
- `navigator.appVersion`: 应用版本
- `navigator.userAgentData`: 新的 UA 客户端提示 API（Chrome/Edge）

### 7. **硬件信息检测**
- `navigator.hardwareConcurrency`: CPU 核心数（移动端通常较少）
- `navigator.connection`: 网络连接类型（移动端通常是 cellular/wifi）

### 8. **其他可能的检测**
- Cookie 中的设备标识
- LocalStorage 中的设备信息
- 特定的请求头（如 `X-Requested-With`）
- Referrer 检测

## 解决方案

本项目提供了两套解决方案：

### 方案 1: Loon 插件（修改 HTTP 请求头）

**文件**: `ua_presets.plugin` + `ua_presets.js`

**功能**:
- 修改 HTTP 请求头中的 `User-Agent`
- 修改 `sec-ch-ua*` 相关请求头
- 支持在 Loon 设置面板选择平台预设（iOS/Mac/iPad/Android/Windows/Linux）
- 自动保存选择，下次启动后恢复

**使用方法**:
1. 在 Loon 中导入 `ua_presets.plugin`
2. 在设置面板选择要模拟的平台类型
3. 确保 MITM 已启用并信任证书

**限制**:
- 只能修改 HTTP 请求头
- 无法修改页面 JavaScript 中的 `navigator` 对象
- 无法修改屏幕尺寸、触摸支持等浏览器属性

### 方案 2: UserScript（修改页面 JavaScript 环境）

**文件**: `ua_presets.user.js`

**功能**:
- 覆盖 `navigator.userAgent`、`navigator.platform`、`navigator.vendor` 等
- 覆盖 `navigator.userAgentData`（UA 客户端提示 API）
- 覆盖屏幕尺寸属性（`screen.width`、`window.innerWidth` 等）
- 覆盖触摸支持（`navigator.maxTouchPoints`、触摸事件处理器）
- 覆盖媒体查询结果
- 覆盖硬件信息（CPU 核心数、网络连接类型）
- 支持 iframe 中的设备信息伪造

**使用方法**:
1. 安装 UserScript 管理器（如 Tampermonkey、Violentmonkey）
2. 安装 `ua_presets.user.js`
3. 修改脚本中的 `SELECT_TARGET` 或启用 `AUTO_SELECT`

**配置**:
```javascript
// 方式 1: 手动选择平台
const AUTO_SELECT = false;
let SELECT_TARGET = 'mac'; // 可选: 'ios', 'mac', 'ipad', 'android', 'windows', 'linux'

// 方式 2: 自动选择（根据原始 UA）
const AUTO_SELECT = true;
```

**限制**:
- 只能修改页面 JavaScript 环境
- 无法修改 HTTP 请求头（需要配合 Loon 插件使用）

## 推荐使用方案

**最佳实践：同时使用两种方案**

1. **Loon 插件**：修改 HTTP 请求头，确保服务器端检测通过
2. **UserScript**：修改页面 JavaScript 环境，确保客户端检测通过

这样可以最大程度地绕过小红书的设备检测。

### 两者的关系和区别

**Loon 插件** 和 **UserScript** 是**独立工作**的，不会互相影响：

- **Loon 插件** (`ua_presets.js`)：
  - 修改的是 **HTTP 请求头**中的 User-Agent
  - 服务器接收请求时看到的是修改后的 UA
  - 不影响浏览器 JavaScript 环境

- **UserScript** (`ua_presets.user.js`)：
  - 修改的是 **JavaScript** 中的 `navigator.userAgent` 等属性
  - 页面 JavaScript 代码执行时看到的是修改后的值
  - 不影响 HTTP 请求头

**重要提示**：
- 如果只使用 Loon 插件，服务器可能认为这是 PC 请求，但页面 JavaScript 检测时仍会发现是移动设备
- 如果只使用 UserScript，页面 JavaScript 可能认为这是 PC，但服务器仍会收到移动设备的请求头
- **必须两者配合使用**才能完全绕过检测

## 注意事项

1. **选择正确的平台预设**：
   
   - **在 iPhone 上模拟 PC**：
     - Loon 插件：在设置面板选择 `mac` 或 `windows`
     - UserScript：设置 `AUTO_SELECT = false` 和 `SELECT_TARGET = 'mac'`（已默认配置）
   
   - **在 PC 上模拟移动端**：
     - Loon 插件：在设置面板选择 `ios` 或 `android`
     - UserScript：设置 `AUTO_SELECT = false` 和 `SELECT_TARGET = 'ios'` 或 `'android'`
   
   - **注意**：UserScript 的 `AUTO_SELECT = true` 会根据**原始的** `navigator.userAgent` 自动选择，在 iPhone 上会选到 `ios`，所以必须设置为 `false` 并手动选择目标平台

2. **清除缓存**：
   - 修改设置后，建议清除浏览器缓存和 Cookie
   - 小红书可能将设备信息存储在 Cookie 或 LocalStorage 中

3. **调试方法**：
   - 在浏览器控制台输入 `window.__UA_SPOOFED__` 查看当前伪造的设备信息
   - 检查 Network 面板中的请求头是否正确

4. **可能的限制**：
   - 某些检测可能无法完全绕过（如服务器端的行为分析）
   - 小红书可能会更新检测机制，需要相应更新脚本

## 技术细节

### UserScript 覆盖的属性列表

- `navigator.userAgent`
- `navigator.platform`
- `navigator.appVersion`
- `navigator.vendor`
- `navigator.userAgentData`（包括 `brands`、`mobile`、`platform`、`getHighEntropyValues`）
- `navigator.maxTouchPoints`
- `navigator.hardwareConcurrency`
- `navigator.connection.type`
- `screen.width` / `screen.height` / `screen.availWidth` / `screen.availHeight`
- `screen.orientation`（设备方向）
- `window.innerWidth` / `window.innerHeight` / `window.outerWidth` / `window.outerHeight`
- `window.devicePixelRatio`
- `window.orientation`（已废弃但可能仍在使用）
- `window.ontouchstart` / `window.ontouchmove` / `window.ontouchend`
- `window.matchMedia()` 返回值（覆盖移动端媒体查询）
- `viewport` meta tag（修改为 PC 端样式）

### Loon 脚本修改的请求头

- `User-Agent`
- `sec-ch-ua`
- `sec-ch-ua-mobile`
- `sec-ch-ua-platform`
- `sec-ch-ua-full-version-list`

## 更新日志

### v1.2 (UserScript)
- 新增屏幕尺寸属性覆盖
- 新增触摸事件支持覆盖
- 新增媒体查询覆盖
- 新增硬件信息覆盖
- 优化触摸事件处理逻辑

### v1.1
- 初始版本，支持基本的 navigator 属性覆盖

