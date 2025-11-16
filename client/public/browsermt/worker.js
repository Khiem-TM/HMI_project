var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/browser-or-node/lib/index.js
var require_lib = __commonJS({
  "node_modules/browser-or-node/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
      return typeof obj;
    } : function(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
    var isNode2 = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
    var isWebWorker = (typeof self === "undefined" ? "undefined" : _typeof(self)) === "object" && self.constructor && self.constructor.name === "DedicatedWorkerGlobalScope";
    var isJsDom = typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && (navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom"));
    var isDeno = typeof Deno !== "undefined" && typeof Deno.core !== "undefined";
    exports.isBrowser = isBrowser;
    exports.isWebWorker = isWebWorker;
    exports.isNode = isNode2;
    exports.isJsDom = isJsDom;
    exports.isDeno = isDeno;
  }
});

// node_modules/comlink/dist/umd/comlink.js
var require_comlink = __commonJS({
  "node_modules/comlink/dist/umd/comlink.js"(exports, module) {
    (function(global, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = global || self, factory(global.Comlink = {}));
    })(exports, function(exports2) {
      "use strict";
      const proxyMarker = Symbol("Comlink.proxy");
      const createEndpoint = Symbol("Comlink.endpoint");
      const releaseProxy = Symbol("Comlink.releaseProxy");
      const throwMarker = Symbol("Comlink.thrown");
      const isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
      const proxyTransferHandler = {
        canHandle: (val) => isObject(val) && val[proxyMarker],
        serialize(obj) {
          const { port1, port2 } = new MessageChannel();
          expose2(obj, port1);
          return [port2, [port2]];
        },
        deserialize(port) {
          port.start();
          return wrap(port);
        }
      };
      const throwTransferHandler = {
        canHandle: (value) => isObject(value) && throwMarker in value,
        serialize({ value }) {
          let serialized;
          if (value instanceof Error) {
            serialized = {
              isError: true,
              value: {
                message: value.message,
                name: value.name,
                stack: value.stack
              }
            };
          } else {
            serialized = { isError: false, value };
          }
          return [serialized, []];
        },
        deserialize(serialized) {
          if (serialized.isError) {
            throw Object.assign(new Error(serialized.value.message), serialized.value);
          }
          throw serialized.value;
        }
      };
      const transferHandlers = /* @__PURE__ */ new Map([
        ["proxy", proxyTransferHandler],
        ["throw", throwTransferHandler]
      ]);
      function expose2(obj, ep = self) {
        ep.addEventListener("message", function callback(ev) {
          if (!ev || !ev.data) {
            return;
          }
          const { id, type, path } = Object.assign({ path: [] }, ev.data);
          const argumentList = (ev.data.argumentList || []).map(fromWireValue);
          let returnValue;
          try {
            const parent = path.slice(0, -1).reduce((obj2, prop) => obj2[prop], obj);
            const rawValue = path.reduce((obj2, prop) => obj2[prop], obj);
            switch (type) {
              case "GET":
                {
                  returnValue = rawValue;
                }
                break;
              case "SET":
                {
                  parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                  returnValue = true;
                }
                break;
              case "APPLY":
                {
                  returnValue = rawValue.apply(parent, argumentList);
                }
                break;
              case "CONSTRUCT":
                {
                  const value = new rawValue(...argumentList);
                  returnValue = proxy(value);
                }
                break;
              case "ENDPOINT":
                {
                  const { port1, port2 } = new MessageChannel();
                  expose2(obj, port2);
                  returnValue = transfer(port1, [port1]);
                }
                break;
              case "RELEASE":
                {
                  returnValue = void 0;
                }
                break;
              default:
                return;
            }
          } catch (value) {
            returnValue = { value, [throwMarker]: 0 };
          }
          Promise.resolve(returnValue).catch((value) => {
            return { value, [throwMarker]: 0 };
          }).then((returnValue2) => {
            const [wireValue, transferables] = toWireValue(returnValue2);
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
            if (type === "RELEASE") {
              ep.removeEventListener("message", callback);
              closeEndPoint(ep);
            }
          });
        });
        if (ep.start) {
          ep.start();
        }
      }
      function isMessagePort(endpoint) {
        return endpoint.constructor.name === "MessagePort";
      }
      function closeEndPoint(endpoint) {
        if (isMessagePort(endpoint))
          endpoint.close();
      }
      function wrap(ep, target) {
        return createProxy(ep, [], target);
      }
      function throwIfProxyReleased(isReleased) {
        if (isReleased) {
          throw new Error("Proxy has been released and is not useable");
        }
      }
      function createProxy(ep, path = [], target = function() {
      }) {
        let isProxyReleased = false;
        const proxy2 = new Proxy(target, {
          get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
              return () => {
                return requestResponseMessage(ep, {
                  type: "RELEASE",
                  path: path.map((p) => p.toString())
                }).then(() => {
                  closeEndPoint(ep);
                  isProxyReleased = true;
                });
              };
            }
            if (prop === "then") {
              if (path.length === 0) {
                return { then: () => proxy2 };
              }
              const r = requestResponseMessage(ep, {
                type: "GET",
                path: path.map((p) => p.toString())
              }).then(fromWireValue);
              return r.then.bind(r);
            }
            return createProxy(ep, [...path, prop]);
          },
          set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, {
              type: "SET",
              path: [...path, prop].map((p) => p.toString()),
              value
            }, transferables).then(fromWireValue);
          },
          apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
              return requestResponseMessage(ep, {
                type: "ENDPOINT"
              }).then(fromWireValue);
            }
            if (last === "bind") {
              return createProxy(ep, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
              type: "APPLY",
              path: path.map((p) => p.toString()),
              argumentList
            }, transferables).then(fromWireValue);
          },
          construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
              type: "CONSTRUCT",
              path: path.map((p) => p.toString()),
              argumentList
            }, transferables).then(fromWireValue);
          }
        });
        return proxy2;
      }
      function myFlat(arr) {
        return Array.prototype.concat.apply([], arr);
      }
      function processArguments(argumentList) {
        const processed = argumentList.map(toWireValue);
        return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
      }
      const transferCache = /* @__PURE__ */ new WeakMap();
      function transfer(obj, transfers) {
        transferCache.set(obj, transfers);
        return obj;
      }
      function proxy(obj) {
        return Object.assign(obj, { [proxyMarker]: true });
      }
      function windowEndpoint(w, context = self, targetOrigin = "*") {
        return {
          postMessage: (msg, transferables) => w.postMessage(msg, targetOrigin, transferables),
          addEventListener: context.addEventListener.bind(context),
          removeEventListener: context.removeEventListener.bind(context)
        };
      }
      function toWireValue(value) {
        for (const [name, handler] of transferHandlers) {
          if (handler.canHandle(value)) {
            const [serializedValue, transferables] = handler.serialize(value);
            return [
              {
                type: "HANDLER",
                name,
                value: serializedValue
              },
              transferables
            ];
          }
        }
        return [
          {
            type: "RAW",
            value
          },
          transferCache.get(value) || []
        ];
      }
      function fromWireValue(value) {
        switch (value.type) {
          case "HANDLER":
            return transferHandlers.get(value.name).deserialize(value.value);
          case "RAW":
            return value.value;
        }
      }
      function requestResponseMessage(ep, msg, transfers) {
        return new Promise((resolve) => {
          const id = generateUUID();
          ep.addEventListener("message", function l(ev) {
            if (!ev.data || !ev.data.id || ev.data.id !== id) {
              return;
            }
            ep.removeEventListener("message", l);
            resolve(ev.data);
          });
          if (ep.start) {
            ep.start();
          }
          ep.postMessage(Object.assign({ id }, msg), transfers);
        });
      }
      function generateUUID() {
        return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
      }
      exports2.createEndpoint = createEndpoint;
      exports2.expose = expose2;
      exports2.proxy = proxy;
      exports2.proxyMarker = proxyMarker;
      exports2.releaseProxy = releaseProxy;
      exports2.transfer = transfer;
      exports2.transferHandlers = transferHandlers;
      exports2.windowEndpoint = windowEndpoint;
      exports2.wrap = wrap;
      Object.defineProperty(exports2, "__esModule", { value: true });
    });
  }
});

