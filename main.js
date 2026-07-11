var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PicLinkerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian10 = require("obsidian");

// src/settings/SettingTab.ts
var import_obsidian4 = require("obsidian");

// src/view/utils/ViewUtils.ts
var import_obsidian2 = require("obsidian");

// src/icons.ts
var DOMAIN_BED_MAP = {
  "github.com": "GitHub" /* GitHub */,
  "github.io": "GitHub" /* GitHub */,
  "raw.githubusercontent.com": "GitHub" /* GitHub */,
  "aliyuncs.com": "\u963F\u91CC\u4E91 OSS" /* Aliyun */,
  "aliyun.com": "\u963F\u91CC\u4E91 OSS" /* Aliyun */,
  "cloud.tencent.com": "\u817E\u8BAF\u4E91 COS" /* Tencent */,
  "myqcloud.com": "\u817E\u8BAF\u4E91 COS" /* Tencent */,
  "sm.ms": "\u5176\u4ED6\u56FE\u5E8A" /* Other */,
  "smms.app": "\u5176\u4ED6\u56FE\u5E8A" /* Other */,
  "52sm.com": "\u5176\u4ED6\u56FE\u5E8A" /* Other */,
  "loli.net": "\u5176\u4ED6\u56FE\u5E8A" /* Other */,
  "sinaimg.cn": "\u5176\u4ED6\u56FE\u5E8A" /* Other */
};
function detectBedTypeFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const [domain, bedType] of Object.entries(DOMAIN_BED_MAP)) {
      if (hostname === domain || hostname.endsWith("." + domain)) return bedType;
    }
  } catch {
  }
  return null;
}
function getBedFaviconSvg(bedType) {
  return bedType ? BED_FAVICON_SVGS[bedType] || BED_FAVICON_SVGS["\u5176\u4ED6\u56FE\u5E8A" /* Other */] : BED_FAVICON_SVGS["\u5176\u4ED6\u56FE\u5E8A" /* Other */];
}
var BED_FAVICON_SVGS = {
  ["GitHub" /* GitHub */]: `<svg viewBox="0 0 1024 1024" width="14" height="14"><path fill="#000000" d="M512 85.333333C276.266667 85.333333 85.333333 276.266667 85.333333 512a426.410667 426.410667 0 0 0 291.754667 404.821333c21.333333 3.712 29.312-9.088 29.312-20.309333 0-10.112-0.554667-43.690667-0.554667-79.445333-107.178667 19.754667-134.912-26.112-143.445333-50.133334-4.821333-12.288-25.6-50.133333-43.733333-60.288-14.933333-7.978667-36.266667-27.733333-0.554667-28.245333 33.621333-0.554667 57.6 30.933333 65.621333 43.733333 38.4 64.512 99.754667 46.378667 124.245334 35.2 3.754667-27.733333 14.933333-46.378667 27.221333-57.045333-94.933333-10.666667-194.133333-47.488-194.133333-210.688 0-46.421333 16.512-84.778667 43.733333-114.688-4.266667-10.666667-19.2-54.4 4.266667-113.066667 0 0 35.712-11.178667 117.333333 43.776a395.946667 395.946667 0 0 1 106.666667-14.421333c36.266667 0 72.533333 4.778667 106.666666 14.378667 81.578667-55.466667 117.333333-43.690667 117.333334-43.690667 23.466667 58.666667 8.533333 102.4 4.266666 113.066667 27.178667 29.866667 43.733333 67.712 43.733334 114.645333 0 163.754667-99.712 200.021333-194.645334 210.688 15.445333 13.312 28.8 38.912 28.8 78.933333 0 57.045333-0.554667 102.912-0.554666 117.333334 0 11.178667 8.021333 24.490667 29.354666 20.224A427.349333 427.349333 0 0 0 938.666667 512c0-235.733333-190.933333-426.666667-426.666667-426.666667z"/></svg>`,
  ["\u963F\u91CC\u4E91 OSS" /* Aliyun */]: `<svg viewBox="0 0 1653 1024" width="14" height="14"><path fill="#F76E05" d="M344.8620198 721.82988526a57.857089 57.857089 0 0 1-46.13274501-56.07295017v-308.4012244a59.89610558 59.89610558 0 0 1 46.13274501-56.07295017l286.35436058-62.06256065 30.07549089-122.72329718H328.80476645A210.78331632 210.78331632 0 0 0 116.61962599 327.28021902v364.47417458a213.71440233 213.71440233 0 0 0 212.18514046 212.31257895h332.48710482l-30.07549089-122.21354321zM1178.05508073 116.49690269H843.01920461l30.58524561 122.72329718 286.35436059 62.06256065a57.98452749 57.98452749 0 0 1 46.132745 56.07295017v308.4012244a60.15098257 60.15098257 0 0 1-46.13274502 56.07295017l-286.35436057 62.06256066-30.58524561 122.72329716H1178.05508073a212.44001744 212.44001744 0 0 0 212.94977139-212.82233291V327.28021902A213.33208686 213.33208686 0 0 0 1178.05508073 116.49690269z"/><path fill="#F76E05" d="M631.21638038 495.49906876h244.29964793v30.07549166H631.21638038z"/></svg>`,
  ["\u817E\u8BAF\u4E91 COS" /* Tencent */]: `<svg viewBox="0 0 1402 1024" width="14" height="14"><path fill="#00A3FF" d="M1215.521013 836.730667c-22.304 22.698667-66.906667 56.746667-144.96 56.746666h-479.493333c144.96-141.872 267.621333-261.045333 278.773333-272.394666 11.146667-11.349333 39.024-39.722667 66.901334-62.421334 55.754667-51.077333 100.362667-56.746667 139.386666-56.746666 55.76 0 100.362667 22.693333 139.392 56.746666 78.053333 73.770667 78.053333 204.293333 0 278.069334z m94.778667-368.869334c-55.754667-62.421333-139.386667-102.149333-228.592-102.149333-78.058667 0-144.96 28.373333-206.293333 73.776-22.304 22.698667-55.754667 45.397333-83.626667 79.445333-22.309333 22.698667-501.797333 499.392-501.797333 499.392C317.86768 1024 351.32368 1024 379.19568 1024h607.728c44.602667 0 78.053333 0 111.509333-5.674667 72.48-5.674667 144.96-34.048 206.293334-90.8 128.234667-124.848 128.234667-334.816 5.573333-459.664z"/><path fill="#00C8DC" d="M517.921013 434.405333c-61.674667-45.792-123.349333-68.693333-196.234666-68.693333-89.706667 0-173.797333 40.069333-229.866667 103.04-123.344 131.658667-123.344 337.728 5.605333 469.386667 56.069333 51.52 112.133333 80.138667 179.413334 85.861333l128.949333-125.930667H332.902347c-72.885333-5.728-117.738667-28.624-145.770667-57.242666-78.490667-80.138667-78.490667-206.074667-5.605333-286.213334 39.242667-40.069333 84.096-57.242667 140.16-57.242666 33.642667 0 84.101333 5.722667 134.56 57.242666 22.426667 22.896 84.096 68.693333 106.522666 91.589334h5.605334l84.101333-85.866667v-5.722667c-39.248-40.069333-100.922667-91.589333-134.56-120.208"/><path fill="#006EFF" d="M1111.62768 286.944C1049.17968 118.154667 884.55568 0 697.233013 0c-221.386667 0-397.354667 163.162667-431.413333 365.712 17.029333 0 34.058667-5.621333 56.762667-5.621333 22.709333 0 51.093333 5.621333 73.797333 5.621333 28.378667-140.656 153.264-241.930667 300.853333-241.930667 124.885333 0 232.736 73.141333 283.824 180.042667 0 0 5.68 5.626667 5.68 0 39.733333-5.626667 85.146667-16.88 124.88-16.88 0 5.626667 0 5.626667 0 0"/></svg>`,
  ["\u5176\u4ED6\u56FE\u5E8A" /* Other */]: `<svg viewBox="0 0 1024 1024" width="14" height="14"><path fill="#11AA66" d="M955.733333 238.933333a170.666667 170.666667 0 1 0-341.333333 0 170.666667 170.666667 0 0 0 341.333333 0zM448.7168 290.816a34.133333 34.133333 0 0 0-59.255467 0L38.673067 904.635733A34.133333 34.133333 0 0 0 68.3008 955.733333h701.576533a34.133333 34.133333 0 0 0 29.627734-51.063466L448.750933 290.781867z"/><path fill="#FFAA44" d="M721.3056 529.749333a34.133333 34.133333 0 0 1 59.255467 0l214.254933 374.920534A34.133333 34.133333 0 0 1 965.188267 955.733333H536.6784a34.133333 34.133333 0 0 1-29.627733-51.063466l214.254933-374.954667z"/></svg>`
};
var LOCAL_ICON_SVG = `<svg viewBox="0 0 1024 1024" width="14" height="14"><path fill="#7C3AED" d="M825.683285 791.051243a2941.372556 2941.031364 0 0 0 79.241815-125.985102 34.545678 34.545678 0 0 0-2.644237-38.384086c-22.006876-29.214555-64.144074-88.496644-87.089228-143.385888-23.584889-56.339309-27.124755-143.940325-27.29535-186.674608a72.801818 72.801818 0 0 0-15.268337-44.781434l-136.391454-173.325476a159.6778 159.6778 0 0 1-3.241323 23.158399c-4.520792 21.45244-13.093238 42.819581-22.859856 63.973478-5.714964 12.368206-12.368206 25.589391-19.021448 38.981172l-13.221185 26.698265c-22.006876 45.549116-42.521038 94.97929-48.278651 153.109856-5.288474 53.737721 1.961853 116.431729 34.758923 191.110103 5.45907 0.469139 10.960789 1.066225 16.462508 1.876555a271.375492 271.375492 0 0 1 141.850524 64.186723c39.06647 33.692698 74.37983 81.971349 102.997299 149.271447zM349.891208 962.969302c3.113376 0.511788 6.226752 0.85298 9.382776 0.85298 33.266208 1.023576 89.349624 3.923707 134.770793 12.368206 37.104617 6.823838 110.588818 27.29535 171.022431 44.994679 46.188851 13.477079 93.742469-23.371644 100.438359-70.967911 4.861984-34.716274 14.074165-73.995989 30.920515-110.034382l-0.42649 0.213245c-28.57482-79.753602-64.911755-131.273576-103.039948-164.155944a225.826376 225.826376 0 0 0-118.478881-53.609774c-65.679437-9.212181-125.899804 8.103307-163.772103 19.192043 22.68926 94.595449 15.694827 205.951949-60.774803 321.189507zM236.189013 424.269971c-0.980927 4.264899-2.388343 8.40185-4.1796 12.368206L120.482317 685.324409a68.323674 68.323674 0 0 0 13.349132 75.574002l175.543223 180.831697c89.690816-132.254503 76.597577-256.74689 35.654551-353.986577-31.048461-73.782744-78.132941-131.401523-108.754912-163.388262zM397.70072 597.936639c26.229126-7.804764 68.49427-19.831778 117.071464-22.774558-29.129257-73.569499-36.166339-137.884169-30.536673-195.204405 6.567944-66.191225 29.85429-121.421661 52.671496-168.463491 4.819335-10.022512 9.510724-19.362639 13.988867-28.318926 6.354699-12.666749 12.282908-24.608464 17.869925-36.678128 9.25483-20.045023 16.163965-37.744352 19.618533-54.164211 3.411919-16.206614 3.411919-30.707269-0.597085-44.482891-4.051654-13.86092-12.666749-28.788065-29.00131-45.207924a68.238376 68.238376 0 0 0-62.907253 15.353634l-211.112477 189.873282a68.323674 68.323674 0 0 0-21.878929 40.601834l-18.211117 120.696628c28.660118 25.162901 99.286837 98.77505 142.234366 200.919368 3.838409 8.956287 7.463572 18.339064 10.790193 27.849788z"/></svg>`;

// src/utils/http.ts
var import_obsidian = require("obsidian");
async function fallbackRequest(url, options) {
  const resp = await (0, import_obsidian.requestUrl)({
    url,
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body
  });
  const buf = resp.arrayBuffer;
  const text = resp.text ?? new TextDecoder().decode(buf);
  return {
    ok: resp.status >= 200 && resp.status < 300,
    status: resp.status,
    text: async () => text,
    json: async () => JSON.parse(text),
    arrayBuffer: async () => buf
  };
}
async function directFetch(url, options = {}) {
  if (typeof window !== "undefined" && "require" in window) {
    let https;
    let URL2;
    try {
      const req = window.require;
      https = req("https");
      URL2 = req("url");
    } catch (reqErr) {
      console.warn(`[PicLinker] directFetch: require("https"/"url") \u5931\u8D25 \u2192 requestUrl \u56DE\u9000: ${reqErr}`);
      return fallbackRequest(url, options);
    }
    return new Promise((resolve, reject) => {
      const parsed = new URL2.URL(url);
      const reqOpts = {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers: options.headers || {}
      };
      const req = https.request(reqOpts, (res) => {
        const chunks = [];
        res.on("data", (chunk) => {
          if (chunk) chunks.push(chunk);
        });
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const text = buf.toString("utf-8");
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: async () => text,
            json: async () => JSON.parse(text),
            arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
          });
        });
      });
      req.on("error", (e) => {
        if (options.method === "DELETE") {
          console.warn("[PicLinker] directFetch: Node.js \u8BF7\u6C42\u9519\u8BEF (DELETE)", e);
          reject(e);
          return;
        }
        console.warn(`[PicLinker] directFetch: Node.js \u8BF7\u6C42\u5931\u8D25 \u2192 requestUrl \u56DE\u9000: ${e.message || e}`);
        fallbackRequest(url, options).then(
          (result) => resolve(result),
          (fe) => {
            console.warn("[PicLinker] directFetch: requestUrl \u56DE\u9000\u4E5F\u5931\u8D25", fe);
            reject(e);
          }
        );
      });
      req.setTimeout(15e3, () => {
        req.destroy(new Error("directFetch: \u8BF7\u6C42\u8D85\u65F6 (15s)"));
      });
      if (options.body) {
        const bodyData = typeof options.body === "string" ? options.body : Buffer.from(options.body);
        req.write(bodyData);
      }
      req.end();
    });
  }
  return fallbackRequest(url, options);
}

// src/comparator/CloudComparator.ts
var CloudComparator = class {
  constructor(settings) {
    this.settings = settings;
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  /**
   * 比对本地图片与云端
   * @param cloudFiles 可选的云端文件列表，传入后将优先用于文件名匹配（避免 CORS）
   * @param pathPrefix 可选的云端路径前缀（来自 frontmatter image-path）
   */
  async compare(localImages, bedType = "GitHub" /* GitHub */, cloudFiles, pathPrefix) {
    const result = /* @__PURE__ */ new Map();
    if (!this.isBedSupported(bedType)) {
      for (const img of localImages) {
        result.set(img.pure, { exists: false });
      }
      return result;
    }
    if ((bedType === "\u963F\u91CC\u4E91 OSS" /* Aliyun */ || bedType === "\u817E\u8BAF\u4E91 COS" /* Tencent */ || bedType === "\u5176\u4ED6\u56FE\u5E8A" /* Other */) && cloudFiles) {
      const cloudFileNames = /* @__PURE__ */ new Set();
      const cloudFileMap = /* @__PURE__ */ new Map();
      for (const f of cloudFiles) {
        if (!f.isDirectory && f.prefix) {
          const name = f.prefix.split("/").pop() || f.name;
          cloudFileNames.add(name);
          cloudFileMap.set(name, f.url);
        }
      }
      for (const img of localImages) {
        if (img.type !== "local") {
          if (this.isUrlFromBed(img.pure, bedType)) {
            result.set(img.pure, { exists: true, url: img.pure });
          } else {
            result.set(img.pure, { exists: false });
          }
          continue;
        }
        const fileName = extractFileName(img.pure);
        const expectedUrl = this.generateExpectedUrl(img.pure, bedType, pathPrefix);
        if (fileName && cloudFileNames.has(fileName)) {
          result.set(img.pure, { exists: true, url: cloudFileMap.get(fileName) || expectedUrl });
        } else {
          result.set(img.pure, { exists: false, url: expectedUrl });
        }
      }
      return result;
    }
    const checks = localImages.map(async (img) => {
      if (img.type !== "local") {
        if (this.isUrlFromBed(img.pure, bedType)) {
          return { key: img.pure, value: { exists: true, url: img.pure } };
        }
        return { key: img.pure, value: { exists: false } };
      }
      const expectedUrl = this.generateExpectedUrl(img.pure, bedType, pathPrefix);
      if (!expectedUrl) {
        return { key: img.pure, value: { exists: false } };
      }
      const exists = await this.checkUrlExists(expectedUrl);
      return { key: img.pure, value: { exists, url: expectedUrl } };
    });
    const results = await Promise.allSettled(checks);
    for (const r of results) {
      if (r.status === "fulfilled") {
        result.set(r.value.key, r.value.value);
      } else {
        console.warn("[PicLinker] compare HEAD request failed:", r.reason);
      }
    }
    for (const img of localImages) {
      if (!result.has(img.pure)) {
        result.set(img.pure, { exists: false });
      }
    }
    return result;
  }
  /**
   * 判断图床是否支持 URL 比对
   */
  isBedSupported(bedType) {
    switch (bedType) {
      case "GitHub" /* GitHub */:
        return !!(this.settings.githubOwner && this.settings.githubRepo);
      case "\u963F\u91CC\u4E91 OSS" /* Aliyun */:
        return !!(this.settings.aliyunEndpoint && this.settings.aliyunBucket);
      case "\u817E\u8BAF\u4E91 COS" /* Tencent */:
        return !!(this.settings.tencentBucket && this.settings.tencentRegion);
      case "\u5176\u4ED6\u56FE\u5E8A" /* Other */:
        return !!(this.settings.smmsToken || this.settings.otherBedUrl);
      default:
        return false;
    }
  }
  generateExpectedUrl(localPure, bedType, pathPrefix) {
    switch (bedType) {
      case "GitHub" /* GitHub */:
        return this.generateGitHubUrl(localPure);
      case "\u963F\u91CC\u4E91 OSS" /* Aliyun */:
        return this.generateAliyunUrl(localPure, pathPrefix);
      case "\u817E\u8BAF\u4E91 COS" /* Tencent */:
        return this.generateTencentUrl(localPure, pathPrefix);
      default:
        return void 0;
    }
  }
  generateGitHubUrl(localPure) {
    const { githubOwner, githubRepo, githubBranch, githubPath } = this.settings;
    if (!githubOwner || !githubRepo) return void 0;
    const fileName = extractFileName(localPure);
    if (!fileName) return void 0;
    const basePath = githubPath ? `${githubPath}/` : "";
    return `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${githubBranch}/${basePath}${fileName}`;
  }
  generateAliyunUrl(localPure, pathPrefix) {
    const { aliyunEndpoint, aliyunBucket } = this.settings;
    if (!aliyunEndpoint || !aliyunBucket) return void 0;
    const fileName = extractFileName(localPure);
    if (!fileName) return void 0;
    const basePath = pathPrefix ? `${pathPrefix.replace(/^\/+|\/+$/g, "")}/` : "images/";
    const ep = aliyunEndpoint.replace(/^https?:\/\//, "");
    return `https://${aliyunBucket}.${ep}/${basePath}${fileName}`;
  }
  generateTencentUrl(localPure, pathPrefix) {
    const { tencentBucket, tencentRegion } = this.settings;
    if (!tencentBucket || !tencentRegion) return void 0;
    const fileName = extractFileName(localPure);
    if (!fileName) return void 0;
    const basePath = pathPrefix ? `${pathPrefix.replace(/^\/+|\/+$/g, "")}/` : "images/";
    return `https://${tencentBucket}.cos.${tencentRegion}.myqcloud.com/${basePath}${fileName}`;
  }
  /**
   * 检查远程 URL 是否属于指定图床（通过域名匹配）
   */
  isUrlFromBed(url, bedType) {
    const detected = detectBedTypeFromUrl(url);
    return detected === bedType;
  }
  async checkUrlExists(url) {
    try {
      const response = await directFetch(url, { method: "HEAD" });
      return response.ok;
    } catch (e) {
      console.warn("[PicLinker] HEAD \u8BF7\u6C42\u5931\u8D25:", e instanceof Error ? e.message : String(e));
      return false;
    }
  }
};
function extractFileName(localPure) {
  const normalized = localPure.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || void 0;
}

// src/view/utils/ViewUtils.ts
function isHidden(el) {
  return el.style.display === "none";
}
function ignoreNextClick(el) {
  const le = el;
  le._ignoreNextClick = true;
  window.setTimeout(() => {
    delete le._ignoreNextClick;
  }, 200);
}
function ensureLazyRendered(el) {
  const le = el;
  if (!le._lazyRendered && le._lazyRenderFn) {
    le._lazyRenderFn();
    le._lazyRendered = true;
  }
}
function setLazyRenderFn(el, fn) {
  el._lazyRenderFn = fn;
}
function setLazyRendered(el, value) {
  el._lazyRendered = value;
}
function setSafeHTML(el, html) {
  const frag = (0, import_obsidian2.sanitizeHTMLToDom)(html);
  el.empty();
  el.appendChild(frag);
}
function formatDisplayPath(fullPath) {
  const MAX_LEN = 60;
  if (fullPath.length <= MAX_LEN) return fullPath;
  const parts = fullPath.split("/");
  if (parts.length <= 2) return "..." + fullPath.slice(-MAX_LEN + 3);
  return parts[0] + "/.../" + parts.slice(-2).join("/");
}
function getTopBedIcon(urls, gray = false) {
  const bedCounts = /* @__PURE__ */ new Map();
  for (const url of urls) {
    const bt = detectBedTypeFromUrl(url) || "\u5176\u4ED6\u56FE\u5E8A" /* Other */;
    bedCounts.set(bt, (bedCounts.get(bt) || 0) + 1);
  }
  let topBed = "\u5176\u4ED6\u56FE\u5E8A" /* Other */;
  let maxCount = 0;
  for (const [bt, count] of bedCounts) {
    if (count > maxCount) {
      maxCount = count;
      topBed = bt;
    }
  }
  const icon = getBedFaviconSvg(topBed);
  return gray ? icon.replace(/fill="[^"]*"/g, 'fill="#9CA3AF"') : icon;
}
function getFileExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}
function expandRefs(img) {
  const refs = [];
  if (img.fileLines) {
    for (const [filePath, lines] of img.fileLines.entries()) {
      for (const line of lines) refs.push({ file: filePath, line });
    }
  }
  if (refs.length === 0) {
    for (const f of img.files) refs.push({ file: f, line: 0 });
  }
  return refs;
}
function parseTagKey(tagKey) {
  const sepIdx = tagKey.lastIndexOf("::");
  if (sepIdx === -1) return null;
  const idx = parseInt(tagKey.substring(sepIdx + 2), 10);
  if (isNaN(idx)) return null;
  return { keyPrefix: tagKey.substring(0, sepIdx), index: idx };
}
function resolveImageFromTagKey(keyPrefix, localImages) {
  let img = localImages.find((i) => i.pure === keyPrefix);
  if (img) return img;
  img = localImages.find((i) => i.resolvedPath === keyPrefix);
  if (img) return img;
  if (keyPrefix.startsWith("local:") || keyPrefix.startsWith("cloud:")) {
    const colonIdx = keyPrefix.indexOf(":");
    const rawPath = keyPrefix.substring(colonIdx + 1);
    img = localImages.find((i) => i.resolvedPath === rawPath || i.pure === rawPath);
    if (img) return img;
  }
  return void 0;
}
function buildFileNameRefCount(localImages) {
  const map = /* @__PURE__ */ new Map();
  for (const img of localImages) {
    const fileName = extractFileName(img.pure);
    if (fileName) {
      map.set(fileName, (map.get(fileName) || 0) + 1);
    }
  }
  return map;
}

// src/utils/DangerConfirmModal.ts
var import_obsidian3 = require("obsidian");
function confirmAsync(app, options) {
  return new Promise((resolve) => {
    const modal = new ConfirmModal(app, {
      message: options.message,
      title: options.title,
      confirmText: options.confirmText,
      onResolve: resolve
    });
    modal.open();
  });
}
var ConfirmModal = class extends import_obsidian3.Modal {
  constructor(app, options) {
    super(app);
    this.message = options.message;
    this.titleText = options.title ?? "\u786E\u8BA4\u64CD\u4F5C";
    this.confirmText = options.confirmText ?? "\u786E\u8BA4";
    this.onResolve = options.onResolve;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createDiv({ cls: "piclinker-confirm-title", text: this.titleText });
    contentEl.createEl("p", { text: this.message });
    const btnRow = contentEl.createDiv({ cls: "modal-button-row piclinker-confirm-actions" });
    const cancelBtn = btnRow.createEl("button", { text: "\u53D6\u6D88" });
    cancelBtn.addEventListener("click", () => {
      this.onResolve(false);
      this.close();
    });
    const confirmBtn = btnRow.createEl("button", { text: this.confirmText, cls: "mod-warning" });
    confirmBtn.addEventListener("click", () => {
      this.onResolve(true);
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/utils/AsyncHandler.ts
function onAsyncClick(handler) {
  return (ev) => {
    void handler(ev);
  };
}
function deferAsync(fn) {
  return () => {
    void fn();
  };
}

// src/utils/Common.ts
function safeBtoa(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "tiff",
  "tif",
  "avif"
]);
function cleanInvisible(s) {
  return s.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var BED_SETTINGS_KEYS = [
  "githubToken",
  "githubOwner",
  "githubRepo",
  "githubBranch",
  "githubPath",
  "aliyunEndpoint",
  "aliyunBucket",
  "aliyunAccessKeyId",
  "aliyunAccessKeySecret",
  "tencentSecretId",
  "tencentSecretKey",
  "tencentBucket",
  "tencentRegion",
  "smmsToken",
  "otherBedName",
  "otherBedUrl",
  "otherBedUsername",
  "otherBedPassword",
  "otherBedPath"
];
function parseXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const errorCode = doc.querySelector("Code");
  if (errorCode) {
    const message = doc.querySelector("Message")?.textContent || "";
    return { doc, error: { code: errorCode.textContent || "", message } };
  }
  return { doc };
}
function parseXmlFileList(doc, baseUrl) {
  const files = [];
  const contents = Array.from(doc.querySelectorAll("Contents"));
  for (const content of contents) {
    const key = decodeURIComponent(content.querySelector("Key")?.textContent || "");
    if (!key || key.endsWith("/")) continue;
    const name = key.split("/").pop() || key;
    files.push({ name, url: `${baseUrl}/${key}`, prefix: key });
  }
  return files;
}

// src/settings/SettingTab.ts
var BED_NAME_TYPE_MAP = {
  "GitHub \u56FE\u5E8A": "GitHub" /* GitHub */,
  "\u963F\u91CC\u4E91 OSS": "\u963F\u91CC\u4E91 OSS" /* Aliyun */,
  "\u817E\u8BAF\u4E91 COS": "\u817E\u8BAF\u4E91 COS" /* Tencent */,
  "\u5176\u4ED6\u56FE\u5E8A": "\u5176\u4ED6\u56FE\u5E8A" /* Other */
};
var BED_CONFIGS = [
  {
    name: "GitHub \u56FE\u5E8A",
    desc: "",
    guide: "\u3010\u83B7\u53D6 Token\u3011\n1. \u6253\u5F00 https://github.com/settings/tokens\n2. Generate new token (classic) \u2192 \u52FE\u9009 repo \u6743\u9650 \u2192 \u751F\u6210\u5E76\u590D\u5236 Token\n\n\u3010\u521B\u5EFA\u4ED3\u5E93\u3011\n3. \u6253\u5F00 https://github.com/new \u521B\u5EFA\u516C\u5F00\u4ED3\u5E93\uFF08Public\uFF09\n4. \u586B\u5199\u4E0B\u65B9\u914D\u7F6E\uFF1A\n   - Owner\uFF1AGitHub \u7528\u6237\u540D\n   - Repo\uFF1A\u4ED3\u5E93\u540D\n   - Branch\uFF1A\u5206\u652F\uFF08\u9ED8\u8BA4 main\uFF09\n   - Path\uFF1A\u5B50\u76EE\u5F55\uFF08\u9ED8\u8BA4 images\uFF09",
    fields: [
      { name: "Token", desc: "Personal Access Token\uFF08\u9700 repo \u6743\u9650\uFF09", placeholder: "ghp_xxxx", key: "githubToken", isSecret: true, required: true },
      { name: "Owner", desc: "GitHub \u7528\u6237\u540D", placeholder: "username", key: "githubOwner", required: true },
      { name: "Repo", desc: "\u56FE\u7247\u4ED3\u5E93\u540D\uFF08\u9700\u4E3A Public\uFF09", placeholder: "image-repo", key: "githubRepo", required: true },
      { name: "Branch", desc: "\u5206\u652F\u540D", placeholder: "main", key: "githubBranch" },
      { name: "Path", desc: "\u5B50\u76EE\u5F55\u8DEF\u5F84\uFF08\u53EF\u9009\uFF09", placeholder: "images", key: "githubPath" }
    ]
  },
  {
    name: "\u963F\u91CC\u4E91 OSS",
    desc: "",
    guide: "\u3010\u83B7\u53D6\u5BC6\u94A5\u3011\n1. \u6253\u5F00 https://ram.console.aliyun.com \u2192 AccessKey \u7BA1\u7406\n2. \u521B\u5EFA AccessKey\uFF08\u5EFA\u8BAE\u4F7F\u7528 RAM \u5B50\u8D26\u53F7\uFF0C\u4EC5\u6388\u4E88 OSS \u6743\u9650\uFF09\n3. \u586B\u5199 AccessKey ID \u548C Secret\n\n\u3010\u81EA\u52A8\u83B7\u53D6 Bucket\u3011\n4. \u586B\u5199\u5BC6\u94A5\u540E\u81EA\u52A8\u83B7\u53D6 Bucket \u5217\u8868\n5. \u9009\u62E9 Bucket \u540E\u81EA\u52A8\u586B\u5165 Endpoint\n6. \u5982\u679C\u81EA\u52A8\u83B7\u53D6\u5931\u8D25\uFF0C\u53EF\u624B\u52A8\u586B\u5199 Bucket \u548C Endpoint\n\n\u3010\u521B\u5EFA Bucket\u3011\n7. \u6253\u5F00 https://oss.console.aliyun.com \u2192 \u521B\u5EFA Bucket\n8. \u8BFB\u5199\u6743\u9650\u8BBE\u4E3A\u300C\u516C\u5171\u8BFB\u300D\uFF08\u56FE\u7247\u9700\u8981\u516C\u5F00\u8BBF\u95EE\uFF09\n\n\u3010\u914D\u7F6E\u8DE8\u57DF\u3011\n9. Bucket \u2192 \u6570\u636E\u5B89\u5168 \u2192 \u8DE8\u57DF\u8BBE\u7F6E \u2192 \u521B\u5EFA\u89C4\u5219\n10. \u6765\u6E90\uFF1Aapp://obsidian.md\n11. \u65B9\u6CD5\uFF1AGET, PUT, DELETE\n12. \u5141\u8BB8 Header\uFF1A*",
    fields: [
      { name: "AccessKey ID", desc: "AccessKey \u7BA1\u7406\u9875\u9762\u83B7\u53D6", placeholder: "LTAI...", key: "aliyunAccessKeyId", required: true },
      { name: "AccessKey Secret", desc: "\u4EC5\u521B\u5EFA\u65F6\u663E\u793A\u4E00\u6B21\uFF0C\u6CE8\u610F\u4FDD\u5B58", placeholder: "", key: "aliyunAccessKeySecret", isSecret: true, required: true }
    ]
  },
  {
    name: "\u817E\u8BAF\u4E91 COS",
    desc: "",
    guide: "\u3010\u83B7\u53D6\u5BC6\u94A5\u3011\n1. \u6253\u5F00 https://console.cloud.tencent.com/cam \u2192 API \u5BC6\u94A5\u7BA1\u7406\n2. \u65B0\u5EFA\u5BC6\u94A5\uFF08\u5EFA\u8BAE\u4F7F\u7528 CAM \u5B50\u7528\u6237\uFF0C\u4EC5\u6388\u4E88 COS \u6743\u9650\uFF09\n3. \u586B\u5199 SecretId \u548C SecretKey\n\n\u3010\u81EA\u52A8\u83B7\u53D6 Bucket\u3011\n4. \u586B\u5199\u5BC6\u94A5\u540E\u81EA\u52A8\u83B7\u53D6 Bucket \u5217\u8868\n5. \u9009\u62E9 Bucket \u540E\u81EA\u52A8\u586B\u5165 Region\n6. \u5982\u679C\u81EA\u52A8\u83B7\u53D6\u5931\u8D25\uFF0C\u53EF\u624B\u52A8\u586B\u5199 Bucket \u548C Region\n\n\u3010\u521B\u5EFA\u5B58\u50A8\u6876\u3011\n7. \u6253\u5F00 https://console.cloud.tencent.com/cos \u2192 \u521B\u5EFA\u5B58\u50A8\u6876\n8. \u8BBF\u95EE\u6743\u9650\u8BBE\u4E3A\u300C\u516C\u6709\u8BFB\u79C1\u6709\u5199\u300D\n9. Bucket \u683C\u5F0F\uFF1A\u540D\u79F0-APPID\uFF08\u5982 my-images-1250000000\uFF09\n\n\u3010\u914D\u7F6E\u8DE8\u57DF\u3011\n10. \u5B58\u50A8\u6876 \u2192 \u57FA\u7840\u914D\u7F6E \u2192 \u8DE8\u57DF\u8BBF\u95EE CORS \u2192 \u6DFB\u52A0\u89C4\u5219\n11. \u6765\u6E90\uFF1Aapp://obsidian.md\n12. \u65B9\u6CD5\uFF1AGET, PUT, DELETE\n13. \u5141\u8BB8 Header\uFF1A*",
    fields: [
      { name: "SecretId", desc: "API \u5BC6\u94A5\u7BA1\u7406\u9875\u9762\u83B7\u53D6", placeholder: "AKID...", key: "tencentSecretId", isSecret: true, required: true },
      { name: "SecretKey", desc: "\u5BC6\u94A5\u5BC6\u7801", placeholder: "", key: "tencentSecretKey", isSecret: true, required: true }
    ]
  },
  {
    name: "\u5176\u4ED6\u56FE\u5E8A",
    desc: "",
    guide: "\u3010\u652F\u6301\u7684\u56FE\u5E8A\u3011\n1. SM.MS\uFF1A\u514D\u8D39\u56FE\u5E8A\uFF0C\u53EA\u9700\u586B\u5199 Token\n2. \u5170\u7A7A\u56FE\u5E8A Lsky Pro\uFF1A\u81EA\u5EFA\u56FE\u5E8A\uFF0C\u9700\u8981 API URL + Token \u6216\u7528\u6237\u540D\u5BC6\u7801\n3. EasyImage\uFF1A\u7B80\u5355\u56FE\u5E8A\uFF0C\u9700\u8981 API URL + Token\n4. Chevereto\uFF1A\u5546\u4E1A\u56FE\u5E8A\uFF0C\u9700\u8981 API URL + Token\n5. \u5176\u4ED6\u81EA\u5EFA\u56FE\u5E8A\uFF1A\u9700\u8981 API URL + \u8BA4\u8BC1\u4FE1\u606F\n\n\u3010SM.MS Token \u83B7\u53D6\u3011\n1. \u6253\u5F00 https://sm.ms \u2192 \u6CE8\u518C\u5E76\u767B\u5F55\n2. Dashboard \u2192 API Token \u2192 \u590D\u5236 Token\n\n\u3010\u81EA\u5EFA\u56FE\u5E8A\u914D\u7F6E\u3011\n3. Name\uFF1A\u81EA\u5B9A\u4E49\u540D\u79F0\uFF08\u4FBF\u4E8E\u8BC6\u522B\uFF09\n4. API URL\uFF1A\u56FE\u5E8A\u63A5\u53E3\u5730\u5740\uFF08\u5982 https://your-domain.com/api/v1/upload\uFF09\n5. Token\uFF1A\u8BA4\u8BC1\u5BC6\u94A5\uFF08\u90E8\u5206\u56FE\u5E8A\u4E0D\u9700\u8981\uFF09\n6. Username/Password\uFF1A\u90E8\u5206\u56FE\u5E8A\u9700\u8981\n7. Path\uFF1A\u56FE\u7247\u5B58\u50A8\u5B50\u76EE\u5F55\uFF08\u53EF\u9009\uFF09",
    fields: [
      { name: "Name", desc: "\u81EA\u5B9A\u4E49\u540D\u79F0\uFF0C\u4FBF\u4E8E\u8BC6\u522B", placeholder: "SM.MS", key: "otherBedName" },
      { name: "API URL", desc: "\u56FE\u5E8A\u63A5\u53E3\u5730\u5740", placeholder: "https://smms.app/api/v2", key: "otherBedUrl", required: true },
      { name: "Token", desc: "\u8BA4\u8BC1\u5BC6\u94A5\uFF08\u90E8\u5206\u56FE\u5E8A\u4E0D\u9700\u8981\uFF09", placeholder: "your-token", key: "smmsToken", isSecret: true },
      { name: "Username", desc: "\u90E8\u5206\u56FE\u5E8A\u9700\u8981", placeholder: "admin", key: "otherBedUsername" },
      { name: "Password", desc: "\u90E8\u5206\u56FE\u5E8A\u9700\u8981", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022", key: "otherBedPassword", isSecret: true },
      { name: "Path", desc: "\u56FE\u7247\u5B58\u50A8\u5B50\u76EE\u5F55\uFF08\u53EF\u9009\uFF09", placeholder: "images", key: "otherBedPath" }
    ]
  }
];
var PicLinkerSettingTab = class _PicLinkerSettingTab extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    /** 防抖保存计时器 */
    this.settingsSaveTimer = null;
    /** 同步操作进行中标志，防止重复点击 */
    this.syncing = false;
    /** 同步状态元素引用 */
    this.webdavStatusEl = null;
    /** 图床连接测试状态 */
    this.bedTestResults = {};
    this.plugin = plugin;
  }
  /**
   * 防抖保存设置：延迟 600ms 后真正写入，
   * 避免用户快速输入时每个字符都触发 saveSettings → 刷新视图 → WebDAV上传
   */
  debouncedSaveSettings() {
    if (this.settingsSaveTimer) window.clearTimeout(this.settingsSaveTimer);
    this.settingsSaveTimer = window.setTimeout(deferAsync(async () => {
      try {
        await this.plugin.saveSettings();
      } catch (e) {
        console.error("[PicLinker] \u4FDD\u5B58\u5931\u8D25:", e);
      }
      this.settingsSaveTimer = null;
    }), 600);
  }
  renderSettings() {
    void (async () => {
      const { containerEl } = this;
      containerEl.empty();
      if (this.settingsSaveTimer) {
        window.clearTimeout(this.settingsSaveTimer);
        this.settingsSaveTimer = null;
      }
      const data = await this.plugin.loadData();
      this.bedTestResults = data?._bedTestResults || {};
      new import_obsidian4.Setting(containerEl).setName("\u8BBE\u7F6E").setHeading();
      this.renderGeneralSettings(containerEl);
      this.renderSectionVisibilitySettings(containerEl);
      for (const bed of BED_CONFIGS) {
        this.renderCollapsibleBed(containerEl, bed);
      }
      this.renderWebdavSettings(containerEl);
    })();
  }
  display() {
    this.renderSettings();
  }
  // ========== 通用设置 ==========
  renderGeneralSettings(container) {
    new import_obsidian4.Setting(container).setName("\u663E\u793A\u8DEF\u5F84").setDesc('\u5F00\u542F\u540E\u663E\u793A"\u6839\u76EE\u5F55/image/photo.jpg"\uFF0C\u5173\u95ED\u5219\u53EA\u663E\u793A"photo.jpg"').addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showPath).onChange((value) => {
        this.plugin.settings.showPath = value;
        this.plugin.refreshView();
        this.debouncedSaveSettings();
      })
    );
  }
  // ========== 插件通用设置 ==========
  // 插件设置已移至顶部独立设置项
  // ========== 插件功能 ==========
  renderSectionVisibilitySettings(container) {
    new import_obsidian4.Setting(container).setName("\u529F\u80FD\u5F00\u5173").setHeading();
    const items = [
      { key: "showLocalImages", name: "\u672C\u5730\u56FE\u7247" },
      { key: "showCloudImages", name: "\u4E91\u7AEF\u56FE\u7247" },
      { key: "showLocalUnreferenced", name: "\u672C\u5730\u672A\u5F15\u7528" },
      { key: "showCloudUnreferenced", name: "\u4E91\u7AEF\u672A\u5F15\u7528" },
      { key: "showNotFoundImages", name: "\u672A\u627E\u5230\u56FE\u7247" },
      { key: "showSameNameFiles", name: "\u540C\u540D\u6587\u4EF6" },
      { key: "showDuplicates", name: "\u91CD\u590D\u56FE\u7247" },
      { key: "showEmptyFolders", name: "\u7A7A\u767D\u6587\u4EF6\u5939" }
    ];
    const table = container.createEl("table", { cls: "pic-settings-table" });
    for (const item of items) {
      const row = table.createEl("tr");
      row.createEl("td", { text: item.name });
      const toggleCell = row.createEl("td", { cls: "pic-table-toggle" });
      const toggleWrapper = toggleCell.createDiv({ cls: "pic-toggle-switch" });
      const toggleInput = toggleWrapper.createEl("input", { type: "checkbox" });
      toggleInput.checked = this.plugin.settings[item.key];
      const slider = toggleWrapper.createEl("span", { cls: "pic-toggle-slider" });
      slider.addEventListener("click", () => {
        toggleInput.checked = !toggleInput.checked;
        this.plugin.settings[item.key] = toggleInput.checked;
        this.plugin.refreshView();
        this.debouncedSaveSettings();
      });
      toggleInput.addEventListener("change", () => {
        this.plugin.settings[item.key] = toggleInput.checked;
        this.plugin.refreshView();
        this.debouncedSaveSettings();
      });
    }
    container.createDiv({ cls: "pic-section-divider" });
  }
  // ========== WebDAV 同步 ==========
  renderWebdavSettings(container) {
    const collapsible = container.createDiv({ cls: "pic-collapsible" });
    const header = collapsible.createDiv({ cls: "pic-collapsible-header" });
    const titleRow = header.createDiv({ cls: "pic-collapsible-title-row" });
    titleRow.createSpan({ cls: "pic-collapsible-arrow", text: "\u25B6" });
    titleRow.createSpan({ cls: "pic-collapsible-title", text: "WebDAV \u540C\u6B65\u8BBE\u7F6E" });
    const syncStatus = titleRow.createSpan({ cls: "pic-webdav-header-status" });
    this.updateWebdavHeaderStatus(syncStatus);
    header.createSpan({ cls: "pic-collapsible-subtitle", text: "" });
    const content = collapsible.createDiv({ cls: "pic-collapsible-content" });
    content.setCssStyles({ display: "none" });
    content.createDiv({ cls: "pic-setting-category-title", text: "\u670D\u52A1\u5668\u914D\u7F6E" });
    new import_obsidian4.Setting(content).setName("\u670D\u52A1\u5668\u5730\u5740").addText((text) => {
      text.inputEl.addClass("pic-webdav-url-input");
      text.setPlaceholder("https://dav.jianguoyun.com/dav/").setValue(this.plugin.settings.webdavUrl).onChange((value) => {
        this.plugin.settings.webdavUrl = value;
        this.debouncedSaveSettings();
      });
      return text;
    });
    content.createDiv({
      cls: "pic-webdav-path-hint",
      text: `\u914D\u7F6E\u6587\u4EF6\u5B58\u50A8\u8DEF\u5F84\uFF1A${this.plugin.settings.webdavRemotePath || "/PicLinker/settings.json"}`
    });
    new import_obsidian4.Setting(content).setName("\u7528\u6237\u540D").addText((text) => {
      text.inputEl.addClass("pic-webdav-username-input");
      text.setPlaceholder("username").setValue(this.plugin.settings.webdavUsername).onChange((value) => {
        this.plugin.settings.webdavUsername = value;
        this.debouncedSaveSettings();
      });
      return text;
    });
    const pwdSetting = new import_obsidian4.Setting(content).setName("\u5BC6\u7801").addText((text) => {
      text.inputEl.type = "password";
      text.inputEl.addClass("pic-webdav-userpwd-input");
      text.inputEl.placeholder = "\u8F93\u5165\u5BC6\u7801";
      text.inputEl.value = this.plugin.settings.webdavPassword;
      text.inputEl.addEventListener("input", () => {
        this.plugin.settings.webdavPassword = text.inputEl.value;
        this.debouncedSaveSettings();
      });
      return text;
    });
    pwdSetting.addButton((btn) => {
      btn.setIcon("eye");
      btn.setTooltip("\u663E\u793A/\u9690\u85CF");
      btn.onClick(() => {
        const input = pwdSetting.settingEl.querySelector("input");
        if (input) {
          const isHidden2 = input.type === "password";
          input.type = isHidden2 ? "text" : "password";
          btn.setIcon(isHidden2 ? "eye-off" : "eye");
        }
      });
    });
    new import_obsidian4.Setting(content).setName("\u81EA\u52A8\u4E0A\u4F20").setDesc("\u4FDD\u5B58\u8BBE\u7F6E\u65F6\u81EA\u52A8\u540C\u6B65\u5230 WebDAV \u670D\u52A1\u5668").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.webdavAutoSync).onChange((value) => {
        this.plugin.settings.webdavAutoSync = value;
        this.plugin.settings.webdavEnable = value;
        void this.plugin.saveSettings();
      });
    });
    const actionRow = content.createDiv({ cls: "pic-webdav-actions" });
    const uploadBtn = actionRow.createEl("button", {
      text: "\u624B\u52A8\u540C\u6B65",
      cls: "mod-cta pic-webdav-btn"
    });
    uploadBtn.addEventListener("click", () => {
      void this.syncToRemote(uploadBtn);
    });
    const downloadBtn = actionRow.createEl("button", {
      text: "\u8986\u76D6\u672C\u5730",
      cls: "pic-webdav-btn"
    });
    downloadBtn.addEventListener("click", () => {
      void this.syncFromRemoteSmart(downloadBtn);
    });
    const testStatus = actionRow.createSpan({ cls: "pic-test-status" });
    const testBtn = actionRow.createEl("button", {
      text: "\u6D4B\u8BD5\u8FDE\u63A5",
      cls: "mod-cta"
    });
    testBtn.addEventListener("click", onAsyncClick(async () => {
      testStatus.textContent = "\u68C0\u6D4B\u4E2D...";
      testStatus.className = "pic-test-status pic-testing";
      try {
        const result = await this.testWebdavConnection();
        if (result.success) {
          testStatus.textContent = "\u5DF2\u8FDE\u63A5";
          testStatus.className = "pic-test-status pic-ok";
        } else {
          testStatus.textContent = result.error || "\u8FDE\u63A5\u5931\u8D25";
          testStatus.className = "pic-test-status pic-fail";
        }
      } catch {
        testStatus.textContent = "\u6D4B\u8BD5\u5F02\u5E38";
        testStatus.className = "pic-test-status pic-fail";
      }
    }));
    this.webdavStatusEl = content.createDiv({ cls: "pic-webdav-status" });
    const arrowEl = titleRow.querySelector(".pic-collapsible-arrow");
    header.addEventListener("click", () => {
      const isOpen = content.style.display !== "none";
      content.setCssStyles({ display: isOpen ? "none" : "" });
      if (arrowEl) arrowEl.textContent = isOpen ? "\u25B6" : "\u25BC";
    });
  }
  /** 更新 WebDAV 标题栏状态指示 */
  updateWebdavHeaderStatus(statusEl) {
    const { webdavUrl, webdavUsername, webdavPassword } = this.plugin.settings;
    const isConfigured = webdavUrl && webdavUsername && webdavPassword;
    if (isConfigured) {
      statusEl.textContent = "\u5DF2\u914D\u7F6E";
      statusEl.className = "pic-webdav-header-status pic-webdav-status-enabled";
    } else {
      statusEl.textContent = "\u672A\u914D\u7F6E";
      statusEl.className = "pic-webdav-header-status pic-webdav-status-disabled";
    }
  }
  async syncToRemote(btn) {
    if (this.syncing) return;
    this.syncing = true;
    this.setButtonLoading(btn, true);
    this.updateSyncStatus("\u6B63\u5728\u4E0A\u4F20...");
    try {
      const result = await this.plugin.webDAVSync.uploadToWebdav();
      if (result.ok) {
        new import_obsidian4.Notice("\u914D\u7F6E\u5DF2\u4E0A\u4F20\u5230 WebDAV \u670D\u52A1\u5668");
        this.updateSyncStatus(`\u4E0A\u4F20\u6210\u529F (${(/* @__PURE__ */ new Date()).toLocaleTimeString()})`);
      } else {
        const msg = result.message || `\u4E0A\u4F20\u5931\u8D25: HTTP ${result.status}`;
        new import_obsidian4.Notice(msg);
        this.updateSyncStatus(msg);
      }
    } catch (e) {
      new import_obsidian4.Notice(`\u4E0A\u4F20\u5F02\u5E38: ${e}`);
      this.updateSyncStatus(`\u4E0A\u4F20\u5F02\u5E38: ${e}`);
    } finally {
      this.syncing = false;
      this.setButtonLoading(btn, false);
    }
  }
  async syncFromRemote() {
    if (!this.plugin.settings.webdavUrl || !this.plugin.settings.webdavUsername || !this.plugin.settings.webdavPassword) {
      new import_obsidian4.Notice("\u8BF7\u5148\u586B\u5199 WebDAV \u670D\u52A1\u5668\u914D\u7F6E");
      return;
    }
    if (!this.plugin.settings.webdavUrl.startsWith("https://")) {
      new import_obsidian4.Notice("WebDAV \u4EC5\u652F\u6301 HTTPS \u8FDE\u63A5");
      return;
    }
    try {
      const url = `${this.plugin.settings.webdavUrl}${this.plugin.settings.webdavRemotePath.replace(/^\//, "")}`;
      const auth = safeBtoa(`${this.plugin.settings.webdavUsername}:${this.plugin.settings.webdavPassword}`);
      const response = await directFetch(url, {
        headers: { Authorization: `Basic ${auth}` }
      });
      if (!response.ok) {
        new import_obsidian4.Notice(`\u4E0B\u8F7D\u5931\u8D25: HTTP ${response.status}`);
        return;
      }
      const remoteData = await response.json();
      if (!remoteData || typeof remoteData !== "object") {
        new import_obsidian4.Notice("\u8FDC\u7A0B\u6570\u636E\u683C\u5F0F\u65E0\u6548");
        return;
      }
      for (const k of BED_SETTINGS_KEYS) {
        if (k in remoteData && typeof remoteData[k] === "string") {
          this.plugin.settings[k] = remoteData[k];
        }
      }
      this.plugin.webDAVSync.meta = {
        lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastSyncSource: "download"
      };
      await this.plugin.saveSettings();
      new import_obsidian4.Notice("\u5DF2\u4ECE WebDAV \u4E0B\u8F7D\u5E76\u5E94\u7528\u914D\u7F6E");
      void this.renderSettings();
    } catch (e) {
      new import_obsidian4.Notice(`\u4E0B\u8F7D\u5F02\u5E38: ${e}`);
    }
  }
  /**
   * #11 智能下载（带冲突检测）
   */
  async syncFromRemoteSmart(btn) {
    if (this.syncing) return;
    this.syncing = true;
    this.setButtonLoading(btn, true);
    this.updateSyncStatus("\u6B63\u5728\u68C0\u67E5\u8FDC\u7A0B\u914D\u7F6E...");
    try {
      const result = await this.plugin.webDAVSync.syncFromRemote();
      if (!result) return;
      if (result.conflict) {
        const msg = result.remoteNewer ? "\u8FDC\u7A0B\u914D\u7F6E\u6BD4\u672C\u5730\u65B0\uFF0C\u662F\u5426\u8986\u76D6\u672C\u5730\uFF1F" : "\u672C\u5730\u914D\u7F6E\u6BD4\u8FDC\u7A0B\u65B0\uFF0C\u662F\u5426\u7528\u8FDC\u7A0B\u8986\u76D6\uFF1F";
        if (!await confirmAsync(this.app, { message: `${result.error}

${msg}` })) return;
        this.updateSyncStatus("\u6B63\u5728\u5408\u5E76...");
        await this.syncFromRemote();
        this.updateSyncStatus(`\u5408\u5E76\u5B8C\u6210 (${(/* @__PURE__ */ new Date()).toLocaleTimeString()})`);
        return;
      }
      if (result.success) {
        new import_obsidian4.Notice("\u5DF2\u4ECE WebDAV \u667A\u80FD\u5408\u5E76\u914D\u7F6E");
        this.updateSyncStatus(`\u540C\u6B65\u6210\u529F (${(/* @__PURE__ */ new Date()).toLocaleTimeString()})`);
        void this.renderSettings();
      } else {
        new import_obsidian4.Notice(result.error || "\u540C\u6B65\u5931\u8D25");
        this.updateSyncStatus(result.error || "\u540C\u6B65\u5931\u8D25");
      }
    } finally {
      this.syncing = false;
      this.setButtonLoading(btn, false);
    }
  }
  /** 更新同步状态文本 */
  updateSyncStatus(text) {
    if (this.webdavStatusEl) {
      this.webdavStatusEl.textContent = text;
    }
  }
  /** 设置按钮加载状态 */
  setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalText = btn.textContent || "";
      btn.textContent = "\u5904\u7406\u4E2D...";
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      delete btn.dataset.originalText;
    }
  }
  // ========== 图床折叠卡片 ==========
  renderCollapsibleBed(container, config) {
    const collapsible = container.createDiv({ cls: "pic-collapsible" });
    const header = collapsible.createDiv({ cls: "pic-collapsible-header" });
    const titleRow = header.createDiv({ cls: "pic-collapsible-title-row" });
    const arrow = titleRow.createSpan({ cls: "pic-collapsible-arrow", text: "\u25B6" });
    const bedType = BED_NAME_TYPE_MAP[config.name];
    if (bedType) {
      const iconSpan = titleRow.createSpan({ cls: "pic-bed-icon" });
      setSafeHTML(iconSpan, getBedFaviconSvg(bedType));
    }
    titleRow.createSpan({ cls: "pic-collapsible-title", text: config.name });
    const statusSpan = titleRow.createSpan({ cls: "pic-bed-status" });
    this.updateBedStatus(statusSpan, config);
    header.createSpan({ cls: "pic-collapsible-subtitle", text: config.desc });
    const content = collapsible.createDiv({ cls: "pic-collapsible-content" });
    content.setCssStyles({ display: "none" });
    for (const field of config.fields) {
      const setting = new import_obsidian4.Setting(content).setDesc(field.desc);
      if (field.required) {
        setSafeHTML(setting.nameEl, `${field.name} <span class="pic-required">*</span>`);
      } else {
        setting.setName(field.name);
      }
      setting.addText((text) => {
        text.inputEl.addClass(field.isSecret ? "pic-bed-secret-input" : "pic-bed-input");
        if (field.isSecret) {
          text.inputEl.type = "password";
          text.inputEl.placeholder = field.placeholder;
          text.inputEl.value = this.plugin.settings[field.key];
          text.inputEl.addEventListener("input", () => {
            this.plugin.settings[field.key] = text.inputEl.value;
            this.debouncedSaveSettings();
            if (bedType) void this.resetBedTestResult(bedType);
            this.updateBedStatus(statusSpan, config);
          });
        } else {
          text.setPlaceholder(field.placeholder).setValue(this.plugin.settings[field.key]).onChange((value) => {
            this.plugin.settings[field.key] = value;
            this.debouncedSaveSettings();
            if (bedType) void this.resetBedTestResult(bedType);
            this.updateBedStatus(statusSpan, config);
          });
        }
        return text;
      });
      if (field.isSecret) {
        setting.addButton((btn) => {
          btn.setIcon("eye");
          btn.setTooltip("\u663E\u793A/\u9690\u85CF");
          btn.onClick(() => {
            const input = setting.settingEl.querySelector("input");
            if (input) {
              const isHidden2 = input.type === "password";
              input.type = isHidden2 ? "text" : "password";
              btn.setIcon(isHidden2 ? "eye-off" : "eye");
            }
          });
        });
      }
    }
    if (bedType === "\u963F\u91CC\u4E91 OSS" /* Aliyun */) {
      const aliyunBucketEl = content.createDiv({ cls: "pic-aliyun-bucket-section" });
      void this.autoFetchAliyunBuckets(aliyunBucketEl, config, statusSpan);
    }
    if (bedType === "\u817E\u8BAF\u4E91 COS" /* Tencent */) {
      const tencentBucketEl = content.createDiv({ cls: "pic-tencent-bucket-section" });
      void this.autoFetchTencentBuckets(tencentBucketEl, config, statusSpan);
    }
    if (bedType) {
      const testRow = content.createDiv({ cls: "pic-test-connection-row" });
      const testStatus = testRow.createSpan({ cls: "pic-test-status" });
      const testBtn = testRow.createEl("button", {
        text: "\u6D4B\u8BD5\u8FDE\u63A5",
        cls: "mod-cta"
      });
      testBtn.addEventListener("click", onAsyncClick(async () => {
        testStatus.textContent = "\u68C0\u6D4B\u4E2D...";
        testStatus.className = "pic-test-status pic-testing";
        try {
          const connResult = await this.plugin.testBedConnection(bedType);
          if (connResult.success) {
            testStatus.textContent = "\u5DF2\u8FDE\u63A5";
            testStatus.className = "pic-test-status pic-ok";
            this.bedTestResults[bedType] = true;
          } else {
            testStatus.textContent = connResult.error || "\u8FDE\u63A5\u5931\u8D25";
            testStatus.className = "pic-test-status pic-fail";
            this.bedTestResults[bedType] = false;
          }
        } catch {
          testStatus.textContent = "\u6D4B\u8BD5\u5F02\u5E38";
          testStatus.className = "pic-test-status pic-fail";
          this.bedTestResults[bedType] = false;
        }
        await this.saveBedTestResults();
        this.updateBedStatus(statusSpan, config);
      }));
    }
    this.renderGuide(content, config);
    header.addEventListener("click", () => {
      const isOpen = content.style.display !== "none";
      content.setCssStyles({ display: isOpen ? "none" : "" });
      arrow.textContent = isOpen ? "\u25B6" : "\u25BC";
    });
  }
  /** 更新图床配置状态指示器 */
  updateBedStatus(statusSpan, config) {
    const allFieldsFilled = config.fields.every((field) => {
      const value = this.plugin.settings[field.key];
      return value && typeof value === "string" && value.trim().length > 0;
    });
    const bedType = BED_NAME_TYPE_MAP[config.name];
    const testPassed = bedType ? this.bedTestResults[bedType] === true : false;
    if (allFieldsFilled && testPassed) {
      statusSpan.textContent = "\u5DF2\u8FDE\u63A5";
      statusSpan.className = "pic-bed-status pic-bed-status-configured";
    } else if (allFieldsFilled) {
      statusSpan.textContent = "\u5DF2\u914D\u7F6E";
      statusSpan.className = "pic-bed-status pic-bed-status-configured";
    } else {
      statusSpan.textContent = "\u672A\u914D\u7F6E";
      statusSpan.className = "pic-bed-status pic-bed-status-unconfigured";
    }
  }
  /** 重置图床连接测试状态（配置修改时调用） */
  async resetBedTestResult(bedType) {
    delete this.bedTestResults[bedType];
    await this.saveBedTestResults();
  }
  /** 持久化图床连接测试结果 */
  async saveBedTestResults() {
    const data = await this.plugin.loadData() || {};
    data._bedTestResults = this.bedTestResults;
    await this.plugin.saveData(data);
  }
  /** 测试 WebDAV 连接 */
  async testWebdavConnection() {
    const { webdavUrl, webdavUsername, webdavPassword } = this.plugin.settings;
    if (!webdavUrl || !webdavUsername || !webdavPassword) {
      return { success: false, error: "\u8BF7\u5148\u586B\u5199\u5B8C\u6574\u914D\u7F6E" };
    }
    if (!webdavUrl.startsWith("https://")) {
      return { success: false, error: "\u4EC5\u652F\u6301 HTTPS \u8FDE\u63A5" };
    }
    try {
      const auth = safeBtoa(`${webdavUsername}:${webdavPassword}`);
      const response = await directFetch(webdavUrl, {
        method: "PROPFIND",
        headers: {
          Authorization: `Basic ${auth}`,
          Depth: "0"
        }
      });
      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: `\u8FDE\u63A5\u5931\u8D25: HTTP ${response.status}` };
    } catch (e) {
      return { success: false, error: `\u8FDE\u63A5\u5931\u8D25: ${e}` };
    }
  }
  /** 渲染阿里云 Bucket 选择器 + Endpoint（测试成功后显示） */
  renderAliyunBucketSection(container, buckets, config, statusSpan) {
    container.empty();
    container.createDiv({ cls: "pic-setting-category-title", text: "\u5B58\u50A8\u6876\u914D\u7F6E" });
    if (buckets.length > 0) {
      const bucketSetting = new import_obsidian4.Setting(container).setName("Bucket").setDesc("\u9009\u62E9\u5B58\u50A8\u6876\uFF08\u81EA\u52A8\u83B7\u53D6\u5217\u8868\uFF09");
      const bucketControl = bucketSetting.controlEl;
      bucketControl.empty();
      const bucketSelect = bucketControl.createEl("select", { cls: "pic-bed-input" });
      bucketSelect.setCssStyles({ width: "180px" });
      for (const bucket of buckets) {
        bucketSelect.createEl("option", { value: bucket.name, text: bucket.name });
      }
      const currentBucket = this.plugin.settings.aliyunBucket;
      if (buckets.some((b) => b.name === currentBucket)) {
        bucketSelect.value = currentBucket;
      }
      const dirSetting = new import_obsidian4.Setting(container).setName("\u65B0\u5EFA\u6587\u4EF6\u5939").setDesc("\u5728\u5F53\u524D Bucket \u4E2D\u521B\u5EFA\u6587\u4EF6\u5939");
      const dirControl = dirSetting.controlEl;
      dirControl.empty();
      const dirInput = dirControl.createEl("input", {
        type: "text",
        cls: "pic-bed-input",
        attr: { placeholder: "\u6587\u4EF6\u5939\u540D" }
      });
      dirInput.setCssStyles({ width: "160px" });
      const dirBtn = dirControl.createEl("button", { cls: "pic-btn-sm", text: "\u521B\u5EFA" });
      dirBtn.setCssStyles({ marginLeft: "4px" });
      dirBtn.addEventListener("click", onAsyncClick(async () => {
        const dir = dirInput.value.trim().replace(/\/+$/, "");
        if (!dir) {
          new import_obsidian4.Notice("\u8BF7\u8F93\u5165\u6587\u4EF6\u5939\u540D");
          dirInput.focus();
          return;
        }
        const bucketName = bucketSelect.value;
        if (!bucketName) {
          new import_obsidian4.Notice("\u8BF7\u5148\u9009\u62E9 Bucket");
          return;
        }
        dirBtn.disabled = true;
        try {
          this.plugin.settings.aliyunBucket = bucketName;
          const selected = buckets.find((b) => b.name === bucketName);
          if (selected?.endpoint) this.plugin.settings.aliyunEndpoint = `https://${selected.endpoint}`;
          const bed = this.plugin.imageBedManager.get("\u963F\u91CC\u4E91 OSS" /* Aliyun */);
          if (bed) bed.configure(this.plugin.settings);
          const result = await this.plugin.createCloudDirectory(dir, "\u963F\u91CC\u4E91 OSS" /* Aliyun */);
          if (result.success) {
            new import_obsidian4.Notice(`\u6587\u4EF6\u5939\u5DF2\u521B\u5EFA: ${dir}`);
            dirInput.value = "";
          } else {
            new import_obsidian4.Notice(`\u521B\u5EFA\u5931\u8D25: ${result.error}`);
          }
        } catch (e) {
          new import_obsidian4.Notice(`\u521B\u5EFA\u5F02\u5E38: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          dirBtn.disabled = false;
        }
      }));
      dirInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") dirBtn.click();
      });
      let endpointInputEl = null;
      new import_obsidian4.Setting(container).setName("Endpoint").setDesc("\u9009\u62E9 Bucket \u540E\u81EA\u52A8\u586B\u5165").addText((text) => {
        text.inputEl.addClass("pic-bed-input");
        text.setValue(this.plugin.settings.aliyunEndpoint).setPlaceholder("https://oss-cn-hangzhou.aliyuncs.com").onChange((value) => {
          this.plugin.settings.aliyunEndpoint = value;
          this.debouncedSaveSettings();
          this.updateBedStatus(statusSpan, config);
        });
        endpointInputEl = text.inputEl;
      });
      bucketSelect.addEventListener("change", () => {
        const selected = buckets.find((b) => b.name === bucketSelect.value);
        if (selected?.endpoint && endpointInputEl) {
          const newEndpoint = `https://${selected.endpoint}`;
          this.plugin.settings.aliyunEndpoint = newEndpoint;
          endpointInputEl.value = newEndpoint;
        }
        this.plugin.settings.aliyunBucket = bucketSelect.value;
        this.debouncedSaveSettings();
        this.updateBedStatus(statusSpan, config);
      });
    } else {
      new import_obsidian4.Setting(container).setName("Endpoint").setDesc("\u65E0\u6CD5\u81EA\u52A8\u83B7\u53D6\uFF0C\u8BF7\u624B\u52A8\u586B\u5199").addText((text) => {
        text.inputEl.addClass("pic-bed-input");
        text.setValue(this.plugin.settings.aliyunEndpoint).setPlaceholder("https://oss-cn-hangzhou.aliyuncs.com").onChange((value) => {
          this.plugin.settings.aliyunEndpoint = value;
          this.debouncedSaveSettings();
          this.updateBedStatus(statusSpan, config);
        });
      });
    }
  }
  static {
    /** 阿里云：自动获取 Bucket 列表并渲染选择器 */
    /** 阿里云 Bucket 缓存（避免重复 API 调用） */
    this.aliyunBucketsCache = null;
  }
  static {
    this.aliyunBucketsCacheKey = "";
  }
  async autoFetchAliyunBuckets(container, config, statusSpan) {
    const settings = this.plugin.settings;
    this.renderAliyunBucketSection(container, [], config, statusSpan);
    if (settings.aliyunAccessKeyId && settings.aliyunAccessKeySecret) {
      try {
        const cacheKey = settings.aliyunAccessKeyId;
        if (_PicLinkerSettingTab.aliyunBucketsCache && _PicLinkerSettingTab.aliyunBucketsCacheKey === cacheKey) {
          const buckets = _PicLinkerSettingTab.aliyunBucketsCache;
          if (!settings.aliyunEndpoint && buckets[0]?.endpoint) {
            settings.aliyunEndpoint = `https://${buckets[0].endpoint}`;
          }
          this.renderAliyunBucketSection(container, buckets, config, statusSpan);
          return;
        }
        const bed = this.plugin.imageBedManager.get("\u963F\u91CC\u4E91 OSS" /* Aliyun */);
        if (bed && bed.listBuckets) {
          bed.configure(settings);
          const buckets = await bed.listBuckets();
          _PicLinkerSettingTab.aliyunBucketsCache = buckets;
          _PicLinkerSettingTab.aliyunBucketsCacheKey = cacheKey;
          if (buckets.length > 0) {
            if (!settings.aliyunEndpoint && buckets[0].endpoint) {
              settings.aliyunEndpoint = `https://${buckets[0].endpoint}`;
            }
            this.renderAliyunBucketSection(container, buckets, config, statusSpan);
          }
        }
      } catch (e) {
        console.warn("[PicLinker] \u83B7\u53D6 Bucket \u5217\u8868\u5931\u8D25:", e instanceof Error ? e.message : String(e));
      }
    }
  }
  static {
    /** 腾讯云 Bucket 缓存 */
    this.tencentBucketsCache = null;
  }
  static {
    this.tencentBucketsCacheKey = "";
  }
  /** 腾讯云：自动获取 Bucket 列表并渲染选择器 */
  async autoFetchTencentBuckets(container, config, statusSpan) {
    const settings = this.plugin.settings;
    this.renderTencentBucketSection(container, [], config, statusSpan);
    if (settings.tencentSecretId && settings.tencentSecretKey) {
      try {
        const cacheKey = settings.tencentSecretId;
        if (_PicLinkerSettingTab.tencentBucketsCache && _PicLinkerSettingTab.tencentBucketsCacheKey === cacheKey) {
          const buckets = _PicLinkerSettingTab.tencentBucketsCache;
          if (!settings.tencentRegion && buckets[0]?.endpoint) {
            settings.tencentRegion = buckets[0].endpoint;
          }
          this.renderTencentBucketSection(container, buckets, config, statusSpan);
          return;
        }
        const bed = this.plugin.imageBedManager.get("\u817E\u8BAF\u4E91 COS" /* Tencent */);
        if (bed && bed.listBuckets) {
          bed.configure(settings);
          const buckets = await bed.listBuckets();
          _PicLinkerSettingTab.tencentBucketsCache = buckets;
          _PicLinkerSettingTab.tencentBucketsCacheKey = cacheKey;
          if (buckets.length > 0) {
            if (!settings.tencentRegion && buckets[0].endpoint) {
              settings.tencentRegion = buckets[0].endpoint;
            }
            this.renderTencentBucketSection(container, buckets, config, statusSpan);
          }
        }
      } catch (e) {
        console.warn("[PicLinker] \u83B7\u53D6 Bucket \u5217\u8868\u5931\u8D25:", e instanceof Error ? e.message : String(e));
      }
    }
  }
  /** 渲染腾讯云 Bucket 选择器 + Region */
  renderTencentBucketSection(container, buckets, config, statusSpan) {
    container.empty();
    container.createDiv({ cls: "pic-setting-category-title", text: "\u5B58\u50A8\u6876\u914D\u7F6E" });
    if (buckets.length > 0) {
      const bucketSetting = new import_obsidian4.Setting(container).setName("Bucket").setDesc("\u9009\u62E9\u5B58\u50A8\u6876\uFF08\u81EA\u52A8\u83B7\u53D6\u5217\u8868\uFF09");
      const bucketControl = bucketSetting.controlEl;
      bucketControl.empty();
      const bucketSelect = bucketControl.createEl("select", { cls: "pic-bed-input" });
      bucketSelect.setCssStyles({ width: "220px" });
      for (const bucket of buckets) {
        bucketSelect.createEl("option", { value: bucket.name, text: bucket.name });
      }
      const currentBucket = this.plugin.settings.tencentBucket;
      if (buckets.some((b) => b.name === currentBucket)) {
        bucketSelect.value = currentBucket;
      }
      const dirSetting = new import_obsidian4.Setting(container).setName("\u65B0\u5EFA\u6587\u4EF6\u5939").setDesc("\u5728\u5F53\u524D Bucket \u4E2D\u521B\u5EFA\u6587\u4EF6\u5939");
      const dirControl = dirSetting.controlEl;
      dirControl.empty();
      const dirInput = dirControl.createEl("input", {
        type: "text",
        cls: "pic-bed-input",
        attr: { placeholder: "\u6587\u4EF6\u5939\u540D" }
      });
      dirInput.setCssStyles({ width: "160px" });
      const dirBtn = dirControl.createEl("button", { cls: "pic-btn-sm", text: "\u521B\u5EFA" });
      dirBtn.setCssStyles({ marginLeft: "4px" });
      dirBtn.addEventListener("click", onAsyncClick(async () => {
        const dir = dirInput.value.trim().replace(/\/+$/, "");
        if (!dir) {
          new import_obsidian4.Notice("\u8BF7\u8F93\u5165\u6587\u4EF6\u5939\u540D");
          dirInput.focus();
          return;
        }
        const bucketName = bucketSelect.value;
        if (!bucketName) {
          new import_obsidian4.Notice("\u8BF7\u5148\u9009\u62E9 Bucket");
          return;
        }
        dirBtn.disabled = true;
        try {
          this.plugin.settings.tencentBucket = bucketName;
          const selected = buckets.find((b) => b.name === bucketName);
          if (selected?.endpoint) this.plugin.settings.tencentRegion = selected.endpoint;
          const bed = this.plugin.imageBedManager.get("\u817E\u8BAF\u4E91 COS" /* Tencent */);
          if (bed) bed.configure(this.plugin.settings);
          const result = await this.plugin.createCloudDirectory(dir, "\u817E\u8BAF\u4E91 COS" /* Tencent */);
          if (result.success) {
            new import_obsidian4.Notice(`\u6587\u4EF6\u5939\u5DF2\u521B\u5EFA: ${dir}`);
            dirInput.value = "";
          } else {
            new import_obsidian4.Notice(`\u521B\u5EFA\u5931\u8D25: ${result.error}`);
          }
        } catch (e) {
          new import_obsidian4.Notice(`\u521B\u5EFA\u5F02\u5E38: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          dirBtn.disabled = false;
        }
      }));
      dirInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") dirBtn.click();
      });
      let regionInputEl = null;
      new import_obsidian4.Setting(container).setName("Region").setDesc("\u9009\u62E9 Bucket \u540E\u81EA\u52A8\u586B\u5165").addText((text) => {
        text.inputEl.addClass("pic-bed-input");
        text.setValue(this.plugin.settings.tencentRegion).setPlaceholder("ap-guangzhou").onChange((value) => {
          this.plugin.settings.tencentRegion = value;
          this.debouncedSaveSettings();
          this.updateBedStatus(statusSpan, config);
        });
        regionInputEl = text.inputEl;
      });
      bucketSelect.addEventListener("change", () => {
        const selected = buckets.find((b) => b.name === bucketSelect.value);
        if (selected?.endpoint && regionInputEl) {
          this.plugin.settings.tencentRegion = selected.endpoint;
          regionInputEl.value = selected.endpoint;
        }
        this.plugin.settings.tencentBucket = bucketSelect.value;
        this.debouncedSaveSettings();
        this.updateBedStatus(statusSpan, config);
      });
    } else {
      new import_obsidian4.Setting(container).setName("Bucket").setDesc("\u65E0\u6CD5\u81EA\u52A8\u83B7\u53D6\uFF0C\u8BF7\u624B\u52A8\u586B\u5199").addText((text) => {
        text.inputEl.addClass("pic-bed-input");
        text.setValue(this.plugin.settings.tencentBucket).setPlaceholder("bucket-1250000000").onChange((value) => {
          this.plugin.settings.tencentBucket = value;
          this.debouncedSaveSettings();
          this.updateBedStatus(statusSpan, config);
        });
      });
      new import_obsidian4.Setting(container).setName("Region").setDesc("\u65E0\u6CD5\u81EA\u52A8\u83B7\u53D6\uFF0C\u8BF7\u624B\u52A8\u586B\u5199").addText((text) => {
        text.inputEl.addClass("pic-bed-input");
        text.setValue(this.plugin.settings.tencentRegion).setPlaceholder("ap-guangzhou").onChange((value) => {
          this.plugin.settings.tencentRegion = value;
          this.debouncedSaveSettings();
          this.updateBedStatus(statusSpan, config);
        });
      });
    }
  }
  /** 渲染可折叠的配置指南 */
  renderGuide(container, config) {
    const guideWrapper = container.createDiv({ cls: "pic-guide-wrapper" });
    const guideHeader = guideWrapper.createDiv({ cls: "pic-guide-header" });
    guideHeader.createSpan({ cls: "pic-guide-icon", text: "\u{1F4D6}" });
    guideHeader.createSpan({ text: "\u914D\u7F6E\u6307\u5357" });
    const guideArrow = guideHeader.createSpan({ cls: "pic-guide-arrow", text: "\u25B6" });
    const guideContent = guideWrapper.createDiv({ cls: "pic-guide-content" });
    guideContent.setCssStyles({ display: "none" });
    const formattedGuide = this.formatGuideContent(config.guide);
    setSafeHTML(guideContent, formattedGuide);
    guideHeader.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        return;
      }
      e.stopPropagation();
      const isOpen = guideContent.style.display !== "none";
      guideContent.setCssStyles({ display: isOpen ? "none" : "" });
      guideArrow.textContent = isOpen ? "\u25B6" : "\u25BC";
    });
    guideContent.addEventListener("click", (e) => {
      const target = e.target;
      if (target.tagName === "A") {
        e.preventDefault();
        e.stopPropagation();
        const url = target.getAttribute("href");
        if (url) {
          window.open(url, "_blank");
        }
      }
    });
  }
  /** 格式化指南内容为 HTML */
  formatGuideContent(guide) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return guide.split("\n").map((line) => {
      if (line.match(/^【.+】$/)) {
        return `<div class="pic-guide-section-title">${escapeHtml(line)}</div>`;
      }
      if (line.match(/^\d+\./)) {
        const linkedLine2 = escapeHtml(line).replace(urlRegex, (url) => {
          return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
        });
        return `<div class="pic-guide-step">${linkedLine2}</div>`;
      }
      if (line.trim() === "") {
        return `<div class="pic-guide-spacer"></div>`;
      }
      const linkedLine = escapeHtml(line).replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
      });
      return `<div class="pic-guide-text">${linkedLine}</div>`;
    }).join("");
  }
};

// src/view/PicLinkerView.ts
var import_obsidian8 = require("obsidian");

// src/parser/LinkParser.ts
var MD_IMAGE_REGEX = /!\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
var WIKI_IMAGE_REGEX = /!?\[\[([^\]|]+?)(?:\|([^\]]*))?]]/g;
var HTML_IMG_REGEX = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
var LinkParser = class {
  /**
   * 解析文本中的所有图片链接（跳过代码块）
   */
  parse(content) {
    const links = [];
    const codeRanges = this.getCodeBlockRanges(content);
    MD_IMAGE_REGEX.lastIndex = 0;
    let match;
    while ((match = MD_IMAGE_REGEX.exec(content)) !== null) {
      if (this.isInCodeBlock(match.index, codeRanges)) continue;
      const linkContent = match[2];
      const link = this.parseLinkContent(linkContent, match[0], match.index, content);
      if (link) {
        links.push(link);
      }
    }
    WIKI_IMAGE_REGEX.lastIndex = 0;
    while ((match = WIKI_IMAGE_REGEX.exec(content)) !== null) {
      if (this.isInCodeBlock(match.index, codeRanges)) continue;
      const pure = match[1].trim();
      const params = match[2]?.trim() || "";
      if (!pure) continue;
      const ext = pure.split(".").pop()?.toLowerCase() || "";
      if (!IMAGE_EXTENSIONS.has(ext)) continue;
      const type = this.detectLinkType(pure);
      const line = this.getLineNumber(content, match.index);
      links.push({
        raw: match[0],
        pure,
        params,
        type,
        count: 0,
        files: [],
        line
      });
    }
    HTML_IMG_REGEX.lastIndex = 0;
    while ((match = HTML_IMG_REGEX.exec(content)) !== null) {
      if (this.isInCodeBlock(match.index, codeRanges)) continue;
      const pure = match[1].trim();
      if (!pure) continue;
      const type = this.detectLinkType(pure);
      const line = this.getLineNumber(content, match.index);
      links.push({
        raw: match[0],
        pure,
        params: "",
        type,
        count: 0,
        files: [],
        line
      });
    }
    return links;
  }
  /**
   * 获取所有代码块的范围（围栏代码块 + 行内代码）
   */
  getCodeBlockRanges(content) {
    const ranges = [];
    const fenceRegex = /(^|\n)(```|~~~)/g;
    let fenceMatch;
    let fenceStart = -1;
    let fenceChar = "";
    while ((fenceMatch = fenceRegex.exec(content)) !== null) {
      if (fenceStart === -1) {
        fenceStart = fenceMatch.index + fenceMatch[1].length;
        fenceChar = fenceMatch[2][0];
      } else if (fenceMatch[2][0] === fenceChar) {
        ranges.push([fenceStart, fenceMatch.index + fenceMatch[0].length]);
        fenceStart = -1;
        fenceChar = "";
      }
    }
    const inlineRegex = new RegExp("(`+)([\\s\\S]+?)\\1", "g");
    let inlineMatch;
    while ((inlineMatch = inlineRegex.exec(content)) !== null) {
      ranges.push([inlineMatch.index, inlineMatch.index + inlineMatch[0].length]);
    }
    return ranges;
  }
  /**
   * 判断偏移量是否在代码块范围内
   */
  isInCodeBlock(offset, ranges) {
    for (const [start, end] of ranges) {
      if (offset >= start && offset < end) return true;
    }
    return false;
  }
  /**
   * 解析 Markdown 链接内容，拆分 pure 和 params
   */
  parseLinkContent(linkContent, fullMatch, matchIndex, content) {
    const titleMatch = linkContent.match(/^(.+?)\s+"([^"]*)"$/);
    let pure;
    let params;
    if (titleMatch) {
      pure = titleMatch[1].trim();
      params = "";
    } else {
      const pipeIndex = linkContent.indexOf("|");
      if (pipeIndex === -1) {
        pure = linkContent;
        params = "";
      } else {
        pure = linkContent.substring(0, pipeIndex).trim();
        params = linkContent.substring(pipeIndex + 1).trim();
      }
    }
    if (!pure) return null;
    const type = this.detectLinkType(pure);
    return {
      raw: fullMatch,
      pure,
      params,
      type,
      count: 0,
      files: [],
      line: this.getLineNumber(content, matchIndex)
    };
  }
  /**
   * 检测链接类型
   */
  detectLinkType(pure) {
    if (pure.startsWith("https://")) return "https";
    if (pure.startsWith("http://")) return "http";
    if (pure.startsWith("//")) return "http";
    return "local";
  }
  /**
   * 根据 offset 计算行号（1-based）
   */
  getLineNumber(content, offset) {
    return content.substring(0, offset).split("\n").length;
  }
};

// src/utils/nodeCrypto.ts
function hasNodeRequire() {
  return typeof window !== "undefined" && "require" in window;
}
function getNodeCrypto() {
  const w = window;
  return w.require("crypto");
}

// src/utils/HashCache.ts
var MAX_CACHE_SIZE = 1e4;
var HashCache = class {
  constructor(serialized) {
    this.cache = /* @__PURE__ */ new Map();
    this.dirty = false;
    if (serialized) {
      try {
        const data = JSON.parse(serialized);
        if (Array.isArray(data)) {
          for (const entry of data) {
            if (entry.hash && entry.url) {
              this.cache.set(entry.hash, entry);
            }
          }
        }
      } catch (e) {
        console.warn("[PicLinker] HashCache \u6570\u636E\u635F\u574F\uFF0C\u5DF2\u6E05\u7A7A\u91CD\u5EFA", e);
      }
    }
  }
  /**
   * 计算文件/Blob 的 SHA-256 哈希
   * - 桌面端（Electron）：使用 Node.js crypto 模块
   * - 移动端：使用 Web Crypto API
   */
  static async computeHash(file) {
    const buffer = await file.arrayBuffer();
    if (hasNodeRequire()) {
      const nodeCrypto = getNodeCrypto();
      const hash = nodeCrypto.createHash("sha256");
      hash.update(Buffer.from(buffer));
      return hash.digest("hex");
    }
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /**
   * 查询哈希缓存（LRU：更新访问顺序）
   */
  get(hash) {
    const entry = this.cache.get(hash);
    if (entry) {
      this.cache.delete(hash);
      this.cache.set(hash, entry);
    }
    return entry;
  }
  /**
   * 记录哈希缓存
   */
  set(hash, entry) {
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(hash)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(hash, { ...entry, uploadedAt: Date.now() });
    this.dirty = true;
  }
  /**
   * 序列化用于持久化存储
   */
  serialize() {
    return JSON.stringify(Array.from(this.cache.values()));
  }
  /**
   * 是否有未保存的更改
   */
  isDirty() {
    return this.dirty;
  }
  /**
   * 标记为已保存
   */
  markClean() {
    this.dirty = false;
  }
  /** 缓存中的条目数量 */
  get size() {
    return this.cache.size;
  }
};

// src/view/ImagePreview.ts
function showImagePreview(src) {
  const overlay = activeDocument.createElement("div");
  overlay.className = "pic-preview-overlay";
  const img = activeDocument.createElement("img");
  img.className = "pic-preview-img";
  img.src = src;
  let scale = 1;
  const close = () => {
    overlay.remove();
    activeDocument.removeEventListener("keydown", onKeyDown);
  };
  overlay.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = e.deltaY < 0 ? Math.min(scale * 1.15, 10) : Math.max(scale / 1.15, 0.1);
    img.setCssStyles({ transform: `scale(${scale})` });
  });
  img.addEventListener("click", (e) => e.stopPropagation());
  img.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    scale = 1;
    img.setCssStyles({ transform: "scale(1)" });
  });
  overlay.addEventListener("click", close);
  const onKeyDown = (e) => {
    if (e.key === "Escape") close();
  };
  activeDocument.addEventListener("keydown", onKeyDown);
  overlay.appendChild(img);
  activeDocument.body.appendChild(overlay);
}

// src/view/SelectionManager.ts
var SelectionSection = /* @__PURE__ */ ((SelectionSection2) => {
  SelectionSection2["LocalImages"] = "localImages";
  SelectionSection2["CloudImages"] = "cloudImages";
  SelectionSection2["LocalUnref"] = "localUnref";
  SelectionSection2["CloudFiles"] = "cloudFiles";
  SelectionSection2["NotFound"] = "notFound";
  SelectionSection2["Dedup"] = "dedup";
  SelectionSection2["SameName"] = "sameName";
  SelectionSection2["EmptyFolders"] = "emptyFolders";
  SelectionSection2["LocalTags"] = "localTags";
  SelectionSection2["CloudTags"] = "cloudTags";
  SelectionSection2["SameNameTags"] = "sameNameTags";
  SelectionSection2["DedupTags"] = "dedupTags";
  return SelectionSection2;
})(SelectionSection || {});
var SelectionManager = class {
  constructor() {
    this.selections = /* @__PURE__ */ new Map();
    this.onChangeCallbacks = [];
    for (const section of Object.values(SelectionSection)) {
      this.selections.set(section, /* @__PURE__ */ new Set());
    }
  }
  /** 注册选中变化回调 */
  onChange(callback) {
    this.onChangeCallbacks.push(callback);
  }
  /** 移除选中变化回调 */
  off(callback) {
    this.onChangeCallbacks = this.onChangeCallbacks.filter((cb) => cb !== callback);
  }
  /** 触发变化通知 */
  notify(section) {
    for (const cb of this.onChangeCallbacks) cb(section);
  }
  /** 切换选中状态 */
  toggle(section, key) {
    const set = this.selections.get(section);
    if (set.has(key)) {
      set.delete(key);
    } else {
      set.add(key);
    }
    this.notify(section);
  }
  /** 批量选中 */
  select(section, keys) {
    const set = this.selections.get(section);
    for (const key of keys) {
      set.add(key);
    }
    this.notify(section);
  }
  /** 取消选中 */
  deselect(section, key) {
    this.selections.get(section)?.delete(key);
    this.notify(section);
  }
  /** 清空指定 section */
  clear(section) {
    this.selections.get(section)?.clear();
    this.notify(section);
  }
  /** 清空所有 section */
  clearAll() {
    for (const set of this.selections.values()) {
      set.clear();
    }
  }
  /** 是否已选中 */
  isSelected(section, key) {
    return this.selections.get(section)?.has(key) ?? false;
  }
  /** 获取选中的 key 列表 */
  getSelected(section) {
    return [...this.selections.get(section) ?? []];
  }
  /** 获取选中数量 */
  getCount(section) {
    return this.selections.get(section)?.size ?? 0;
  }
  /** 获取指定 section 的选中集（用于批量操作需要 Set 的场景） */
  getSet(section) {
    return this.selections.get(section) ?? /* @__PURE__ */ new Set();
  }
  /** 检查是否有任何 section 有选中项 */
  hasAnySelection() {
    for (const set of this.selections.values()) {
      if (set.size > 0) return true;
    }
    return false;
  }
};

// src/view/DedupService.ts
var DedupService = class {
  constructor(app, getStorageKey) {
    this.app = app;
    this.getStorageKey = getStorageKey;
  }
  // ==================== 去重结果 ====================
  saveDedupGroups(groups) {
    try {
      const serialized = groups.map((group) => ({
        hash: group.hash,
        type: group.type,
        items: group.items.map((item) => ({
          path: item.path,
          source: item.source,
          bedType: item.bedType,
          referenced: item.referenced
        }))
      }));
      this.app.saveLocalStorage(this.getStorageKey("dedupGroups"), JSON.stringify(serialized));
    } catch (e) {
      console.warn("[PicLinker] \u4FDD\u5B58\u53BB\u91CD\u6570\u636E\u5931\u8D25", e);
    }
  }
  loadDedupGroups() {
    try {
      const raw = this.app.loadLocalStorage(this.getStorageKey("dedupGroups"));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((group) => ({
        hash: group.hash,
        type: group.type,
        items: group.items.filter((item) => item.path !== void 0 && typeof item.path === "string" && !item.path.endsWith("/")).map((item) => ({
          path: item.path,
          source: item.source,
          bedType: item.bedType,
          referenced: item.referenced
        }))
      })).filter((group) => group.items.length >= 2);
    } catch (e) {
      console.warn("[PicLinker] \u52A0\u8F7D\u53BB\u91CD\u6570\u636E\u5931\u8D25\uFF0C\u5DF2\u91CD\u7F6E", e);
      return [];
    }
  }
  clearDedupGroups() {
    this.app.saveLocalStorage(this.getStorageKey("dedupGroups"), null);
  }
  // ==================== 同名文件 ====================
  saveSameNameData(groups) {
    try {
      this.app.saveLocalStorage(this.getStorageKey("sameName"), JSON.stringify(groups));
    } catch (e) {
      console.warn("[PicLinker] \u4FDD\u5B58\u540C\u540D\u6587\u4EF6\u6570\u636E\u5931\u8D25", e);
    }
  }
  loadSameNameData() {
    try {
      const raw = this.app.loadLocalStorage(this.getStorageKey("sameName"));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("[PicLinker] \u52A0\u8F7D\u540C\u540D\u6587\u4EF6\u6570\u636E\u5931\u8D25\uFF0C\u5DF2\u91CD\u7F6E", e);
      return [];
    }
  }
  clearSameNameData() {
    this.app.saveLocalStorage(this.getStorageKey("sameName"), null);
  }
  // ==================== 空白文件夹 ====================
  saveEmptyFoldersCleared(value) {
    if (value) {
      this.app.saveLocalStorage(this.getStorageKey("emptyFoldersCleared"), "true");
    } else {
      this.app.saveLocalStorage(this.getStorageKey("emptyFoldersCleared"), null);
    }
  }
  loadEmptyFoldersCleared() {
    return this.app.loadLocalStorage(this.getStorageKey("emptyFoldersCleared")) === "true";
  }
  // ==================== 展开状态 ====================
  saveExpandState(sectionExpanded, dirExpanded) {
    try {
      this.app.saveLocalStorage(this.getStorageKey("sectionExpanded"), JSON.stringify([...sectionExpanded]));
      this.app.saveLocalStorage(this.getStorageKey("dirExpanded"), JSON.stringify([...dirExpanded]));
    } catch (e) {
      console.warn("[PicLinker] \u4FDD\u5B58\u5C55\u5F00\u72B6\u6001\u5931\u8D25", e);
    }
  }
  loadExpandState() {
    return {
      sectionExpanded: this.safeParseArray(this.getStorageKey("sectionExpanded")),
      dirExpanded: this.safeParseArray(this.getStorageKey("dirExpanded"))
    };
  }
  safeParseArray(key) {
    try {
      const raw = this.app.loadLocalStorage(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("[PicLinker] \u52A0\u8F7D\u5C55\u5F00\u72B6\u6001\u6570\u636E\u5931\u8D25\uFF0C\u5DF2\u91CD\u7F6E", e);
      return [];
    }
  }
};

// src/view/components/TreeRenderer.ts
var TreeRenderer = class {
  constructor(context) {
    this.context = context;
  }
  /** 从扁平路径列表构建树 */
  buildTree(items, getPath) {
    const root = { files: [], children: /* @__PURE__ */ new Map() };
    for (const item of items) {
      const path = getPath(item);
      const parts = path.split("/");
      if (parts.length === 1) {
        root.files.push(item);
      } else {
        let current = root;
        for (let i = 0; i < parts.length - 1; i++) {
          const dir = parts[i];
          if (!current.children.has(dir)) {
            current.children.set(dir, { files: [], children: /* @__PURE__ */ new Map() });
          }
          current = current.children.get(dir);
        }
        current.files.push(item);
      }
    }
    return root;
  }
  /** 收集树节点及所有子节点的文件 */
  collectTreeFiles(node) {
    const result = [...node.files];
    for (const child of node.children.values()) {
      result.push(...this.collectTreeFiles(child));
    }
    return result;
  }
  /** 通用树节点渲染 */
  renderTreeNodeGeneric(container, node, depth, config, selectedSet, breadcrumb = "") {
    const { searchKeyword, dirExpanded, saveExpandState, updateLocalActions, updateLocalUnrefActions, updateParentDirCheckboxes } = this.context;
    if (node.files.length > 0) {
      const isRoot = depth === 0;
      if (isRoot) {
        const dirKey = breadcrumb || "__root__";
        const expanded = !!searchKeyword || dirExpanded.has(dirKey);
        const dirHeader = container.createDiv({ cls: "pic-dir-header" });
        dirHeader.setCssStyles({ paddingLeft: `${10 + depth * 16}px` });
        dirHeader.dataset.depth = String(depth);
        dirHeader.dataset.dirKey = dirKey;
        let arrowEl = null;
        if (selectedSet) {
          const dirCb = dirHeader.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
          const allKeys = this.collectTreeFiles(node).map(config.getKey);
          dirCb.checked = allKeys.length > 0 && allKeys.every((k) => selectedSet.has(k));
          dirCb.addEventListener("click", (e) => e.stopPropagation());
          dirCb.addEventListener("change", () => {
            for (const k of allKeys) {
              if (dirCb.checked) selectedSet.add(k);
              else selectedSet.delete(k);
            }
            if (dirContent.style.display === "none") {
              dirContent.setCssStyles({ display: "" });
              if (arrowEl) arrowEl.textContent = "\u25BD";
              dirExpanded.add(dirKey);
              saveExpandState();
            }
            const forceRender = (el) => {
              el.querySelectorAll(".pic-dir-content").forEach((child) => {
                ensureLazyRendered(child);
              });
            };
            forceRender(dirContent);
            const syncNested = (el) => {
              el.querySelectorAll(".pic-cloud-checkbox").forEach((cb) => {
                cb.checked = dirCb.checked;
              });
              el.querySelectorAll(".pic-dir-content").forEach((childContent) => syncNested(childContent));
            };
            syncNested(dirContent);
            updateLocalUnrefActions();
            updateLocalActions();
            updateParentDirCheckboxes();
          });
        }
        const arrow = dirHeader.createSpan({ cls: "pic-dir-arrow", text: expanded ? "\u25BD" : "\u25B6" });
        arrowEl = arrow;
        const iconSpan = dirHeader.createSpan({ cls: "pic-dir-icon" });
        setSafeHTML(iconSpan, `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`);
        dirHeader.createSpan({ cls: "pic-dir-name", text: "\u6839\u76EE\u5F55" });
        dirHeader.createSpan({ cls: "pic-dir-count", text: `(${node.files.length})` });
        const dirContent = container.createDiv({ cls: "pic-dir-content" });
        if (!expanded) dirContent.setCssStyles({ display: "none" });
        dirHeader.addEventListener("click", () => {
          const isCollapsed = dirContent.style.display === "none";
          dirContent.setCssStyles({ display: isCollapsed ? "" : "none" });
          arrow.textContent = isCollapsed ? "\u25BD" : "\u25B6";
          if (isCollapsed) {
            dirExpanded.add(dirKey);
            saveExpandState();
          } else {
            dirExpanded.delete(dirKey);
            saveExpandState();
          }
        });
        for (const item of node.files) {
          config.renderItem(dirContent, item, selectedSet);
        }
      } else {
        for (const item of node.files) {
          config.renderItem(container, item, selectedSet);
        }
      }
    }
    const sortedChildren = Array.from(node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [dirName, childNode] of sortedChildren) {
      const allFiles = this.collectTreeFiles(childNode);
      const childBreadcrumb = breadcrumb ? `${breadcrumb} / ${dirName}` : dirName;
      const dirKey = childBreadcrumb;
      const expanded = !!searchKeyword || dirExpanded.has(dirKey);
      const dirHeader = container.createDiv({ cls: "pic-dir-header" });
      dirHeader.setCssStyles({ paddingLeft: `${10 + depth * 16}px` });
      dirHeader.dataset.depth = String(depth);
      dirHeader.dataset.dirKey = dirKey;
      let arrowEl = null;
      if (selectedSet) {
        const dirCb = dirHeader.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
        const allKeys = allFiles.map(config.getKey);
        dirCb.checked = allKeys.length > 0 && allKeys.every((k) => selectedSet.has(k));
        dirCb.addEventListener("click", (e) => e.stopPropagation());
        dirCb.addEventListener("change", () => {
          for (const k of allKeys) {
            if (dirCb.checked) selectedSet.add(k);
            else selectedSet.delete(k);
          }
          if (dirContent.style.display === "none") {
            dirContent.setCssStyles({ display: "" });
            if (arrowEl) arrowEl.textContent = "\u25BD";
            dirExpanded.add(dirKey);
            saveExpandState();
          }
          dirContent.querySelectorAll(".pic-dir-content").forEach((child) => {
            ensureLazyRendered(child);
          });
          dirContent.querySelectorAll(".pic-cloud-checkbox").forEach((cb) => {
            cb.checked = dirCb.checked;
          });
          updateLocalUnrefActions();
          updateLocalActions();
          updateParentDirCheckboxes();
        });
      }
      const arrow = dirHeader.createSpan({ cls: "pic-dir-arrow", text: expanded ? "\u25BD" : "\u25B6" });
      arrowEl = arrow;
      const iconSpan = dirHeader.createSpan({ cls: "pic-dir-icon" });
      setSafeHTML(iconSpan, `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`);
      dirHeader.createSpan({ cls: "pic-dir-name", text: dirName });
      dirHeader.createSpan({ cls: "pic-dir-count", text: `(${allFiles.length})` });
      const dirContent = container.createDiv({ cls: "pic-dir-content" });
      if (!expanded) dirContent.setCssStyles({ display: "none" });
      dirHeader.addEventListener("click", () => {
        const isCollapsed = dirContent.style.display === "none";
        dirContent.setCssStyles({ display: isCollapsed ? "" : "none" });
        arrow.textContent = isCollapsed ? "\u25BD" : "\u25B6";
        if (isCollapsed) {
          dirExpanded.add(dirKey);
        } else {
          dirExpanded.delete(dirKey);
        }
        saveExpandState();
      });
      this.renderTreeNodeGeneric(dirContent, childNode, depth + 1, config, selectedSet, childBreadcrumb);
    }
  }
  /** 创建可折叠分区 */
  createCollapsibleSection(parent, sectionKey, iconSvg, title, count, selectionSection) {
    const { searchKeyword, sectionExpanded, saveExpandState, dirExpanded } = this.context;
    let expanded;
    if (searchKeyword) {
      expanded = count > 0;
    } else {
      expanded = count > 0 && !sectionExpanded.has(`!${sectionKey}`);
    }
    const header = parent.createDiv({ cls: "pic-part-header" });
    header.dataset.breadcrumb = title;
    const left = header.createDiv({ cls: "pic-part-left" });
    const icon = left.createSpan({ cls: "pic-part-icon" });
    setSafeHTML(icon, iconSvg);
    const arrow = left.createSpan({ cls: "pic-part-arrow", text: expanded ? "\u25BD" : "\u25B6" });
    left.createSpan({ text: title, cls: "pic-part-title" });
    left.createSpan({ text: `${count} \u4E2A`, cls: "pic-part-count" });
    if (selectionSection !== void 0) {
      header.dataset.selectionSection = String(selectionSection);
      header.createDiv({ cls: "pic-part-actions" });
    }
    const content = parent.createDiv({ cls: "pic-part-content", attr: { "data-section-key": sectionKey } });
    if (!expanded) content.setCssStyles({ display: "none" });
    setLazyRendered(content, expanded);
    header.addEventListener("click", () => {
      const isCollapsed = content.style.display === "none";
      content.setCssStyles({ display: isCollapsed ? "" : "none" });
      arrow.textContent = isCollapsed ? "\u25BD" : "\u25B6";
      const actionsEl = header.querySelector(".pic-part-actions");
      if (actionsEl) actionsEl.setCssStyles({ display: isCollapsed ? "" : "none" });
      if (isCollapsed) {
        sectionExpanded.delete(`!${sectionKey}`);
        content.querySelectorAll(".pic-dir-header[data-dir-key]").forEach((h) => {
          const dirKey = h.dataset.dirKey;
          if (!dirKey) return;
          const dirContent = h.nextElementSibling;
          const arrow2 = h.querySelector(".pic-dir-arrow");
          const isDirExpanded = dirExpanded.has(dirKey);
          if (dirContent) dirContent.setCssStyles({ display: isDirExpanded ? "" : "none" });
          if (arrow2) arrow2.textContent = isDirExpanded ? "\u25BD" : "\u25B6";
        });
        saveExpandState();
        ensureLazyRendered(content);
        header.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        if (!searchKeyword) {
          sectionExpanded.add(`!${sectionKey}`);
          content.querySelectorAll(".pic-dir-content").forEach((d) => {
            d.setCssStyles({ display: "none" });
          });
          content.querySelectorAll(".pic-dir-arrow").forEach((a) => {
            a.textContent = "\u25B6";
          });
          saveExpandState();
        }
      }
    });
    return { header, content, expanded };
  }
};

// src/view/components/ItemRenderer.ts
var import_obsidian5 = require("obsidian");
var ItemRenderer = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  /** 渲染本地引用图片条目 */
  renderLocalItem(container, img, selectedSet) {
    const { selection, app, copyImagePath, updateLocalActions, updateParentDirCheckboxes } = this.ctx;
    const item = container.createDiv({ cls: "pic-item" });
    if (selectedSet) {
      item.addEventListener("click", (e) => {
        const target = e.target;
        if (target.closest("input, img, .pic-file-tag, button")) return;
        if (item._ignoreNextClick) return;
        const isSelected = selectedSet.has(img.pure);
        if (isSelected) {
          selectedSet.delete(img.pure);
          selection.deselect("localImages" /* LocalImages */, img.pure);
        } else {
          selectedSet.add(img.pure);
          selection.select("localImages" /* LocalImages */, [img.pure]);
        }
        const cb = item.querySelector(".pic-cloud-checkbox");
        if (cb) cb.checked = !isSelected;
        item.setCssStyles({ backgroundColor: !isSelected ? "var(--background-modifier-hover)" : "" });
        updateLocalActions();
        updateParentDirCheckboxes();
      });
    }
    item.addEventListener("dblclick", (e) => {
      const target = e.target;
      if (target.closest("input, img, .pic-file-tag, button")) return;
      e.stopPropagation();
      const fileName = extractFileName(img.resolvedPath || img.pure);
      if (fileName) {
        navigator.clipboard.writeText(fileName).then(
          () => new import_obsidian5.Notice(`\u5DF2\u590D\u5236\u6587\u4EF6\u540D: ${fileName}`),
          () => new import_obsidian5.Notice("\u590D\u5236\u5931\u8D25")
        );
      }
    });
    if (selectedSet) {
      const checkbox = item.createEl("input", {
        type: "checkbox",
        cls: "pic-cloud-checkbox"
      });
      checkbox.checked = selectedSet.has(img.pure);
      checkbox.addEventListener("click", (e) => e.stopPropagation());
      checkbox.addEventListener("change", (e) => {
        e.stopPropagation();
        ignoreNextClick(item);
        if (checkbox.checked) {
          selectedSet.add(img.pure);
          selection.select("localImages" /* LocalImages */, [img.pure]);
        } else {
          selectedSet.delete(img.pure);
          selection.deselect("localImages" /* LocalImages */, img.pure);
        }
        item.setCssStyles({ backgroundColor: checkbox.checked ? "var(--background-modifier-hover)" : "" });
        updateLocalActions();
        updateParentDirCheckboxes();
      });
    }
    const resolvedPath = img.resolvedPath || img.pure;
    const ext = resolvedPath.split(".").pop()?.toLowerCase() || "";
    const isImage = IMAGE_EXTENSIONS.has(ext);
    if (isImage) {
      let thumbSrc;
      if (img.type === "local") {
        const file = app.vault.getAbstractFileByPath(resolvedPath);
        if (file instanceof import_obsidian5.TFile) {
          thumbSrc = app.vault.getResourcePath(file);
        }
      } else {
        thumbSrc = img.pure;
      }
      if (thumbSrc) {
        const thumb = item.createEl("img", {
          cls: "pic-thumb pic-thumb-clickable",
          attr: { src: thumbSrc, loading: "lazy" }
        });
        thumb.addEventListener("error", () => {
          thumb.setCssStyles({ display: "none" });
        });
        thumb.addEventListener("click", (e) => {
          e.stopPropagation();
          showImagePreview(thumbSrc);
        });
      }
    }
    let displayPath = img.resolvedPath || img.pure;
    if (img.type !== "local") {
      try {
        displayPath = new URL(img.pure).pathname.slice(1);
      } catch {
      }
    }
    const shortPath = formatDisplayPath(displayPath);
    const pathSpan = item.createSpan({ cls: "pic-path", text: shortPath, title: "\u53CC\u51FB\u590D\u5236\u5B8C\u6574\u8DEF\u5F84" });
    pathSpan.classList.add("clickable");
    item.dataset.purePath = img.pure;
    pathSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      copyImagePath(img);
    });
    this.renderTags(item, img, "localTags" /* LocalTags */, img.pure);
    const actions = item.createDiv({ cls: "pic-actions" });
    const deleteBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u6587\u4EF6\u5E76\u6E05\u7406\u5F15\u7528" } });
    deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
      e.stopPropagation();
      if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5220\u9664 "${img.pure}" \u5417\uFF1F
\u5C06\u540C\u65F6\u6E05\u7406\u7B14\u8BB0\u4E2D\u7684\u5F15\u7528\u884C\u3002` })) return;
      for (const fp of img.files) {
        await this.ctx.removeImageFromMdFile(fp, [img.pure]);
      }
      const filePath = img.resolvedPath || img.pure;
      const file = app.vault.getAbstractFileByPath(filePath);
      if (file instanceof import_obsidian5.TFile) {
        await app.fileManager.trashFile(file);
        new import_obsidian5.Notice(`\u5DF2\u5220\u9664: ${extractFileName(filePath) || filePath}`);
      }
      selection.deselect("localImages" /* LocalImages */, img.pure);
      for (const tagKey of selection.getSelected("localTags" /* LocalTags */)) {
        if (tagKey.startsWith(img.pure + "::")) selection.deselect("localTags" /* LocalTags */, tagKey);
      }
      await this.ctx.refresh();
    }));
  }
  /** 渲染引用标签 */
  renderTags(container, img, section, keyPrefix) {
    const { selection, jumpToFile } = this.ctx;
    const expandedRefs = expandRefs(img);
    if (expandedRefs.length === 0) return;
    for (let i = 0; i < expandedRefs.length; i++) {
      const ref = expandedRefs[i];
      const tagKey = `${keyPrefix}::${i}`;
      const isSelected = selection.isSelected(section, tagKey);
      const fileName = ref.file.split("/").pop() || ref.file;
      const tagText = ref.line > 0 ? `${fileName}:${ref.line}` : fileName;
      const tag = container.createSpan({
        cls: `pic-file-tag${isSelected ? " pic-file-tag-focus" : ""}`,
        text: tagText
      });
      tag.dataset.tagRef = tagText;
      tag.title = isSelected ? `\u518D\u6B21\u5355\u51FB\u8DF3\u8F6C\u5230 ${ref.file}:${ref.line}` : `\u5355\u51FB\u9009\u4E2D`;
      tag.classList.add("clickable");
      tag.addEventListener("click", (e) => {
        e.stopPropagation();
        if (selection.isSelected(section, tagKey)) {
          jumpToFile(img, ref.file, ref.line);
        } else {
          selection.select(section, [tagKey]);
          tag.classList.add("pic-file-tag-focus");
          tag.title = `\u518D\u6B21\u5355\u51FB\u8DF3\u8F6C\u5230 ${ref.file}:${ref.line}`;
        }
      });
    }
  }
  /** 云端引用图片项 */
  renderCloudReferencedItem(container, img, selectedSet) {
    const { selection, copyImagePath, deleteCloudFile, removeImageFromMdFile, updateLocalActions, updateParentDirCheckboxes } = this.ctx;
    const item = container.createDiv({ cls: "pic-item" });
    if (selectedSet) {
      item.addEventListener("click", (e) => {
        const target = e.target;
        if (target.closest("input, img, button")) return;
        if (item._ignoreNextClick) return;
        const isSelected = selectedSet.has(img.pure);
        if (isSelected) {
          selectedSet.delete(img.pure);
          selection.deselect("cloudImages" /* CloudImages */, img.pure);
        } else {
          selectedSet.add(img.pure);
          selection.select("cloudImages" /* CloudImages */, [img.pure]);
        }
        const cb = item.querySelector(".pic-cloud-checkbox");
        if (cb) cb.checked = !isSelected;
        item.setCssStyles({ backgroundColor: !isSelected ? "var(--background-modifier-hover)" : "" });
        updateLocalActions();
        updateParentDirCheckboxes();
      });
    }
    item.addEventListener("dblclick", (e) => {
      const target = e.target;
      if (target.closest("input, img, button")) return;
      e.stopPropagation();
      const fileName = extractFileName(img.pure);
      if (fileName) {
        navigator.clipboard.writeText(fileName).then(
          () => new import_obsidian5.Notice(`\u5DF2\u590D\u5236\u6587\u4EF6\u540D: ${fileName}`),
          () => new import_obsidian5.Notice("\u590D\u5236\u5931\u8D25")
        );
      }
    });
    if (selectedSet) {
      const checkbox = item.createEl("input", {
        type: "checkbox",
        cls: "pic-cloud-checkbox"
      });
      checkbox.checked = selectedSet.has(img.pure);
      checkbox.addEventListener("click", (e) => e.stopPropagation());
      checkbox.addEventListener("change", (e) => {
        e.stopPropagation();
        ignoreNextClick(item);
        if (checkbox.checked) {
          selectedSet.add(img.pure);
          selection.select("cloudImages" /* CloudImages */, [img.pure]);
        } else {
          selectedSet.delete(img.pure);
          selection.deselect("cloudImages" /* CloudImages */, img.pure);
        }
        item.setCssStyles({ backgroundColor: checkbox.checked ? "var(--background-modifier-hover)" : "" });
        updateLocalActions();
        updateParentDirCheckboxes();
      });
    }
    let thumbSrc;
    try {
      thumbSrc = img.pure;
    } catch {
    }
    if (thumbSrc) {
      const thumb = item.createEl("img", {
        cls: "pic-thumb pic-thumb-clickable",
        attr: { src: thumbSrc, loading: "lazy" }
      });
      thumb.addEventListener("error", () => {
        thumb.setCssStyles({ display: "none" });
      });
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        showImagePreview(thumbSrc);
      });
    }
    let displayPath;
    try {
      displayPath = new URL(img.pure).pathname.slice(1);
    } catch {
      displayPath = img.pure;
    }
    const shortPath = formatDisplayPath(displayPath);
    const pathSpan = item.createSpan({ cls: "pic-path", text: shortPath, title: "\u53CC\u51FB\u590D\u5236\u5B8C\u6574\u8DEF\u5F84" });
    pathSpan.classList.add("clickable");
    item.dataset.purePath = img.pure;
    pathSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      copyImagePath(img);
    });
    this.renderTags(item, img, "cloudTags" /* CloudTags */, img.pure);
    const actions = item.createDiv({ cls: "pic-actions" });
    const deleteBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u4E91\u7AEF\u6587\u4EF6\u5E76\u6E05\u7406\u5F15\u7528" } });
    deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
      e.stopPropagation();
      if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5220\u9664 "${img.pure}" \u5417\uFF1F
\u5C06\u540C\u65F6\u6E05\u7406\u7B14\u8BB0\u4E2D\u7684\u5F15\u7528\u884C\u3002` })) return;
      for (const fp of img.files) {
        await removeImageFromMdFile(fp, [img.pure]);
      }
      const bedType = detectBedTypeFromUrl(img.pure) ?? void 0;
      const cloudFile = this.ctx.cloudFiles.find((cf) => cf.url === img.pure);
      const fileKey = cloudFile?.prefix || cloudFile?.name || extractFileName(img.pure) || img.pure;
      if (bedType) {
        await deleteCloudFile(fileKey, bedType);
      } else {
        new import_obsidian5.Notice("\u65E0\u6CD5\u8BC6\u522B\u56FE\u5E8A\u7C7B\u578B\uFF0C\u8DF3\u8FC7\u4E91\u7AEF\u6587\u4EF6\u5220\u9664");
      }
      new import_obsidian5.Notice(`\u5DF2\u5220\u9664: ${extractFileName(img.pure) || img.pure}`);
      selection.deselect("cloudImages" /* CloudImages */, img.pure);
      await this.ctx.refresh();
    }));
  }
  /** 未找到图片项 */
  renderNotFoundItem(container, img, selectedSet) {
    const { selection, removeImageFromMdFile, jumpToFile, updateLocalActions, updateParentDirCheckboxes, refresh } = this.ctx;
    const item = container.createDiv({ cls: "pic-item" });
    const isChecked = selectedSet ? selectedSet.has(img.pure) : selection.isSelected("notFound" /* NotFound */, img.pure);
    const checkbox = item.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
    checkbox.checked = isChecked;
    checkbox.addEventListener("click", (e) => e.stopPropagation());
    checkbox.addEventListener("change", (e) => {
      e.stopPropagation();
      ignoreNextClick(item);
      if (checkbox.checked) {
        if (selectedSet) selectedSet.add(img.pure);
        else selection.select("notFound" /* NotFound */, [img.pure]);
      } else {
        if (selectedSet) selectedSet.delete(img.pure);
        else selection.deselect("notFound" /* NotFound */, img.pure);
      }
      updateLocalActions();
    });
    item.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest(".pic-file-tag, button, input")) return;
      if (item._ignoreNextClick) return;
      const isSelected = selectedSet ? selectedSet.has(img.pure) : selection.isSelected("notFound" /* NotFound */, img.pure);
      if (isSelected) {
        if (img.files.length > 0) {
          jumpToFile(img, img.files[0]);
        } else {
          if (selectedSet) selectedSet.delete(img.pure);
          else selection.deselect("notFound" /* NotFound */, img.pure);
          checkbox.checked = false;
          updateLocalActions();
          updateParentDirCheckboxes();
        }
      } else {
        if (selectedSet) selectedSet.add(img.pure);
        else selection.select("notFound" /* NotFound */, [img.pure]);
        checkbox.checked = true;
        updateLocalActions();
        updateParentDirCheckboxes();
      }
    });
    item.addEventListener("dblclick", (e) => {
      const target = e.target;
      if (target.closest(".pic-file-tag, button, input")) return;
      e.stopPropagation();
      const fileName = extractFileName(img.resolvedPath || img.pure);
      if (fileName) {
        navigator.clipboard.writeText(fileName).then(
          () => new import_obsidian5.Notice(`\u5DF2\u590D\u5236\u6587\u4EF6\u540D: ${fileName}`),
          () => new import_obsidian5.Notice("\u590D\u5236\u5931\u8D25")
        );
      }
    });
    const notFoundIcon = `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;
    const iconWrapper = item.createSpan();
    setSafeHTML(iconWrapper, notFoundIcon);
    const displayPath = img.resolvedPath || img.pure;
    const shortPath = formatDisplayPath(displayPath);
    const pathSpan = item.createSpan({ cls: "pic-path", text: shortPath, title: displayPath });
    pathSpan.classList.add("clickable");
    item.dataset.purePath = img.pure;
    pathSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(displayPath).then(
        () => new import_obsidian5.Notice(`\u8DEF\u5F84\u5DF2\u590D\u5236`),
        () => new import_obsidian5.Notice("\u590D\u5236\u5931\u8D25")
      );
    });
    this.renderTags(item, img, "notFound" /* NotFound */, img.pure);
    const actions = item.createDiv({ cls: "pic-actions" });
    const deleteBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u8BE5\u56FE\u7247\u7684\u6240\u6709\u5F15\u7528\u884C" } });
    deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
      e.stopPropagation();
      if (img.files.length === 0) {
        new import_obsidian5.Notice("\u6CA1\u6709\u627E\u5230\u5F15\u7528\u8BE5\u56FE\u7247\u7684\u7B14\u8BB0");
        return;
      }
      const fileList = img.files.map((f) => f.split("/").pop() || f).join("\u3001");
      if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5220\u9664 "${displayPath}" \u5728 ${img.files.length} \u4E2A\u7B14\u8BB0\uFF08${fileList}\uFF09\u4E2D\u7684\u6240\u6709\u5F15\u7528\u884C\u5417\uFF1F` })) return;
      let successCount = 0;
      let failCount = 0;
      for (const fp of img.files) {
        try {
          const count = await removeImageFromMdFile(fp, [img.pure]);
          if (count > 0) successCount += count;
          else failCount++;
        } catch {
          failCount++;
        }
      }
      const parts = [];
      if (successCount > 0) parts.push(`${successCount} \u884C\u5DF2\u5220\u9664`);
      if (failCount > 0) parts.push(`${failCount} \u884C\u5931\u8D25`);
      new import_obsidian5.Notice(`\u5220\u9664\u5B8C\u6210\uFF1A${parts.join("\uFF0C")}`);
      await refresh();
    }));
  }
  /** 云端文件项 */
  renderCloudItem(container, file, indent = "") {
    const { selection, deleteCloudFile, removeImageFromAllMdFiles, updateLocalUnrefActions, updateLocalActions, updateParentDirCheckboxes, updateDeleteSelectedBtn, showPath } = this.ctx;
    const item = container.createDiv({ cls: "pic-item" });
    const fileKey = file.prefix || file.name;
    item.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest("input, img, .pic-file-tag, button")) return;
      if (item._ignoreNextClick) return;
      const isSelected = selection.isSelected("cloudFiles" /* CloudFiles */, fileKey);
      if (isSelected) {
        selection.deselect("cloudFiles" /* CloudFiles */, fileKey);
      } else {
        selection.select("cloudFiles" /* CloudFiles */, [fileKey]);
      }
      const cb = item.querySelector(".pic-cloud-checkbox");
      if (cb) cb.checked = !isSelected;
      updateDeleteSelectedBtn?.();
      updateLocalUnrefActions();
      updateLocalActions();
      updateParentDirCheckboxes();
    });
    item.addEventListener("dblclick", (e) => {
      const target = e.target;
      if (target.closest("input, img, .pic-file-tag, button")) return;
      e.stopPropagation();
      const fileName = extractFileName(file.name);
      if (fileName) {
        navigator.clipboard.writeText(fileName).then(
          () => new import_obsidian5.Notice(`\u5DF2\u590D\u5236\u6587\u4EF6\u540D: ${fileName}`),
          () => new import_obsidian5.Notice("\u590D\u5236\u5931\u8D25")
        );
      }
    });
    const checkbox = item.createEl("input", {
      type: "checkbox",
      cls: "pic-cloud-checkbox"
    });
    checkbox.checked = selection.isSelected("cloudFiles" /* CloudFiles */, fileKey);
    checkbox.addEventListener("click", (e) => e.stopPropagation());
    checkbox.addEventListener("change", (e) => {
      e.stopPropagation();
      ignoreNextClick(item);
      if (checkbox.checked) {
        selection.select("cloudFiles" /* CloudFiles */, [fileKey]);
      } else {
        selection.deselect("cloudFiles" /* CloudFiles */, fileKey);
      }
      updateDeleteSelectedBtn?.();
      updateLocalUnrefActions();
      updateParentDirCheckboxes();
    });
    const cloudBedType = detectBedTypeFromUrl(file.url);
    const ext = getFileExtension(file.name);
    const isImage = IMAGE_EXTENSIONS.has(ext);
    if (isImage) {
      const thumb = item.createEl("img", {
        cls: "pic-thumb pic-thumb-clickable",
        attr: { src: file.url, loading: "lazy" }
      });
      thumb.addEventListener("error", () => {
        thumb.setCssStyles({ display: "none" });
      });
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        showImagePreview(file.url);
      });
    } else {
      item.createSpan({ cls: "pic-cloud-file-icon", text: "\u{1F4C4}" });
    }
    const cloudDisplayName = showPath ? file.prefix || file.name : extractFileName(file.name) || file.name;
    const pathSpan = item.createSpan({ cls: "pic-path", text: `${indent}${cloudDisplayName}` });
    pathSpan.classList.add("clickable");
    item.dataset.purePath = fileKey;
    pathSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(file.url).then(
        () => new import_obsidian5.Notice("\u8DEF\u5F84\u5DF2\u590D\u5236"),
        () => new import_obsidian5.Notice("\u590D\u5236\u5931\u8D25")
      );
    });
    const actions = item.createDiv({ cls: "pic-actions" });
    const deleteBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u4E91\u7AEF\u6587\u4EF6\u5E76\u6E05\u7406\u5F15\u7528" } });
    deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
      e.stopPropagation();
      if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5220\u9664\u4E91\u7AEF\u6587\u4EF6 "${file.name}" \u5417\uFF1F
\u5C06\u540C\u65F6\u6E05\u7406\u7B14\u8BB0\u4E2D\u7684\u5F15\u7528\u884C\u3002` })) return;
      if (!cloudBedType) {
        new import_obsidian5.Notice("\u4E91\u7AEF\u6587\u4EF6\u672A\u5220\u9664\uFF08\u65E0\u6CD5\u8BC6\u522B\u56FE\u5E8A\u7C7B\u578B\uFF09");
        return;
      }
      await deleteCloudFile(file.prefix || file.name, cloudBedType);
      await removeImageFromAllMdFiles([file.url]);
      new import_obsidian5.Notice(`\u5DF2\u5220\u9664: ${file.name}`);
      await this.ctx.refresh();
    }));
  }
  /** 渲染本地未引用图片项 */
  renderLocalUnrefItem(container, file) {
    const { selection, app, deleteLocalUnrefFile, updateLocalUnrefActions, updateLocalActions, updateParentDirCheckboxes } = this.ctx;
    const item = container.createDiv({ cls: "pic-item" });
    item.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest("input, img, .pic-file-tag, button")) return;
      if (item._ignoreNextClick) return;
      const isSelected = selection.isSelected("localUnref" /* LocalUnref */, file.path);
      if (isSelected) {
        selection.deselect("localUnref" /* LocalUnref */, file.path);
      } else {
        selection.select("localUnref" /* LocalUnref */, [file.path]);
      }
      const cb = item.querySelector(".pic-cloud-checkbox");
      if (cb) cb.checked = !isSelected;
      updateLocalUnrefActions();
      updateLocalActions();
      updateParentDirCheckboxes();
    });
    item.addEventListener("dblclick", (e) => {
      const target = e.target;
      if (target.closest("input, img, .pic-file-tag, button")) return;
      e.stopPropagation();
      navigator.clipboard.writeText(file.name).then(
        () => new import_obsidian5.Notice(`\u5DF2\u590D\u5236\u6587\u4EF6\u540D: ${file.name}`),
        () => new import_obsidian5.Notice("\u590D\u5236\u5931\u8D25")
      );
    });
    const checkbox = item.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
    checkbox.checked = selection.isSelected("localUnref" /* LocalUnref */, file.path);
    checkbox.addEventListener("click", (e) => e.stopPropagation());
    checkbox.addEventListener("change", (e) => {
      e.stopPropagation();
      ignoreNextClick(item);
      if (checkbox.checked) selection.select("localUnref" /* LocalUnref */, [file.path]);
      else selection.deselect("localUnref" /* LocalUnref */, file.path);
      updateLocalUnrefActions();
      updateParentDirCheckboxes();
    });
    const ext = file.extension.toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      const thumbSrc = app.vault.getResourcePath(file);
      const thumb = item.createEl("img", { cls: "pic-thumb pic-thumb-clickable", attr: { src: thumbSrc, loading: "lazy" } });
      thumb.addEventListener("error", () => {
        thumb.setCssStyles({ display: "none" });
      });
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        showImagePreview(thumbSrc);
      });
    }
    const shortName = formatDisplayPath(file.path);
    const pathSpan = item.createSpan({ cls: "pic-path", text: shortName });
    pathSpan.classList.add("clickable");
    item.dataset.purePath = file.path;
    pathSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(file.path).then(
        () => new import_obsidian5.Notice(`\u8DEF\u5F84\u5DF2\u590D\u5236`),
        () => new import_obsidian5.Notice("\u590D\u5236\u5931\u8D25")
      );
    });
    const actions = item.createDiv({ cls: "pic-actions" });
    const deleteBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u79FB\u5165\u56DE\u6536\u7AD9" } });
    deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
      e.stopPropagation();
      if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5C06 "${file.name}" \u79FB\u5165\u56DE\u6536\u7AD9\u5417\uFF1F` })) return;
      if (deleteLocalUnrefFile) {
        await deleteLocalUnrefFile(file);
      } else {
        await app.fileManager.trashFile(file);
        new import_obsidian5.Notice(`\u5DF2\u79FB\u5165\u56DE\u6536\u7AD9: ${file.name}`);
      }
      await this.ctx.refresh();
    }));
  }
  /** 添加缩略图 */
  addThumbnail(item, img) {
    const { app } = this.ctx;
    const resolvedPath = img.resolvedPath || img.pure;
    const ext = resolvedPath.split(".").pop()?.toLowerCase() || "";
    const isImage = IMAGE_EXTENSIONS.has(ext);
    if (!isImage) return;
    let thumbSrc;
    if (img.type === "local") {
      let file = app.vault.getAbstractFileByPath(resolvedPath);
      if (!(file instanceof import_obsidian5.TFile)) {
        const fileName = extractFileName(resolvedPath);
        if (fileName) {
          file = app.vault.getFiles().find((f) => f.name === fileName && f.path === resolvedPath) ?? null;
          if (!file) file = app.vault.getFiles().find((f) => f.name === fileName) ?? null;
        }
      }
      if (file instanceof import_obsidian5.TFile) {
        thumbSrc = app.vault.getResourcePath(file);
      }
    } else {
      thumbSrc = img.pure;
    }
    if (thumbSrc) {
      const thumb = item.createEl("img", {
        cls: "pic-thumb pic-thumb-clickable",
        attr: { src: thumbSrc, loading: "lazy" }
      });
      thumb.addEventListener("error", () => {
        thumb.setCssStyles({ display: "none" });
      });
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        showImagePreview(thumbSrc);
      });
    }
  }
};

// src/view/operations/BatchOperations.ts
var import_obsidian6 = require("obsidian");
var BatchOperations = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  /** 通用批量复制到剪贴板 */
  async genericBatchCopy(section, items, getKey, getUrl, getName, format) {
    const { selection } = this.ctx;
    const selected = items.filter((item) => selection.isSelected(section, getKey(item)));
    if (selected.length === 0) {
      new import_obsidian6.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u590D\u5236\u7684\u9879\u76EE");
      return;
    }
    const lines = selected.map((item) => {
      const name = getName(item);
      const url = getUrl(item);
      return format === "markdown" ? `![${name}](${url})` : `<img src="${url}" alt="${name}">`;
    });
    await navigator.clipboard.writeText(lines.join("\n"));
    new import_obsidian6.Notice(`\u5DF2\u590D\u5236 ${lines.length} \u4E2A ${format === "markdown" ? "Markdown" : "HTML"} \u94FE\u63A5`);
  }
  /** 通用批量下载 */
  async genericBatchDownload(section, items, getKey, getUrl, getName, onAfter) {
    const { selection } = this.ctx;
    const selected = items.filter((item) => selection.isSelected(section, getKey(item)));
    if (selected.length === 0) {
      new import_obsidian6.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u4E0B\u8F7D\u7684\u6587\u4EF6");
      return;
    }
    let success = 0;
    let fail = 0;
    for (const item of selected) {
      const imageUrl = getUrl(item);
      const fileName = getName(item) || "image";
      try {
        const resp = await (0, import_obsidian6.requestUrl)(imageUrl);
        if (resp.status >= 400) {
          fail++;
          continue;
        }
        const blob = new Blob([resp.arrayBuffer]);
        const blobUrl = URL.createObjectURL(blob);
        const a = activeDocument.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        activeDocument.body.appendChild(a);
        a.click();
        activeDocument.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        success++;
      } catch {
        fail++;
      }
    }
    new import_obsidian6.Notice(`\u4E0B\u8F7D\u5B8C\u6210\uFF1A\u6210\u529F ${success} \u4E2A\uFF0C\u5931\u8D25 ${fail} \u4E2A`);
    selection.clear(section);
    onAfter?.();
  }
};

// src/view/operations/DeleteOperations.ts
var import_obsidian7 = require("obsidian");
var DeleteOperations = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  /**
   * 通用批量删除方法
   * @param options.section 选中区域
   * @param options.confirmMessage 确认对话框消息
   * @param options.items 要删除的项目列表
   * @param options.deleteReferences 是否删除笔记引用
   * @param options.onDeleteLocal 删除本地文件的回调
   * @param options.onDeleteCloud 删除云端文件的回调
   * @param options.onAfterDelete 删除完成后的回调（用于清理数据）
   */
  async batchDeleteWithCleanup(options) {
    const result = { referencesDeleted: 0, referencesFailed: 0, filesDeleted: 0, filesFailed: 0 };
    const { selection, localImages, removeImageFromMdFile, refresh } = this.ctx;
    if (options.items.length === 0) {
      new import_obsidian7.Notice("\u65E0\u9879\u76EE\u9700\u8981\u5220\u9664");
      return result;
    }
    if (!await confirmAsync(this.ctx.app, { message: options.confirmMessage })) return result;
    if (options.deleteReferences) {
      const fileImageMap = /* @__PURE__ */ new Map();
      for (const item of options.items) {
        const img = localImages().find((i) => i.pure === item.key);
        if (img) {
          for (const fp of img.files) {
            if (!fileImageMap.has(fp)) fileImageMap.set(fp, []);
            fileImageMap.get(fp).push(img.pure);
          }
        }
      }
      for (const [fp, imagePaths] of fileImageMap) {
        try {
          const count = await removeImageFromMdFile(fp, imagePaths);
          if (count > 0) result.referencesDeleted += count;
          else result.referencesFailed++;
        } catch {
          result.referencesFailed++;
        }
      }
    }
    for (const item of options.items) {
      try {
        if (item.type === "local" && options.onDeleteLocal) {
          const success = await options.onDeleteLocal(item.path);
          if (success) result.filesDeleted++;
          else result.filesFailed++;
        } else if (item.type === "cloud" && options.onDeleteCloud) {
          const success = await options.onDeleteCloud(item.path, item.bedType || "\u5176\u4ED6\u56FE\u5E8A" /* Other */);
          if (success) result.filesDeleted++;
          else result.filesFailed++;
        }
      } catch {
        result.filesFailed++;
      }
    }
    selection.clear(options.section);
    if (options.section === "localImages" /* LocalImages */ || options.section === "notFound" /* NotFound */) {
      selection.clear("localTags" /* LocalTags */);
    } else if (options.section === "cloudImages" /* CloudImages */) {
      selection.clear("cloudTags" /* CloudTags */);
    } else if (options.section === "sameName" /* SameName */) {
      selection.clear("sameNameTags" /* SameNameTags */);
    } else if (options.section === "dedup" /* Dedup */) {
      selection.clear("dedupTags" /* DedupTags */);
    }
    if (options.onAfterDelete) {
      await options.onAfterDelete(new Set(options.items.map((i) => i.key)));
    }
    await refresh();
    const parts = [];
    if (result.referencesDeleted > 0) parts.push(`${result.referencesDeleted} \u884C\u5F15\u7528\u5DF2\u6E05\u7406`);
    if (result.filesDeleted > 0) parts.push(`${result.filesDeleted} \u4E2A\u6587\u4EF6\u5DF2\u5220\u9664`);
    if (result.referencesFailed > 0) parts.push(`${result.referencesFailed} \u884C\u5F15\u7528\u6E05\u7406\u5931\u8D25`);
    if (result.filesFailed > 0) parts.push(`${result.filesFailed} \u4E2A\u6587\u4EF6\u5220\u9664\u5931\u8D25`);
    if (parts.length > 0) new import_obsidian7.Notice(`\u6279\u91CF\u5220\u9664\u5B8C\u6210\uFF1A${parts.join("\uFF0C")}`);
    return result;
  }
  /** 批量删除选中的本地未引用图片 */
  async batchDeleteLocalUnref(localUnreferenced) {
    const { selection, app } = this.ctx;
    if (selection.getCount("localUnref" /* LocalUnref */) === 0) {
      new import_obsidian7.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u56FE\u7247");
      return;
    }
    const toDelete = localUnreferenced.filter((f) => selection.isSelected("localUnref" /* LocalUnref */, f.path));
    if (toDelete.length === 0) {
      new import_obsidian7.Notice("\u65E0\u56FE\u7247\u9700\u8981\u5220\u9664");
      return;
    }
    await this.batchDeleteWithCleanup({
      section: "localUnref" /* LocalUnref */,
      confirmMessage: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${toDelete.length} \u4E2A\u672C\u5730\u672A\u5F15\u7528\u56FE\u7247\u5417\uFF1F\uFF08\u5C06\u79FB\u5165\u56DE\u6536\u7AD9\uFF09`,
      items: toDelete.map((f) => ({ key: f.path, type: "local", path: f.path })),
      deleteReferences: false,
      onDeleteLocal: async (path) => {
        const file = app.vault.getAbstractFileByPath(path);
        if (file instanceof import_obsidian7.TFile) {
          await app.fileManager.trashFile(file);
          return true;
        }
        return false;
      }
    });
  }
  /** 批量删除选中的本地图片文件 */
  async batchDeleteLocalFiles(localImages) {
    const { selection, app } = this.ctx;
    if (selection.getCount("localImages" /* LocalImages */) === 0) {
      new import_obsidian7.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u56FE\u7247");
      return;
    }
    const toDelete = localImages.filter((img) => selection.isSelected("localImages" /* LocalImages */, img.pure));
    if (toDelete.length === 0) {
      new import_obsidian7.Notice("\u65E0\u56FE\u7247\u9700\u8981\u5220\u9664");
      return;
    }
    await this.batchDeleteWithCleanup({
      section: "localImages" /* LocalImages */,
      confirmMessage: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${toDelete.length} \u4E2A\u56FE\u7247\u6587\u4EF6\u5417\uFF1F
\u5C06\u79FB\u5165\u7CFB\u7EDF\u56DE\u6536\u7AD9\u5E76\u6E05\u7406\u7B14\u8BB0\u4E2D\u7684\u5F15\u7528\u884C\u3002`,
      items: toDelete.map((img) => ({
        key: img.pure,
        type: "local",
        path: img.resolvedPath || img.pure
      })),
      deleteReferences: true,
      onDeleteLocal: async (path) => {
        const file = app.vault.getAbstractFileByPath(path);
        if (file instanceof import_obsidian7.TFile) {
          await app.fileManager.trashFile(file);
          return true;
        }
        return false;
      }
    });
  }
  /** 批量删除引用行（删除笔记中引用选中图片的行） */
  /** 删除顶部工具栏「删除行」—— 清除所有标签对应的引用行 */
  async batchDeleteReferenceLines() {
    return this.deleteReferenceLinesForSections([
      "localTags" /* LocalTags */,
      "cloudTags" /* CloudTags */,
      "sameNameTags" /* SameNameTags */,
      "dedupTags" /* DedupTags */
    ]);
  }
  /** 删除当前区域标签对应的引用行 —— 供区域标题栏按钮调用 */
  async deleteReferenceLinesForSections(tagSections) {
    const { selection, localImages, app, removeImageFromLine, refresh } = this.ctx;
    const refsToDelete = [];
    const allTagKeys = [];
    for (const section of tagSections) {
      allTagKeys.push(...selection.getSelected(section));
    }
    for (const tagKey of allTagKeys) {
      const parsed = parseTagKey(tagKey);
      if (!parsed) continue;
      const img = resolveImageFromTagKey(parsed.keyPrefix, localImages());
      if (!img) continue;
      const expandedRefs = expandRefs(img);
      if (parsed.index < expandedRefs.length) {
        refsToDelete.push({ img, file: expandedRefs[parsed.index].file, line: expandedRefs[parsed.index].line });
      }
    }
    if (refsToDelete.length === 0) {
      new import_obsidian7.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u5F15\u7528\u884C");
      return;
    }
    if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5220\u9664 ${refsToDelete.length} \u4E2A\u5F15\u7528\u884C\u5417\uFF1F` })) return;
    const fileGroups = /* @__PURE__ */ new Map();
    for (const ref of refsToDelete) {
      if (!fileGroups.has(ref.file)) fileGroups.set(ref.file, []);
      fileGroups.get(ref.file).push(ref);
    }
    let successCount = 0;
    let failCount = 0;
    for (const [filePath, refs] of fileGroups) {
      const abstractFile = app.vault.getAbstractFileByPath(filePath);
      if (!(abstractFile instanceof import_obsidian7.TFile)) {
        failCount += refs.length;
        continue;
      }
      try {
        const content = await app.vault.read(abstractFile);
        const lines = content.split("\n");
        const linesToModify = /* @__PURE__ */ new Map();
        const linesToDelete = /* @__PURE__ */ new Set();
        for (const ref of refs) {
          if (ref.line > 0) {
            const lineIdx = ref.line - 1;
            if (lineIdx >= lines.length) continue;
            const originalLine = lines[lineIdx];
            if (originalLine !== void 0) {
              const cleaned = removeImageFromLine(originalLine, ref.img.pure);
              if (!cleaned.trim()) linesToDelete.add(lineIdx);
              else if (cleaned !== originalLine) linesToModify.set(lineIdx, cleaned);
            }
          } else {
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(ref.img.pure)) {
                const cleaned = removeImageFromLine(lines[i], ref.img.pure);
                if (!cleaned.trim()) linesToDelete.add(i);
                else if (cleaned !== lines[i]) linesToModify.set(i, cleaned);
                break;
              }
            }
          }
        }
        const newLines = lines.map((line, idx) => linesToModify.has(idx) ? linesToModify.get(idx) : line).filter((_, idx) => !linesToDelete.has(idx));
        if (newLines.length < lines.length || linesToModify.size > 0) {
          await app.vault.modify(abstractFile, newLines.join("\n"));
          successCount += linesToModify.size + linesToDelete.size;
        }
      } catch {
        failCount += refs.length;
      }
    }
    for (const section of tagSections) {
      selection.clear(section);
    }
    await refresh();
    const parts = [];
    if (successCount > 0) parts.push(`${successCount} \u884C\u5DF2\u5220\u9664`);
    if (failCount > 0) parts.push(`${failCount} \u884C\u5931\u8D25`);
    new import_obsidian7.Notice(`\u5220\u9664\u5F15\u7528\u884C\u5B8C\u6210\uFF1A${parts.join("\uFF0C")}`);
  }
  /** 批量删除未找到图片（图片级选中：删除整条图片的所有引用行） */
  async batchDeleteNotFoundImages() {
    const { selection, localImages, removeImageFromMdFile, refresh } = this.ctx;
    const selectedKeys = selection.getSelected("notFound" /* NotFound */);
    const imageKeys = selectedKeys.filter((k) => !k.includes("::"));
    if (imageKeys.length === 0) {
      new import_obsidian7.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u56FE\u7247");
      return;
    }
    const images = localImages().filter((img) => img.found === false);
    const imageMap = /* @__PURE__ */ new Map();
    for (const img of images) imageMap.set(img.pure, img);
    if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${imageKeys.length} \u4E2A\u65AD\u94FE\u56FE\u7247\u7684\u6240\u6709\u5F15\u7528\u884C\u5417\uFF1F` })) return;
    let successCount = 0;
    let failCount = 0;
    for (const pure of imageKeys) {
      const img = imageMap.get(pure);
      if (!img) {
        failCount++;
        continue;
      }
      for (const fp of img.files) {
        selection.deselect("notFound" /* NotFound */, pure);
        try {
          const count = await removeImageFromMdFile(fp, [pure]);
          if (count > 0) successCount += count;
          else failCount++;
        } catch {
          failCount++;
        }
      }
    }
    await refresh();
    const parts = [];
    if (successCount > 0) parts.push(`${successCount} \u884C\u5DF2\u5220\u9664`);
    if (failCount > 0) parts.push(`${failCount} \u884C\u5931\u8D25`);
    new import_obsidian7.Notice(`\u5220\u9664\u5B8C\u6210\uFF1A${parts.join("\uFF0C")}`);
  }
  /** 批量删除未找到图片标签引用行（标签级选中：只删选中的行） */
  async batchDeleteNotFoundTags() {
    const { selection, localImages, app, removeImageFromLine, refresh } = this.ctx;
    const selectedKeys = selection.getSelected("notFound" /* NotFound */);
    const tagKeys = selectedKeys.filter((k) => k.includes("::"));
    if (tagKeys.length === 0) {
      new import_obsidian7.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u5F15\u7528\u6807\u7B7E");
      return;
    }
    if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${tagKeys.length} \u4E2A\u5F15\u7528\u884C\u5417\uFF1F` })) return;
    const images = localImages().filter((img) => img.found === false);
    const perFile = /* @__PURE__ */ new Map();
    for (const tagKey of tagKeys) {
      const parsed = parseTagKey(tagKey);
      if (!parsed) continue;
      const img = resolveImageFromTagKey(parsed.keyPrefix, images);
      if (!img) continue;
      const expandedRefs = expandRefs(img);
      if (parsed.index < expandedRefs.length) {
        const ref = expandedRefs[parsed.index];
        if (!perFile.has(ref.file)) perFile.set(ref.file, { pure: img.pure, lines: /* @__PURE__ */ new Set() });
        perFile.get(ref.file).lines.add(ref.line);
      }
    }
    let successCount = 0;
    let failCount = 0;
    for (const [filePath, info] of perFile) {
      const abstractFile = app.vault.getAbstractFileByPath(filePath);
      if (!(abstractFile instanceof import_obsidian7.TFile)) {
        failCount += info.lines.size;
        continue;
      }
      try {
        const content = await app.vault.read(abstractFile);
        const contentLines = content.split("\n");
        const linesToDelete = /* @__PURE__ */ new Set();
        const linesToModify = /* @__PURE__ */ new Map();
        for (const lineNum of info.lines) {
          if (lineNum > 0) {
            const idx = lineNum - 1;
            const orig = contentLines[idx];
            if (orig !== void 0) {
              const cleaned = removeImageFromLine(orig, info.pure);
              if (!cleaned.trim()) linesToDelete.add(idx);
              else if (cleaned !== orig) linesToModify.set(idx, cleaned);
            }
          }
        }
        const newLines = contentLines.map((l, i) => linesToModify.has(i) ? linesToModify.get(i) : l).filter((_, i) => !linesToDelete.has(i));
        if (newLines.length !== contentLines.length || linesToModify.size > 0) {
          await app.vault.modify(abstractFile, newLines.join("\n"));
          successCount += linesToModify.size + linesToDelete.size;
        }
      } catch {
        failCount += info.lines.size;
      }
    }
    selection.clear("notFound" /* NotFound */);
    await refresh();
    const parts = [];
    if (successCount > 0) parts.push(`${successCount} \u884C\u5DF2\u5220\u9664`);
    if (failCount > 0) parts.push(`${failCount} \u884C\u5931\u8D25`);
    new import_obsidian7.Notice(`\u5220\u9664\u5F15\u7528\u884C\u5B8C\u6210\uFF1A${parts.join("\uFF0C")}`);
  }
  /** 批量删除选中的云端图片（删除引用行 + 删除云端文件） */
  async batchDeleteCloudImages() {
    const { selection, localImages, cloudFiles, compareResult, selectedBed, deleteCloudFile } = this.ctx;
    if (selection.getCount("cloudImages" /* CloudImages */) === 0) {
      new import_obsidian7.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u56FE\u7247");
      return;
    }
    const selected = localImages().filter((img) => selection.isSelected("cloudImages" /* CloudImages */, img.pure));
    if (selected.length === 0) {
      new import_obsidian7.Notice("\u65E0\u56FE\u7247\u9700\u8981\u5220\u9664");
      return;
    }
    const urlToCloudFile = /* @__PURE__ */ new Map();
    for (const cf of cloudFiles()) {
      if (cf.url) urlToCloudFile.set(cf.url, cf);
    }
    await this.batchDeleteWithCleanup({
      section: "cloudImages" /* CloudImages */,
      confirmMessage: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${selected.length} \u4E2A\u4E91\u7AEF\u56FE\u7247\u5417\uFF1F
\u5C06\u540C\u65F6\u5220\u9664\u7B14\u8BB0\u4E2D\u7684\u5F15\u7528\u884C\u548C\u4E91\u7AEF\u6587\u4EF6\u3002`,
      items: selected.map((img) => {
        const result = compareResult().get(img.pure);
        const bedType = result?.bedType || detectBedTypeFromUrl(img.pure) || selectedBed();
        return { key: img.pure, type: "cloud", path: img.pure, bedType };
      }),
      deleteReferences: true,
      onDeleteCloud: async (path, bedType) => {
        const cloudFile = urlToCloudFile.get(path);
        const fileKey = cloudFile?.prefix || cloudFile?.name || extractFileName(path) || path;
        const deleteResult = await deleteCloudFile(fileKey, bedType);
        if (!deleteResult.success) {
          console.warn(`[PicLinker] \u5220\u9664\u4E91\u7AEF\u6587\u4EF6\u5931\u8D25: ${path}`, deleteResult.error);
        }
        return deleteResult.success;
      }
    });
  }
  /** 批量删除空白文件夹 */
  async batchDeleteEmptyFolders(parseEmptyFolder) {
    const { selection, app, deleteCloudFile, refresh } = this.ctx;
    if (selection.getCount("emptyFolders" /* EmptyFolders */) === 0) {
      new import_obsidian7.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u6587\u4EF6\u5939");
      return;
    }
    if (!await confirmAsync(this.ctx.app, { message: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${selection.getCount("emptyFolders" /* EmptyFolders */)} \u4E2A\u7A7A\u767D\u6587\u4EF6\u5939\u5417\uFF1F` })) return;
    let successCount = 0;
    let failCount = 0;
    for (const folderPath of selection.getSelected("emptyFolders" /* EmptyFolders */)) {
      try {
        const info = parseEmptyFolder(folderPath);
        if (info.isCloud && info.bedType) {
          const result = await deleteCloudFile(info.path, info.bedType);
          if (result.success) successCount++;
          else failCount++;
        } else {
          try {
            await app.vault.adapter.rmdir(folderPath, false);
            successCount++;
          } catch {
            new import_obsidian7.Notice(`\u65E0\u6CD5\u5220\u9664\u975E\u7A7A\u6587\u4EF6\u5939: ${folderPath}`);
            failCount++;
          }
        }
      } catch {
        failCount++;
      }
    }
    selection.clear("emptyFolders" /* EmptyFolders */);
    await refresh();
    const parts = [];
    if (successCount > 0) parts.push(`${successCount} \u4E2A\u5DF2\u5220\u9664`);
    if (failCount > 0) parts.push(`${failCount} \u4E2A\u5931\u8D25`);
    new import_obsidian7.Notice(`\u5220\u9664\u5B8C\u6210\uFF1A${parts.join("\uFF0C")}`);
  }
};

// src/view/components/ActionsRenderer.ts
var ActionsRenderer = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  /** 设置删除行按钮引用（按钮在 render 中晚于 ActionsRenderer 创建） */
  setDeleteLineBtn(btn) {
    this.ctx.deleteLineBtn = btn;
  }
  /** 更新所有清除选中按钮的显隐 */
  updateClearButtons() {
    const { selection, headerCache } = this.ctx;
    for (const [section, header] of headerCache) {
      const clearBtn = header.querySelector(".pic-part-clear-btn");
      if (clearBtn) {
        let count = selection.getCount(section);
        if (section === "localImages" /* LocalImages */) {
          count += selection.getCount("localTags" /* LocalTags */);
        }
        if (section === "cloudImages" /* CloudImages */) {
          count += selection.getCount("cloudTags" /* CloudTags */);
        }
        if (section === "sameName" /* SameName */) {
          count += selection.getCount("sameNameTags" /* SameNameTags */);
        }
        if (section === "dedup" /* Dedup */) {
          count += selection.getCount("dedupTags" /* DedupTags */);
        }
        clearBtn.setCssStyles({ display: count > 0 ? "" : "none" });
      }
    }
  }
  /** 通用：动态更新区域标题栏操作按钮 */
  updateSectionActions(section, getButtons) {
    const header = this.ctx.headerCache.get(section);
    if (!header) return;
    let actions = header.querySelector(".pic-part-actions");
    if (!actions) {
      actions = header.createDiv({ cls: "pic-part-actions" });
    }
    const clearBtn = actions.querySelector(".pic-part-clear-btn");
    const buttons = getButtons();
    Array.from(actions.children).forEach((child) => {
      if (child !== clearBtn) child.remove();
    });
    actions.setCssStyles({ display: "" });
    for (const btn of buttons) {
      const el = actions.createEl("button", { text: btn.text, cls: btn.cls, attr: { title: btn.title } });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        btn.onClick();
      });
    }
    if (clearBtn) actions.appendChild(clearBtn);
  }
  /** 更新工具栏「删除行」按钮显隐与文案 */
  updateDeleteLineBtn() {
    const { selection, deleteLineBtn } = this.ctx;
    if (!deleteLineBtn) return;
    const tagCount = selection.getCount("localTags" /* LocalTags */) + selection.getCount("cloudTags" /* CloudTags */) + selection.getCount("sameNameTags" /* SameNameTags */) + selection.getCount("dedupTags" /* DedupTags */);
    if (tagCount > 0) {
      deleteLineBtn.setCssStyles({ display: "" });
      deleteLineBtn.textContent = `\u5220\u9664\u884C (${tagCount})`;
    } else {
      deleteLineBtn.setCssStyles({ display: "none" });
    }
  }
  /** 动态更新本地图片区域的操作按钮 */
  updateLocalActions() {
    this.updateDeleteLineBtn();
    this.updateClearButtons();
    const [localBtns, cloudBtns, notFoundBtns] = this.ctx.getLocalActions();
    this.updateSectionActions("localImages" /* LocalImages */, () => localBtns);
    this.updateSectionActions("cloudImages" /* CloudImages */, () => cloudBtns);
    this.updateSectionActions("notFound" /* NotFound */, () => notFoundBtns);
  }
  /** 动态更新未引用图片区域的操作按钮 */
  updateLocalUnrefActions() {
    this.updateClearButtons();
    const [localUnrefBtns, cloudUnrefBtns] = this.ctx.getLocalUnrefActions();
    this.updateSectionActions("localUnref" /* LocalUnref */, () => localUnrefBtns);
    this.updateSectionActions("cloudFiles" /* CloudFiles */, () => cloudUnrefBtns);
  }
  /** 动态更新同名文件区域的操作按钮 */
  updateSameNameActions() {
    this.updateDeleteLineBtn();
    this.updateClearButtons();
    this.updateSectionActions("sameName" /* SameName */, () => this.ctx.getSameNameActions());
  }
  /** 动态更新去重区域按钮 */
  updateDedupActions() {
    this.updateDeleteLineBtn();
    this.updateClearButtons();
    this.updateSectionActions("dedup" /* Dedup */, () => this.ctx.getDedupActions());
  }
  /** 动态更新空白文件夹区域的操作按钮 */
  updateEmptyFolderActions() {
    this.updateClearButtons();
    this.updateSectionActions("emptyFolders" /* EmptyFolders */, () => this.ctx.getEmptyFolderActions());
  }
};

// src/view/PicLinkerView.ts
var VIEW_TYPE_PIC_LINKER = "pic-linker";
var PicLinkerView = class extends import_obsidian8.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    /** vault 名称（用于 app localStorage 命名空间） */
    this.vaultName = "";
    this.localImages = [];
    this.vaultImagesMap = /* @__PURE__ */ new Map();
    this.cloudFiles = [];
    /** 云端所有目录（含空目录，来自 delimiter 列表） */
    this.cloudAllDirs = [];
    /** 本地图片云端比对结果缓存（跨所有图床） */
    this.compareResult = /* @__PURE__ */ new Map();
    /** 搜索关键字 */
    this.searchKeyword = "";
    /** 文件名 → 引用次数映射 */
    this.fileNameRefCount = /* @__PURE__ */ new Map();
    this.headerCache = /* @__PURE__ */ new Map();
    /** 操作区按钮引用 */
    /** 统一选中状态管理 */
    this.selection = new SelectionManager();
    /** 选中变化回调引用（用于 onClose 时移除） */
    this.selectionChangeCallback = null;
    /** 删除行按钮 */
    this.deleteLineBtn = null;
    /** 视图是否已关闭（防止异步回调操作已销毁 DOM） */
    this.isClosed = false;
    /** 云端数据是否已加载完成 */
    this.cloudLoaded = false;
    /** 本地数据是否正在加载 */
    this.localLoading = false;
    /** 云端数据是否正在加载 */
    this.cloudLoading = false;
    /** 云端数据加载完成通知（用于 await 模式替代 busy-wait） */
    this.cloudDataResolvers = [];
    /** 当前云端数据加载的 Promise（供 debounceFileRefresh 等待完成） */
    this._cloudLoadPromise = null;
    /** 云端图片列表（renderContent 时更新） */
    this.cloudReferenced = [];
    /** 去重结果 */
    this.dedupGroups = [];
    /** 同名文件数据：按文件名分组，每组包含本地和/或云端条目 */
    this.sameNameGroups = [];
    /** 空白文件夹区域是否被清除（持久化到 app localStorage） */
    this.emptyFoldersCleared = false;
    /** 空白文件夹缓存（refresh 时清除） */
    this.emptyFoldersCache = null;
    /** sticky 滚动处理器 */
    this.stickyScrollHandler = null;
    /** 工具栏 ResizeObserver（onClose 时清理） */
    this.toolbarResizeObserver = null;
    /** 全局展开/收起按钮首次点击标记（首次强制展开） */
    this.isFirstToggle = true;
    /** 分区折叠状态（Section_Key -> false 表示折叠） */
    this.sectionExpanded = /* @__PURE__ */ new Set();
    /** 目录折叠状态（已展开的路径集合） */
    this.dirExpanded = /* @__PURE__ */ new Set();
    /**
     * 获取本地未引用的图片（库中存在但未被任何笔记引用的图片文件）
     */
    /** 未引用图片缓存（localImages 变更时失效） */
    this.unreferencedCache = null;
    /** unreferencedCache 版本号，避免两次 refresh 间返回过期数据 */
    this.unreferencedCacheVersion = 0;
    this._unreferencedCacheBuiltAt = -1;
    this.plugin = plugin;
    this.vaultName = plugin.app.vault.getName();
    this.dedupService = new DedupService(this.app, (key) => this.getStorageKey(key));
    this.emptyFoldersCleared = this.dedupService.loadEmptyFoldersCleared();
    const expandState = this.dedupService.loadExpandState();
    this.sectionExpanded = new Set(expandState.sectionExpanded);
    this.dirExpanded = new Set(expandState.dirExpanded);
    this.dedupGroups = this.dedupService.loadDedupGroups();
    this.treeRenderer = new TreeRenderer({
      searchKeyword: this.searchKeyword,
      dirExpanded: this.dirExpanded,
      sectionExpanded: this.sectionExpanded,
      saveExpandState: () => this.saveExpandState(),
      updateLocalActions: () => this.actions.updateLocalActions(),
      updateLocalUnrefActions: () => this.actions.updateLocalUnrefActions(),
      updateParentDirCheckboxes: () => this.updateParentDirCheckboxes()
    });
    this.itemRenderer = new ItemRenderer({
      app: this.app,
      selection: this.selection,
      compareResult: this.compareResult,
      cloudFiles: this.cloudFiles,
      refresh: () => this.refresh(),
      copyImagePath: (img) => this.copyImagePath(img),
      jumpToFile: (img, filePath, lineNumber) => void this.jumpToFile(img, filePath, lineNumber),
      updateLocalActions: () => this.actions.updateLocalActions(),
      updateLocalUnrefActions: () => this.actions.updateLocalUnrefActions(),
      updateParentDirCheckboxes: () => this.updateParentDirCheckboxes(),
      deleteCloudFile: (fileKey, bedType) => this.plugin.deleteCloudFile(fileKey, bedType),
      removeImageFromMdFile: (filePath, urls) => this.plugin.linkEditor.removeImageFromMdFile(filePath, urls),
      removeImageFromAllMdFiles: (urls) => this.plugin.linkEditor.removeImageFromAllMdFiles(urls),
      showPath: this.plugin.settings.showPath
    });
    this.batchOps = new BatchOperations({
      selection: this.selection
    });
    this.deleteOps = new DeleteOperations({
      selection: this.selection,
      app: this.app,
      localImages: () => this.localImages,
      cloudFiles: () => this.cloudFiles,
      compareResult: () => this.compareResult,
      selectedBed: () => this.selectedBed,
      removeImageFromMdFile: (fp, urls) => this.plugin.linkEditor.removeImageFromMdFile(fp, urls),
      removeImageFromLine: (line, url) => this.plugin.linkEditor.removeImageFromLine(line, url),
      deleteCloudFile: (fileKey, bedType) => this.plugin.deleteCloudFile(fileKey, bedType),
      refresh: () => this.refresh()
    });
    this.actions = new ActionsRenderer({
      selection: this.selection,
      headerCache: this.headerCache,
      deleteLineBtn: this.deleteLineBtn,
      getLocalActions: () => [
        // [0] 本地图片
        [
          ...this.selection.getCount("localTags" /* LocalTags */) > 0 ? [{ text: `\u5220\u9664\u884C (${this.selection.getCount("localTags" /* LocalTags */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u6807\u7B7E\u7684\u5F15\u7528\u884C\uFF08\u4EC5\u672C\u533A\u57DF\uFF09", onClick: () => this.deleteOps.deleteReferenceLinesForSections(["localTags" /* LocalTags */]) }] : [],
          ...this.selection.getCount("localImages" /* LocalImages */) > 0 ? [{ text: `\u5220\u9664 (${this.selection.getCount("localImages" /* LocalImages */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u7684\u56FE\u7247\u6587\u4EF6", onClick: () => this.deleteOps.batchDeleteLocalFiles(this.localImages) }] : []
        ],
        // [1] 云端图片
        this.selection.getCount("cloudImages" /* CloudImages */) > 0 || this.selection.getCount("cloudTags" /* CloudTags */) > 0 ? [
          ...this.selection.getCount("cloudTags" /* CloudTags */) > 0 ? [{ text: `\u5220\u9664\u884C (${this.selection.getCount("cloudTags" /* CloudTags */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u6807\u7B7E\u7684\u5F15\u7528\u884C\uFF08\u4EC5\u672C\u533A\u57DF\uFF09", onClick: () => this.deleteOps.deleteReferenceLinesForSections(["cloudTags" /* CloudTags */]) }] : [],
          ...this.selection.getCount("cloudImages" /* CloudImages */) > 0 ? [
            { text: `MD (${this.selection.getCount("cloudImages" /* CloudImages */)})`, cls: "pic-btn-sm", title: "\u590D\u5236 Markdown \u683C\u5F0F\u56FE\u7247\u94FE\u63A5", onClick: () => this.batchOps.genericBatchCopy("cloudImages" /* CloudImages */, this.cloudReferenced, (img) => img.pure, (img) => img.pure, (img) => extractFileName(img.pure) || img.pure, "markdown") },
            { text: `HTML (${this.selection.getCount("cloudImages" /* CloudImages */)})`, cls: "pic-btn-sm", title: "\u590D\u5236 HTML \u683C\u5F0F\u56FE\u7247\u94FE\u63A5", onClick: () => this.batchOps.genericBatchCopy("cloudImages" /* CloudImages */, this.cloudReferenced, (img) => img.pure, (img) => img.pure, (img) => extractFileName(img.pure) || img.pure, "html") },
            { text: `\u4E0B\u8F7D (${this.selection.getCount("cloudImages" /* CloudImages */)})`, cls: "pic-btn-sm", title: "\u4E0B\u8F7D\u9009\u4E2D\u7684\u4E91\u7AEF\u56FE\u7247", onClick: () => this.batchOps.genericBatchDownload("cloudImages" /* CloudImages */, this.cloudReferenced, (img) => img.pure, (img) => img.pure, (img) => extractFileName(img.pure) || "image", () => this.renderContent()) },
            { text: `\u5220\u9664 (${this.selection.getCount("cloudImages" /* CloudImages */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u5F15\u7528\u884C\u548C\u4E91\u7AEF\u56FE\u7247", onClick: () => this.deleteOps.batchDeleteCloudImages() }
          ] : []
        ] : [],
        // [2] 未找到图片
        [
          ...this.selection.getSelected("notFound" /* NotFound */).some((k) => k.includes("::")) ? [{ text: `\u5220\u9664\u884C (${this.selection.getSelected("notFound" /* NotFound */).filter((k) => k.includes("::")).length})`, cls: "pic-btn-sm pic-btn-danger", title: "\u4EC5\u5220\u9664\u9009\u4E2D\u7684\u5F15\u7528\u884C", onClick: () => this.deleteOps.batchDeleteNotFoundTags() }] : [],
          ...this.selection.getSelected("notFound" /* NotFound */).some((k) => !k.includes("::")) ? [{ text: `\u5220\u9664 (${this.selection.getSelected("notFound" /* NotFound */).filter((k) => !k.includes("::")).length})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u7684\u65AD\u94FE\u56FE\u7247\u53CA\u5176\u6240\u6709\u5F15\u7528\u884C", onClick: () => this.deleteOps.batchDeleteNotFoundImages() }] : []
        ]
      ],
      getLocalUnrefActions: () => [
        this.selection.getCount("localUnref" /* LocalUnref */) > 0 ? [{ text: `\u5220\u9664 (${this.selection.getCount("localUnref" /* LocalUnref */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u7684\u672C\u5730\u672A\u5F15\u7528\u56FE\u7247", onClick: () => {
          void this.deleteOps.batchDeleteLocalUnref(this.getLocalUnreferencedImages());
        } }] : [],
        this.selection.getCount("cloudFiles" /* CloudFiles */) > 0 ? (() => {
          const cloudOnly = this.getCloudOnlyFiles();
          const filteredCloud = this.applyCloudFilter(cloudOnly);
          return [
            { text: `MD (${this.selection.getCount("cloudFiles" /* CloudFiles */)})`, cls: "pic-btn-sm", title: "\u590D\u5236 Markdown \u683C\u5F0F\u56FE\u7247\u94FE\u63A5", onClick: () => {
              void this.batchOps.genericBatchCopy("cloudFiles" /* CloudFiles */, filteredCloud, (f) => f.prefix || f.name, (f) => f.url, (f) => extractFileName(f.name) || f.name, "markdown");
            } },
            { text: `HTML (${this.selection.getCount("cloudFiles" /* CloudFiles */)})`, cls: "pic-btn-sm", title: "\u590D\u5236 HTML \u683C\u5F0F\u56FE\u7247\u94FE\u63A5", onClick: () => {
              void this.batchOps.genericBatchCopy("cloudFiles" /* CloudFiles */, filteredCloud, (f) => f.prefix || f.name, (f) => f.url, (f) => extractFileName(f.name) || f.name, "html");
            } },
            { text: `\u4E0B\u8F7D (${this.selection.getCount("cloudFiles" /* CloudFiles */)})`, cls: "pic-btn-sm", title: "\u4E0B\u8F7D\u9009\u4E2D\u7684\u4E91\u7AEF\u56FE\u7247", onClick: () => {
              void this.batchOps.genericBatchDownload("cloudFiles" /* CloudFiles */, filteredCloud, (f) => f.prefix || f.name, (f) => f.url, (f) => extractFileName(f.name) || "image");
            } },
            { text: `\u5220\u9664 (${this.selection.getCount("cloudFiles" /* CloudFiles */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u4ECE\u56FE\u5E8A\u4E2D\u5220\u9664\u9009\u4E2D\u7684\u6587\u4EF6", onClick: () => {
              void this.cleanupUnreferenced(filteredCloud.filter((f) => this.selection.isSelected("cloudFiles" /* CloudFiles */, f.prefix || f.name)));
            } }
          ];
        })() : []
      ],
      getSameNameActions: () => [
        ...this.selection.getCount("sameNameTags" /* SameNameTags */) > 0 ? [{ text: `\u5220\u9664\u884C (${this.selection.getCount("sameNameTags" /* SameNameTags */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u6807\u7B7E\u7684\u5F15\u7528\u884C\uFF08\u4EC5\u672C\u533A\u57DF\uFF09", onClick: () => this.deleteOps.deleteReferenceLinesForSections(["sameNameTags" /* SameNameTags */]) }] : [],
        ...this.selection.getCount("sameName" /* SameName */) > 0 ? [{ text: `\u5220\u9664 (${this.selection.getCount("sameName" /* SameName */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u7684\u540C\u540D\u6587\u4EF6", onClick: () => this.deleteSelectedSameName() }] : []
      ],
      getDedupActions: () => [
        ...this.selection.getCount("dedupTags" /* DedupTags */) > 0 ? [{ text: `\u5220\u9664\u884C (${this.selection.getCount("dedupTags" /* DedupTags */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u6807\u7B7E\u7684\u5F15\u7528\u884C\uFF08\u4EC5\u672C\u533A\u57DF\uFF09", onClick: () => this.deleteOps.deleteReferenceLinesForSections(["dedupTags" /* DedupTags */]) }] : [],
        ...this.selection.getCount("dedup" /* Dedup */) > 0 ? [{ text: `\u5220\u9664 (${this.selection.getCount("dedup" /* Dedup */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u7684\u91CD\u590D\u6587\u4EF6\uFF0C\u5C06\u5F15\u7528\u66F4\u65B0\u4E3A\u7EC4\u5185\u7B2C\u4E00\u9879", onClick: () => this.dedupDeleteSelected() }] : []
      ],
      getEmptyFolderActions: () => this.selection.getCount("emptyFolders" /* EmptyFolders */) > 0 ? [{ text: `\u5220\u9664 (${this.selection.getCount("emptyFolders" /* EmptyFolders */)})`, cls: "pic-btn-sm pic-btn-danger", title: "\u5220\u9664\u9009\u4E2D\u7684\u7A7A\u767D\u6587\u4EF6\u5939", onClick: () => {
        void this.deleteOps.batchDeleteEmptyFolders((fp) => this.parseEmptyFolder(fp));
      } }] : []
    });
    this.selectedBed = "GitHub" /* GitHub */;
    this.selectionChangeCallback = (section) => this.onSelectionChange(section);
    this.selection.onChange(this.selectionChangeCallback);
  }
  /** 保存展开状态到 app localStorage */
  saveExpandState() {
    this.dedupService.saveExpandState(this.sectionExpanded, this.dirExpanded);
  }
  /** 保存去重结果到 app localStorage */
  saveDedupGroups() {
    this.dedupService.saveDedupGroups(this.dedupGroups);
  }
  /** 清除去重结果 */
  clearDedupGroups() {
    this.dedupGroups = [];
    this.selection.clear("dedup" /* Dedup */);
    this.dedupService.clearDedupGroups();
  }
  /** 清理已失效的去重组条目（本地文件已删除或云端文件已不在列表中的） */
  cleanupDedupGroups() {
    if (this.dedupGroups.length === 0) return;
    const localPaths = new Set(this.localImages.map((i) => i.resolvedPath || i.pure));
    for (const file of this.getLocalUnreferencedImages()) {
      localPaths.add(file.path);
    }
    const cloudUrls = new Set(this.cloudFiles.map((f) => f.url));
    let changed = false;
    for (const group of this.dedupGroups) {
      const before = group.items.length;
      group.items = group.items.filter((item) => {
        if (item.source === "local") return localPaths.has(item.path);
        if (item.source === "cloud") return cloudUrls.has(item.file?.url || item.path);
        return true;
      });
      if (group.items.length !== before) changed = true;
    }
    const beforeCount = this.dedupGroups.length;
    this.dedupGroups = this.dedupGroups.filter((g) => g.items.length >= 2);
    if (changed || this.dedupGroups.length !== beforeCount) {
      this.saveDedupGroups();
    }
  }
  /** 保存同名文件数据到 app localStorage */
  saveSameNameData() {
    this.dedupService.saveSameNameData(this.sameNameGroups);
  }
  /** 从 app localStorage 加载同名文件数据 */
  loadSameNameData() {
    this.sameNameGroups = this.dedupService.loadSameNameData();
  }
  /** 清除同名文件数据 */
  clearSameNameData() {
    this.sameNameGroups = [];
    this.dedupService.clearSameNameData();
  }
  /** 仅计算本地同名文件（每次刷新时调用，不依赖云端数据） */
  /** 从 localImages + 未引用图片中收集本地同名条目（公共逻辑） */
  collectLocalSameNameEntries() {
    const nameMap = /* @__PURE__ */ new Map();
    for (const img of this.localImages) {
      const fileName = extractFileName(img.resolvedPath || img.pure);
      if (!fileName) continue;
      const key = fileName.toLowerCase();
      if (!nameMap.has(key)) nameMap.set(key, []);
      const path = img.resolvedPath || img.pure;
      const existing = nameMap.get(key);
      if (img.type === "local") {
        if (!existing.some((i) => i.source === "local" && i.path === path)) {
          existing.push({ source: "local", path, count: img.count, section: "\u672C\u5730\u56FE\u7247" });
        }
      } else {
        if (!existing.some((i) => i.source === "cloud" && i.url === img.pure)) {
          existing.push({ source: "cloud", path, url: img.pure, section: "\u4E91\u7AEF\u56FE\u7247" });
        }
      }
    }
    const unreferenced = this.getLocalUnreferencedImages();
    for (const file of unreferenced) {
      const fileName = file.name;
      const key = fileName.toLowerCase();
      if (!nameMap.has(key)) nameMap.set(key, []);
      const existing = nameMap.get(key);
      if (!existing.some((i) => i.source === "local" && i.path === file.path)) {
        existing.push({ source: "local", path: file.path, count: 0, section: "\u672C\u5730\u672A\u5F15\u7528\u56FE\u7247" });
      }
    }
    return nameMap;
  }
  computeLocalSameName() {
    const nameMap = this.collectLocalSameNameEntries();
    const validLocalKeys = /* @__PURE__ */ new Set();
    for (const [key, items] of nameMap) {
      if (items.length < 2) continue;
      const unique = [...new Map(items.map((i) => [i.path, i])).values()];
      if (unique.length < 2) continue;
      validLocalKeys.add(key);
      const existingIdx = this.sameNameGroups.findIndex((g) => g.fileName.toLowerCase() === key);
      if (existingIdx >= 0) {
        const existing = this.sameNameGroups[existingIdx];
        const cloudItems = existing.items.filter((i) => i.source === "cloud");
        this.sameNameGroups[existingIdx] = { fileName: existing.fileName, items: [...unique, ...cloudItems] };
      } else {
        const fileName = extractFileName(unique[0].path) || key;
        this.sameNameGroups.push({ fileName, items: unique });
      }
    }
    this.sameNameGroups = this.sameNameGroups.filter((g) => {
      const key = g.fileName.toLowerCase();
      if (validLocalKeys.has(key)) return true;
      if (g.items.some((i) => i.source === "cloud")) return true;
      return false;
    });
    this.saveSameNameData();
  }
  /** 计算全部同名文件数据并保存（云端比对完成后调用，全量重建） */
  computeAndSaveSameName() {
    const localEntries = this.collectLocalSameNameEntries();
    const nameMap = /* @__PURE__ */ new Map();
    for (const [key, items] of localEntries) {
      nameMap.set(key, { fileName: items[0]?.path ? extractFileName(items[0].path) || key : key, items: [...items] });
    }
    const referencedCloudUrls = /* @__PURE__ */ new Set();
    for (const img of this.localImages) {
      const result = this.compareResult.get(img.pure);
      if (result?.exists && result.url) referencedCloudUrls.add(result.url);
    }
    for (const cf of this.cloudFiles) {
      if (cf.isDirectory) continue;
      const fileName = extractFileName(cf.name) || cf.name;
      if (!fileName) continue;
      const key = fileName.toLowerCase();
      if (!nameMap.has(key)) nameMap.set(key, { fileName, items: [] });
      const entry = nameMap.get(key);
      if (!entry.items.some((i) => i.source === "cloud" && i.url === cf.url)) {
        const section = referencedCloudUrls.has(cf.url) ? "\u4E91\u7AEF\u56FE\u7247" : "\u4E91\u7AEF\u672A\u5F15\u7528\u56FE\u7247";
        entry.items.push({ source: "cloud", path: cf.prefix || cf.name, url: cf.url, bedType: cf.bedType, section });
      }
    }
    const groups = [];
    for (const [, entry] of nameMap) {
      if (entry.items.length < 2) continue;
      groups.push({ fileName: entry.fileName, items: entry.items });
    }
    this.sameNameGroups = groups;
    this.saveSameNameData();
  }
  /** 生成带 vault 前缀的 app localStorage key */
  getStorageKey(key) {
    return `${this.vaultName}::piclinker-${key}`;
  }
  getViewType() {
    return VIEW_TYPE_PIC_LINKER;
  }
  getDisplayText() {
    return "\u56FE\u5E8A\u7BA1\u5BB6";
  }
  getIcon() {
    return "cloud-check";
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("pic-container");
    const leafEl = this.containerEl.closest(".workspace-leaf");
    if (leafEl) leafEl.addClass("pic-leaf-active");
    this.render(container);
    await this.refresh();
  }
  async onClose() {
    const leafEl = this.containerEl.closest(".workspace-leaf");
    if (leafEl) leafEl.removeClass("pic-leaf-active");
    this.isClosed = true;
    if (this.stickyScrollHandler) {
      const scrollContainer = this.containerEl.parentElement || this.containerEl;
      scrollContainer.removeEventListener("scroll", this.stickyScrollHandler);
      this.stickyScrollHandler = null;
    }
    this.localImages = [];
    this.unreferencedCache = null;
    this.cloudFiles = [];
    this.compareResult.clear();
    this.vaultImagesMap.clear();
    this.fileNameRefCount.clear();
    this.selection.clearAll();
    if (this.selectionChangeCallback) {
      this.selection.off(this.selectionChangeCallback);
      this.selectionChangeCallback = null;
    }
    this.toolbarResizeObserver?.disconnect();
    this.toolbarResizeObserver = null;
    this.containerEl.empty();
  }
  async refresh() {
    this.isFirstToggle = true;
    this.emptyFoldersCleared = false;
    this.emptyFoldersCache = null;
    this.dedupService.saveEmptyFoldersCleared(false);
    const savedCheckedPaths = this.collectCheckedPaths();
    this.selection.clearAll();
    this.selectedBed = "GitHub" /* GitHub */;
    this.plugin.vaultScanner.invalidateChangedFiles();
    this.vaultImagesMap = await this.plugin.getVaultImages();
    this.localImages = Array.from(this.vaultImagesMap.values());
    this.localImages.sort((a, b) => (a.resolvedPath || a.pure).localeCompare(b.resolvedPath || b.pure));
    this.unreferencedCache = null;
    this.fileNameRefCount = buildFileNameRefCount(this.localImages);
    if (!this.cloudLoading) {
      this.cloudLoaded = false;
      this.compareResult.clear();
    }
    this.updateSameNameReferences();
    this.computeLocalSameName();
    this.cleanupDedupGroups();
    this.renderContent(savedCheckedPaths);
    if (!this.cloudLoading) {
      void this.loadCloudData();
    } else {
      this.cloudDataResolvers.push(() => {
        if (this.localImages.length > 0) {
          this.renderContent();
        }
      });
    }
  }
  /** 后台加载云端图床数据（防重入），完成后自动刷新视图 */
  loadCloudData() {
    if (this.cloudLoading) return this._cloudLoadPromise || Promise.resolve();
    this.cloudLoading = true;
    return this._cloudLoadPromise = (async () => {
      try {
        const allCompareResult = /* @__PURE__ */ new Map();
        const allCloudFiles = [];
        const settings = this.plugin.settings;
        const bedTypes = [];
        if (settings.githubToken && settings.githubOwner) bedTypes.push("GitHub" /* GitHub */);
        if (settings.aliyunAccessKeyId && settings.aliyunAccessKeySecret) bedTypes.push("\u963F\u91CC\u4E91 OSS" /* Aliyun */);
        if (settings.tencentSecretId && settings.tencentSecretKey) bedTypes.push("\u817E\u8BAF\u4E91 COS" /* Tencent */);
        if (settings.smmsToken) bedTypes.push("\u5176\u4ED6\u56FE\u5E8A" /* Other */);
        if (bedTypes.length === 0) {
          this.cloudLoaded = true;
          this.renderContent();
          return;
        }
        const results = await Promise.allSettled(
          bedTypes.map(async (bedType) => {
            const cloudFiles = await this.plugin.listCloudFiles(bedType);
            for (const cf of cloudFiles) cf.bedType = bedType;
            const compareResult = await this.plugin.compareLocalWithCloud(this.localImages, bedType, cloudFiles);
            return { bedType, cloudFiles, compareResult };
          })
        );
        const failedBeds = [];
        for (const r of results) {
          if (r.status === "fulfilled") {
            allCloudFiles.push(...r.value.cloudFiles);
            for (const [key, val] of r.value.compareResult.entries()) {
              if (val.exists && !allCompareResult.has(key)) {
                allCompareResult.set(key, { ...val, bedType: r.value.bedType });
              }
            }
          } else {
            const reason = r.reason;
            if (reason instanceof Error) {
              failedBeds.push(reason.message);
            } else if (typeof reason === "object" && reason !== null) {
              failedBeds.push(JSON.stringify(reason));
            } else {
              failedBeds.push(String(reason));
            }
          }
        }
        this.cloudFiles = allCloudFiles;
        this.compareResult = allCompareResult;
        this.cloudLoaded = true;
        this.emptyFoldersCache = null;
        this.cloudAllDirs = [];
        for (const bt of ["\u963F\u91CC\u4E91 OSS" /* Aliyun */, "\u817E\u8BAF\u4E91 COS" /* Tencent */]) {
          if (bedTypes.includes(bt)) {
            try {
              const bed = this.plugin.imageBedManager.get(bt);
              if (bed && bed.listEmptyDirs) {
                bed.configure(settings);
                const dirs = await bed.listEmptyDirs();
                for (const dir of dirs) {
                  this.cloudAllDirs.push({ dir, bedType: bt });
                }
              }
            } catch (e) {
              console.warn("[PicLinker] \u83B7\u53D6\u4E91\u7AEF\u7A7A\u76EE\u5F55\u5931\u8D25:", e instanceof Error ? e.message : String(e));
            }
          }
        }
        this.computeAndSaveSameName();
        this.cleanupDedupGroups();
        if (failedBeds.length > 0) {
          console.warn("[PicLinker] \u52A0\u8F7D\u4E91\u7AEF\u6570\u636E \u90E8\u5206\u56FE\u5E8A\u52A0\u8F7D\u5931\u8D25:", failedBeds.join("; "));
          new import_obsidian8.Notice(`\u90E8\u5206\u56FE\u5E8A\u52A0\u8F7D\u5931\u8D25: ${failedBeds.join("; ")}`);
        }
        this.renderContent();
      } catch (e) {
        console.warn("[PicLinker] \u52A0\u8F7D\u4E91\u7AEF\u6570\u636E \u5931\u8D25", e instanceof Error ? e.message : String(e));
        new import_obsidian8.Notice(`\u52A0\u8F7D\u4E91\u7AEF\u6570\u636E\u5931\u8D25: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        this.cloudLoading = false;
        for (const resolve of this.cloudDataResolvers) resolve();
        this.cloudDataResolvers = [];
        this._cloudLoadPromise = null;
      }
    })();
  }
  /** 等待云端数据加载完成（供外部如 debounceFileRefresh 使用） */
  async waitForCloudLoad() {
    if (!this.cloudLoading && this.cloudLoaded) return;
    if (this._cloudLoadPromise) {
      await this._cloudLoadPromise;
      return;
    }
    return new Promise((resolve) => {
      this.cloudDataResolvers.push(resolve);
    });
  }
  /** 后台刷新本地图片数据（防重入），完成后自动刷新视图 */
  async refreshLocalData() {
    if (this.localLoading) return;
    this.localLoading = true;
    try {
      this.vaultImagesMap = await this.plugin.getVaultImages();
      this.localImages = Array.from(this.vaultImagesMap.values());
      this.unreferencedCache = null;
      this.localImages.sort((a, b) => (a.resolvedPath || a.pure).localeCompare(b.resolvedPath || b.pure));
      this.fileNameRefCount = buildFileNameRefCount(this.localImages);
      this.cleanupDedupGroups();
      this.renderContent();
    } catch (e) {
      new import_obsidian8.Notice(`\u5237\u65B0\u672C\u5730\u56FE\u7247\u5931\u8D25: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      this.localLoading = false;
    }
  }
  render(container) {
    const filterBar = container.createDiv({ cls: "pic-toolbar" });
    const searchBox = filterBar.createDiv({ cls: "pic-search-box" });
    searchBox.createSpan({ cls: "pic-search-icon", text: "\u{1F50D}" });
    const searchInput = searchBox.createEl("input", {
      type: "text",
      cls: "pic-search-input",
      placeholder: ""
    });
    const searchClear = searchBox.createSpan({ cls: "pic-search-clear", text: "\u2715" });
    searchClear.setCssStyles({ display: "none" });
    const searchHint = searchBox.createSpan({ cls: "pic-search-hint", text: "\u641C\u7D22\u6587\u4EF6\u540D..." });
    const cursorMin = 0;
    const updateSearchUI = () => {
      const hasText = searchInput.value.length > cursorMin;
      searchHint.setCssStyles({ display: hasText ? "none" : "" });
      searchClear.setCssStyles({ display: hasText ? "" : "none" });
    };
    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.focus();
      this.searchKeyword = "";
      updateSearchUI();
      this.renderContent();
    });
    searchInput.addEventListener("input", () => {
      this.searchKeyword = searchInput.value.trim().toLowerCase();
      updateSearchUI();
      this.renderContent();
    });
    searchInput.addEventListener("focus", () => {
      searchHint.setCssStyles({ display: "none" });
    });
    searchInput.addEventListener("blur", () => {
      updateSearchUI();
    });
    searchInput.addEventListener("click", () => {
    });
    searchInput.addEventListener("keydown", () => {
    });
    const actionsRight = filterBar.createDiv({ cls: "pic-filter-actions" });
    this.deleteLineBtn = actionsRight.createEl("button", { text: "\u5220\u9664\u884C", cls: "pic-refresh-btn pic-btn-danger", attr: { title: "\u5220\u9664\u7B14\u8BB0\u4E2D\u5F15\u7528\u56FE\u7247\u7684\u884C" } });
    this.deleteLineBtn.setCssStyles({ display: "none" });
    this.deleteLineBtn.addEventListener("click", () => {
      void this.deleteOps.batchDeleteReferenceLines();
    });
    this.actions.setDeleteLineBtn(this.deleteLineBtn);
    const refreshBtn = actionsRight.createEl("button", { text: "\u{1F504} \u5237\u65B0", cls: "pic-refresh-btn", attr: { title: "\u91CD\u65B0\u626B\u63CF\u5168\u5E93\u56FE\u7247" } });
    refreshBtn.addEventListener("click", onAsyncClick(async () => {
      refreshBtn.textContent = "\u23F3 \u5237\u65B0\u4E2D...";
      refreshBtn.disabled = true;
      refreshBtn.classList.add("loading");
      this.selection.clear("localTags" /* LocalTags */);
      this.selection.clear("cloudTags" /* CloudTags */);
      this.selection.clear("sameNameTags" /* SameNameTags */);
      this.selection.clear("dedupTags" /* DedupTags */);
      const container2 = this.containerEl.querySelector(".pic-container");
      container2?.classList.add("refreshing");
      try {
        await new Promise((r) => window.setTimeout(r, 200));
        await this.refresh();
      } catch (e) {
        new import_obsidian8.Notice(`\u5237\u65B0\u5931\u8D25: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        container2?.classList.remove("refreshing");
        container2?.classList.add("refreshed");
        window.setTimeout(() => container2?.classList.remove("refreshed"), 300);
        refreshBtn.textContent = "\u{1F504} \u5237\u65B0";
        refreshBtn.disabled = false;
        refreshBtn.classList.remove("loading");
      }
    }));
    const dedupBtn = actionsRight.createEl("button", { text: "\u53BB\u91CD", cls: "pic-refresh-btn", attr: { title: "\u5355\u51FB\uFF1A\u9009\u4E2D\u56FE\u7247\u53BB\u91CD\uFF1B\u53CC\u51FB\uFF1A\u5168\u5E93\u53BB\u91CD" } });
    let dedupClickCount = 0;
    let dedupClickTimer = null;
    dedupBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dedupClickCount++;
      if (dedupClickTimer) window.clearTimeout(dedupClickTimer);
      dedupClickTimer = window.setTimeout(deferAsync(async () => {
        const isDouble = dedupClickCount >= 2;
        dedupClickCount = 0;
        dedupClickTimer = null;
        if (isDouble) {
          new import_obsidian8.Notice("\u5F00\u59CB\u5168\u5E93\u53BB\u91CD...");
          await this.runDedup(false);
        } else {
          await this.runDedup(true);
        }
      }), 300);
    });
    const toggleAllBtn = actionsRight.createEl("button", { cls: "pic-refresh-btn", attr: { title: "\u6536\u8D77\u6240\u6709" } });
    (0, import_obsidian8.setIcon)(toggleAllBtn, "chevrons-up-down");
    toggleAllBtn.addEventListener("click", () => {
      const mainList = this.containerEl.querySelector("#pic-main-list");
      if (!mainList) return;
      const allSections = mainList.querySelectorAll(".pic-part-content");
      const allDirContents = mainList.querySelectorAll(".pic-dir-content");
      const anyExpanded = Array.from(allSections).some((s) => s.style.display !== "none") || Array.from(allDirContents).some((d) => d.style.display !== "none");
      const shouldCollapse = this.isFirstToggle ? false : anyExpanded;
      this.isFirstToggle = false;
      allSections.forEach((s) => {
        s.setCssStyles({ display: shouldCollapse ? "none" : "" });
        if (!shouldCollapse) ensureLazyRendered(s);
      });
      allDirContents.forEach((d) => {
        d.setCssStyles({ display: shouldCollapse ? "none" : "" });
      });
      mainList.querySelectorAll(".pic-dir-arrow").forEach((a) => {
        a.textContent = shouldCollapse ? "\u25B6" : "\u25BD";
      });
      mainList.querySelectorAll(".pic-part-arrow").forEach((a) => {
        a.textContent = shouldCollapse ? "\u25B6" : "\u25BD";
      });
      mainList.querySelectorAll(".pic-part-actions").forEach((a) => {
        a.setCssStyles({ display: shouldCollapse ? "none" : "" });
      });
      (0, import_obsidian8.setIcon)(toggleAllBtn, shouldCollapse ? "chevrons-down-up" : "chevrons-up-down");
      toggleAllBtn.title = shouldCollapse ? "\u5C55\u5F00\u6240\u6709" : "\u6536\u8D77\u6240\u6709";
      if (shouldCollapse) {
        mainList.querySelectorAll(".pic-part-content").forEach((s) => {
          const key = s.dataset.sectionKey;
          if (key) this.sectionExpanded.add(`!${key}`);
        });
        this.dirExpanded.clear();
      } else {
        this.sectionExpanded.clear();
        mainList.querySelectorAll(".pic-dir-header[data-dir-key]").forEach((h) => {
          const dirKey = h.dataset.dirKey;
          if (dirKey) this.dirExpanded.add(dirKey);
        });
      }
      this.saveExpandState();
    });
    const updateToolbarH = () => {
      const h = filterBar.offsetHeight;
      if (h > 0) container.style.setProperty("--pic-toolbar-h", `${h}px`);
    };
    updateToolbarH();
    this.toolbarResizeObserver = new ResizeObserver(updateToolbarH);
    this.toolbarResizeObserver.observe(filterBar);
    const list = container.createDiv({ cls: "pic-list", attr: { id: "pic-main-list" } });
    list.createDiv({ cls: "pic-loading", text: "\u52A0\u8F7D\u4E2D..." });
  }
  renderContent(savedCheckedPaths) {
    if (this.isClosed) return;
    const el = this.containerEl.querySelector("#pic-main-list");
    if (!el) return;
    const savedPaths = savedCheckedPaths || this.collectCheckedPaths();
    const createdirBar = el.querySelector(".pic-createdir-bar");
    el.empty();
    if (createdirBar) el.prepend(createdirBar);
    if (this.localImages.length === 0 && this.cloudFiles.length === 0) {
      el.createDiv({ cls: "pic-empty", text: "\u65E0\u6570\u636E" });
      return;
    }
    const { localOnly, cloudReferenced, notFoundImages } = this.splitImagesBySource();
    this.cloudReferenced = cloudReferenced;
    this.renderLocalImagesSection(el, localOnly);
    this.renderCloudImagesSection(el, cloudReferenced);
    this.renderLocalUnrefSection(el);
    this.renderCloudUnrefSection(el);
    this.renderNotFoundSection(el, notFoundImages);
    this.renderSameNameSection(el);
    this.renderDedupSection(el);
    this.renderEmptyFoldersSection(el);
    this.headerCache.clear();
    el.querySelectorAll(".pic-part-header").forEach((header) => {
      const sectionStr = header.dataset.selectionSection;
      if (sectionStr) this.headerCache.set(sectionStr, header);
    });
    this.restoreSelectionState(savedPaths);
    this.actions.updateLocalActions();
    this.setupStickyHeaders();
  }
  /** 收集当前所有选中的路径（用于 DOM 重建后恢复） */
  collectCheckedPaths() {
    const paths = /* @__PURE__ */ new Set();
    for (const section of [
      "localImages" /* LocalImages */,
      "cloudImages" /* CloudImages */,
      "localUnref" /* LocalUnref */,
      "cloudFiles" /* CloudFiles */,
      "notFound" /* NotFound */,
      "sameName" /* SameName */,
      "dedup" /* Dedup */,
      "emptyFolders" /* EmptyFolders */
    ]) {
      for (const path of this.selection.getSelected(section)) {
        paths.add(path);
      }
    }
    return paths;
  }
  /** 按来源拆分图片：本地 / 云端 / 未找到 */
  splitImagesBySource() {
    const filteredLocal = this.applyLocalFilter(this.localImages);
    const localOnly = [];
    const cloudReferenced = [];
    const notFoundImages = [];
    for (const img of filteredLocal) {
      if (this.cloudLoaded) {
        const result = this.compareResult.get(img.pure);
        if (result?.exists) {
          cloudReferenced.push(img);
          continue;
        }
        if (img.type !== "local") {
          cloudReferenced.push(img);
          continue;
        }
      }
      if (img.found === false) {
        notFoundImages.push(img);
      } else {
        localOnly.push(img);
      }
    }
    return { localOnly, cloudReferenced, notFoundImages };
  }
  // ===== Section 1: 本地图片 =====
  renderLocalImagesSection(el, localOnly) {
    if (!this.plugin.settings.showLocalImages || localOnly.length === 0) return;
    const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "local", LOCAL_ICON_SVG, "\u672C\u5730\u56FE\u7247", localOnly.length, "localImages" /* LocalImages */);
    const actions = header.querySelector(".pic-part-actions");
    if (actions) {
      if (this.selection.getCount("localImages" /* LocalImages */) > 0) {
        const btn = actions.createEl("button", { text: `\u5220\u9664 (${this.selection.getCount("localImages" /* LocalImages */)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u9009\u4E2D\u7684\u56FE\u7247\u6587\u4EF6" } });
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.deleteOps.batchDeleteLocalFiles(localOnly);
        });
      }
      this.addClearSelectionButton(actions, "localImages" /* LocalImages */);
    }
    const _renderLocal = () => this.renderLocalGroupedByFolder(content, localOnly, this.selection.getSet("localImages" /* LocalImages */));
    if (expanded) _renderLocal();
    else setLazyRenderFn(content, _renderLocal);
  }
  // ===== Section 2: 云端图片 =====
  renderCloudImagesSection(el, cloudReferenced) {
    if (!this.plugin.settings.showCloudImages || cloudReferenced.length === 0 && this.cloudLoaded) return;
    const cloudIcon = getTopBedIcon(cloudReferenced.map((i) => i.pure));
    const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "cloud", cloudIcon, "\u4E91\u7AEF\u56FE\u7247", cloudReferenced.length, "cloudImages" /* CloudImages */);
    if (cloudReferenced.length > 0) {
      const actions = header.querySelector(".pic-part-actions");
      if (actions) {
        if (this.selection.getCount("cloudImages" /* CloudImages */) > 0) {
          this.addCloudImageActions(actions, cloudReferenced);
        }
        this.addClearSelectionButton(actions, "cloudImages" /* CloudImages */);
      }
      const _renderCloud = () => this.renderCloudReferencedByBed(content, cloudReferenced, this.selection.getSet("cloudImages" /* CloudImages */));
      if (expanded) _renderCloud();
      else setLazyRenderFn(content, _renderCloud);
    } else {
      content.createDiv({ cls: "pic-cloud-loading", text: "\u6B63\u5728\u52A0\u8F7D\u4E91\u7AEF\u6570\u636E..." });
    }
  }
  // ===== Section 3: 本地未引用图片 =====
  renderLocalUnrefSection(el) {
    if (!this.plugin.settings.showLocalUnreferenced) return;
    let localUnreferenced = this.getLocalUnreferencedImages();
    if (this.searchKeyword) {
      const kw = this.searchKeyword;
      localUnreferenced = localUnreferenced.filter((f) => f.name.toLowerCase().includes(kw));
    }
    if (localUnreferenced.length === 0) return;
    const grayIcon = LOCAL_ICON_SVG.replace(/#7C3AED/g, "#9CA3AF");
    const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "local-unref", grayIcon, "\u672C\u5730\u672A\u5F15\u7528\u56FE\u7247", localUnreferenced.length, "localUnref" /* LocalUnref */);
    const actions = header.querySelector(".pic-part-actions");
    if (actions) {
      if (this.selection.getCount("localUnref" /* LocalUnref */) > 0) {
        const delBtn = actions.createEl("button", { text: `\u5220\u9664 (${this.selection.getCount("localUnref" /* LocalUnref */)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u9009\u4E2D\u7684\u672C\u5730\u672A\u5F15\u7528\u56FE\u7247" } });
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.deleteOps.batchDeleteLocalUnref(localUnreferenced);
        });
      }
      this.addClearSelectionButton(actions, "localUnref" /* LocalUnref */);
    }
    const _renderLocalUnref = () => this.renderLocalUnrefByFolder(content, localUnreferenced);
    if (expanded) _renderLocalUnref();
    else setLazyRenderFn(content, _renderLocalUnref);
  }
  // ===== Section 4: 云端未引用图片 =====
  renderCloudUnrefSection(el) {
    if (!this.plugin.settings.showCloudUnreferenced) return;
    const cloudOnly = this.getCloudOnlyFiles();
    const filteredCloud = this.applyCloudFilter(cloudOnly);
    if (this.searchKeyword && filteredCloud.length === 0) return;
    const grayIcon = getTopBedIcon(filteredCloud.map((f) => f.url), true);
    const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "unreferenced", grayIcon, "\u4E91\u7AEF\u672A\u5F15\u7528\u56FE\u7247", filteredCloud.length, "cloudFiles" /* CloudFiles */);
    if (filteredCloud.length > 0) {
      const actions = header.querySelector(".pic-part-actions");
      if (actions) {
        if (this.selection.getCount("cloudFiles" /* CloudFiles */) > 0) {
          this.addCloudFileActions(actions, filteredCloud);
        }
        this.addClearSelectionButton(actions, "cloudFiles" /* CloudFiles */);
      }
      const _renderCloudUnref = () => this.renderCloudUnreferencedByBed(content, filteredCloud);
      if (expanded) _renderCloudUnref();
      else setLazyRenderFn(content, _renderCloudUnref);
    } else if (!this.cloudLoaded) {
      content.createDiv({ cls: "pic-cloud-loading", text: "\u6B63\u5728\u52A0\u8F7D\u4E91\u7AEF\u6570\u636E..." });
    } else {
      content.createDiv({ cls: "pic-empty", text: "\u6240\u6709\u4E91\u7AEF\u56FE\u7247\u5747\u88AB\u7B14\u8BB0\u5F15\u7528" });
    }
  }
  // ===== Section 5: 未找到图片 =====
  renderNotFoundSection(el, notFoundImages) {
    if (!this.plugin.settings.showNotFoundImages || notFoundImages.length === 0) return;
    const notFoundIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "not-found", notFoundIcon, "\u672A\u627E\u5230\u56FE\u7247", notFoundImages.length, "notFound" /* NotFound */);
    const actions = header.querySelector(".pic-part-actions");
    if (actions) {
      this.addClearSelectionButton(actions, "notFound" /* NotFound */);
    }
    const _renderNotFound = () => this.renderNotFoundFlat(content, notFoundImages);
    if (expanded) _renderNotFound();
    else setLazyRenderFn(content, _renderNotFound);
    this.actions.updateLocalActions();
  }
  // ===== Section 6: 同名文件 =====
  renderSameNameSection(el) {
    const filteredSameName = this.searchKeyword ? this.sameNameGroups.filter((g) => g.fileName.toLowerCase().includes(this.searchKeyword)) : this.sameNameGroups;
    if (!this.plugin.settings.showSameNameFiles || filteredSameName.length === 0) return;
    const totalItems = filteredSameName.reduce((sum, g) => sum + g.items.length, 0);
    const sameNameIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
    const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "same-name", sameNameIcon, "\u540C\u540D\u6587\u4EF6", totalItems, "sameName" /* SameName */);
    const actions = header.querySelector(".pic-part-actions");
    if (actions) {
      if (!expanded) actions.setCssStyles({ display: "none" });
      if (this.selection.getCount("sameName" /* SameName */) > 0) {
        const delBtn = actions.createEl("button", { text: `\u5220\u9664 (${this.selection.getCount("sameName" /* SameName */)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u9009\u4E2D\u7684\u540C\u540D\u6587\u4EF6" } });
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.deleteSelectedSameName();
        });
      }
      this.addClearSelectionButton(actions, "sameName" /* SameName */);
    }
    const _renderSameName = () => this.renderSameNameGroups(content, filteredSameName);
    if (expanded) _renderSameName();
    else setLazyRenderFn(content, _renderSameName);
  }
  // ===== Section 7: 重复图片 =====
  renderDedupSection(el) {
    const filteredDedup = this.searchKeyword ? this.dedupGroups.filter((g) => g.items.some((i) => (extractFileName(i.path) || "").toLowerCase().includes(this.searchKeyword))) : this.dedupGroups;
    if (!this.plugin.settings.showDuplicates || filteredDedup.length === 0) return;
    const dedupIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>`;
    const totalItems = filteredDedup.reduce((sum, g) => sum + g.items.length, 0);
    const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "duplicates", dedupIcon, "\u91CD\u590D\u56FE\u7247", totalItems, "dedup" /* Dedup */);
    const actions = header.querySelector(".pic-part-actions");
    if (actions) {
      if (!expanded) actions.setCssStyles({ display: "none" });
      if (this.selection.getCount("dedup" /* Dedup */) > 0) {
        const delBtn = actions.createEl("button", { text: `\u5220\u9664 (${this.selection.getCount("dedup" /* Dedup */)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u9009\u4E2D\u7684\u91CD\u590D\u6587\u4EF6\uFF0C\u5C06\u5F15\u7528\u66F4\u65B0\u4E3A\u7EC4\u5185\u7B2C\u4E00\u9879" } });
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.dedupDeleteSelected();
        });
      }
      this.addClearSelectionButton(actions, "dedup" /* Dedup */);
    }
    const _renderDedup = () => this.renderDedupGroups(content, filteredDedup);
    if (expanded) _renderDedup();
    else setLazyRenderFn(content, _renderDedup);
  }
  // ===== Section 8: 空白文件夹 =====
  renderEmptyFoldersSection(el) {
    if (!this.plugin.settings.showEmptyFolders || this.emptyFoldersCleared) return;
    let emptyFolders = this.getEmptyFolders();
    if (this.searchKeyword) {
      emptyFolders = emptyFolders.filter((f) => (f.split("/").pop() || "").toLowerCase().includes(this.searchKeyword));
    }
    if (emptyFolders.length === 0) return;
    const emptyIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "empty-folders", emptyIcon, "\u7A7A\u767D\u6587\u4EF6\u5939", emptyFolders.length, "emptyFolders" /* EmptyFolders */);
    const actions = header.querySelector(".pic-part-actions");
    if (actions) {
      if (!expanded) actions.setCssStyles({ display: "none" });
      if (this.selection.getCount("emptyFolders" /* EmptyFolders */) > 0) {
        const delBtn = actions.createEl("button", { text: `\u5220\u9664 (${this.selection.getCount("emptyFolders" /* EmptyFolders */)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u9009\u4E2D\u7684\u7A7A\u767D\u6587\u4EF6\u5939" } });
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          void this.deleteOps.batchDeleteEmptyFolders((fp) => this.parseEmptyFolder(fp));
        });
      }
      this.addClearSelectionButton(actions, "emptyFolders" /* EmptyFolders */);
    }
    const _renderEmpty = () => this.renderEmptyFolders(content, emptyFolders);
    if (expanded) _renderEmpty();
    else setLazyRenderFn(content, _renderEmpty);
  }
  /** 获取 URL 列表中最多的图床图标 */
  getTopBedIcon(urls, gray = false) {
    const bedCounts = /* @__PURE__ */ new Map();
    for (const url of urls) {
      const bt = detectBedTypeFromUrl(url) || "\u5176\u4ED6\u56FE\u5E8A" /* Other */;
      bedCounts.set(bt, (bedCounts.get(bt) || 0) + 1);
    }
    let topBed = "\u5176\u4ED6\u56FE\u5E8A" /* Other */;
    let maxCount = 0;
    for (const [bt, count] of bedCounts) {
      if (count > maxCount) {
        maxCount = count;
        topBed = bt;
      }
    }
    const icon = getBedFaviconSvg(topBed);
    return gray ? icon.replace(/fill="[^"]*"/g, 'fill="#9CA3AF"') : icon;
  }
  /** 添加云端图片操作按钮 */
  addCloudImageActions(actions, cloudReferenced) {
    const count = this.selection.getCount("cloudImages" /* CloudImages */);
    actions.createEl("button", { text: `MD (${count})`, cls: "pic-btn-sm", attr: { title: "\u590D\u5236 Markdown \u683C\u5F0F\u56FE\u7247\u94FE\u63A5" } }).addEventListener("click", (e) => {
      e.stopPropagation();
      void this.batchOps.genericBatchCopy("cloudImages" /* CloudImages */, cloudReferenced, (img) => img.pure, (img) => img.pure, (img) => extractFileName(img.pure) || img.pure, "markdown");
    });
    actions.createEl("button", { text: `HTML (${count})`, cls: "pic-btn-sm", attr: { title: "\u590D\u5236 HTML \u683C\u5F0F\u56FE\u7247\u94FE\u63A5" } }).addEventListener("click", (e) => {
      e.stopPropagation();
      void this.batchOps.genericBatchCopy("cloudImages" /* CloudImages */, cloudReferenced, (img) => img.pure, (img) => img.pure, (img) => extractFileName(img.pure) || img.pure, "html");
    });
    actions.createEl("button", { text: `\u4E0B\u8F7D (${count})`, cls: "pic-btn-sm", attr: { title: "\u4E0B\u8F7D\u9009\u4E2D\u7684\u4E91\u7AEF\u56FE\u7247" } }).addEventListener("click", (e) => {
      e.stopPropagation();
      void this.batchOps.genericBatchDownload("cloudImages" /* CloudImages */, cloudReferenced, (img) => img.pure, (img) => img.pure, (img) => extractFileName(img.pure) || "image", () => this.renderContent());
    });
    actions.createEl("button", { text: `\u5220\u9664 (${count})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u5F15\u7528\u884C\u548C\u4E91\u7AEF\u56FE\u7247" } }).addEventListener("click", (e) => {
      e.stopPropagation();
      void this.deleteOps.batchDeleteCloudImages();
    });
  }
  /** 添加云端文件操作按钮 */
  addCloudFileActions(actions, filteredCloud) {
    const count = this.selection.getCount("cloudFiles" /* CloudFiles */);
    actions.createEl("button", { text: `MD (${count})`, cls: "pic-btn-sm", attr: { title: "\u590D\u5236 Markdown \u683C\u5F0F\u56FE\u7247\u94FE\u63A5" } }).addEventListener("click", (e) => {
      e.stopPropagation();
      void this.batchOps.genericBatchCopy("cloudFiles" /* CloudFiles */, filteredCloud, (f) => f.prefix || f.name, (f) => f.url, (f) => extractFileName(f.name) || f.name, "markdown");
    });
    actions.createEl("button", { text: `HTML (${count})`, cls: "pic-btn-sm", attr: { title: "\u590D\u5236 HTML \u683C\u5F0F\u56FE\u7247\u94FE\u63A5" } }).addEventListener("click", (e) => {
      e.stopPropagation();
      void this.batchOps.genericBatchCopy("cloudFiles" /* CloudFiles */, filteredCloud, (f) => f.prefix || f.name, (f) => f.url, (f) => extractFileName(f.name) || f.name, "html");
    });
    actions.createEl("button", { text: `\u4E0B\u8F7D (${count})`, cls: "pic-btn-sm", attr: { title: "\u4E0B\u8F7D\u9009\u4E2D\u7684\u4E91\u7AEF\u56FE\u7247" } }).addEventListener("click", (e) => {
      e.stopPropagation();
      void this.batchOps.genericBatchDownload("cloudFiles" /* CloudFiles */, filteredCloud, (f) => f.prefix || f.name, (f) => f.url, (f) => extractFileName(f.name) || "image");
    });
    actions.createEl("button", { text: `\u5220\u9664 (${count})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u4ECE\u56FE\u5E8A\u4E2D\u5220\u9664\u9009\u4E2D\u7684\u6587\u4EF6" } }).addEventListener("click", (e) => {
      e.stopPropagation();
      const selected = filteredCloud.filter((f) => this.selection.isSelected("cloudFiles" /* CloudFiles */, f.prefix || f.name));
      if (selected.length > 0) void this.cleanupUnreferenced(selected);
    });
  }
  /** 恢复选中状态：根据 SelectionManager 中的选中记录恢复复选框 checked 状态 */
  restoreSelectionState(savedCheckedPaths) {
    const mainList = this.containerEl.querySelector("#pic-main-list");
    if (!mainList) return;
    mainList.querySelectorAll(".pic-item").forEach((item) => {
      const purePath = item.dataset.purePath;
      if (!purePath) return;
      if (savedCheckedPaths.has(purePath)) {
        const cb = item.querySelector(".pic-cloud-checkbox");
        if (cb) cb.checked = true;
        item.setCssStyles({ backgroundColor: "var(--background-modifier-hover)" });
      }
    });
    mainList.querySelectorAll(".pic-file-tag").forEach((tag) => {
      const allTagKeys = [
        ...this.selection.getSelected("localTags" /* LocalTags */),
        ...this.selection.getSelected("cloudTags" /* CloudTags */),
        ...this.selection.getSelected("sameNameTags" /* SameNameTags */),
        ...this.selection.getSelected("dedupTags" /* DedupTags */)
      ];
      for (const tagKey of allTagKeys) {
        const parsed = parseTagKey(tagKey);
        if (!parsed) continue;
        const img = resolveImageFromTagKey(parsed.keyPrefix, this.localImages);
        if (!img) continue;
        const expandedRefs = expandRefs(img);
        if (parsed.index >= expandedRefs.length) continue;
        const ref = expandedRefs[parsed.index];
        const fileName = ref.file.split("/").pop() || ref.file;
        const expectedText = ref.line > 0 ? `${fileName}:${ref.line}` : fileName;
        if (!tag.dataset.tagRef) tag.dataset.tagRef = expectedText;
        if (tag.dataset.tagRef === expectedText) {
          tag.classList.add("pic-file-tag-focus");
          tag.title = `\u518D\u6B21\u5355\u51FB\u8DF3\u8F6C\u5230 ${ref.file}:${ref.line}`;
        }
      }
    });
    this.updateParentDirCheckboxes();
  }
  /** 设置动态 sticky 功能 */
  setupStickyHeaders() {
  }
  // ==================== 通用树渲染 ====================
  /** 从扁平路径列表构建树 */
  /** 递归收集节点及子节点的所有文件 */
  /** 通用树节点渲染 */
  // ==================== 可折叠分区 ====================
  /** 在操作按钮区域末尾添加清除选中按钮 */
  addClearSelectionButton(actions, selectionSection) {
    const clearBtn = actions.createEl("button", { cls: "pic-part-clear-btn", text: "\u{1F9F9} \u6E05\u9664\u9009\u4E2D" });
    clearBtn.setCssStyles({ display: "none" });
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selection.clear(selectionSection);
      if (selectionSection === "localImages" /* LocalImages */) {
        this.selection.clear("localTags" /* LocalTags */);
      }
      if (selectionSection === "cloudImages" /* CloudImages */) {
        this.selection.clear("cloudTags" /* CloudTags */);
      }
      if (selectionSection === "sameName" /* SameName */) {
        this.selection.clear("sameNameTags" /* SameNameTags */);
      }
      if (selectionSection === "dedup" /* Dedup */) {
        this.selection.clear("dedupTags" /* DedupTags */);
      }
      this.renderContent();
    });
  }
  /** 创建可折叠分区 */
  /** 渲染引用标签（通用方法，供各 section 复用） */
  /** 云端引用图片项（独立于 renderLocalItem，用 CloudImages + CloudTags） */
  /** 按图床类型分组渲染云端图片 */
  renderCloudReferencedByBed(container, images, selectedSet) {
    const groups = /* @__PURE__ */ new Map();
    for (const img of images) {
      const result = this.compareResult.get(img.pure);
      let bedType;
      if (result?.bedType) {
        bedType = result.bedType;
      } else if (img.type !== "local") {
        bedType = detectBedTypeFromUrl(img.pure) || "\u5176\u4ED6\u56FE\u5E8A" /* Other */;
      } else {
        bedType = "\u5176\u4ED6\u56FE\u5E8A" /* Other */;
      }
      if (!groups.has(bedType)) groups.set(bedType, []);
      groups.get(bedType).push(img);
    }
    const order = ["GitHub" /* GitHub */, "\u963F\u91CC\u4E91 OSS" /* Aliyun */, "\u817E\u8BAF\u4E91 COS" /* Tencent */, "\u5176\u4ED6\u56FE\u5E8A" /* Other */];
    const sorted = Array.from(groups.entries()).sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return ia - ib;
    });
    for (const [bedType, imgs] of sorted) {
      const dirKey = String(bedType);
      const expanded = !!this.searchKeyword || this.dirExpanded.has(dirKey);
      const dirHeader = container.createDiv({ cls: "pic-dir-header" });
      dirHeader.setCssStyles({ paddingLeft: "10px" });
      dirHeader.dataset.dirKey = dirKey;
      const arrow = dirHeader.createSpan({ cls: "pic-dir-arrow", text: expanded ? "\u25BD" : "\u25B6" });
      const iconSpan = dirHeader.createSpan({ cls: "pic-bed-icon" });
      setSafeHTML(iconSpan, getBedFaviconSvg(bedType));
      dirHeader.createSpan({ cls: "pic-dir-name", text: bedType });
      dirHeader.createSpan({ cls: "pic-dir-count", text: `(${imgs.length})` });
      const dirContent = container.createDiv({ cls: "pic-dir-content" });
      if (!expanded) dirContent.setCssStyles({ display: "none" });
      dirHeader.addEventListener("click", () => {
        const isCollapsed = isHidden(dirContent);
        dirContent.setCssStyles({ display: isCollapsed ? "" : "none" });
        arrow.textContent = isCollapsed ? "\u25BD" : "\u25B6";
        if (isCollapsed) {
          this.dirExpanded.add(dirKey);
        } else {
          this.dirExpanded.delete(dirKey);
        }
        this.saveExpandState();
      });
      this.renderCloudReferencedByFolder(dirContent, imgs, selectedSet);
    }
  }
  /** 按 URL 路径分组渲染云端图片（嵌套树） */
  renderCloudReferencedByFolder(container, images, selectedSet) {
    const pathMap = /* @__PURE__ */ new Map();
    for (const img of images) {
      let folderPath;
      try {
        const url = new URL(img.pure);
        const parts = url.pathname.split("/").filter(Boolean);
        const bedType = detectBedTypeFromUrl(img.pure);
        if (bedType === "GitHub" /* GitHub */ && parts.length > 3) {
          parts.splice(0, 3);
        }
        parts.pop();
        folderPath = parts.join("/");
      } catch {
        folderPath = "";
      }
      pathMap.set(img, folderPath);
    }
    const root = { files: [], children: /* @__PURE__ */ new Map() };
    for (const img of images) {
      const folderPath = pathMap.get(img) || "";
      let node = root;
      if (folderPath) {
        for (const part of folderPath.split("/")) {
          if (!node.children.has(part)) node.children.set(part, { files: [], children: /* @__PURE__ */ new Map() });
          node = node.children.get(part);
        }
      }
      node.files.push(img);
    }
    this.treeRenderer.renderTreeNodeGeneric(container, root, 0, {
      getKey: (img) => img.pure,
      renderItem: (c, img, sel) => this.itemRenderer.renderCloudReferencedItem(c, img, sel),
      collectFiles: (node) => this.treeRenderer.collectTreeFiles(node)
    }, selectedSet);
  }
  /** 按文件夹路径分组渲染本地图片（嵌套树） */
  renderLocalGroupedByFolder(container, images, selectedSet) {
    const root = this.treeRenderer.buildTree(images, (img) => img.resolvedPath || img.pure);
    this.treeRenderer.renderTreeNodeGeneric(container, root, 0, {
      getKey: (img) => img.pure,
      renderItem: (c, img, sel) => this.itemRenderer.renderLocalItem(c, img, sel),
      collectFiles: (node) => this.treeRenderer.collectTreeFiles(node)
    }, selectedSet);
  }
  /** 按文件夹分组渲染本地未引用图片 */
  renderLocalUnrefByFolder(container, files) {
    const root = this.treeRenderer.buildTree(files, (f) => f.path);
    this.treeRenderer.renderTreeNodeGeneric(container, root, 0, {
      getKey: (f) => f.path,
      renderItem: (c, f) => this.itemRenderer.renderLocalUnrefItem(c, f),
      collectFiles: (node) => this.treeRenderer.collectTreeFiles(node)
    }, this.selection.getSet("localUnref" /* LocalUnref */));
  }
  /** 渲染同名文件分组列表 */
  /** 动态更新同名文件的引用数据（保留分组结构，只刷新标签信息） */
  updateSameNameReferences() {
    for (const group of this.sameNameGroups) {
      for (const item of group.items) {
        if (item.source !== "local") continue;
        const matchedImg = this.localImages.find((i) => (i.resolvedPath || i.pure) === item.path);
        if (matchedImg) {
          item.count = matchedImg.count;
          item.section = "\u672C\u5730\u56FE\u7247";
        } else {
          item.count = 0;
          item.section = "\u672C\u5730\u672A\u5F15\u7528\u56FE\u7247";
        }
      }
    }
    this.sameNameGroups = this.sameNameGroups.filter((g) => g.items.length >= 2);
    this.saveSameNameData();
  }
  renderSameNameGroups(container, groups) {
    for (const group of groups) {
      this.renderSameNameGroup(container, group);
    }
  }
  /** 渲染单个同名文件组 */
  renderSameNameGroup(container, group) {
    const groupEl = container.createDiv({ cls: "pic-dedup-group" });
    const groupHeader = groupEl.createDiv({ cls: "pic-item pic-dedup-hash" });
    const dirIconEl = groupHeader.createSpan({ cls: "pic-dir-icon" });
    setSafeHTML(dirIconEl, `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`);
    groupHeader.createSpan({ cls: "pic-path", text: `${group.fileName}  (${group.items.length} \u9879)` });
    for (const item of group.items) {
      const itemEl = groupEl.createDiv({ cls: "pic-item" });
      const itemKey = `${item.source}:${item.url || item.path}`;
      itemEl.addEventListener("click", (e) => {
        const target = e.target;
        if (target.closest("input, img, .pic-file-tag, button")) return;
        const isSelected = this.selection.isSelected("sameName" /* SameName */, itemKey);
        if (isSelected) this.selection.deselect("sameName" /* SameName */, itemKey);
        else this.selection.select("sameName" /* SameName */, [itemKey]);
        const cb2 = itemEl.querySelector(".pic-cloud-checkbox");
        if (cb2) cb2.checked = !isSelected;
        itemEl.setCssStyles({ backgroundColor: !isSelected ? "var(--background-modifier-hover)" : "" });
        this.actions.updateSameNameActions();
        this.updateParentDirCheckboxes();
      });
      const cb = itemEl.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
      cb.checked = this.selection.isSelected("sameName" /* SameName */, itemKey);
      cb.addEventListener("change", () => {
        if (cb.checked) this.selection.select("sameName" /* SameName */, [itemKey]);
        else this.selection.deselect("sameName" /* SameName */, itemKey);
        this.actions.updateSameNameActions();
        this.updateParentDirCheckboxes();
      });
      if (item.source === "local") {
        const img = { pure: item.path, resolvedPath: item.path, type: "local", raw: "", params: "", count: item.count || 0, files: [] };
        this.itemRenderer.addThumbnail(itemEl, img);
        itemEl.createSpan({ cls: "pic-path", text: formatDisplayPath(item.path) });
        itemEl.dataset.purePath = itemKey;
        const matchedImg = this.localImages.find((i) => (i.resolvedPath || i.pure) === item.path);
        if (matchedImg) {
          this.itemRenderer.renderTags(itemEl, matchedImg, "sameNameTags" /* SameNameTags */, `${item.source}:${item.path}`);
        }
      } else {
        if (item.url) {
          const img = { pure: item.url, type: "https", raw: "", params: "", count: 0, files: [] };
          this.itemRenderer.addThumbnail(itemEl, img);
        }
        const bedLabel = item.bedType || "\u672A\u77E5";
        itemEl.createSpan({ cls: "pic-path", text: `${bedLabel} / ${extractFileName(item.url || item.path) || item.url || item.path}` });
        itemEl.dataset.purePath = itemKey;
        const matchedCloudImg = this.localImages.find((i) => i.pure === (item.url || item.path));
        if (matchedCloudImg && matchedCloudImg.files.length > 0) {
          this.itemRenderer.renderTags(itemEl, matchedCloudImg, "sameNameTags" /* SameNameTags */, `${item.source}:${item.url || item.path}`);
        }
      }
      const actions = itemEl.createDiv({ cls: "pic-actions" });
      const delBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "pic-btn-sm pic-btn-danger", attr: { title: item.source === "local" ? "\u5220\u9664\u672C\u5730\u6587\u4EF6" : "\u5220\u9664\u4E91\u7AEF\u6587\u4EF6" } });
      delBtn.addEventListener("click", onAsyncClick(async (e) => {
        e.stopPropagation();
        const itemName = item.source === "local" ? item.path.split("/").pop() || item.path : item.url || item.path;
        if (!await confirmAsync(this.app, { message: `\u786E\u5B9A\u8981\u5220\u9664 "${itemName}" \u5417\uFF1F` })) return;
        let ok = false;
        try {
          if (item.source === "local") {
            const file = this.app.vault.getAbstractFileByPath(item.path);
            if (file instanceof import_obsidian8.TFile) {
              await this.app.fileManager.trashFile(file);
              ok = true;
            } else {
              console.warn("[PicLinker] \u672C\u5730\u6587\u4EF6\u4E0D\u5B58\u5728:", item.path);
            }
          } else {
            const bedType = item.bedType || this.selectedBed;
            const result = await this.plugin.deleteCloudFile(item.url || item.path, bedType);
            if (result.success) {
              ok = true;
            } else {
              console.warn("[PicLinker] \u4E91\u7AEF\u5220\u9664\u5931\u8D25:", result.error, item.url || item.path, bedType);
            }
          }
        } catch (e2) {
          console.error("[PicLinker] \u5220\u9664\u5F02\u5E38:", e2);
        }
        if (ok) {
          try {
            const refImg = this.localImages.find((i) => (i.resolvedPath || i.pure) === (item.url || item.path));
            if (refImg) {
              for (const fp of refImg.files) {
                await this.plugin.linkEditor.removeImageFromMdFile(fp, [item.url || item.path]);
              }
            }
          } catch (e2) {
            console.warn("[PicLinker] \u5F15\u7528\u884C\u5220\u9664\u5931\u8D25:", e2);
            new import_obsidian8.Notice("\u6587\u4EF6\u5DF2\u5220\u9664\uFF0C\u4F46\u5F15\u7528\u884C\u6E05\u7406\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u5220\u9664");
          }
          new import_obsidian8.Notice(`\u5DF2\u5220\u9664: ${itemName}`);
          for (const g of this.sameNameGroups) {
            g.items = g.items.filter((i) => !(i.source === item.source && (i.url || i.path) === (item.url || item.path)));
          }
          this.sameNameGroups = this.sameNameGroups.filter((g) => g.items.length >= 2);
          this.saveSameNameData();
          this.selection.deselect("sameName" /* SameName */, itemKey);
          this.renderContent();
        } else {
          new import_obsidian8.Notice(`\u5220\u9664\u5931\u8D25: ${itemName}`);
        }
      }));
    }
  }
  /** 为图片项添加缩略图 */
  /** 按文件夹分组渲染未找到图片 */
  renderNotFoundFlat(container, images) {
    const selectedSet = this.selection.getSet("notFound" /* NotFound */);
    for (const img of images) {
      this.itemRenderer.renderNotFoundItem(container, img, selectedSet);
    }
  }
  /** 渲染空白文件夹列表 */
  /** 解析空白文件夹路径：本地路径或 [cloud:bedType] prefix */
  parseEmptyFolder(folderPath) {
    const match = folderPath.match(/^\[cloud:([^\]]+)\]\s*(.+)$/);
    if (match) {
      return { isCloud: true, bedType: match[1], path: match[2] };
    }
    return { isCloud: false, path: folderPath };
  }
  renderEmptyFolders(container, folders) {
    for (const folderPath of folders) {
      const info = this.parseEmptyFolder(folderPath);
      const item = container.createDiv({ cls: "pic-item" });
      item.dataset.purePath = folderPath;
      const cb = item.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
      const isSelected = this.selection.isSelected("emptyFolders" /* EmptyFolders */, folderPath);
      cb.checked = isSelected;
      cb.addEventListener("change", () => {
        if (cb.checked) this.selection.select("emptyFolders" /* EmptyFolders */, [folderPath]);
        else this.selection.deselect("emptyFolders" /* EmptyFolders */, folderPath);
        this.actions.updateEmptyFolderActions();
        this.updateParentDirCheckboxes();
      });
      if (info.isCloud && info.bedType) {
        const iconSpan = item.createSpan({ cls: "pic-dedup-icon" });
        setSafeHTML(iconSpan, getBedFaviconSvg(info.bedType));
      }
      const displayPath = info.isCloud ? info.path : folderPath;
      const pathSpan = item.createSpan({ cls: "pic-path", text: displayPath, title: folderPath });
      pathSpan.classList.add("clickable");
      const actions = item.createDiv({ cls: "pic-actions" });
      const deleteBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u7A7A\u767D\u6587\u4EF6\u5939" } });
      deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
        e.stopPropagation();
        const displayPath2 = info.isCloud ? info.path : folderPath;
        if (!await confirmAsync(this.app, { message: `\u786E\u5B9A\u8981\u5220\u9664\u7A7A\u767D\u6587\u4EF6\u5939 "${displayPath2}" \u5417\uFF1F` })) return;
        try {
          if (info.isCloud && info.bedType) {
            const result = await this.plugin.deleteCloudFile(info.path, info.bedType);
            if (result.success) {
              new import_obsidian8.Notice(`\u5DF2\u5220\u9664: ${displayPath2}`);
            } else {
              new import_obsidian8.Notice(`\u5220\u9664\u5931\u8D25: ${result.error}`);
            }
          } else {
            try {
              await this.app.vault.adapter.rmdir(folderPath, false);
            } catch {
              await this.app.vault.adapter.rmdir(folderPath, true);
            }
            new import_obsidian8.Notice(`\u5DF2\u5220\u9664: ${displayPath2}`);
          }
          this.renderContent();
        } catch (e2) {
          new import_obsidian8.Notice(`\u5220\u9664\u5931\u8D25: ${e2 instanceof Error ? e2.message : String(e2)}`);
        }
      }));
    }
  }
  /** 按图床分组渲染云端未引用文件 */
  renderCloudUnreferencedByBed(container, files) {
    const groups = /* @__PURE__ */ new Map();
    for (const file of files) {
      const bt = file.bedType || detectBedTypeFromUrl(file.url) || "\u5176\u4ED6\u56FE\u5E8A" /* Other */;
      if (!groups.has(bt)) groups.set(bt, []);
      groups.get(bt).push(file);
    }
    const order = ["GitHub" /* GitHub */, "\u963F\u91CC\u4E91 OSS" /* Aliyun */, "\u817E\u8BAF\u4E91 COS" /* Tencent */, "\u5176\u4ED6\u56FE\u5E8A" /* Other */];
    const sorted = Array.from(groups.entries()).sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    for (const [bedType, bedFiles] of sorted) {
      const dirKey = String(bedType);
      const expanded = !!this.searchKeyword || this.dirExpanded.has(dirKey);
      const dirHeader = container.createDiv({ cls: "pic-dir-header" });
      dirHeader.setCssStyles({ paddingLeft: "10px" });
      dirHeader.dataset.dirKey = dirKey;
      const arrow = dirHeader.createSpan({ cls: "pic-dir-arrow", text: expanded ? "\u25BD" : "\u25B6" });
      const iconSpan = dirHeader.createSpan({ cls: "pic-bed-icon" });
      setSafeHTML(iconSpan, getBedFaviconSvg(bedType));
      dirHeader.createSpan({ cls: "pic-dir-name", text: bedType });
      dirHeader.createSpan({ cls: "pic-dir-count", text: `(${bedFiles.length})` });
      const dirContent = container.createDiv({ cls: "pic-dir-content" });
      if (!expanded) dirContent.setCssStyles({ display: "none" });
      dirHeader.addEventListener("click", () => {
        const isCollapsed = isHidden(dirContent);
        dirContent.setCssStyles({ display: isCollapsed ? "" : "none" });
        arrow.textContent = isCollapsed ? "\u25BD" : "\u25B6";
        if (isCollapsed) {
          this.dirExpanded.add(dirKey);
        } else {
          this.dirExpanded.delete(dirKey);
        }
        this.saveExpandState();
      });
      this.renderCloudGroupedByFolder(dirContent, bedFiles, bedType);
    }
  }
  /** 按文件夹路径分组渲染云端文件（嵌套树） */
  renderCloudGroupedByFolder(el, files, breadcrumb = "") {
    const root = this.treeRenderer.buildTree(files, (f) => f.prefix || f.name);
    this.treeRenderer.renderTreeNodeGeneric(el, root, 0, {
      getKey: (f) => f.prefix || f.name,
      renderItem: (c, f) => this.itemRenderer.renderCloudItem(c, f),
      collectFiles: (node) => this.treeRenderer.collectTreeFiles(node)
    }, this.selection.getSet("cloudFiles" /* CloudFiles */), breadcrumb);
  }
  /** 等待云端数据加载完成，超时返回 false */
  waitForCloudData(timeoutMs) {
    if (!this.cloudLoading) return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        this.cloudDataResolvers = this.cloudDataResolvers.filter((r) => r !== wrappedResolve);
        resolve(false);
      }, timeoutMs);
      const wrappedResolve = () => {
        window.clearTimeout(timer);
        resolve(true);
      };
      this.cloudDataResolvers.push(wrappedResolve);
    });
  }
  // ==================== 去重功能 ====================
  /** 执行去重扫描 */
  async runDedup(selectedOnly) {
    if (this.cloudLoading) {
      new import_obsidian8.Notice("\u6B63\u5728\u7B49\u5F85\u4E91\u7AEF\u6570\u636E\u52A0\u8F7D\u5B8C\u6210...");
      const loaded = await this.waitForCloudData(3e4);
      if (!loaded) {
        new import_obsidian8.Notice("\u4E91\u7AEF\u6570\u636E\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5");
        return;
      }
    }
    const selectedLocalPaths = /* @__PURE__ */ new Set();
    const selectedCloudNames = /* @__PURE__ */ new Set();
    if (selectedOnly) {
      const localImagesSelected = this.selection.getSelected("localImages" /* LocalImages */);
      for (const path of localImagesSelected) {
        selectedLocalPaths.add(path);
      }
      const cloudImagesSelected = this.selection.getSelected("cloudImages" /* CloudImages */);
      for (const path of cloudImagesSelected) {
        selectedLocalPaths.add(path);
      }
      const localUnrefSelected = this.selection.getSelected("localUnref" /* LocalUnref */);
      for (const path of localUnrefSelected) {
        selectedLocalPaths.add(path);
      }
      const cloudFilesSelected = this.selection.getSelected("cloudFiles" /* CloudFiles */);
      for (const path of cloudFilesSelected) {
        selectedCloudNames.add(path);
      }
      const notFoundSelected = this.selection.getSelected("notFound" /* NotFound */);
      for (const path of notFoundSelected) {
        selectedLocalPaths.add(path);
      }
      const localTagsSelected = this.selection.getSelected("localTags" /* LocalTags */);
      const cloudTagsSelected = this.selection.getSelected("cloudTags" /* CloudTags */);
      const sameNameTagsSelected = this.selection.getSelected("sameNameTags" /* SameNameTags */);
      const dedupTagsSelected = this.selection.getSelected("dedupTags" /* DedupTags */);
      for (const tagKey of [...localTagsSelected, ...cloudTagsSelected, ...sameNameTagsSelected, ...dedupTagsSelected]) {
        const parsed = parseTagKey(tagKey);
        if (parsed) selectedLocalPaths.add(parsed.keyPrefix);
      }
      if (selectedLocalPaths.size === 0 && selectedCloudNames.size === 0) {
        new import_obsidian8.Notice("\u672A\u9009\u4E2D\u56FE\u7247\uFF0C\u53CC\u51FB\u300C\u53BB\u91CD\u300D\u6309\u94AE\u53EF\u6267\u884C\u5168\u5E93\u53BB\u91CD");
        return;
      }
    } else {
    }
    const localHashMap = /* @__PURE__ */ new Map();
    const allLocalImages = [];
    const addedPaths = /* @__PURE__ */ new Set();
    for (const img of this.localImages) {
      if (img.type !== "local") continue;
      if (selectedOnly && selectedLocalPaths.size > 0 && !selectedLocalPaths.has(img.pure)) continue;
      allLocalImages.push(img);
      addedPaths.add(img.resolvedPath || img.pure);
    }
    const unreferenced = this.getLocalUnreferencedImages();
    for (const file of unreferenced) {
      if (selectedOnly && selectedLocalPaths.size > 0 && !selectedLocalPaths.has(file.path)) continue;
      if (addedPaths.has(file.path)) continue;
      allLocalImages.push({
        raw: `![[${file.name}]]`,
        pure: file.path,
        params: "",
        type: "local",
        count: 0,
        files: [],
        resolvedPath: file.path,
        found: true
      });
      addedPaths.add(file.path);
    }
    for (const img of allLocalImages) {
      const filePath = img.resolvedPath || img.pure;
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof import_obsidian8.TFile)) {
        continue;
      }
      let hash = null;
      const cached = this.plugin.dedupCache.get(filePath);
      if (cached && cached.mtime === file.stat.mtime) {
        hash = cached.hash;
      } else {
        try {
          const buffer = await this.app.vault.readBinary(file);
          const blob = new Blob([buffer]);
          const newHash = await HashCache.computeHash(blob);
          if (cached && cached.hash === newHash) {
            this.plugin.dedupCache.set({ ...cached, mtime: file.stat.mtime, computedAt: Date.now() });
          } else {
            this.plugin.dedupCache.set({ hash: newHash, source: "local", path: filePath, mtime: file.stat.mtime, computedAt: Date.now() });
          }
          hash = newHash;
        } catch (e) {
          console.warn("[PicLinker] \u8BA1\u7B97\u54C8\u5E0C\u5931\u8D25:", filePath, e);
          continue;
        }
      }
      if (!localHashMap.has(hash)) localHashMap.set(hash, []);
      localHashMap.get(hash).push(img);
    }
    const cloudHashMap = /* @__PURE__ */ new Map();
    const cloudFilesToProcess = [];
    for (const file of this.cloudFiles) {
      if (file.isDirectory) continue;
      if (selectedOnly) {
        if (selectedCloudNames.size === 0 && this.selection.getCount("cloudFiles" /* CloudFiles */) === 0) continue;
        if (selectedCloudNames.size > 0 && !selectedCloudNames.has(file.name) && !this.selection.isSelected("cloudFiles" /* CloudFiles */, file.prefix || file.name)) continue;
      }
      const cached = this.plugin.dedupCache.get(file.url);
      if (cached) {
        if (!cloudHashMap.has(cached.hash)) cloudHashMap.set(cached.hash, []);
        cloudHashMap.get(cached.hash).push(file);
      } else {
        cloudFilesToProcess.push(file);
      }
    }
    if (cloudFilesToProcess.length > 0) {
      const sizeMap = /* @__PURE__ */ new Map();
      for (const file of cloudFilesToProcess) {
        try {
          const resp = await (0, import_obsidian8.requestUrl)({ url: file.url, method: "HEAD" });
          const size = parseInt(resp.headers["content-length"] || "0", 10);
          if (size > 0) {
            if (!sizeMap.has(size)) sizeMap.set(size, []);
            sizeMap.get(size).push(file);
          }
        } catch {
          if (!sizeMap.has(0)) sizeMap.set(0, []);
          sizeMap.get(0).push(file);
        }
      }
      const localSizeSet = /* @__PURE__ */ new Set();
      for (const img of allLocalImages) {
        const filePath = img.resolvedPath || img.pure;
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof import_obsidian8.TFile) localSizeSet.add(file.stat.size);
      }
      for (const [size, files] of sizeMap) {
        if (files.length === 1 && !localSizeSet.has(size)) continue;
        for (const file of files) {
          try {
            const response = await (0, import_obsidian8.requestUrl)({ url: file.url });
            const buffer = response.arrayBuffer;
            const hashBytes = await crypto.subtle.digest("SHA-256", buffer);
            const hash = Array.from(new Uint8Array(hashBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
            this.plugin.dedupCache.set({ hash, source: "cloud", path: file.url, bedType: file.bedType, computedAt: Date.now() });
            if (!cloudHashMap.has(hash)) cloudHashMap.set(hash, []);
            cloudHashMap.get(hash).push(file);
          } catch (e) {
            console.warn("[PicLinker] \u4E91\u7AEF\u6587\u4EF6\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8DF3\u8FC7:", file.url, e instanceof Error ? e.message : String(e));
            continue;
          }
        }
      }
    }
    const groups = [];
    for (const [hash, imgs] of localHashMap) {
      if (imgs.length > 1) {
        groups.push({
          hash,
          type: "local",
          items: imgs.map((img) => ({
            path: img.resolvedPath || img.pure,
            source: "local",
            referenced: img.files.length,
            img
          }))
        });
      }
    }
    for (const [hash, files] of cloudHashMap) {
      if (files.length > 1) {
        groups.push({
          hash,
          type: "cloud",
          items: files.map((f) => ({
            path: f.url,
            source: "cloud",
            bedType: f.bedType,
            file: f
          }))
        });
      }
    }
    for (const [hash, imgs] of localHashMap) {
      const cloudFiles = cloudHashMap.get(hash);
      if (cloudFiles && cloudFiles.length > 0) {
        groups.push({
          hash,
          type: "cross",
          items: [
            ...imgs.map((img) => ({
              path: img.resolvedPath || img.pure,
              source: "local",
              referenced: img.files.length,
              img
            })),
            ...cloudFiles.map((f) => ({
              path: f.url,
              source: "cloud",
              bedType: f.bedType,
              file: f
            }))
          ]
        });
      }
    }
    if (selectedOnly) {
      const existingHashes = new Set(this.dedupGroups.map((g) => g.hash));
      for (const group of groups) {
        if (!existingHashes.has(group.hash)) {
          this.dedupGroups.push(group);
        }
      }
    } else {
      this.dedupGroups = groups;
    }
    this.selection.clear("dedup" /* Dedup */);
    await this.plugin.saveSettings();
    this.saveDedupGroups();
    this.renderContent();
    if (groups.length === 0) {
      new import_obsidian8.Notice(selectedOnly ? "\u9009\u4E2D\u7684\u56FE\u7247\u6CA1\u6709\u91CD\u590D" : "\u6CA1\u6709\u53D1\u73B0\u91CD\u590D\u56FE\u7247");
    } else {
      new import_obsidian8.Notice(`\u53D1\u73B0 ${groups.length} \u7EC4\u91CD\u590D\u56FE\u7247`);
    }
  }
  /** 渲染去重分组列表 */
  renderDedupGroups(content, groups = this.dedupGroups) {
    for (const group of groups) {
      const groupEl = content.createDiv({ cls: "pic-dedup-group" });
      const groupHeader = groupEl.createDiv({ cls: "pic-item pic-dedup-hash" });
      const firstItem = group.items[0];
      const ext = firstItem.path.split(".").pop()?.toLowerCase() || "";
      if (IMAGE_EXTENSIONS.has(ext)) {
        let thumbSrc;
        if (firstItem.source === "local") {
          const file = this.app.vault.getAbstractFileByPath(firstItem.path);
          if (file instanceof import_obsidian8.TFile) thumbSrc = this.app.vault.getResourcePath(file);
        } else {
          thumbSrc = firstItem.path;
        }
        if (thumbSrc) {
          const thumb = groupHeader.createEl("img", {
            cls: "pic-thumb pic-thumb-clickable",
            attr: { src: thumbSrc, loading: "lazy" }
          });
          thumb.addEventListener("error", () => {
            thumb.setCssStyles({ display: "none" });
          });
          thumb.addEventListener("click", (e) => {
            e.stopPropagation();
            showImagePreview(thumbSrc);
          });
        }
      }
      const hashDisplay = group.hash.length > 16 ? `${group.hash.substring(0, 8)}\xB7\xB7\xB7${group.hash.substring(group.hash.length - 8)}` : group.hash;
      groupHeader.createSpan({ cls: "pic-path", text: `${hashDisplay}  (${group.items.length} \u9879)` });
      for (const item of group.items) {
        const itemEl = groupEl.createDiv({ cls: "pic-item" });
        const itemKey = `${item.source}:${item.path}`;
        itemEl.addEventListener("click", (e) => {
          const target = e.target;
          if (target.closest("input, img, .pic-file-tag, button")) return;
          const isSelected = this.selection.isSelected("dedup" /* Dedup */, itemKey);
          if (isSelected) this.selection.deselect("dedup" /* Dedup */, itemKey);
          else this.selection.select("dedup" /* Dedup */, [itemKey]);
          const cb2 = itemEl.querySelector(".pic-cloud-checkbox");
          if (cb2) cb2.checked = !isSelected;
          itemEl.setCssStyles({ backgroundColor: !isSelected ? "var(--background-modifier-hover)" : "" });
          this.actions.updateDedupActions();
          this.updateParentDirCheckboxes();
        });
        itemEl.dataset.purePath = itemKey;
        const cb = itemEl.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
        cb.checked = this.selection.isSelected("dedup" /* Dedup */, itemKey);
        cb.addEventListener("change", () => {
          if (cb.checked) {
            this.selection.select("dedup" /* Dedup */, [itemKey]);
          } else {
            this.selection.deselect("dedup" /* Dedup */, itemKey);
          }
          this.actions.updateDedupActions();
          this.updateParentDirCheckboxes();
        });
        if (item.source === "local") {
          const resolvedPath = item.path;
          const file = this.app.vault.getAbstractFileByPath(resolvedPath);
          if (file instanceof import_obsidian8.TFile) {
            const thumbSrc = this.app.vault.getResourcePath(file);
            const thumb = itemEl.createEl("img", { cls: "pic-thumb pic-thumb-clickable", attr: { src: thumbSrc, loading: "lazy" } });
            thumb.addEventListener("error", () => {
              thumb.setCssStyles({ display: "none" });
            });
            thumb.addEventListener("click", (e) => {
              e.stopPropagation();
              showImagePreview(thumbSrc);
            });
          }
          const shortPath = formatDisplayPath(item.path);
          itemEl.createSpan({ cls: "pic-path", text: shortPath });
        } else {
          const thumbSrc = item.path;
          const thumb = itemEl.createEl("img", { cls: "pic-thumb pic-thumb-clickable", attr: { src: thumbSrc, loading: "lazy" } });
          thumb.addEventListener("error", () => {
            thumb.setCssStyles({ display: "none" });
          });
          thumb.addEventListener("click", (e) => {
            e.stopPropagation();
            showImagePreview(thumbSrc);
          });
          const bedLabel = item.bedType || "\u672A\u77E5";
          itemEl.createSpan({ cls: "pic-path", text: `${bedLabel} / ${extractFileName(item.path) || item.path}` });
        }
        const matchedDedupImg = this.localImages.find((i) => (i.resolvedPath || i.pure) === item.path);
        if (matchedDedupImg && matchedDedupImg.files.length > 0) {
          this.itemRenderer.renderTags(itemEl, matchedDedupImg, "dedupTags" /* DedupTags */, item.path);
        }
        const actions = itemEl.createDiv({ cls: "pic-actions" });
        const delBtn = actions.createEl("button", { text: "\u5220\u9664", cls: "pic-btn-sm pic-btn-danger", attr: { title: "\u5220\u9664\u6B64\u9879\uFF0C\u5F15\u7528\u5C06\u66F4\u65B0\u4E3A\u4FDD\u7559\u9879" } });
        delBtn.addEventListener("click", onAsyncClick(async (e) => {
          e.stopPropagation();
          const itemName = item.source === "local" ? item.path.split("/").pop() || item.path : extractFileName(item.path) || item.path;
          if (!await confirmAsync(this.app, { message: `\u786E\u5B9A\u8981\u5220\u9664 "${itemName}" \u5417\uFF1F
\u5F15\u7528\u5C06\u81EA\u52A8\u66F4\u65B0\u4E3A\u7EC4\u5185\u4FDD\u7559\u9879\u3002` })) return;
          const remaining = group.items.filter((i) => i !== item);
          const keepItem = remaining.reduce((best, cur) => {
            const bestScore = best.source === "cloud" ? (best.referenced || 0) + 1e3 : 0;
            const curScore = cur.source === "cloud" ? (cur.referenced || 0) + 1e3 : 0;
            return curScore > bestScore ? cur : best;
          }, remaining[0]);
          let ok = false;
          try {
            if (item.source === "local") {
              const file = this.app.vault.getAbstractFileByPath(item.path);
              if (file instanceof import_obsidian8.TFile) {
                await this.app.fileManager.trashFile(file);
                this.plugin.dedupCache.remove(item.path);
                ok = true;
              } else {
                console.warn("[PicLinker] \u672C\u5730\u6587\u4EF6\u4E0D\u5B58\u5728:", item.path);
              }
            } else {
              const bedType = item.bedType || this.selectedBed;
              const result = await this.plugin.deleteCloudFile(item.path, bedType);
              if (result.success) {
                this.plugin.dedupCache.remove(item.path);
                ok = true;
              } else {
                console.warn("[PicLinker] \u4E91\u7AEF\u5220\u9664\u5931\u8D25:", result.error, item.path, bedType);
              }
            }
          } catch (e2) {
            console.error("[PicLinker] \u5220\u9664\u5F02\u5E38:", e2);
          }
          if (ok && keepItem) {
            try {
              const bestCloud = group.items.find((i) => i.source === "cloud");
              const keepPath = bestCloud ? bestCloud.path : keepItem.source === "local" ? keepItem.img?.pure || keepItem.path : keepItem.path;
              const freshImg = this.localImages.find((i) => (i.resolvedPath || i.pure) === item.path);
              await this.plugin.linkEditor.replaceImageInMdFiles(item.path, keepPath, freshImg?.files);
            } catch (e2) {
              console.warn("[PicLinker] \u5F15\u7528\u66F4\u65B0\u5931\u8D25:", e2);
              new import_obsidian8.Notice("\u6587\u4EF6\u5DF2\u5220\u9664\uFF0C\u4F46\u5F15\u7528\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u66FF\u6362");
            }
          }
          if (ok) {
            new import_obsidian8.Notice(`\u5DF2\u5220\u9664: ${itemName}`);
            group.items = group.items.filter((i) => i !== item);
            this.dedupGroups = this.dedupGroups.filter((g) => g.items.length >= 2);
            this.selection.deselect("dedup" /* Dedup */, itemKey);
            this.saveDedupGroups();
            this.renderContent();
          } else {
            new import_obsidian8.Notice(`\u5220\u9664\u5931\u8D25: ${itemName}`);
          }
        }));
      }
    }
  }
  /** 选中变化时统一调用的更新方法 */
  onSelectionChange(section) {
    switch (section) {
      case "localImages" /* LocalImages */:
      case "localTags" /* LocalTags */:
        this.actions.updateLocalActions();
        break;
      case "cloudImages" /* CloudImages */:
      case "cloudTags" /* CloudTags */:
        this.actions.updateLocalActions();
        break;
      case "localUnref" /* LocalUnref */:
        this.actions.updateLocalUnrefActions();
        break;
      case "cloudFiles" /* CloudFiles */:
        this.actions.updateLocalUnrefActions();
        break;
      case "sameName" /* SameName */:
      case "sameNameTags" /* SameNameTags */:
        this.actions.updateSameNameActions();
        break;
      case "dedup" /* Dedup */:
      case "dedupTags" /* DedupTags */:
        this.actions.updateDedupActions();
        break;
      case "emptyFolders" /* EmptyFolders */:
        this.actions.updateEmptyFolderActions();
        break;
      case "notFound" /* NotFound */:
        this.actions.updateLocalActions();
        break;
    }
  }
  /** 批量删除选中的空白文件夹 */
  /** 删除选中的同名文件 */
  async deleteSelectedSameName() {
    if (this.selection.getCount("sameName" /* SameName */) === 0) {
      new import_obsidian8.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u6587\u4EF6");
      return;
    }
    const items = [];
    for (const itemKey of this.selection.getSelected("sameName" /* SameName */)) {
      const sepIdx = itemKey.indexOf(":");
      const source = itemKey.substring(0, sepIdx);
      const path = itemKey.substring(sepIdx + 1);
      let bedType;
      if (source === "cloud") {
        for (const group of this.sameNameGroups) {
          const found = group.items.find((i) => i.source === "cloud" && (i.url || i.path) === path);
          if (found?.bedType) {
            bedType = found.bedType;
            break;
          }
        }
      }
      items.push({ key: itemKey, type: source, path, bedType });
    }
    await this.deleteOps.batchDeleteWithCleanup({
      section: "sameName" /* SameName */,
      confirmMessage: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${items.length} \u4E2A\u6587\u4EF6\u5417\uFF1F`,
      items,
      deleteReferences: true,
      onDeleteLocal: async (path) => {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof import_obsidian8.TFile) {
          await this.app.fileManager.trashFile(file);
          return true;
        }
        return false;
      },
      onDeleteCloud: async (path, bedType) => {
        const result = await this.plugin.deleteCloudFile(path, bedType);
        return result.success;
      },
      onAfterDelete: async (deletedKeys) => {
        for (const group of this.sameNameGroups) {
          group.items = group.items.filter((i) => {
            const key = `${i.source}:${i.url || i.path}`;
            return !deletedKeys.has(key);
          });
        }
        this.sameNameGroups = this.sameNameGroups.filter((g) => g.items.length >= 2);
        this.saveSameNameData();
      }
    });
  }
  /** 删除选中的重复项，引用更新为组内引用次数最多的项 */
  async dedupDeleteSelected() {
    if (this.selection.getCount("dedup" /* Dedup */) === 0) {
      new import_obsidian8.Notice("\u8BF7\u5148\u9009\u62E9\u8981\u5220\u9664\u7684\u91CD\u590D\u6587\u4EF6");
      return;
    }
    if (!await confirmAsync(this.app, { message: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${this.selection.getCount("dedup" /* Dedup */)} \u4E2A\u91CD\u590D\u6587\u4EF6\u5417\uFF1F
\u5F15\u7528\u5C06\u81EA\u52A8\u5207\u6362\u4E3A\u7EC4\u5185\u4E91\u7AEF\u7248\u672C\u3002` })) {
      return;
    }
    let deleteSuccess = 0;
    let deleteFail = 0;
    let updateSuccess = 0;
    for (const group of this.dedupGroups) {
      const bestCloud = group.items.find((i) => i.source === "cloud");
      const keepItem = group.items.reduce((best, item) => {
        const bestScore = best.source === "cloud" ? (best.referenced || 0) + 1e3 : 0;
        const itemScore = item.source === "cloud" ? (item.referenced || 0) + 1e3 : 0;
        return itemScore > bestScore ? item : best;
      }, group.items[0]);
      const toDelete = group.items.filter((item) => this.selection.isSelected("dedup" /* Dedup */, `${item.source}:${item.path}`));
      for (const item of toDelete) {
        if (item.path === keepItem.path) continue;
        let keepPath;
        if (bestCloud) {
          keepPath = bestCloud.path;
        } else if (keepItem.source === "local") {
          keepPath = keepItem.img?.pure || keepItem.path;
        } else {
          keepPath = keepItem.path;
        }
        try {
          if (item.source === "local") {
            const file = this.app.vault.getAbstractFileByPath(item.path);
            if (file instanceof import_obsidian8.TFile) {
              await this.app.fileManager.trashFile(file);
              this.plugin.dedupCache.remove(item.path);
              deleteSuccess++;
            } else {
              deleteFail++;
            }
          } else {
            const bedType = item.bedType || this.selectedBed;
            const result = await this.plugin.deleteCloudFile(item.path, bedType);
            if (result.success) {
              this.plugin.dedupCache.remove(item.path);
              deleteSuccess++;
            } else {
              deleteFail++;
            }
          }
          const freshImg = this.localImages.find((i) => (i.resolvedPath || i.pure) === item.path);
          const replacedCount = await this.plugin.linkEditor.replaceImageInMdFiles(item.path, keepPath, freshImg?.files);
          updateSuccess += replacedCount;
        } catch {
          deleteFail++;
        }
      }
    }
    for (const group of this.dedupGroups) {
      const keepItem = group.items.reduce((best, item) => {
        const bestScore = best.source === "cloud" ? (best.referenced || 0) + 1e3 : 0;
        const itemScore = item.source === "cloud" ? (item.referenced || 0) + 1e3 : 0;
        return itemScore > bestScore ? item : best;
      }, group.items[0]);
      group.items = group.items.filter(
        (item) => item === keepItem || !this.selection.isSelected("dedup" /* Dedup */, `${item.source}:${item.path}`)
      );
    }
    this.dedupGroups = this.dedupGroups.filter((g) => g.items.length >= 2);
    this.selection.clear("dedup" /* Dedup */);
    this.saveDedupGroups();
    await this.refresh();
    const parts = [];
    if (deleteSuccess > 0) parts.push(`${deleteSuccess} \u4E2A\u6587\u4EF6\u5DF2\u5220\u9664`);
    if (updateSuccess > 0) parts.push(`${updateSuccess} \u5904\u5F15\u7528\u5DF2\u66F4\u65B0`);
    if (deleteFail > 0) parts.push(`${deleteFail} \u4E2A\u5931\u8D25`);
    new import_obsidian8.Notice(`\u53BB\u91CD\u5B8C\u6210\uFF1A${parts.join("\uFF0C")}`);
  }
  // ==================== 搜索过滤 ====================
  applyLocalFilter(images) {
    if (!this.searchKeyword) return images;
    const kw = this.searchKeyword;
    return images.filter((img) => {
      const fileName = (extractFileName(img.resolvedPath || img.pure) || "").toLowerCase();
      return fileName.includes(kw);
    });
  }
  // ==================== 路径显示 ====================
  /** 根据 showPath 设置格式化显示路径，根目录文件加"根目录/"前缀 */
  formatDisplayPath(fullPath) {
    if (!this.plugin.settings.showPath) {
      return extractFileName(fullPath) || fullPath;
    }
    const parts = fullPath.split("/");
    return parts.length <= 1 ? `\u6839\u76EE\u5F55/${fullPath}` : fullPath;
  }
  // ==================== 跳转 & 复制功能 ====================
  /**
   * 双击路径 → 复制图片路径（或文件名，可设置）
   */
  copyImagePath(img) {
    const displayPath = img.resolvedPath || img.pure;
    const copyTarget = displayPath;
    navigator.clipboard.writeText(copyTarget).then(() => {
      new import_obsidian8.Notice(`\u5DF2\u590D\u5236: ${copyTarget}`);
    }).catch(() => {
      new import_obsidian8.Notice("\u590D\u5236\u5931\u8D25");
    });
  }
  /** 更新所有目录复选框的 checked/indeterminate 状态 */
  updateParentDirCheckboxes() {
    const mainList = this.containerEl.querySelector("#pic-main-list");
    if (!mainList) return;
    const dirHeaders = Array.from(mainList.querySelectorAll(".pic-dir-header[data-dir-key]"));
    dirHeaders.sort((a, b) => {
      const depthA = parseInt(a.dataset.depth || "0", 10);
      const depthB = parseInt(b.dataset.depth || "0", 10);
      return depthB - depthA;
    });
    for (const dirHeader of dirHeaders) {
      const dirContent = dirHeader.nextElementSibling;
      if (!dirContent || !dirContent.classList.contains("pic-dir-content")) continue;
      const dirCb = dirHeader.querySelector(".pic-cloud-checkbox");
      if (!dirCb) continue;
      const fileCbs = dirContent.querySelectorAll(".pic-item .pic-cloud-checkbox");
      if (fileCbs.length === 0) continue;
      let checkedCount = 0;
      fileCbs.forEach((cb) => {
        if (cb.checked) checkedCount++;
      });
      dirCb.checked = checkedCount === fileCbs.length;
      dirCb.indeterminate = checkedCount > 0 && checkedCount < fileCbs.length;
    }
  }
  /**
   * 打开指定笔记并跳转到此图片的引用位置
   */
  async jumpToFile(img, filePath, lineNumber) {
    const abstractFile = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (!abstractFile || !(abstractFile instanceof import_obsidian8.TFile)) {
      new import_obsidian8.Notice(`\u6587\u4EF6\u4E0D\u5B58\u5728: ${filePath}`);
      return;
    }
    try {
      const leaf = this.plugin.app.workspace.getLeaf(false);
      await leaf.openFile(abstractFile, { active: true });
      const editorView = this.plugin.app.workspace.activeEditor;
      if (editorView?.editor) {
        if (lineNumber && lineNumber > 0) {
          const line = Math.max(0, lineNumber - 1);
          editorView.editor.setCursor({ line, ch: 0 });
          editorView.editor.scrollIntoView({ from: { line: Math.max(0, line - 3), ch: 0 }, to: { line: line + 5, ch: 0 } }, true);
        } else {
          const content = editorView.editor.getValue();
          const searchStr = img.raw || img.pure;
          const pos = content.indexOf(searchStr);
          if (pos !== -1) {
            const { line } = editorView.editor.offsetToPos(pos);
            editorView.editor.setCursor({ line, ch: 0 });
            editorView.editor.scrollIntoView({ from: { line: Math.max(0, line - 3), ch: 0 }, to: { line: line + 5, ch: 0 } }, true);
          }
        }
      }
    } catch {
      new import_obsidian8.Notice(`\u65E0\u6CD5\u6253\u5F00\u6587\u4EF6: ${filePath}`);
    }
  }
  getLocalUnreferencedImages() {
    if (this.unreferencedCache !== null && this._unreferencedCacheBuiltAt === this.unreferencedCacheVersion) return this.unreferencedCache;
    const referencedPaths = /* @__PURE__ */ new Set();
    const referencedFileNames = /* @__PURE__ */ new Set();
    for (const img of this.localImages) {
      if (img.type === "local") {
        const path = img.resolvedPath || img.pure;
        referencedPaths.add(path);
        const fileName = extractFileName(path);
        if (fileName) referencedFileNames.add(fileName);
      }
    }
    this.unreferencedCache = this.app.vault.getFiles().filter((f) => {
      const ext = f.extension.toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) return false;
      if (referencedPaths.has(f.path)) return false;
      if (referencedFileNames.has(f.name)) return false;
      return true;
    });
    this._unreferencedCacheBuiltAt = this.unreferencedCacheVersion;
    return this.unreferencedCache;
  }
  /**
   * 获取云端未引用的图片（不被任何本地笔记引用的）
   */
  getCloudOnlyFiles() {
    return this.cloudFiles.filter(
      (f) => !f.isDirectory && (this.fileNameRefCount.get(extractFileName(f.name) || f.name) || 0) === 0
    );
  }
  /**
   * 获取空白文件夹（不包含任何文件或子文件夹的文件夹）
   */
  getEmptyFolders() {
    if (this.emptyFoldersCache) return this.emptyFoldersCache;
    const emptyFolders = [];
    const allFiles = this.app.vault.getFiles();
    const allFolders = this.app.vault.getAllLoadedFiles().filter(
      (f) => f instanceof import_obsidian8.TFolder
    );
    for (const folder of allFolders) {
      if (!folder.path || folder.path === "/" || folder.path.startsWith(".")) continue;
      const hasContent = allFiles.some((f) => f.path.startsWith(folder.path + "/")) || allFolders.some((f) => f.path.startsWith(folder.path + "/") && f.path !== folder.path);
      if (!hasContent) {
        emptyFolders.push(folder.path);
      }
    }
    if (this.cloudLoaded && this.cloudAllDirs.length > 0) {
      const dirsHasFile = /* @__PURE__ */ new Set();
      for (const f of this.cloudFiles) {
        if (!f.isDirectory && f.prefix) {
          const parts = f.prefix.split("/");
          for (let i = 1; i < parts.length; i++) {
            dirsHasFile.add(parts.slice(0, i).join("/") + "/");
          }
        }
      }
      for (const { dir, bedType } of this.cloudAllDirs) {
        if (!dirsHasFile.has(dir)) {
          emptyFolders.push(`[cloud:${bedType}] ${dir}`);
        }
      }
    }
    const unique = [...new Set(emptyFolders)];
    this.emptyFoldersCache = unique.sort((a, b) => {
      const depthA = a.split("/").length;
      const depthB = b.split("/").length;
      return depthB - depthA;
    });
    return this.emptyFoldersCache;
  }
  applyCloudFilter(files) {
    if (!this.searchKeyword) return files;
    const kw = this.searchKeyword;
    return files.filter((f) => f.name.toLowerCase().includes(kw));
  }
  // ==================== 云端未引用清理 ====================
  async cleanupUnreferenced(files) {
    const count = files.length;
    if (!await confirmAsync(this.app, { message: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${count} \u4E2A\u6587\u4EF6\u5417\uFF1F` })) return;
    let success = 0;
    let failed = 0;
    for (const file of files) {
      const bedType = file.bedType || this.selectedBed;
      const result = await this.plugin.deleteCloudFile(file.prefix || file.name, bedType);
      if (result.success) success++;
      else failed++;
    }
    this.selection.clear("cloudFiles" /* CloudFiles */);
    new import_obsidian8.Notice(`\u5220\u9664\u5B8C\u6210\uFF1A\u6210\u529F ${success} \u4E2A\uFF0C\u5931\u8D25 ${failed} \u4E2A`);
    await this.refresh();
  }
  /** 更新删除选中按钮的计数和禁用状态 */
  // ==================== 批量操作相关 ====================
  /** 批量复制云端文件为 Markdown 格式 */
  /** 批量复制云端文件为 HTML 格式 */
  /** 批量下载云端文件 */
  // ==================== 通用批量删除 ====================
  /**
   * 通用批量删除方法
   * @param section 选中区域
   * @param confirmMessage 确认对话框消息
   * @param items 要删除的项目列表
   * @param deleteReferences 是否删除笔记引用
   * @param onDeleteLocal 删除本地文件的回调
   * @param onDeleteCloud 删除云端文件的回调
   * @param onAfterDelete 删除完成后的回调（用于清理数据）
   */
  /** 批量删除选中的本地未引用图片 */
  // ==================== 工具方法 ====================
};

// src/scanner/VaultScanner.ts
var CACHE_VERSION = 2;
var VaultScanner = class {
  constructor(app, parser) {
    /** 扫描缓存：文件路径 → 缓存条目 */
    this.scanCache = /* @__PURE__ */ new Map();
    /** 脏文件集合：通过事件标记需要重扫的文件路径 */
    this.dirtyFiles = /* @__PURE__ */ new Set();
    this.app = app;
    this.parser = parser;
  }
  /** 标记文件为脏（需要重扫），由文件事件调用 */
  markDirty(filePath) {
    this.dirtyFiles.add(filePath);
  }
  /** 当前脏文件数量（调试用） */
  get dirtyCount() {
    return this.dirtyFiles.size;
  }
  /**
   * 扫描整个库，返回所有图片链接的使用统计
   * 支持增量扫描：仅重新扫描修改过的文件
   * 批量并行读取未缓存文件，提升大库扫描速度
   */
  async scan() {
    const result = /* @__PURE__ */ new Map();
    const mdFiles = this.app.vault.getMarkdownFiles();
    const filesToRead = [];
    const fileLinksMap = /* @__PURE__ */ new Map();
    for (const file of mdFiles) {
      const mtime = file.stat.mtime;
      const cached = this.scanCache.get(file.path);
      if (cached && cached.version === CACHE_VERSION && cached.mtime === mtime) {
        fileLinksMap.set(file.path, cached.links);
      } else {
        filesToRead.push(file);
      }
    }
    const CONCURRENCY = 20;
    for (let i = 0; i < filesToRead.length; i += CONCURRENCY) {
      const batch = filesToRead.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (file) => {
          const content = await this.app.vault.read(file);
          return { file, content };
        })
      );
      for (const { file, content } of results) {
        const links = this.parser.parse(content);
        this.scanCache.set(file.path, { mtime: file.stat.mtime, version: CACHE_VERSION, links });
        fileLinksMap.set(file.path, links);
      }
    }
    for (const file of mdFiles) {
      const links = fileLinksMap.get(file.path) || [];
      for (const link of links) {
        let resolvedPath;
        let found = true;
        if (link.type === "local") {
          const dest = this.app.metadataCache.getFirstLinkpathDest(link.pure, file.path);
          if (dest) {
            resolvedPath = dest.path;
          } else {
            const srcDir = file.path.substring(0, file.path.lastIndexOf("/"));
            const tryPath = srcDir ? `${srcDir}/${link.pure}` : link.pure;
            const tryFile = this.app.vault.getAbstractFileByPath(tryPath);
            if (tryFile) {
              resolvedPath = tryPath;
            } else {
              const fileName = link.pure.split("/").pop() || link.pure;
              const matchByName = this.app.vault.getFiles().find((f) => f.name === fileName);
              if (matchByName) {
                resolvedPath = matchByName.path;
              } else {
                resolvedPath = tryPath;
                found = false;
              }
            }
          }
        }
        const key = resolvedPath || link.pure;
        const line = link.line || 1;
        if (result.has(key)) {
          const existing = result.get(key);
          existing.count++;
          if (!existing.files.includes(file.path)) {
            existing.files.push(file.path);
          }
          if (!existing.fileLines) {
            existing.fileLines = /* @__PURE__ */ new Map();
          }
          if (!existing.fileLines.has(file.path)) {
            existing.fileLines.set(file.path, []);
          }
          existing.fileLines.get(file.path).push(line);
        } else {
          const fileLines = /* @__PURE__ */ new Map();
          fileLines.set(file.path, [line]);
          result.set(key, {
            ...link,
            resolvedPath,
            found,
            count: 1,
            files: [file.path],
            fileLines
          });
        }
      }
    }
    const currentFiles = new Set(mdFiles.map((f) => f.path));
    for (const cachedPath of this.scanCache.keys()) {
      if (!currentFiles.has(cachedPath)) {
        this.scanCache.delete(cachedPath);
      }
    }
    return result;
  }
  /**
   * 清除扫描缓存（强制下次全量扫描）
   */
  clearCache() {
    this.scanCache.clear();
  }
  /**
   * 增量失效：只清除已变更文件的缓存，保留未变化文件的缓存
   * 优先使用事件标记的脏文件，回退到 mtime 检测
   */
  invalidateChangedFiles() {
    const mdFiles = this.app.vault.getMarkdownFiles();
    const currentPaths = new Set(mdFiles.map((f) => f.path));
    for (const cachedPath of this.scanCache.keys()) {
      if (!currentPaths.has(cachedPath)) {
        this.scanCache.delete(cachedPath);
      }
    }
    if (this.dirtyFiles.size > 0) {
      for (const dirtyPath of this.dirtyFiles) {
        this.scanCache.delete(dirtyPath);
      }
      this.dirtyFiles.clear();
    }
    for (const file of mdFiles) {
      const cached = this.scanCache.get(file.path);
      if (cached && cached.mtime !== file.stat.mtime) {
        this.scanCache.delete(file.path);
      }
    }
  }
  /**
   * 序列化扫描缓存（用于持久化存储）
   * 将 Map 转换为可 JSON 序列化的数组格式
   */
  serialize() {
    const entries = [];
    for (const [path, entry] of this.scanCache) {
      entries.push([path, {
        mtime: entry.mtime,
        version: entry.version || 0,
        links: entry.links.map((link) => ({
          ...link,
          fileLines: link.fileLines ? [...link.fileLines.entries()] : void 0
        }))
      }]);
    }
    return JSON.stringify(entries);
  }
  /**
   * 从序列化数据恢复扫描缓存
   */
  loadSerialized(data) {
    try {
      const entries = JSON.parse(data);
      if (!Array.isArray(entries)) return;
      for (const [path, entry] of entries) {
        if (!path || typeof path !== "string" || !entry || typeof entry.mtime !== "number") continue;
        if (entry.version !== CACHE_VERSION) continue;
        const links = (entry.links || []).map((link) => {
          const fileLines = Array.isArray(link.fileLines) ? new Map(link.fileLines) : void 0;
          return { ...link, fileLines };
        });
        this.scanCache.set(path, { mtime: entry.mtime, version: CACHE_VERSION, links });
      }
    } catch (e) {
      console.warn("[PicLinker] \u626B\u63CF\u7F13\u5B58\u6570\u636E\u635F\u574F\uFF0C\u5DF2\u5FFD\u7565", e);
    }
  }
};

// src/imagebed/ImageBedManager.ts
var ImageBedManager = class {
  constructor() {
    this.beds = /* @__PURE__ */ new Map();
  }
  register(type, bed) {
    this.beds.set(type, bed);
  }
  get(type) {
    return this.beds.get(type);
  }
  getAll() {
    return Array.from(this.beds.values());
  }
  getTypes() {
    return Array.from(this.beds.keys());
  }
};

// src/imagebed/GitHubImageBed.ts
var GitHubImageBed = class {
  constructor() {
    this.token = "";
    this.owner = "";
    this.repo = "";
    this.branch = "main";
    this.path = "";
  }
  configure(settings) {
    this.token = cleanInvisible(settings.githubToken || "");
    this.owner = (settings.githubOwner || "").trim();
    this.repo = (settings.githubRepo || "").trim();
    this.branch = settings.githubBranch || "main";
    this.path = settings.githubPath || "images";
  }
  async listFiles() {
    if (!this.token || !this.owner || !this.repo) return [];
    const files = [];
    await this.fetchDirectoryContents(this.path, files);
    return files;
  }
  /**
   * 递归获取指定目录下的所有文件
   * 通过 GitHub API Link header 实现分页，自动拉取所有页
   */
  async fetchDirectoryContents(dirPath, files) {
    let pageUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${dirPath}?ref=${this.branch}`;
    while (pageUrl) {
      try {
        const response = await directFetch(pageUrl, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/vnd.github.v3+json"
          }
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data)) return;
        for (const item of data) {
          if (item.type === "file") {
            const name = item.name ?? "";
            const prefix = item.path ?? "";
            const downloadUrl = item.download_url || `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${prefix}`;
            files.push({ name, url: downloadUrl, prefix });
          } else if (item.type === "dir") {
            await this.fetchDirectoryContents(item.path ?? "", files);
          }
        }
        pageUrl = this.parseNextPageHeader(response);
      } catch (e) {
        console.warn("[PicLinker] GitHub \u76EE\u5F55\u5217\u8868\u83B7\u53D6\u5931\u8D25:", e instanceof Error ? e.message : String(e));
        return;
      }
    }
  }
  /**
   * 从 GitHub API 响应 Link header 解析下一页 URL
   * GitHub API 限制每页最多 100 条，超出的数据通过 Link header 分页
   */
  parseNextPageHeader(_response) {
    return null;
  }
  async delete(filename) {
    if (!this.token || !this.owner || !this.repo) {
      return { success: false, error: "GitHub \u56FE\u5E8A\u914D\u7F6E\u4E0D\u5B8C\u6574" };
    }
    const basePath = this.path ? `${this.path}/` : "";
    const path = `${basePath}${filename}`;
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`;
    try {
      const getResponse = await directFetch(`${url}?ref=${this.branch}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      if (!getResponse.ok) {
        return { success: false, error: "\u6587\u4EF6\u4E0D\u5B58\u5728" };
      }
      const data = await getResponse.json();
      const sha = data.sha;
      const deleteResponse = await directFetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: `Delete ${filename} via PicLinker`,
          sha,
          branch: this.branch
        })
      });
      if (!deleteResponse.ok) {
        const err = await deleteResponse.json();
        return { success: false, error: err.message || "\u5220\u9664\u5931\u8D25" };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: `\u5220\u9664\u5F02\u5E38: ${e}` };
    }
  }
  /**
   * 测试连接：尝试获取仓库信息
   */
  async testConnection() {
    if (!this.token || !this.owner || !this.repo) {
      const missing = [
        !this.token && "Token",
        !this.owner && "Owner",
        !this.repo && "Repo"
      ].filter(Boolean).join("\u3001");
      return { success: false, error: `\u8BF7\u586B\u5199\uFF1A${missing}` };
    }
    try {
      const response = await directFetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/vnd.github.v3+json"
          }
        }
      );
      if (response.ok) {
        return { success: true };
      }
      if (response.status === 401) return { success: false, error: "Token \u65E0\u6548\u6216\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210" };
      if (response.status === 404) return { success: false, error: `\u4ED3\u5E93 ${this.owner}/${this.repo} \u4E0D\u5B58\u5728` };
      if (response.status === 403) return { success: false, error: "\u6743\u9650\u4E0D\u8DB3\uFF0C\u8BF7\u786E\u8BA4 Token \u6709 repo \u6743\u9650" };
      const err = await response.json();
      return { success: false, error: err.message || `HTTP ${response.status}` };
    } catch {
      return { success: false, error: `\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5` };
    }
  }
  async createDirectory(_dirName) {
    return { success: false, error: "GitHub \u56FE\u5E8A\u4E0D\u652F\u6301\u521B\u5EFA\u76EE\u5F55" };
  }
  testCreateDirectoryCapability() {
    return Promise.resolve({ supported: false, reason: "GitHub \u56FE\u5E8A\u4E0D\u652F\u6301\u521B\u5EFA\u76EE\u5F55" });
  }
};

// src/utils/OssV4Signer.ts
async function sha256(data) {
  if (hasNodeRequire()) {
    const nodeCrypto = getNodeCrypto();
    return nodeCrypto.createHash("sha256").update(Buffer.from(data)).digest("hex");
  }
  const hashBuf = await crypto.subtle.digest("SHA-256", data.buffer);
  return Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function getRegion(endpoint) {
  const match = endpoint.match(/oss-([^.]+)\./);
  return match ? match[1] : "oss-cn-hangzhou";
}
async function hmacSha256(key, msg) {
  if (hasNodeRequire()) {
    const nodeCrypto = getNodeCrypto();
    if (typeof key === "string") {
      return nodeCrypto.createHmac("sha256", key).update(msg).digest();
    }
    const keyBuf = key instanceof Uint8Array ? Buffer.from(key) : Buffer.from(key);
    return nodeCrypto.createHmac("sha256", keyBuf).update(msg).digest();
  }
  const enc = new TextEncoder();
  if (typeof key === "string") {
    const rawKey2 = new Uint8Array(enc.encode(key));
    const k2 = await crypto.subtle.importKey("raw", rawKey2.buffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", k2, enc.encode(msg)));
  }
  const rawKey = new Uint8Array(key);
  const k = await crypto.subtle.importKey("raw", rawKey.buffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
async function deriveSigningKey(accessKeySecret, date8, region) {
  const kDate = await hmacSha256("aliyun_v4" + accessKeySecret, date8);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, "oss");
  return hmacSha256(kService, "aliyun_v4_request");
}
async function signOssV4(params) {
  const {
    method,
    canonicalUri,
    accessKeyId,
    accessKeySecret,
    region,
    expiresSeconds,
    subResources,
    headers,
    baseUrl,
    urlPath
  } = params;
  const now = /* @__PURE__ */ new Date();
  const dateStr = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const date8 = dateStr.slice(0, 8);
  const queryParams = new URLSearchParams();
  queryParams.set("x-oss-expires", String(expiresSeconds));
  queryParams.set("x-oss-date", dateStr);
  queryParams.set("x-oss-signature-version", "OSS4-HMAC-SHA256");
  queryParams.set(
    "x-oss-credential",
    `${accessKeyId}/${date8}/${region}/oss/aliyun_v4_request`
  );
  if (subResources) {
    for (const [k, v] of Object.entries(subResources)) {
      queryParams.set(k, v);
    }
  }
  queryParams.sort();
  let canonicalHeaders = "";
  let signedHeaders = "";
  if (headers && Object.keys(headers).length > 0) {
    const sortedKeys = Object.keys(headers).map((k) => k.toLowerCase()).sort();
    canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k]}`).join("\n") + "\n";
    signedHeaders = sortedKeys.join(";");
  }
  const canonicalRequest = [
    method,
    canonicalUri,
    queryParams.toString(),
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD"
  ].join("\n");
  const credentialScope = `${date8}/${region}/oss/aliyun_v4_request`;
  const hashedCanonicalReq = await sha256(new TextEncoder().encode(canonicalRequest));
  const stringToSign = [
    "OSS4-HMAC-SHA256",
    dateStr,
    credentialScope,
    hashedCanonicalReq
  ].join("\n");
  const signingKey = await deriveSigningKey(accessKeySecret, date8, region);
  const sigBuf = await hmacSha256(signingKey, stringToSign);
  const signature = Array.from(sigBuf).map((b) => b.toString(16).padStart(2, "0")).join("");
  queryParams.set("x-oss-signature", signature);
  return `${baseUrl}${urlPath ?? canonicalUri}?${queryParams.toString()}`;
}

// src/imagebed/AliyunOssImageBed.ts
var AliyunOssImageBed = class {
  constructor() {
    this.endpoint = "";
    this.bucket = "";
    this.accessKeyId = "";
    this.accessKeySecret = "";
    this.path = "images";
  }
  configure(settings) {
    this.endpoint = (settings.aliyunEndpoint || "").trim().replace(/\/+$/, "");
    this.bucket = (settings.aliyunBucket || "").trim();
    this.accessKeyId = cleanInvisible((settings.aliyunAccessKeyId || "").trim());
    this.accessKeySecret = cleanInvisible((settings.aliyunAccessKeySecret || "").trim());
    this.path = (settings.aliyunPath || "images").trim().replace(/^\/+|\/+$/g, "");
  }
  getBaseUrl() {
    const ep = this.endpoint.replace(/^https?:\/\//, "");
    return `https://${this.bucket}.${ep}`;
  }
  /**
   * 生成 OSS V4 预签名 URL（OSS4-HMAC-SHA256）
   *
   * @param method HTTP 方法
   * @param objectPath object 路径，如 /images/a.jpg
   * @param expiresSeconds 过期秒数（相对时间）
   * @param subResources 子资源参数
   */
  async signUrl(method, objectPath, expiresSeconds, subResources, headers) {
    const region = getRegion(this.endpoint);
    const encodedObjectPath = objectPath.split("/").map(encodeURIComponent).join("/");
    const canonicalUri = `/${this.bucket}${encodedObjectPath}`;
    return signOssV4({
      method,
      canonicalUri,
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      region,
      expiresSeconds,
      subResources,
      headers,
      baseUrl: this.getBaseUrl(),
      urlPath: encodedObjectPath
    });
  }
  /**
   * 生成服务级签名 URL（ListBuckets，不含 bucket 前缀）
   */
  async signServiceUrl(method, expiresSeconds) {
    const region = getRegion(this.endpoint);
    return signOssV4({
      method,
      canonicalUri: "/",
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      region,
      expiresSeconds,
      baseUrl: `https://oss-${region}.aliyuncs.com`
    });
  }
  async listFiles() {
    if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) {
      return [];
    }
    const files = [];
    let continuationToken = "";
    try {
      do {
        const expires = 3600;
        const resource = "/";
        const subResources = {
          "list-type": "2",
          "max-keys": "1000",
          "encoding-type": "url"
        };
        if (continuationToken) {
          subResources["continuation-token"] = continuationToken;
        }
        const url = await this.signUrl("GET", resource, expires, subResources);
        const response = await directFetch(url);
        if (!response.ok) {
          console.error("OSS ListObjects failed:", response.status);
          break;
        }
        const xmlText = await response.text();
        const { doc, error } = parseXml(xmlText);
        if (error) {
          console.error("OSS API Error:", error.code, error.message);
          break;
        }
        const baseUrl = this.getBaseUrl();
        const parsedFiles = parseXmlFileList(doc, baseUrl);
        for (const f of parsedFiles) {
          files.push({ ...f, isDirectory: false });
        }
        const nextToken = doc.querySelector("NextContinuationToken")?.textContent || "";
        const isTruncated = doc.querySelector("IsTruncated")?.textContent === "true";
        continuationToken = isTruncated ? nextToken : "";
      } while (continuationToken);
      const dirSet = /* @__PURE__ */ new Set();
      for (const file of files) {
        const key = file.prefix || "";
        const parts = key.split("/");
        for (let i = 1; i < parts.length; i++) {
          const dirPath = parts.slice(0, i).join("/") + "/";
          if (!dirSet.has(dirPath)) {
            dirSet.add(dirPath);
            const baseUrl = this.getBaseUrl();
            files.push({
              name: parts[i - 1] + "/",
              url: `${baseUrl}/${dirPath}`,
              isDirectory: true,
              prefix: dirPath
            });
          }
        }
      }
    } catch (e) {
      console.error("OSS listFiles error:", e instanceof Error ? e.message : String(e));
    }
    return files;
  }
  /**
   * 列出所有目录（含空目录）
   * 使用 delimiter=/ 获取 CommonPrefixes
   */
  async listEmptyDirs() {
    if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) return [];
    const dirs = /* @__PURE__ */ new Set();
    let continuationToken = "";
    try {
      do {
        const expires = 3600;
        const resource = "/";
        const subResources = {
          "list-type": "2",
          "max-keys": "1000",
          "delimiter": "/",
          "encoding-type": "url"
        };
        if (continuationToken) {
          subResources["continuation-token"] = continuationToken;
        }
        const url = await this.signUrl("GET", resource, expires, subResources);
        const response = await directFetch(url);
        if (!response.ok) break;
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const prefixes = xmlDoc.querySelectorAll("CommonPrefixes > Prefix");
        for (const node of prefixes) {
          const prefix = decodeURIComponent(node.textContent?.trim() || "");
          if (prefix) dirs.add(prefix);
        }
        const nextToken = xmlDoc.querySelector("NextContinuationToken")?.textContent || "";
        const isTruncated = xmlDoc.querySelector("IsTruncated")?.textContent === "true";
        continuationToken = isTruncated ? nextToken : "";
      } while (continuationToken);
    } catch (e) {
      console.warn("[PicLinker] listEmptyDirs error:", e instanceof Error ? e.message : String(e));
    }
    return [...dirs];
  }
  /**
   * 删除文件
   */
  async delete(filename) {
    if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) {
      return { success: false, error: "\u963F\u91CC\u4E91 OSS \u914D\u7F6E\u4E0D\u5B8C\u6574" };
    }
    try {
      const expires = 3600;
      const prefix = this.path ? `${this.path}/` : "images/";
      const objectKey = filename.includes("/") ? filename : `${prefix}${filename}`;
      const resource = `/${objectKey}`;
      const url = await this.signUrl("DELETE", resource, expires);
      const response = await directFetch(url, { method: "DELETE" });
      if (!response.ok) {
        return { success: false, error: `\u5220\u9664\u5931\u8D25: HTTP ${response.status}` };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: `\u5220\u9664\u5F02\u5E38: ${e}` };
    }
  }
  /**
   * 测试连接：尝试列出文件（限制 1 条）
   */
  async testConnection() {
    if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) {
      const missing = [
        !this.bucket && "Bucket",
        !this.endpoint && "Endpoint",
        !this.accessKeyId && "AccessKey ID",
        !this.accessKeySecret && "AccessKey Secret"
      ].filter(Boolean).join("\u3001");
      return { success: false, error: `\u8BF7\u586B\u5199\uFF1A${missing}` };
    }
    try {
      const expires = 60;
      const resource = "/";
      const subResources = { "list-type": "2", "max-keys": "1" };
      const url = await this.signUrl("GET", resource, expires, subResources);
      const response = await directFetch(url);
      if (response.ok || response.status === 404) {
        return { success: true };
      }
      const errText = await response.text();
      let detail = "";
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(errText, "application/xml");
        const code = xmlDoc.querySelector("Code")?.textContent;
        const msg = xmlDoc.querySelector("Message")?.textContent;
        if (code) {
          const friendly = {
            "InvalidAccessKeyId": "AccessKey ID \u65E0\u6548",
            "SignatureDoesNotMatch": "AccessKey Secret \u9519\u8BEF",
            "InvalidBucketName": "Bucket \u540D\u79F0\u65E0\u6548",
            "NoSuchBucket": "Bucket \u4E0D\u5B58\u5728",
            "AccessDenied": "\u6743\u9650\u4E0D\u8DB3\uFF0C\u8BF7\u68C0\u67E5 RAM \u7B56\u7565"
          };
          detail = friendly[code] || `${code}: ${msg}`;
        }
      } catch {
      }
      return { success: false, error: detail || `HTTP ${response.status}` };
    } catch {
      return { success: false, error: "\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u68C0\u67E5 Endpoint \u662F\u5426\u6B63\u786E" };
    }
  }
  /**
   * 创建目录（在 OSS 中 PUT 一个以 / 结尾的空对象）
   */
  async createDirectory(dirName) {
    if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) {
      return { success: false, error: "\u8BF7\u5148\u5B8C\u6210\u963F\u91CC\u4E91 OSS \u914D\u7F6E" };
    }
    try {
      const expires = 3600;
      const dirKey = dirName.endsWith("/") ? dirName : `${dirName}/`;
      const resource = `/${dirKey}`;
      const url = await this.signUrl("PUT", resource, expires);
      const response = await directFetch(url, {
        method: "PUT",
        body: "",
        headers: {
          "Content-Length": "0"
        }
      });
      if (!response.ok && response.status !== 200) {
        return { success: false, error: `\u521B\u5EFA\u76EE\u5F55\u5931\u8D25: HTTP ${response.status}` };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: `\u521B\u5EFA\u76EE\u5F55\u5F02\u5E38: ${e}` };
    }
  }
  async testCreateDirectoryCapability() {
    return { supported: true };
  }
  /**
   * 获取可用 Bucket 列表
   */
  async listBuckets() {
    if (!this.accessKeyId || !this.accessKeySecret) {
      return [];
    }
    try {
      const url = await this.signServiceUrl("GET", 60);
      const response = await directFetch(url);
      if (!response.ok) {
        const errText = await response.text();
        console.warn("[PicLinker] listBuckets: \u8BF7\u6C42\u5931\u8D25", response.status, errText.slice(0, 200));
        return [];
      }
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");
      const errorCode = xmlDoc.querySelector("Code");
      if (errorCode) {
        console.warn("[PicLinker] listBuckets: API \u9519\u8BEF", errorCode.textContent, xmlDoc.querySelector("Message")?.textContent);
        return [];
      }
      const buckets = [];
      const bucketNodes = xmlDoc.querySelectorAll("Bucket");
      for (const node of bucketNodes) {
        const name = node.querySelector("Name")?.textContent?.trim();
        const ep = node.querySelector("ExtranetEndpoint")?.textContent?.trim();
        if (name) buckets.push({ name, endpoint: ep || "" });
      }
      return buckets;
    } catch (e) {
      console.warn("[PicLinker] listBuckets: \u5F02\u5E38", e instanceof Error ? e.message : String(e));
      return [];
    }
  }
};

// src/utils/CosV1Signer.ts
async function hmacSha1(key, msg) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const buf = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(msg));
  return Array.from(new Uint8Array(buf)).map((b) => String.fromCharCode(b)).join("");
}
async function sha1Hex(data) {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-1", encoder.encode(data));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function signCosV1(params) {
  const { method, path, host, secretId, secretKey, headers, queryParams } = params;
  const now = /* @__PURE__ */ new Date();
  const timestamp = Math.floor(now.getTime() / 1e3);
  const keyTime = `${timestamp};${timestamp + 3600}`;
  const allHeaders = { host, ...headers };
  const sortedHeaderKeys = Object.keys(allHeaders).map((k) => k.toLowerCase()).sort();
  const headerList = sortedHeaderKeys.join(";");
  const paramList = queryParams ? Object.keys(queryParams).sort().join(";") : "";
  let canonicalQuery = "";
  if (queryParams) {
    const sortedKeys = Object.keys(queryParams).sort();
    canonicalQuery = sortedKeys.map((k) => `${k}=${encodeURIComponent(queryParams[k] ?? "")}`).join("&");
  }
  const signKey = await hmacSha1(secretKey, keyTime);
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${allHeaders[k]}`).join("\n") + "\n";
  const canonicalRequest = [
    method,
    path,
    canonicalQuery,
    canonicalHeaders,
    headerList,
    ""
  ].join("\n");
  const canonicalReqHash = await sha1Hex(canonicalRequest);
  const stringToSign = `sha1
${keyTime}
${canonicalReqHash}
`;
  const signature = btoa(await hmacSha1(signKey, stringToSign));
  const authorization = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=${headerList}&q-url-param-list=${paramList}&q-signature=${signature}`;
  let url = `https://${host}${path}`;
  if (canonicalQuery) {
    url += "?" + canonicalQuery;
  }
  return { url, authHeader: authorization };
}

// src/imagebed/TencentCosImageBed.ts
var TencentCosImageBed = class {
  constructor() {
    this.secretId = "";
    this.secretKey = "";
    this.bucket = "";
    this.region = "";
    this.path = "images";
  }
  configure(settings) {
    this.secretId = cleanInvisible((settings.tencentSecretId || "").trim());
    this.secretKey = cleanInvisible((settings.tencentSecretKey || "").trim());
    this.bucket = (settings.tencentBucket || "").trim();
    this.region = (settings.tencentRegion || "").trim();
    this.path = (settings.tencentPath || "images").trim().replace(/^\/+|\/+$/g, "");
  }
  getBaseUrl() {
    return `https://${this.bucket}.cos.${this.region}.myqcloud.com`;
  }
  getHost() {
    return `${this.bucket}.cos.${this.region}.myqcloud.com`;
  }
  /**
   * 生成 COS Authorization 签名头（V1 签名）
   */
  async signRequest(method, path, headers, queryParams) {
    return signCosV1({
      method,
      path,
      host: this.getHost(),
      secretId: this.secretId,
      secretKey: this.secretKey,
      headers,
      queryParams
    });
  }
  async listFiles() {
    if (!this.secretId || !this.secretKey || !this.bucket || !this.region) {
      return [];
    }
    const files = [];
    try {
      const baseUrl = this.getBaseUrl();
      let marker = "";
      do {
        const queryParams = {
          "max-keys": "1000",
          "prefix": "",
          "encoding-type": "url"
        };
        if (marker) {
          queryParams["marker"] = marker;
        }
        const { url, authHeader } = await this.signRequest("GET", "/", {}, queryParams);
        const response = await directFetch(url, {
          headers: { Authorization: authHeader }
        });
        if (!response.ok) {
          console.error("COS ListObjects failed:", response.status);
          break;
        }
        const xmlText = await response.text();
        const { doc, error } = parseXml(xmlText);
        if (error) {
          console.error("COS API Error:", error.code, error.message);
          break;
        }
        const parsedFiles = parseXmlFileList(doc, baseUrl);
        for (const f of parsedFiles) {
          files.push({ ...f, isDirectory: false });
        }
        const rawMarker = doc.querySelector("IsTruncated")?.textContent === "true" ? doc.querySelector("NextMarker")?.textContent || "" : "";
        try {
          marker = rawMarker ? decodeURIComponent(rawMarker) : "";
        } catch {
          marker = rawMarker;
        }
      } while (marker);
      const dirSet = /* @__PURE__ */ new Set();
      for (const file of files) {
        const parts = (file.prefix || "").split("/");
        for (let i = 1; i < parts.length; i++) {
          const dirPath = parts.slice(0, i).join("/") + "/";
          if (!dirSet.has(dirPath)) {
            dirSet.add(dirPath);
            files.push({
              name: parts[i - 1] + "/",
              url: `${this.getBaseUrl()}/${dirPath}`,
              isDirectory: true,
              prefix: dirPath
            });
          }
        }
      }
    } catch (e) {
      console.error("COS listFiles error:", e instanceof Error ? e.message : String(e));
    }
    return files;
  }
  async delete(filename) {
    if (!this.secretId || !this.secretKey || !this.bucket || !this.region) {
      return { success: false, error: "\u817E\u8BAF\u4E91 COS \u914D\u7F6E\u4E0D\u5B8C\u6574" };
    }
    try {
      const prefix = this.path ? `${this.path}/` : "images/";
      const objectKey = filename.includes("/") ? filename : `${prefix}${filename}`;
      const { url, authHeader } = await this.signRequest("DELETE", `/${objectKey}`);
      const response = await directFetch(url, {
        method: "DELETE",
        headers: { Authorization: authHeader }
      });
      if (!response.ok) {
        return { success: false, error: `\u5220\u9664\u5931\u8D25: HTTP ${response.status}` };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: `\u5220\u9664\u5F02\u5E38: ${e}` };
    }
  }
  /**
   * 测试连接：尝试 ListObjects（限制 1 条）
   */
  async testConnection() {
    if (!this.secretId || !this.secretKey || !this.bucket || !this.region) {
      const missing = [
        !this.secretId && "SecretId",
        !this.secretKey && "SecretKey",
        !this.bucket && "Bucket",
        !this.region && "Region"
      ].filter(Boolean).join("\u3001");
      return { success: false, error: `\u8BF7\u586B\u5199\uFF1A${missing}` };
    }
    try {
      const queryParams = {
        "max-keys": "1",
        "prefix": ""
      };
      const { url, authHeader } = await this.signRequest("GET", "/", {}, queryParams);
      const response = await directFetch(url, { headers: { Authorization: authHeader } });
      if (response.ok || response.status === 404) {
        return { success: true };
      }
      if (response.status === 403) {
        return { success: false, error: "\u6743\u9650\u4E0D\u8DB3\uFF0C\u8BF7\u68C0\u67E5\u5BC6\u94A5\u548C\u6876\u7684 ACL/\u7B56\u7565\u914D\u7F6E" };
      }
      const errText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errText.slice(0, 100)}` };
    } catch {
      return { success: false, error: "\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u68C0\u67E5 Region \u662F\u5426\u6B63\u786E" };
    }
  }
  async createDirectory(dirName) {
    if (!this.secretId || !this.secretKey || !this.bucket || !this.region) {
      return { success: false, error: "\u8BF7\u5148\u5B8C\u6210\u817E\u8BAF\u4E91 COS \u914D\u7F6E" };
    }
    try {
      const dirKey = dirName.endsWith("/") ? dirName : `${dirName}/`;
      const { url, authHeader } = await this.signRequest("PUT", `/${dirKey}`);
      const response = await directFetch(url, {
        method: "PUT",
        body: "",
        headers: {
          Authorization: authHeader,
          "Content-Length": "0"
        }
      });
      if (!response.ok && response.status !== 200) {
        return { success: false, error: `\u521B\u5EFA\u76EE\u5F55\u5931\u8D25: HTTP ${response.status}` };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: `\u521B\u5EFA\u76EE\u5F55\u5F02\u5E38: ${e}` };
    }
  }
  async testCreateDirectoryCapability() {
    return { supported: true };
  }
  /**
   * 获取可用 Bucket 列表（使用 GetService API）
   * 参考: https://cloud.tencent.com/document/product/436/8291
   */
  async listBuckets() {
    if (!this.secretId || !this.secretKey) return [];
    try {
      const now = /* @__PURE__ */ new Date();
      const timestamp = Math.floor(now.getTime() / 1e3);
      const keyTime = `${timestamp};${timestamp + 3600}`;
      const signKey = await hmacSha1(this.secretKey, keyTime);
      const canonicalHeaders = "host:service.cos.myqcloud.com\n";
      const canonicalRequest = ["GET", "/", "", canonicalHeaders, "host", ""].join("\n");
      const canonicalReqHash = await sha1Hex(canonicalRequest);
      const stringToSign = `sha1
${keyTime}
${canonicalReqHash}
`;
      const signature = btoa(await hmacSha1(signKey, stringToSign));
      const authorization = `q-sign-algorithm=sha1&q-ak=${this.secretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=host&q-url-param-list=&q-signature=${signature}`;
      const response = await directFetch("https://service.cos.myqcloud.com/", {
        headers: { Authorization: authorization }
      });
      if (!response.ok) return [];
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");
      const buckets = [];
      const bucketNodes = xmlDoc.querySelectorAll("Bucket");
      for (const node of bucketNodes) {
        const name = node.querySelector("Name")?.textContent?.trim() || "";
        const loc = node.querySelector("Location")?.textContent?.trim() || "";
        if (name) {
          buckets.push({ name, endpoint: loc });
        }
      }
      return buckets;
    } catch (e) {
      console.warn("[PicLinker] COS listBuckets \u5931\u8D25:", e instanceof Error ? e.message : String(e));
      return [];
    }
  }
  /**
   * 列出所有目录（含空目录，使用 delimiter 获取 CommonPrefixes）
   */
  async listEmptyDirs() {
    if (!this.secretId || !this.secretKey || !this.bucket || !this.region) return [];
    const dirs = /* @__PURE__ */ new Set();
    let marker = "";
    try {
      do {
        const queryParams = {
          "max-keys": "1000",
          "delimiter": "/",
          "encoding-type": "url"
        };
        if (marker) queryParams["marker"] = marker;
        const { url, authHeader } = await this.signRequest("GET", "/", {}, queryParams);
        const response = await directFetch(url, { headers: { Authorization: authHeader } });
        if (!response.ok) break;
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const prefixes = xmlDoc.querySelectorAll("CommonPrefixes > Prefix");
        for (const node of prefixes) {
          const prefix = decodeURIComponent(node.textContent?.trim() || "");
          if (prefix) dirs.add(prefix);
        }
        const rawMarker = xmlDoc.querySelector("IsTruncated")?.textContent === "true" ? xmlDoc.querySelector("NextMarker")?.textContent || "" : "";
        try {
          marker = rawMarker ? decodeURIComponent(rawMarker) : "";
        } catch {
          marker = rawMarker;
        }
      } while (marker);
    } catch (e) {
      console.warn("[PicLinker] COS listEmptyDirs \u5931\u8D25:", e instanceof Error ? e.message : String(e));
    }
    return [...dirs];
  }
};

// src/imagebed/SmmsImageBed.ts
var SMMS_API = "https://smms.app/api/v2";
var HASH_CACHE_MAX = 500;
var SmmsImageBed = class {
  constructor() {
    this.token = "";
    /** 文件名 → hash 缓存，避免删除时重复拉取上传历史 */
    this.hashCache = /* @__PURE__ */ new Map();
    /** 上次 listFiles 返回的文件列表缓存（有 5 分钟有效期，避免 SM.MS API 频率限制） */
    this.cachedFiles = null;
    /** 上次 listFiles 拉取时间戳 */
    this.lastListFetchAt = 0;
  }
  configure(settings) {
    const newToken = cleanInvisible(settings.smmsToken || "").trim();
    if (this.token !== newToken) {
      this.cachedFiles = null;
      this.lastListFetchAt = 0;
      this.hashCache.clear();
    }
    this.token = newToken;
  }
  async listFiles() {
    if (!this.token) return [];
    const now = Date.now();
    if (this.cachedFiles && now - this.lastListFetchAt < 3e5) {
      return this.cachedFiles;
    }
    try {
      const response = await directFetch(`${SMMS_API}/upload_history`, {
        headers: {
          Authorization: this.token
        }
      });
      if (!response.ok) return this.cachedFiles || [];
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) return this.cachedFiles || [];
      for (const item of data.data) {
        const name = item.filename || item.origin_name || "";
        if (name && item.hash) {
          if (this.hashCache.size >= HASH_CACHE_MAX) {
            const firstKey = this.hashCache.keys().next().value;
            if (firstKey) this.hashCache.delete(firstKey);
          }
          this.hashCache.set(name, item.hash);
        }
      }
      const mappedFiles = data.data.map((item) => ({
        name: item.filename || item.origin_name || "",
        url: item.url || "",
        isDirectory: false,
        prefix: item.filename || item.origin_name || ""
      }));
      this.cachedFiles = mappedFiles;
      this.lastListFetchAt = now;
      return mappedFiles;
    } catch (e) {
      console.warn("[PicLinker] SM.MS \u83B7\u53D6\u6587\u4EF6\u5217\u8868\u5931\u8D25:", e instanceof Error ? e.message : String(e));
      return this.cachedFiles || [];
    }
  }
  async delete(filename) {
    if (!this.token) {
      return { success: false, error: "SM.MS Token \u672A\u914D\u7F6E" };
    }
    try {
      let hash = this.hashCache.get(filename);
      if (!hash) {
        const historyRes = await directFetch(`${SMMS_API}/upload_history`, {
          headers: { Authorization: this.token }
        });
        if (!historyRes.ok) return { success: false, error: "\u67E5\u8BE2\u6587\u4EF6\u5931\u8D25" };
        const historyData = await historyRes.json();
        if (!historyData.success || !Array.isArray(historyData.data)) {
          return { success: false, error: "\u67E5\u8BE2\u6587\u4EF6\u5217\u8868\u5931\u8D25" };
        }
        for (const item of historyData.data) {
          const name = item.filename || item.origin_name || "";
          if (name && item.hash) {
            if (this.hashCache.size >= HASH_CACHE_MAX) {
              const firstKey = this.hashCache.keys().next().value;
              if (firstKey) this.hashCache.delete(firstKey);
            }
            this.hashCache.set(name, item.hash);
          }
        }
        hash = this.hashCache.get(filename);
      }
      if (!hash) {
        return { success: false, error: "\u672A\u627E\u5230\u6587\u4EF6" };
      }
      const deleteRes = await directFetch(`${SMMS_API}/delete/${hash}`, {
        method: "POST",
        headers: { Authorization: this.token }
      });
      const deleteData = await deleteRes.json();
      if (!deleteData.success) {
        return { success: false, error: deleteData.message || "\u5220\u9664\u5931\u8D25" };
      }
      this.hashCache.delete(filename);
      return { success: true };
    } catch (e) {
      return { success: false, error: `\u5220\u9664\u5F02\u5E38: ${e}` };
    }
  }
  /**
   * 测试连接：尝试获取上传历史（验证 Token 有效性）
   */
  async testConnection() {
    if (!this.token) return { success: false, error: "\u8BF7\u586B\u5199 API Token" };
    try {
      const response = await directFetch(`${SMMS_API}/upload_history`, {
        headers: { Authorization: this.token }
      });
      if (response.status === 401) {
        return { success: false, error: "Token \u65E0\u6548\uFF0C\u8BF7\u5728 sm.ms \u540E\u53F0\u91CD\u65B0\u83B7\u53D6" };
      }
      if (response.ok) {
        const data = await response.json();
        if (data.success === false && data.message) {
          return { success: false, error: data.message };
        }
        return { success: true };
      }
      return { success: false, error: `HTTP ${response.status}` };
    } catch {
      return { success: false, error: "\u7F51\u7EDC\u5F02\u5E38\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5" };
    }
  }
  async createDirectory(_dirName) {
    return { success: false, error: "SM.MS \u4E0D\u652F\u6301\u521B\u5EFA\u76EE\u5F55" };
  }
  testCreateDirectoryCapability() {
    return Promise.resolve({ supported: false, reason: "SM.MS \u4E0D\u652F\u6301\u521B\u5EFA\u76EE\u5F55" });
  }
};

// src/utils/DedupCache.ts
var MAX_CACHE_SIZE2 = 2e4;
var DedupCache = class {
  constructor(serialized) {
    this.cache = /* @__PURE__ */ new Map();
    if (serialized) {
      try {
        const arr = JSON.parse(serialized);
        if (Array.isArray(arr)) {
          for (const entry of arr) {
            if (entry && typeof entry === "object" && "path" in entry && "hash" in entry) {
              const e = entry;
              if (e.path && e.hash) this.cache.set(e.path, e);
            }
          }
        }
      } catch (e) {
        console.warn("[PicLinker] DedupCache \u6570\u636E\u635F\u574F\uFF0C\u5DF2\u6E05\u7A7A\u91CD\u5EFA", e);
      }
    }
  }
  /** 获取缓存的哈希（LRU：更新访问顺序） */
  get(path) {
    const entry = this.cache.get(path);
    if (entry) {
      this.cache.delete(path);
      this.cache.set(path, entry);
    }
    return entry || null;
  }
  /** 存入缓存 */
  set(entry) {
    if (this.cache.size >= MAX_CACHE_SIZE2 && !this.cache.has(entry.path)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(entry.path, entry);
  }
  /** 检查是否有缓存 */
  has(path) {
    return this.cache.has(path);
  }
  /** 移除缓存 */
  remove(path) {
    this.cache.delete(path);
  }
  /** 序列化 */
  serialize() {
    return JSON.stringify([...this.cache.values()]);
  }
};

// src/utils/FrontmatterParser.ts
var BED_ALIASES = {
  "github": "GitHub",
  "gh": "GitHub",
  "aliyun": "\u963F\u91CC\u4E91 OSS",
  "ali": "\u963F\u91CC\u4E91 OSS",
  "oss": "\u963F\u91CC\u4E91 OSS",
  "tencent": "\u817E\u8BAF\u4E91 COS",
  "cos": "\u817E\u8BAF\u4E91 COS",
  "tx": "\u817E\u8BAF\u4E91 COS",
  "other": "\u5176\u4ED6\u56FE\u5E8A",
  "smms": "\u5176\u4ED6\u56FE\u5E8A",
  "sm.ms": "\u5176\u4ED6\u56FE\u5E8A"
};
function parseBedValue(raw) {
  const value = raw.trim().replace(/^["']|["']$/g, "");
  const lower = value.toLowerCase();
  if (BED_ALIASES[lower]) {
    return BED_ALIASES[lower];
  }
  if (value === "GitHub" || value === "\u963F\u91CC\u4E91 OSS" || value === "\u817E\u8BAF\u4E91 COS" || value === "\u5176\u4ED6\u56FE\u5E8A") {
    return value;
  }
  return value;
}
function parseFrontmatter(content) {
  const lines = content.split("\n");
  if (lines.length < 2 || lines[0].replace(/\r$/, "").trim() !== "---") return null;
  const yamlLines = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.replace(/\r$/, "").trim() === "---") {
      const yaml = yamlLines.join("\n");
      if (!yaml.trim()) return null;
      const config = {};
      const bedMatch = yaml.match(/^(?:image[-_]?bed)\s*:\s*(.+)$/im);
      if (bedMatch) config.imageBed = parseBedValue(bedMatch[1]);
      const autoMatch = yaml.match(/^(?:auto[-_]?upload)\s*:\s*(true|false)$/im);
      if (autoMatch) config.autoUpload = autoMatch[1] === "true";
      const pathMatch = yaml.match(/^(?:image[-_]?path)\s*:\s*(.+)$/im);
      if (pathMatch) config.imagePath = pathMatch[1].trim().replace(/^["']|["']$/g, "");
      if (config.imageBed === void 0 && config.autoUpload === void 0 && config.imagePath === void 0) {
        return null;
      }
      return config;
    }
    yamlLines.push(line);
  }
  return null;
}

// src/utils/SecureStorage.ts
var ENC_PREFIX = "enc:v1:";
var SENSITIVE_FIELDS = [
  "githubToken",
  "aliyunAccessKeyId",
  "aliyunAccessKeySecret",
  "tencentSecretId",
  "tencentSecretKey",
  "smmsToken",
  "webdavPassword",
  "otherBedPassword"
];
function isEncrypted(value) {
  return value.startsWith(ENC_PREFIX);
}
var KEY_MATERIAL_V2 = "PicLinker-v2:aes-gcm-pbkdf2-100k";
var KEY_MATERIAL_V1 = "PicLinker-v1";
async function deriveKey(salt, material = KEY_MATERIAL_V2) {
  if (!salt) {
    throw new Error("[PicLinker] deriveKey: salt \u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u68C0\u67E5 vault \u540D\u79F0\u662F\u5426\u53EF\u83B7\u53D6");
  }
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(material),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function encryptValue(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < combined.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(combined.subarray(i, i + chunkSize)));
  }
  return ENC_PREFIX + btoa(binary);
}
async function decryptValue(ciphertext, key) {
  const raw = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}
async function encryptSensitiveFields(settings, deviceSalt) {
  const key = await deriveKey(deviceSalt);
  const result = { ...settings };
  for (const field of SENSITIVE_FIELDS) {
    const value = result[field];
    if (typeof value === "string" && value && !isEncrypted(value)) {
      result[field] = await encryptValue(value, key);
    }
  }
  return result;
}
async function decryptSensitiveFields(settings, deviceSalt) {
  const keyV2 = await deriveKey(deviceSalt, KEY_MATERIAL_V2);
  const result = { ...settings };
  for (const field of SENSITIVE_FIELDS) {
    const value = result[field];
    if (typeof value === "string" && isEncrypted(value)) {
      const cipher = value.slice(ENC_PREFIX.length);
      try {
        result[field] = await decryptValue(cipher, keyV2);
      } catch (e2) {
        try {
          const keyV1 = await deriveKey(deviceSalt, KEY_MATERIAL_V1);
          result[field] = await decryptValue(cipher, keyV1);
        } catch (e1) {
          console.warn(`[PicLinker] \u89E3\u5BC6\u5B57\u6BB5 ${field} \u5931\u8D25 (v2: ${e2}, v1: ${e1})\uFF0C\u5DF2\u6E05\u7A7A`);
          result[field] = "";
        }
      }
    }
  }
  return result;
}

// src/editor/LinkEditor.ts
var import_obsidian9 = require("obsidian");
var LinkEditor = class {
  constructor(app) {
    this.app = app;
  }
  /**
   * 替换本地链接为云端链接（保留 params）
   * 遍历 img.files 中所有引用文件，逐个替换
   */
  async replaceLink(img, newPure) {
    if (img.files.length === 0) {
      new import_obsidian9.Notice("\u65E0\u6CD5\u786E\u5B9A\u56FE\u7247\u5F15\u7528\u7684\u6587\u4EF6\uFF0C\u8DF3\u8FC7\u66FF\u6362");
      return;
    }
    const targetFiles = img.files;
    for (const filePath of targetFiles) {
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof import_obsidian9.TFile)) continue;
      const content = await this.app.vault.read(file);
      let newContent;
      if (img.raw.startsWith("![[") && img.raw.endsWith("]]")) {
        const newWikiLink = img.params ? `![[${newPure}|${img.params}]]` : `![[${newPure}]]`;
        const escaped = escapeRegex(img.raw);
        newContent = content.replace(new RegExp(escaped, "g"), newWikiLink);
      } else {
        const escapedPure = escapeRegex(img.pure);
        const safeReplacement = `$1${newPure.replace(/\$/g, "$$$$")}$2`;
        newContent = content.replace(
          new RegExp(`(!\\[[^\\]]*\\]\\()${escapedPure}(\\))`, "g"),
          safeReplacement
        );
      }
      if (newContent !== content) {
        await this.app.vault.modify(file, newContent);
      }
    }
  }
  /**
   * 从单个 Markdown 文件中移除图片引用
   * 移除后如果行变为空，则删除该行
   * @returns 修改的行数（含删除的空行）
   */
  async removeImageFromMdFile(filePath, imagePaths) {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof import_obsidian9.TFile)) return 0;
    const content = await this.app.vault.read(file);
    const lines = content.split("\n");
    const linesToDelete = /* @__PURE__ */ new Set();
    let modifiedCount = 0;
    for (let i = 0; i < lines.length; i++) {
      for (const imgPath of imagePaths) {
        const cleaned = this.removeImageFromLine(lines[i], imgPath);
        if (cleaned !== lines[i]) {
          lines[i] = cleaned;
          modifiedCount++;
          if (!lines[i].trim()) linesToDelete.add(i);
        }
      }
    }
    const newLines = lines.filter((_, idx) => !linesToDelete.has(idx));
    if (newLines.length < lines.length || content !== newLines.join("\n")) {
      await this.app.vault.modify(file, newLines.join("\n"));
    }
    return modifiedCount;
  }
  /**
   * 在 Markdown 文件中替换图片路径（用于去重合并）
   * @param candidates 可选的候选文件路径列表（来自 VaultScanner 的反向索引），有值时只扫描这些文件；无值时回退全库扫描
   * @returns 被修改的文件数
   */
  async replaceImageInMdFiles(oldPath, newPath, candidates) {
    const escaped = escapeRegex(oldPath);
    const escapedNew = newPath.replace(/\$/g, "$$$$");
    const mdRegex = new RegExp(`(!\\[[^\\]]*\\]\\()${escaped}(\\))`, "g");
    const wikiRegex = new RegExp(`(!?\\[\\[)${escaped}(\\|[^\\]]*)?(\\]\\])`, "g");
    const htmlRegex = new RegExp(`(<img[^>]*src=["'])${escaped}(["'][^>]*/?>)`, "g");
    let count = 0;
    const filesToScan = candidates && candidates.length > 0 ? candidates.map((p) => this.app.vault.getAbstractFileByPath(p)).filter((f) => f instanceof import_obsidian9.TFile) : this.app.vault.getMarkdownFiles();
    for (const mdFile of filesToScan) {
      const content = await this.app.vault.cachedRead(mdFile);
      if (!content.includes(oldPath)) continue;
      let newContent = content;
      newContent = newContent.replace(mdRegex, `$1${escapedNew}$2`);
      newContent = newContent.replace(wikiRegex, `$1${escapedNew}$2$3`);
      newContent = newContent.replace(htmlRegex, `$1${escapedNew}$2`);
      if (newContent !== content) {
        await this.app.vault.modify(mdFile, newContent);
        count++;
      }
    }
    return count;
  }
  /**
   * 从所有 Markdown 文件中移除图片引用
   * @returns 被修改的文件数
   */
  async removeImageFromAllMdFiles(imagePaths) {
    let count = 0;
    for (const mdFile of this.app.vault.getMarkdownFiles()) {
      const modified = await this.removeImageFromMdFile(mdFile.path, imagePaths);
      if (modified > 0) count++;
    }
    return count;
  }
  /** 智能移除行中的图片引用，保留行中其他内容 */
  removeImageFromLine(line, imgPath) {
    let result = line.replace(
      new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegex(imgPath)}\\)`, "g"),
      ""
    );
    result = result.replace(
      new RegExp(`!?\\[\\[${escapeRegex(imgPath)}(\\|[^\\]]*)?\\]\\]`, "g"),
      ""
    );
    result = result.replace(
      new RegExp(`<img[^>]*src=["']${escapeRegex(imgPath)}["'][^>]*/?>`, "g"),
      ""
    );
    return result;
  }
};

// src/sync/WebDAVSync.ts
var WebDAVSync = class {
  constructor(settings, vaultName, onSettingsChanged) {
    this.settings = settings;
    this.vaultName = vaultName;
    this.onSettingsChanged = onSettingsChanged;
    this.meta = null;
    /** 标记位：syncFromRemote 下载后禁止自动上传回远程，防止循环 */
    this.skipAutoUpload = false;
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  /**
   * 获取图床配置的明文数据（用于 WebDAV 同步）
   * 解密敏感字段后再返回，确保远程存储的是明文，
   * 其他设备下载后可以用本地密钥重新加密
   */
  async getDecryptedBedSettings() {
    const salt = `imagelmgr:${this.vaultName}`;
    const decrypted = await decryptSensitiveFields(this.settings, salt);
    const bedData = {};
    for (const k of BED_SETTINGS_KEYS) {
      bedData[k] = typeof decrypted[k] === "string" ? decrypted[k] : "";
    }
    return bedData;
  }
  /**
   * WebDAV 静默自动上传（不弹 Notice）
   */
  async syncToRemote() {
    await this.uploadToWebdav();
  }
  /**
   * 公共上传逻辑：MKCOL 创建目录 → PUT 上传配置
   * 同时被 SettingTab.syncToRemote() 和本类的 syncToRemote() 调用
   * @returns { ok: boolean, status?: number, message?: string }
   */
  async uploadToWebdav() {
    if (!this.settings.webdavUrl || !this.settings.webdavUsername || !this.settings.webdavPassword) {
      return { ok: false, message: "WebDAV \u914D\u7F6E\u4E0D\u5B8C\u6574" };
    }
    if (!this.settings.webdavUrl.startsWith("https://")) {
      console.warn("[PicLinker] WebDAV \u4EC5\u652F\u6301 HTTPS\uFF0C\u5DF2\u8DF3\u8FC7\u540C\u6B65");
      return { ok: false, message: "WebDAV \u4EC5\u652F\u6301 HTTPS" };
    }
    try {
      const url = `${this.settings.webdavUrl}${this.settings.webdavRemotePath.replace(/^\//, "")}`;
      const auth = safeBtoa(`${this.settings.webdavUsername}:${this.settings.webdavPassword}`);
      const dirUrl = url.substring(0, url.lastIndexOf("/"));
      await directFetch(dirUrl + "/", {
        method: "MKCOL",
        headers: { Authorization: `Basic ${auth}` }
      });
      const bedData = await this.getDecryptedBedSettings();
      bedData._syncedAt = (/* @__PURE__ */ new Date()).toISOString();
      const response = await directFetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bedData, null, 2)
      });
      if (response.ok || response.status === 201 || response.status === 204) {
        return { ok: true, status: response.status };
      }
      return { ok: false, status: response.status, message: `HTTP ${response.status}` };
    } catch (e) {
      console.warn("[PicLinker] syncToRemote: \u5F02\u5E38", e);
      return { ok: false, message: `\u5F02\u5E38: ${e}` };
    }
  }
  /**
   * 从服务器下载并带冲突检测
   * @returns 冲突信息或 null
   */
  async syncFromRemote() {
    if (!this.settings.webdavUrl || !this.settings.webdavUsername || !this.settings.webdavPassword) {
      return { success: false, error: "\u8BF7\u5148\u586B\u5199 WebDAV \u670D\u52A1\u5668\u914D\u7F6E", conflict: false };
    }
    if (!this.settings.webdavUrl.startsWith("https://")) {
      return { success: false, error: "WebDAV \u4EC5\u652F\u6301 HTTPS \u8FDE\u63A5", conflict: false };
    }
    let localSyncedAt;
    let remoteSyncedAt;
    try {
      const url = `${this.settings.webdavUrl}${this.settings.webdavRemotePath.replace(/^\//, "")}`;
      const auth = safeBtoa(`${this.settings.webdavUsername}:${this.settings.webdavPassword}`);
      const response = await directFetch(url, { headers: { Authorization: `Basic ${auth}` } });
      if (!response.ok) {
        return { success: false, error: `\u4E0B\u8F7D\u5931\u8D25: HTTP ${response.status}`, conflict: false };
      }
      const remoteData = await response.json();
      if (!remoteData || typeof remoteData !== "object") {
        return { success: false, error: "\u8FDC\u7A0B\u6570\u636E\u683C\u5F0F\u65E0\u6548", conflict: false };
      }
      remoteSyncedAt = remoteData._syncedAt;
      if (this.meta) localSyncedAt = this.meta.lastSyncedAt;
      if (localSyncedAt && remoteSyncedAt) {
        const lastSyncTime = new Date(localSyncedAt).getTime();
        const remoteTime = new Date(remoteSyncedAt).getTime();
        const localModifiedAt = this.meta?.lastLocalModifiedAt;
        const localModifiedTime = localModifiedAt ? new Date(localModifiedAt).getTime() : 0;
        const localModified = localModifiedTime > lastSyncTime;
        const remoteModified = remoteTime > lastSyncTime;
        if (localModified && remoteModified) {
          return {
            success: false,
            error: "\u68C0\u6D4B\u5230\u914D\u7F6E\u53EF\u80FD\u5B58\u5728\u51B2\u7A81",
            conflict: true,
            remoteNewer: remoteTime > localModifiedTime,
            localNewer: localModifiedTime > remoteTime
          };
        }
      }
      for (const k of BED_SETTINGS_KEYS) {
        if (k in remoteData && typeof remoteData[k] === "string") {
          this.settings[k] = remoteData[k];
        }
      }
      this.meta = {
        lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastSyncSource: "download",
        lastRemoteModifiedAt: remoteSyncedAt
      };
      this.skipAutoUpload = true;
      await this.onSettingsChanged(this.settings);
      return { success: true, conflict: false };
    } catch (e) {
      return { success: false, error: `\u4E0B\u8F7D\u5F02\u5E38: ${e}`, conflict: false };
    }
  }
};

// src/main.ts
var DEFAULT_SETTINGS = {
  // 插件通用设置
  showPath: true,
  // 插件功能
  showLocalImages: true,
  showCloudImages: true,
  showLocalUnreferenced: true,
  showCloudUnreferenced: true,
  showNotFoundImages: true,
  showEmptyFolders: true,
  showDuplicates: true,
  showSameNameFiles: true,
  // WebDAV 同步
  webdavEnable: false,
  webdavUrl: "",
  webdavUsername: "",
  webdavPassword: "",
  webdavRemotePath: "/PicLinker/settings.json",
  webdavAutoSync: false,
  // 图床配置
  githubToken: "",
  githubOwner: "",
  githubRepo: "",
  githubBranch: "main",
  githubPath: "images",
  aliyunEndpoint: "",
  aliyunBucket: "",
  aliyunAccessKeyId: "",
  aliyunAccessKeySecret: "",
  aliyunPath: "images",
  tencentSecretId: "",
  tencentSecretKey: "",
  tencentBucket: "",
  tencentRegion: "",
  tencentPath: "images",
  smmsToken: "",
  otherBedName: "",
  otherBedUrl: "",
  otherBedUsername: "",
  otherBedPassword: "",
  otherBedPath: ""
};
var PicLinkerPlugin = class extends import_obsidian10.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.view = null;
    /** 文件哈希缓存（SHA-256 → HashEntry{url, bedType, uploadedAt}，用于去重和比对） */
    this.hashCache = new HashCache();
    /** 图片去重哈希缓存（文件路径 → DedupHashEntry{hash, source, mtime}，避免重复计算） */
    this.dedupCache = new DedupCache();
    this.fileDebounceTimer = null;
    this.activeDebounceTimer = null;
  }
  async onload() {
    this.linkParser = new LinkParser();
    this.vaultScanner = new VaultScanner(this.app, this.linkParser);
    this.linkEditor = new LinkEditor(this.app);
    await this.loadSettings();
    this.webDAVSync = new WebDAVSync(
      this.settings,
      this.app.vault.getName(),
      async (updated) => {
        this.settings = updated;
        await this.saveSettings();
      }
    );
    if (this._pendingWebdavMeta) {
      this.webDAVSync.meta = this._pendingWebdavMeta;
      this._pendingWebdavMeta = void 0;
    }
    this.startDevReloadWatch();
    this.cloudComparator = new CloudComparator(this.settings);
    this.imageBedManager = new ImageBedManager();
    this.registerImageBeds();
    this.registerView(VIEW_TYPE_PIC_LINKER, (leaf) => {
      return new PicLinkerView(leaf, this);
    });
    this.addRibbonIcon("cloud-check", "\u6253\u5F00\u56FE\u5E8A\u7BA1\u5BB6", () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open",
      name: "\u6253\u5F00\u56FE\u5E8A\u7BA1\u5BB6",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "refresh",
      name: "\u5237\u65B0\u56FE\u7247\u626B\u63CF",
      callback: () => this.refreshView()
    });
    this.addCommand({
      id: "test",
      name: "\u8FD0\u884C\u8BCA\u65AD\u6D4B\u8BD5",
      callback: () => this.runDiagnostics()
    });
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian10.TFile) {
          this.onFileChanged(file.path);
        }
      })
    );
    this.registerEvent(
      this.app.metadataCache.on("resolved", () => {
        this.debounceFileRefresh();
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        this.onFileChanged(file.path, false);
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file) => {
        this.onFileChanged(file.path, false);
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        this.onFileChanged(file.path, false);
      })
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.onActiveFileChanged();
      })
    );
    this.addSettingTab(new PicLinkerSettingTab(this.app, this));
  }
  onunload() {
    if (this.fileDebounceTimer) {
      window.clearTimeout(this.fileDebounceTimer);
      this.fileDebounceTimer = null;
    }
    if (this.activeDebounceTimer) {
      window.clearTimeout(this.activeDebounceTimer);
      this.activeDebounceTimer = null;
    }
  }
  registerImageBeds() {
    const github = new GitHubImageBed();
    github.configure(this.settings);
    this.imageBedManager.register("GitHub" /* GitHub */, github);
    const aliyun = new AliyunOssImageBed();
    aliyun.configure(this.settings);
    this.imageBedManager.register("\u963F\u91CC\u4E91 OSS" /* Aliyun */, aliyun);
    const tencent = new TencentCosImageBed();
    tencent.configure(this.settings);
    this.imageBedManager.register("\u817E\u8BAF\u4E91 COS" /* Tencent */, tencent);
    const smms = new SmmsImageBed();
    smms.configure(this.settings);
    this.imageBedManager.register("\u5176\u4ED6\u56FE\u5E8A" /* Other */, smms);
  }
  async activateView() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_PIC_LINKER);
    if (existing.length > 0) {
      void this.app.workspace.revealLeaf(existing[0]);
      const view = existing[0].view;
      if (view instanceof PicLinkerView) this.view = view;
      return;
    }
    const newLeaf = this.app.workspace.getLeaf("tab");
    if (newLeaf) {
      await newLeaf.setViewState({ type: VIEW_TYPE_PIC_LINKER, active: true });
      const view = newLeaf.view;
      if (view instanceof PicLinkerView) this.view = view;
      void this.app.workspace.revealLeaf(newLeaf);
    }
  }
  onFileChanged(filePath, markDirty = true) {
    if (filePath.endsWith(".md")) {
      if (markDirty) this.vaultScanner.markDirty(filePath);
      this.debounceFileRefresh();
      return;
    }
    const ext = filePath.split(".").pop()?.toLowerCase();
    if (ext && IMAGE_EXTENSIONS.has(ext)) {
      this.debounceFileRefresh();
    }
  }
  onActiveFileChanged() {
    this.debounceActiveRefresh();
  }
  debounceFileRefresh() {
    if (this.fileDebounceTimer) window.clearTimeout(this.fileDebounceTimer);
    this.fileDebounceTimer = window.setTimeout(deferAsync(async () => {
      await new Promise((r) => window.setTimeout(r, 300));
      const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PIC_LINKER);
      if (leaves.length > 0 && this.view) {
        await this.view.refresh();
        const view = this.view;
        window.setTimeout(() => {
          void (async () => {
            if (view && view.waitForCloudLoad) {
              await view.waitForCloudLoad();
              if (view && !view.isClosed) {
                void view.refresh();
              }
            }
          })();
        }, 1e3);
      } else {
        this.vaultScanner.invalidateChangedFiles();
        await this.vaultScanner.scan();
      }
    }), 500);
  }
  debounceActiveRefresh() {
    if (this.activeDebounceTimer) window.clearTimeout(this.activeDebounceTimer);
    this.activeDebounceTimer = window.setTimeout(() => {
      if (this.view) this.refreshView();
    }, 500);
  }
  refreshView() {
    if (this.view) {
      void this.view.refresh();
    }
  }
  async loadSettings() {
    const data = await this.loadData() || {};
    const { _hashcache, _webdavmeta, _dedupcache, _scancache, ...settingsData } = data;
    const deprecatedKeys = ["autoRefreshOnOpen", "showUnreferenced", "deleteConfirm", "debounceDelay"];
    for (const key of deprecatedKeys) {
      delete settingsData[key];
    }
    const raw = Object.assign({}, DEFAULT_SETTINGS, settingsData);
    const salt = `imagelmgr:${this.app.vault.getName()}`;
    this.settings = await decryptSensitiveFields(raw, salt);
    if (_hashcache && typeof _hashcache === "string") {
      this.hashCache = new HashCache(_hashcache);
    }
    if (_dedupcache && typeof _dedupcache === "string") {
      this.dedupCache = new DedupCache(_dedupcache);
    }
    if (_webdavmeta) {
      this._pendingWebdavMeta = _webdavmeta;
    }
    if (_scancache && typeof _scancache === "string") {
      this.vaultScanner.loadSerialized(_scancache);
    }
  }
  async saveSettings() {
    const salt = `imagelmgr:${this.app.vault.getName()}`;
    const encrypted = await encryptSensitiveFields(this.settings, salt);
    const savePayload = { ...encrypted };
    if (this.hashCache.isDirty() || this.hashCache.size > 0) {
      savePayload._hashcache = this.hashCache.serialize();
      this.hashCache.markClean();
    }
    if (this.dedupCache) {
      savePayload._dedupcache = this.dedupCache.serialize();
    }
    if (this.webDAVSync?.meta) {
      this.webDAVSync.meta.lastLocalModifiedAt = (/* @__PURE__ */ new Date()).toISOString();
      savePayload._webdavmeta = this.webDAVSync.meta;
    }
    try {
      savePayload._scancache = this.vaultScanner.serialize();
    } catch (e) {
      console.warn("[PicLinker] \u626B\u63CF\u7F13\u5B58\u5E8F\u5217\u5316\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7", e);
    }
    await this.saveData(savePayload);
    for (const bed of this.imageBedManager.getAll()) {
      bed.configure(this.settings);
    }
    this.cloudComparator.updateSettings(this.settings);
    this.webDAVSync?.updateSettings(this.settings);
    this.refreshView();
    if (this.settings.webdavEnable && this.settings.webdavAutoSync && this.settings.webdavUrl && this.settings.webdavUsername && this.settings.webdavPassword && !this.webDAVSync?.skipAutoUpload) {
      void this.webDAVSync.syncToRemote();
    }
    if (this.webDAVSync) this.webDAVSync.skipAutoUpload = false;
  }
  /**
  	 * 获取当前活跃笔记的图片链接
  	 */
  async getCurrentFileImages() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.extension !== "md") return [];
    const content = await this.app.vault.read(activeFile);
    return this.linkParser.parse(content);
  }
  /**
   * 获取全库图片链接统计
   */
  async getVaultImages() {
    return await this.vaultScanner.scan();
  }
  /**
   * 比对本地图片与云端
   * @param cloudFiles 可选的云端文件列表（用于文件名匹配，避免 CORS）
   * @param pathPrefix 可选的云端路径前缀（来自 frontmatter image-path）
   */
  async compareLocalWithCloud(localImages, bedType, cloudFiles, pathPrefix) {
    return await this.cloudComparator.compare(localImages, bedType, cloudFiles, pathPrefix);
  }
  /**
   * 删除云端文件
   */
  async deleteCloudFile(filename, bedType) {
    const bed = this.imageBedManager.get(bedType);
    if (!bed) return { success: false, error: "\u56FE\u5E8A\u672A\u6CE8\u518C" };
    return bed.delete(filename);
  }
  /**
   * 获取云端文件列表
   */
  async listCloudFiles(bedType) {
    const bed = this.imageBedManager.get(bedType);
    if (!bed) return [];
    return bed.listFiles();
  }
  /**
   * 创建云端目录
   */
  async createCloudDirectory(dirName, bedType) {
    const bed = this.imageBedManager.get(bedType);
    if (!bed) return { success: false, error: "\u56FE\u5E8A\u672A\u6CE8\u518C" };
    return bed.createDirectory(dirName);
  }
  /**
   * #6 测试图床连接
   */
  async testBedConnection(bedType) {
    const bed = this.imageBedManager.get(bedType);
    if (!bed) return { success: false, error: "\u56FE\u5E8A\u672A\u6CE8\u518C" };
    if (bed.testConnection) return bed.testConnection();
    return { success: false, error: "\u8BE5\u56FE\u5E8A\u4E0D\u652F\u6301\u8FDE\u63A5\u6D4B\u8BD5" };
  }
  async testCreateDirectoryCapability(bedType) {
    const bed = this.imageBedManager.get(bedType);
    if (!bed) return { supported: false, reason: "\u56FE\u5E8A\u672A\u6CE8\u518C" };
    if (bed.testCreateDirectoryCapability) return bed.testCreateDirectoryCapability();
    return { supported: false, reason: "\u672A\u77E5\u662F\u5426\u652F\u6301\u521B\u5EFA\u76EE\u5F55" };
  }
  /**
   * #10 解析当前活跃文件的 Frontmatter 配置
   */
  async getFileFrontmatter() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.extension !== "md") return {};
    const content = await this.app.vault.read(activeFile);
    const config = parseFrontmatter(content);
    if (!config) return {};
    const result = {};
    if (config.imageBed !== void 0) result.imageBed = config.imageBed;
    if (config.autoUpload !== void 0) result.autoUpload = config.autoUpload;
    if (config.imagePath !== void 0) result.imagePath = config.imagePath;
    return result;
  }
  // ==================== 诊断测试 ====================
  /** 运行诊断测试，检查各模块功能 */
  async runDiagnostics() {
    const results = [];
    const add = (ok, msg) => results.push(`${ok ? "\u2705" : "\u274C"} ${msg}`);
    add(!!this.linkParser, "LinkParser \u521D\u59CB\u5316");
    add(!!this.vaultScanner, "VaultScanner \u521D\u59CB\u5316");
    add(!!this.cloudComparator, "CloudComparator \u521D\u59CB\u5316");
    add(!!this.imageBedManager, "ImageBedManager \u521D\u59CB\u5316");
    add(!!this.linkEditor, "LinkEditor \u521D\u59CB\u5316");
    add(!!this.webDAVSync, "WebDAVSync \u521D\u59CB\u5316");
    add(!!this.hashCache, "HashCache \u521D\u59CB\u5316");
    add(!!this.dedupCache, "DedupCache \u521D\u59CB\u5316");
    const s = this.settings;
    const githubOk = !!(s.githubToken && s.githubOwner && s.githubRepo);
    const aliyunOk = !!(s.aliyunAccessKeyId && s.aliyunAccessKeySecret && s.aliyunEndpoint && s.aliyunBucket);
    const tencentOk = !!(s.tencentSecretId && s.tencentSecretKey && s.tencentBucket && s.tencentRegion);
    const smmsOk = !!s.smmsToken;
    add(githubOk || aliyunOk || tencentOk || smmsOk, `\u81F3\u5C11\u914D\u7F6E\u4E00\u4E2A\u56FE\u5E8A (GitHub:${githubOk} Aliyun:${aliyunOk} Tencent:${tencentOk} SM.MS:${smmsOk})`);
    const beds = this.imageBedManager.getAll();
    add(beds.length === 4, `\u56FE\u5E8A\u6CE8\u518C\u6570\u91CF: ${beds.length}/4`);
    try {
      const original = { ...this.settings };
      await this.saveSettings();
      await this.loadSettings();
      const match = JSON.stringify(original) === JSON.stringify(this.settings);
      add(match, "Settings \u4FDD\u5B58/\u52A0\u8F7D\u4E00\u81F4\u6027");
    } catch (e) {
      add(false, `Settings \u4FDD\u5B58/\u52A0\u8F7D\u5F02\u5E38: ${e}`);
    }
    try {
      const salt = `imagelmgr:${this.app.vault.getName()}`;
      const testValue = "test-token-12345";
      const encrypted = await encryptSensitiveFields({ testField: testValue }, salt);
      const decrypted = await decryptSensitiveFields(encrypted, salt);
      add(decrypted.testField === testValue, "\u654F\u611F\u5B57\u6BB5\u52A0\u5BC6/\u89E3\u5BC6");
    } catch (e) {
      add(false, `\u52A0\u5BC6/\u89E3\u5BC6\u5F02\u5E38: ${e}`);
    }
    const webdavOk = !!(s.webdavUrl && s.webdavUsername && s.webdavPassword);
    add(true, `WebDAV \u914D\u7F6E: ${webdavOk ? "\u5DF2\u914D\u7F6E" : "\u672A\u914D\u7F6E"}`);
    if (webdavOk) {
      add(s.webdavUrl.startsWith("https://"), "WebDAV \u4F7F\u7528 HTTPS");
    }
    try {
      const images = await this.getVaultImages();
      add(true, `\u672C\u5730\u56FE\u7247\u626B\u63CF: ${images.size} \u4E2A`);
    } catch (e) {
      add(false, `\u672C\u5730\u626B\u63CF\u5F02\u5E38: ${e}`);
    }
    if (githubOk) {
      try {
        const result = await this.testBedConnection("GitHub" /* GitHub */);
        add(result.success, `GitHub \u8FDE\u63A5: ${result.success ? "\u6210\u529F" : result.error}`);
      } catch (e) {
        add(false, `GitHub \u8FDE\u63A5\u5F02\u5E38: ${e}`);
      }
    }
    if (aliyunOk) {
      try {
        const result = await this.testBedConnection("\u963F\u91CC\u4E91 OSS" /* Aliyun */);
        add(result.success, `\u963F\u91CC\u4E91 OSS \u8FDE\u63A5: ${result.success ? "\u6210\u529F" : result.error}`);
      } catch (e) {
        add(false, `\u963F\u91CC\u4E91 OSS \u8FDE\u63A5\u5F02\u5E38: ${e}`);
      }
    }
    if (tencentOk) {
      try {
        const result = await this.testBedConnection("\u817E\u8BAF\u4E91 COS" /* Tencent */);
        add(result.success, `\u817E\u8BAF\u4E91 COS \u8FDE\u63A5: ${result.success ? "\u6210\u529F" : result.error}`);
      } catch (e) {
        add(false, `\u817E\u8BAF\u4E91 COS \u8FDE\u63A5\u5F02\u5E38: ${e}`);
      }
    }
    try {
      const testLine = "![test](images/test.png) \u548C\u4E00\u4E9B\u6587\u5B57";
      const cleaned = this.linkEditor.removeImageFromLine(testLine, "images/test.png");
      add(cleaned === " \u548C\u4E00\u4E9B\u6587\u5B57", "LinkEditor.removeImageFromLine");
    } catch (e) {
      add(false, `LinkEditor \u5F02\u5E38: ${e}`);
    }
    const summary = `PicLinker \u8BCA\u65AD\u62A5\u544A
${"\u2500".repeat(30)}
${results.join("\n")}
${"\u2500".repeat(30)}
\u901A\u8FC7: ${results.filter((r) => r.startsWith("\u2705")).length}/${results.length}`;
    console.info("[PicLinker \u8BCA\u65AD]", summary);
    new import_obsidian10.Notice(summary, 15e3);
  }
  // ==================== 开发模式热加载 ====================
  /** 开发模式：检测 main.js 修改时间变化时自动刷新视图 */
  startDevReloadWatch() {
    if (!("require" in window)) return;
    try {
      const fs = window.require("fs");
      const path = window.require("path");
      const pluginDir = this.manifest.dir;
      if (!pluginDir) return;
      const srcDir = path.join(pluginDir, "src");
      if (!fs.existsSync(srcDir)) return;
      const mainJsPath = path.join(pluginDir, "main.js");
      let lastMtime = "";
      const interval = window.setInterval(() => {
        try {
          const stat = fs.statSync(mainJsPath);
          const mtime = stat.mtimeMs.toString();
          if (mtime && mtime !== lastMtime) {
            lastMtime = mtime;
            this.refreshView?.();
          }
        } catch (e) {
          console.warn("[PicLinker] \u6587\u4EF6\u53D8\u5316\u68C0\u6D4B\u5F02\u5E38:", e instanceof Error ? e.message : String(e));
        }
      }, 1e3);
      this.register(() => window.clearInterval(interval));
    } catch {
    }
  }
};
