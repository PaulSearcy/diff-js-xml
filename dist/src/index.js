"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var underscore_1 = __importDefault(require("underscore"));
var xml_js_1 = require("xml-js");
var defaultOptions = {
    compareElementValues: true
};
var defaultXml2JsOptions = {
    compact: true,
    ignoreDoctype: true,
    ignoreDeclaration: true,
    ignoreAttributes: true
};
var compareObjects = function (a, b, schema, keyPrefix, options) {
    var differences = [];
    var ak = Object.keys(a);
    var bk = Object.keys(b);
    var allKeys = underscore_1.default.union(ak, bk);
    allKeys.forEach(function (key) {
        var formattedKey = (keyPrefix || "") + key;
        var fieldOptions = schema[key] || {};
        if (!underscore_1.default.contains(ak, key)) {
            if (fieldOptions.skipKey) {
                return;
            }
            else {
                var diffResult = {
                    path: formattedKey,
                    resultType: "missing element",
                    message: "field " + formattedKey + " not present in lhs"
                };
                return differences.push(diffResult);
            }
        }
        else {
            if (fieldOptions.skipKey) {
                return;
            }
            else {
                if (options.compareElementValues) {
                    var valueA = void 0;
                    var valueB = void 0;
                    if (a[key] !== undefined) {
                        valueA = a[key].toString();
                    }
                    if (b[key] !== undefined) {
                        valueB = b[key].toString();
                    }
                    if (valueB !== undefined && valueA !== valueB && valueA !== "*") {
                        var resultValueA = JSON.stringify(a[key], null, 1);
                        var resultValueB = JSON.stringify(b[key], null, 1);
                        var diffResult = {
                            path: formattedKey,
                            resultType: "difference in element value",
                            message: {
                                lhs: resultValueA,
                                rhs: resultValueB
                            }
                        };
                        return differences.push(diffResult);
                    }
                }
            }
        }
        if (!underscore_1.default.contains(bk, key)) {
            if (fieldOptions.skipKey) {
                return;
            }
            else {
                var diffResult = {
                    path: formattedKey,
                    resultType: "missing element",
                    message: "field " + formattedKey + " not present in rhs"
                };
                return differences.push(diffResult);
            }
        }
        if (underscore_1.default.isArray(a[key])) {
            for (var i = 0; i < a[key].length; i++) {
                var objA = a[key][i];
                var objB = b[key][i];
                if (objA === "" && objB === "") {
                    return;
                }
                if (objA === "false" && objB === "false") {
                    return;
                }
                if (objA === 0 && objB === 0) {
                    return;
                }
                if (!objB) {
                    var diffResult = {
                        path: formattedKey,
                        resultType: "missing element",
                        message: "field " + formattedKey + "[" + i + "] not present in rhs"
                    };
                    return differences.push(diffResult);
                }
                if (!objA) {
                    var diffResult = {
                        path: formattedKey,
                        resultType: "missing element",
                        message: "element " + formattedKey + "[" + i + "] not present in lhs"
                    };
                    return differences.push(diffResult);
                }
                if (underscore_1.default.isObject(a[key][i]) &&
                    underscore_1.default.isObject(b[key][i])) {
                    differences = differences.concat(compareObjects(a[key][i], b[key][i], schema, formattedKey + "[" + i + "].", options));
                }
            }
        }
        else if (underscore_1.default.isObject(a[key])) {
            differences = differences.concat(compareObjects(a[key], b[key], schema, formattedKey + ".", options));
        }
    });
    return differences;
};
function adjustXMLforDiff(input) {
    return input.replace(/({"_text":)("?(.*?)"?)(})/g, "$2");
}
function diff(lhs, rhs, schema, options, next) {
    next(compareObjects(lhs, rhs, schema || {}, null, underscore_1.default.extend({}, defaultOptions, options)));
}
exports.diff = diff;
function diffAsXml(lhs, rhs, schema, options, next) {
    var xml2JsOpts = underscore_1.default.extend({}, defaultXml2JsOptions);
    if (options && options.xml2jsOptions) {
        underscore_1.default.extend(xml2JsOpts, options.xml2jsOptions);
    }
    var lhsp = xml_js_1.xml2json(lhs, xml2JsOpts);
    var rhsp = xml_js_1.xml2json(rhs, xml2JsOpts);
    var lhsCompareString = adjustXMLforDiff(lhsp);
    var rhsCompareString = adjustXMLforDiff(rhsp);
    var jsonLhs = JSON.parse(lhsCompareString);
    var jsonRhs = JSON.parse(rhsCompareString);
    next(compareObjects(jsonLhs, jsonRhs, schema || {}, null, underscore_1.default.extend({}, defaultOptions, options)));
}
exports.diffAsXml = diffAsXml;