// src/worker.ts
var import_browser_or_node = __toESM(require_lib());
var comlink = __toESM(require_comlink());
comlink.expose({ importBergamotWorker, loadModel, translate });
var timing = { workerStart: Date.now() };
var FILE_INFO = [
  { type: "model", alignment: 256 },
  { type: "lex", alignment: 64 },
  { type: "vocab", alignment: 64 },
  { type: "qualityModel", alignment: 64 }
];
function log(...args) {
  console.debug(...args);
}
function logTime(timingKey, ...args) {
  const time = (Date.now() - timing[timingKey]) / 1e3;
  log(...args, `${time} secs`);
}
var translationService;
var runtimeInitializedPromiseResolve;
var runtimeInitializedPromise = new Promise(
  (resolve) => runtimeInitializedPromiseResolve = resolve
);
var workerWasmFilePath;
globalThis.Module = {
  preRun: [
    () => {
      logTime("workerStart", "Time until Module.preRun");
      timing.moduleLoadStart = Date.now();
    }
  ],
  locateFile: () => {
    return workerWasmFilePath;
  },
  onRuntimeInitialized: async () => {
    logTime(
      "moduleLoadStart",
      "Wasm Runtime initialized Successfully (preRun -> onRuntimeInitialized)"
    );
    runtimeInitializedPromiseResolve();
  }
};
async function importBergamotWorker(jsFilePath, wasmFilePath) {
  if (typeof wasmFilePath === "string") {
    workerWasmFilePath = wasmFilePath;
  } else {
    globalThis.Module.wasmBinary = wasmFilePath;
  }
  if (import_browser_or_node.isNode) {
    const fs = __require("fs");
    const code = fs.readFileSync(jsFilePath, "utf-8");
    const vm = __require("vm");
    vm.runInThisContext(code);
  } else {
    importScripts(jsFilePath);
  }
  await runtimeInitializedPromise;
}
async function loadModel(from, to, modelRegistry) {
  timing.loadModelStart = Date.now();
  try {
    await constructTranslationService();
    await constructTranslationModel(from, to, modelRegistry);
    logTime("loadModelStart", `Model '${from}-${to}' successfully constructed`);
    return "Model successfully loaded";
  } catch (error) {
    console.error(error);
    log(`Model '${from}${to}' construction failed:`, error.message);
    return "Model loading failed";
  }
}
function translate(from, to, sentences, options) {
  timing.translateStart = Date.now();
  const wordCount = sentences.reduce(
    (acc, sentence) => acc + _wordsCount(sentence),
    0
  );
  let result;
  try {
    log(`Blocks to translate: ${sentences.length}`);
    result = _translate(from, to, sentences, options);
    const secs = (Date.now() - timing.translateStart) / 1e3;
    log(
      `Speed: ${Math.round(
        wordCount / secs
      )} WPS (${wordCount} words in ${secs} secs)`
    );
  } catch (error) {
    log(`Error:`, error.message);
  }
  return result;
}
var languagePairToTranslationModels = /* @__PURE__ */ new Map();
var PIVOT_LANGUAGE = "en";
onmessage = async function(e) {
  const command = e.data[0];
  log(`Message '${command}' received from main script`);
  if (command === "translate") {
    const from = e.data[1];
    const to = e.data[2];
    const input = e.data[3];
    const translateOptions = e.data[4];
    const result = translate(from, to, input, translateOptions);
    console.warn(result);
    log(`'${command}' command done, Posting message back to main script`);
    postMessage([`${command}_reply`, result]);
  }
};
var constructTranslationService = async () => {
  if (!translationService) {
    const config = { cacheSize: 2e4 };
    log(`Creating Translation Service with config`, config);
    translationService = new globalThis.Module.BlockingService(config);
    log(`Translation Service created successfully`);
  }
};
var constructTranslationModel = async (from, to, modelRegistry) => {
  languagePairToTranslationModels.forEach((value, key) => {
    log(`Destructing model '${key}'`);
    value.delete();
  });
  languagePairToTranslationModels.clear();
  if (_isPivotingRequired(from, to)) {
    const languagePairSrcToPivot = _getLanguagePair(from, PIVOT_LANGUAGE);
    const languagePairPivotToTarget = _getLanguagePair(PIVOT_LANGUAGE, to);
    await Promise.all([
      _constructTranslationModelHelper(languagePairSrcToPivot, modelRegistry),
      _constructTranslationModelHelper(
        languagePairPivotToTarget,
        modelRegistry
      )
    ]);
  } else {
    await _constructTranslationModelHelper(
      _getLanguagePair(from, to),
      modelRegistry
    );
  }
};
var _translate = (from, to, input, translateOptions) => {
  let vectorResponseOptions, vectorSourceText, vectorResponse;
  try {
    vectorResponseOptions = _prepareResponseOptions(translateOptions);
    vectorSourceText = _prepareSourceText(input);
    if (_isPivotingRequired(from, to)) {
      const translationModelSrcToPivot = _getLoadedTranslationModel(
        from,
        PIVOT_LANGUAGE
      );
      const translationModelPivotToTarget = _getLoadedTranslationModel(
        PIVOT_LANGUAGE,
        to
      );
      vectorResponse = translationService.translateViaPivoting(
        translationModelSrcToPivot,
        translationModelPivotToTarget,
        vectorSourceText,
        vectorResponseOptions
      );
    } else {
      const translationModel = _getLoadedTranslationModel(from, to);
      vectorResponse = translationService.translate(
        translationModel,
        vectorSourceText,
        vectorResponseOptions
      );
    }
    const listTranslatedText = _parseTranslatedText(vectorResponse);
    const listSourceText = _parseSourceText(vectorResponse);
    const listTranslatedTextSentences = _parseTranslatedTextSentences(vectorResponse);
    const listSourceTextSentences = _parseSourceTextSentences(vectorResponse);
    log(`Source text: ${listSourceText}`);
    log(`Translated text: ${listTranslatedText}`);
    log(`Translated sentences: ${JSON.stringify(listTranslatedTextSentences)}`);
    log(`Source sentences: ${JSON.stringify(listSourceTextSentences)}`);
    return listTranslatedText;
  } finally {
    if (vectorSourceText != null)
      vectorSourceText.delete();
    if (vectorResponseOptions != null)
      vectorResponseOptions.delete();
    if (vectorResponse != null)
      vectorResponse.delete();
  }
};
var _downloadAsArrayBufferNode = async (url) => {
  const protocol = url.split("://")[0];
  const https = __require(protocol);
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status code ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("error", (error) => {
        console.error("Error in fetching", error);
        reject(error);
      });
      res.on("data", (chunk) => {
        if (res.statusCode !== 200) {
          reject("data: Status code is not 200");
        }
        chunks.push(chunk);
      });
      res.on("end", async () => {
        if (res.statusCode !== 200) {
          reject("end: Status code is not 200");
        }
        const { Blob } = __require("buffer");
        const data = new Blob(chunks);
        try {
          const buffer = await data.arrayBuffer();
          resolve(buffer);
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", function(e) {
      if (e.code !== "ECONNRESET") {
        reject(e);
      }
    });
    req.on("timeout", function(e) {
      console.error(`timeout: problem with request: ${e.message}`);
      reject(e);
    });
    req.on("uncaughtException", function(e) {
      console.error(`uncaughtException: problem with request: ${e.message}`);
      reject(e);
    });
  });
};
var _downloadAsArrayBuffer = async (url) => {
  if (import_browser_or_node.isNode) {
    return _downloadAsArrayBufferNode(url);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw Error(
      `Downloading ${url} failed: HTTP ${response.status} - ${response.statusText}`
    );
  }
  return response.arrayBuffer();
};
var _prepareAlignedMemoryFromBuffer = async (buffer, alignmentSize) => {
  const byteArray = new Int8Array(buffer);
  const alignedMemory = new globalThis.Module.AlignedMemory(
    byteArray.byteLength,
    alignmentSize
  );
  const alignedByteArrayView = alignedMemory.getByteArrayView();
  alignedByteArrayView.set(byteArray);
  return alignedMemory;
};
async function prepareAlignedMemory(file, languagePair, modelRegistry) {
  const fileName = modelRegistry[languagePair][file.type].name;
  const buffer = await _downloadAsArrayBuffer(fileName);
  const alignedMemory = await _prepareAlignedMemoryFromBuffer(
    buffer,
    file.alignment
  );
  log(
    `${file.type} aligned memory prepared. Size: ${alignedMemory.size()} bytes, alignment: ${file.alignment}`
  );
  return alignedMemory;
}
var _constructTranslationModelHelper = async (languagePair, modelRegistry) => {
  log(`Constructing translation model ${languagePair}`);
  const modelConfig = `beam-size: 12
normalize: 1.0
word-penalty: 0
max-length-break: 512
mini-batch-words: 8192
workspace: 512
max-length-factor: 12
skip-cost: false
cpu-threads: 0
quiet: true
quiet-translation: true
gemm-precision: int8shiftAlphaAll
alignment: soft
`;
  const alignedMemories = await Promise.all(
    FILE_INFO.filter((file) => file.type in modelRegistry[languagePair]).map(
      (file) => prepareAlignedMemory(file, languagePair, modelRegistry)
    )
  );
  log(`Translation Model config: ${modelConfig}`);
  log(
    `Aligned memory sizes: Model:${alignedMemories[0].size()} Shortlist:${alignedMemories[1].size()} Vocab:${alignedMemories[2].size()}`
  );
  const alignedVocabMemoryList = new globalThis.Module.AlignedMemoryList();
  alignedVocabMemoryList.push_back(alignedMemories[2]);
  let translationModel;
  if (alignedMemories.length === FILE_INFO.length) {
    log(`QE:${alignedMemories[3].size()}`);
    translationModel = new globalThis.Module.TranslationModel(
      modelConfig,
      alignedMemories[0],
      alignedMemories[1],
      alignedVocabMemoryList,
      alignedMemories[3]
    );
  } else {
    translationModel = new globalThis.Module.TranslationModel(
      modelConfig,
      alignedMemories[0],
      alignedMemories[1],
      alignedVocabMemoryList,
      null
    );
  }
  languagePairToTranslationModels.set(languagePair, translationModel);
};
var _isPivotingRequired = (from, to) => {
  return false;
};
var _getLanguagePair = (srcLang, tgtLang) => {
  return `${srcLang}${tgtLang}`;
};
var _getLoadedTranslationModel = (srcLang, tgtLang) => {
  const languagePair = _getLanguagePair(srcLang, tgtLang);
  if (!languagePairToTranslationModels.has(languagePair)) {
    throw Error(`Translation model '${languagePair}' not loaded`);
  }
  return languagePairToTranslationModels.get(languagePair);
};
var _parseTranslatedText = (vectorResponse) => {
  const result = [];
  for (let i = 0; i < vectorResponse.size(); i++) {
    const response = vectorResponse.get(i);
    result.push(response.getTranslatedText());
  }
  return result;
};
var _parseTranslatedTextSentences = (vectorResponse) => {
  const result = [];
  for (let i = 0; i < vectorResponse.size(); i++) {
    const response = vectorResponse.get(i);
    result.push(_getTranslatedSentences(response));
  }
  return result;
};
var _parseSourceText = (vectorResponse) => {
  const result = [];
  for (let i = 0; i < vectorResponse.size(); i++) {
    const response = vectorResponse.get(i);
    result.push(response.getOriginalText());
  }
  return result;
};
var _parseSourceTextSentences = (vectorResponse) => {
  const result = [];
  for (let i = 0; i < vectorResponse.size(); i++) {
    const response = vectorResponse.get(i);
    result.push(_getSourceSentences(response));
  }
  return result;
};
var _prepareResponseOptions = (translateOptions) => {
  const vectorResponseOptions = new globalThis.Module.VectorResponseOptions();
  translateOptions.forEach((translateOption) => {
    vectorResponseOptions.push_back({
      qualityScores: translateOption.isQualityScores,
      alignment: true,
      html: translateOption.isHtml
    });
  });
  if (vectorResponseOptions.size() == 0) {
    vectorResponseOptions.delete();
    throw Error(`No Translation Options provided`);
  }
  return vectorResponseOptions;
};
var _prepareSourceText = (input) => {
  const vectorSourceText = new globalThis.Module.VectorString();
  input.forEach((paragraph) => {
    if (paragraph.trim() === "") {
      return;
    }
    vectorSourceText.push_back(paragraph.trim());
  });
  if (vectorSourceText.size() == 0) {
    vectorSourceText.delete();
    throw Error(`No text provided to translate`);
  }
  return vectorSourceText;
};
var _getTranslatedSentences = (response) => {
  const sentences = [];
  const text = response.getTranslatedText();
  for (let sentenceIndex = 0; sentenceIndex < response.size(); sentenceIndex++) {
    const utf8SentenceByteRange = response.getTranslatedSentence(sentenceIndex);
    sentences.push(_getSubString(text, utf8SentenceByteRange));
  }
  return sentences;
};
var _getSourceSentences = (response) => {
  const sentences = [];
  const text = response.getOriginalText();
  for (let sentenceIndex = 0; sentenceIndex < response.size(); sentenceIndex++) {
    const utf8SentenceByteRange = response.getSourceSentence(sentenceIndex);
    sentences.push(_getSubString(text, utf8SentenceByteRange));
  }
  return sentences;
};
var _getSubString = (text, utf8ByteRange) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const textUtf8ByteView = encoder.encode(text);
  const substringUtf8ByteView = textUtf8ByteView.subarray(
    utf8ByteRange.begin,
    utf8ByteRange.end
  );
  return decoder.decode(substringUtf8ByteView);
};
function _wordsCount(sentence) {
  return sentence.trim().split(" ").filter((word) => word.trim() !== "").length;
}
//# sourceMappingURL=worker.js.map
