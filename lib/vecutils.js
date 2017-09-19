"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.veclistsum = veclistsum;
exports.vecvecmin = vecvecmin;
exports.vecvecsum = vecvecsum;
exports.vecvecdif = vecvecdif;
exports.vecvecmul = vecvecmul;
exports.veckmul = veckmul;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/* -*- coding: utf-8 -*-

Copyright (c) 2016 Ministerio de Fomento
                   Instituto de Ciencias de la Construcción Eduardo Torroja (IETcc-CSIC)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Author(s): Rafael Villar Burke <pachi@ietcc.csic.es>,
           Daniel Jiménez González <dani@ietcc.csic.es>
*/

// -----------------------------------------------------------------------------------
// Vector utilities
// -----------------------------------------------------------------------------------
var zip = exports.zip = function zip() {
  for (var _len = arguments.length, rows = Array(_len), _key = 0; _key < _len; _key++) {
    rows[_key] = arguments[_key];
  }

  return [].concat(_toConsumableArray(rows[0])).map(function (_, c) {
    return rows.map(function (row) {
      return row[c];
    });
  });
};

// Elementwise sum res[i] = vec1[i] + vec2[i] + ... + vecj[i]
function veclistsum(veclist) {
  return zip.apply(undefined, _toConsumableArray(veclist)).map(function (valsi) {
    return valsi.reduce(function (a, b) {
      return a + b;
    }, 0);
  });
}

// Elementwise minimum min res[i] = min(vec1[i], vec2[i])
function vecvecmin(vec1, vec2) {
  return vec1.map(function (el, ii) {
    return Math.min(el, vec2[ii]);
  });
}

// Elementwise sum of arrays
function vecvecsum(vec1, vec2) {
  return vec1.map(function (el, ii) {
    return el + vec2[ii];
  });
}

// Elementwise difference res[i] = vec1[i] - vec2[i]
function vecvecdif(vec1, vec2) {
  return vec1.map(function (el, ii) {
    return el - vec2[ii];
  });
}

// Elementwise multiplication res[i] = vec1[i] * vec2[i]
function vecvecmul(vec1, vec2) {
  return vec1.map(function (el, ii) {
    return el * vec2[ii];
  });
}

// Multiply vector by scalar
function veckmul(vec1, k) {
  return vec1.map(function (v) {
    return v * k;
  });
}

// Sum all elements in a vector
var vecsum = exports.vecsum = function vecsum(vec) {
  return vec.reduce(function (a, b) {
    return a + b;
  }, 0);
};
