'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /* -*- coding: utf-8 -*-
                                                                                                                                                                                                                                                                  
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

var _energycalculations = require('./energycalculations.js');

var _cteepbd = require('./cteepbd.js');

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _path = require('path');

var path = _interopRequireWildcard(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var TESTFPJ = (0, _energycalculations.parse_weighting_factors)('vector, fuente, uso, step, ren, nren\nELECTRICIDAD, RED, input, A, 0.5, 2.0\nELECTRICIDAD, INSITU, input,   A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0\nGASNATURAL, RED, input,A, 0.0, 1.1\nBIOCARBURANTE, RED, input, A, 1.1, 0.1\nMEDIOAMBIENTE, INSITU, input,  A, 1.0, 0.0\nMEDIOAMBIENTE, RED, input,  A, 1.0, 0.0\n');

var TESTFPJ7 = (0, _energycalculations.parse_weighting_factors)('vector, fuente, uso, step, ren, nren\nELECTRICIDAD, RED, input, A, 0.5, 2.0\nGASNATURAL, RED, input,A, 0.0, 1.1\nELECTRICIDAD, COGENERACION, input, A, 0.0, 0.0\nELECTRICIDAD, COGENERACION, to_grid, A, 0.0, 2.5\nELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0');

var TESTFPJ8 = (0, _energycalculations.parse_weighting_factors)('vector, fuente, uso, step, ren, nren\nELECTRICIDAD, RED, input, A, 0.5, 2.0\nGASNATURAL, RED, input,A, 0.0, 1.1\nBIOCARBURANTE, RED, input, A, 1.0, 0.1\nELECTRICIDAD, COGENERACION, input, A, 0.0, 0.0\nELECTRICIDAD, COGENERACION, to_grid, A, 2.27, 0.23\nELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0');

var TESTFPJ9 = (0, _energycalculations.parse_weighting_factors)('vector, fuente, uso, step, ren, nren\nELECTRICIDAD, RED, input, A, 0.5, 2.0\nELECTRICIDAD, INSITU, input,   A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_nEPB, A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0\nELECTRICIDAD, INSITU, to_nEPB, B, 0.5, 2.0');

var TESTFP = (0, _energycalculations.parse_weighting_factors)('vector, fuente, uso, step, ren, nren\n\nELECTRICIDAD, RED, input, A, 0.5, 2.0\n\nELECTRICIDAD, INSITU, input,   A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_nEPB, A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0\nELECTRICIDAD, INSITU, to_nEPB, B, 0.5, 2.0\n\nGASNATURAL, RED, input,A, 0.0, 1.1\n\nBIOCARBURANTE, RED, input, A, 1.1, 0.1\n\nMEDIOAMBIENTE, INSITU, input,  A, 1.0, 0.0\nMEDIOAMBIENTE, RED, input,  A, 1.0, 0.0\n\nELECTRICIDAD, COGENERACION, input,   A, 0.0, 0.0\nELECTRICIDAD, COGENERACION, to_grid, A, 0.0, 2.5\nELECTRICIDAD, COGENERACION, to_nEPB, A, 1.0, 0.0\nELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0\nELECTRICIDAD, COGENERACION, to_nEPB, B, 0.5, 2.0');

var CTEFPSTRING = 'vector, fuente, uso, step, ren, nren\n#valores de la propuesta del documento reconocido del IDAE de 03/02/2014, p\xE1gina 14\n#META FUENTEFP: CTE2013\n\nELECTRICIDAD, RED, input, A, 0.341, 2.082\n\nELECTRICIDADBALEARES, RED, input, A, 0.094, 3.060\nELECTRICIDADCANARIAS, RED, input, A, 0.059, 3.058\nELECTRICIDADCEUTAMELILLA, RED, input, A, 0.066, 2.759\n\nELECTRICIDAD, INSITU, input,   A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_nEPB, A, 1.0, 0.0\nELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0\nELECTRICIDAD, INSITU, to_nEPB, B, 0.5, 2.0\n\nGASOLEO, RED, input, A, 0.003, 1.179\n\nGLP, RED, input, A, 0.03, 1.201\n\nGASNATURAL, RED, input,A, 0.005, 1.190\n\nCARBON, RED, input, A, 0.002, 1.082\n\nBIOCARBURANTE, RED, input, A, 1.028, 0.085 #BIOMASA DENSIFICADA (PELLETS)\n\nMEDIOAMBIENTE, INSITU, input,  A, 1.0, 0.0\nMEDIOAMBIENTE, RED, input,  A, 1.0, 0.0\n\nELECTRICIDAD, COGENERACION, input,   A, 0.0, 0.0\nELECTRICIDAD, COGENERACION, to_grid, A, 1.0, 0.0\nELECTRICIDAD, COGENERACION, to_nEPB, A, 1.0, 0.0\nELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0\nELECTRICIDAD, COGENERACION, to_nEPB, B, 0.5, 2.0';

var CTEFP = (0, _energycalculations.parse_weighting_factors)(CTEFPSTRING);

// data from ejemplo3PVBdC_normativo
var ENERGYDATALIST = [{ values: [9.67, 7.74, 4.84, 4.35, 2.42, 2.9, 3.87, 3.39, 2.42, 3.87, 5.8, 7.74],
  carrier: 'ELECTRICIDAD', ctype: 'CONSUMO', csubtype: 'EPB' }, { values: [1.13, 1.42, 1.99, 2.84, 4.82, 5.39, 5.67, 5.11, 4.54, 3.40, 2.27, 1.42],
  carrier: 'ELECTRICIDAD', ctype: 'PRODUCCION', csubtype: 'INSITU' }, { values: [21.48, 17.18, 10.74, 9.66, 5.37, 6.44, 8.59, 7.52, 5.37, 8.59, 12.89, 17.18],
  carrier: 'MEDIOAMBIENTE', ctype: 'CONSUMO', csubtype: 'EPB' }, { values: [21.48, 17.18, 10.74, 9.66, 5.37, 6.44, 8.59, 7.52, 5.37, 8.59, 12.89, 17.18],
  carrier: 'MEDIOAMBIENTE', ctype: 'PRODUCCION', csubtype: 'INSITU' }];

var TESTKEXP = 1.0;

// Utilities ------------------------------------------------------------

var myround = function myround(num) {
  var ndigits = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
  return Math.round(num * Math.pow(10, ndigits)) / Math.pow(10, ndigits);
};
var reserr = function reserr(ep1, ep2) {
  var res = Math.sqrt(Math.pow(ep1.ren - ep2.ren, 2) + Math.pow(ep1.nren - ep2.nren, 2));
  return isNaN(res) || res > 2.0;
};
var showEP = function showEP(ep, step) {
  return 'EP(' + step + ')' + (': ren = ' + ep.ren.toFixed(1)) + (', nren= ' + ep.nren.toFixed(1)) + (', tot = ' + (ep.ren + ep.nren).toFixed(1)) + (', RER = ' + (ep.ren / (ep.ren + ep.nren)).toFixed(2));
};

// Check that the computed value is within a valid range of precomputed result
function check(casename, computed, result) {
  var verbose = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var errA = false;
  var errB = false;

  if (result.EP.hasOwnProperty('A')) {
    errA = reserr(computed.EP.A, result.EP.A);
  }

  if (result.EP.hasOwnProperty('B')) {
    errB = reserr(computed.EP.B, result.EP.B);
  }

  var isError = errA || errB;

  var outstr = void 0;
  if (isError) {
    outstr = '[ERROR] ' + casename + ' (' + computed.path + ')';
    if (errA) {
      outstr += '\n  Found:    ' + showEP(computed.EP.A, 'A') + ('\n  Expected: ' + showEP(result.EP.A, 'A'));
    } else if (verbose) {
      outstr += '\n  ' + showEP(computed.EP.A, 'A');
    }
    if (errB) {
      outstr += '\n  Found:    ' + showEP(computed.EP.B, 'B') + ('\n  Expected: ' + showEP(result.EP.B, 'B'));
    } else if (verbose) {
      outstr += '\n  ' + showEP(computed.EP.B, 'B');
    }
    if (verbose) {
      outstr += '\n\n**** Balance ****\n\n' + JSON.stringify(computed, null, 4);
    }
  } else {
    outstr = '[OK] ' + casename + ' (' + computed.path + ')';
    if (verbose) {
      outstr += '\n  ' + showEP(computed.EP.A, 'A') + ('\n  ' + showEP(computed.EP.B, 'B'));
    }
  }
  console.log(outstr);
}

// Compute primary energy (weighted energy) from datalist
function epfromdata(datalist, fp, kexp) {
  var balance = (0, _energycalculations.energy_performance)(datalist, fp, kexp);
  return _extends({}, balance, { path: 'data' });
}

// Compute primary energy (weighted energy) from data in filename
function epfromfile(filename, fp, kexp) {
  var datapath = path.resolve(__dirname, 'examples', filename);
  var datastring = fs.readFileSync(datapath, 'utf-8');
  var carrierlist = (0, _energycalculations.parse_carrier_list)(datastring).filter(function (c) {
    return c.type === 'CARRIER';
  }).filter(_cteepbd.carrier_isvalid);
  return epfromdata(carrierlist, fp, kexp);
}

// Tests ----------------------------------------------------------
console.log("*** Ejemplos FprEN 15603:2014\n");

check('1 base', epfromfile('ejemplo1base.csv', TESTFP, TESTKEXP), { EP: { B: { ren: 50.0, nren: 200.0 } } });

check('1 base_normativo', epfromfile('ejemplo1base.csv', CTEFP, TESTKEXP), { EP: { B: { ren: 34.1, nren: 208.20 } } });

check('1 PV', epfromfile('ejemplo1PV.csv', TESTFP, TESTKEXP), { EP: { B: { ren: 75.0, nren: 100.0 } } });

check('1 PV_normativo', epfromfile('ejemplo1PV.csv', CTEFP, TESTKEXP), { EP: { B: { ren: 67.1, nren: 104.1 } } });

check('1 xPV', epfromfile('ejemplo1xPV.csv', TESTFP, TESTKEXP), { EP: { B: { ren: 120.0, nren: -80.0 } } });

check('1 xPV_normativo', epfromfile('ejemplo1xPV.csv', CTEFP, TESTKEXP), { EP: { B: { ren: 120.0, nren: -80.0 } } });

check('1 xPVk0', epfromfile('ejemplo1xPV.csv', TESTFP, 0.0), { EP: { B: { ren: 100.0, nren: 0.0 } } });

check('1 xPVk0_normativo', epfromfile('ejemplo1xPV.csv', CTEFP, 0.0), { EP: { B: { ren: 100.0, nren: 0.0 } } });

check('2 xPV gas', epfromfile('ejemplo2xPVgas.csv', TESTFP, TESTKEXP), { EP: { B: { ren: 30.0, nren: 169.0 } } });

check('2 xPV gas_normativo', epfromfile('ejemplo2xPVgas.csv', CTEFP, TESTKEXP), { EP: { B: { ren: 30.9, nren: 186.1 } } });

check('3 PV BdC', epfromfile('ejemplo3PVBdC.csv', TESTFP, TESTKEXP), { EP: { B: { ren: 180.0, nren: 38.0 } } });

check('3 PV BdC_normativo', epfromfile('ejemplo3PVBdC.csv', CTEFP, TESTKEXP), { EP: { B: { ren: 177.5, nren: 39.6 } } });

check('4 cgn fosil', epfromfile('ejemplo4cgnfosil.csv', TESTFP, TESTKEXP), { EP: { B: { ren: -14.0, nren: 227.0 } } });

check('4 cgn fosil_normativo', epfromfile('ejemplo4cgnfosil.csv', CTEFP, TESTKEXP), { EP: { B: { ren: -12.7, nren: 251 } } });

check('5 cgn biogas', epfromfile('ejemplo5cgnbiogas.csv', TESTFP, TESTKEXP), { EP: { B: { ren: 159.0, nren: 69.0 } } });

check('5 cgn biogas_normativo', epfromfile('ejemplo5cgnbiogas.csv', CTEFP, TESTKEXP), { EP: { B: { ren: 148.9, nren: 76.4 } } });

check('6 K3', epfromfile('ejemplo6K3.csv', TESTFP, TESTKEXP), { EP: { B: { ren: 1385.5, nren: -662 } } });

check('3 PV BdC_normativo_from_data', epfromdata(ENERGYDATALIST, CTEFP, TESTKEXP), { EP: { B: { ren: 177.5, nren: 39.6 } } });

// -----------------------------------------------------------

console.log("*** Ejemplos ISO/TR 52000-2:2016\n");

check('J1 Base kexp=1.0', epfromfile('ejemploJ1_base.csv', TESTFPJ, TESTKEXP), { EP: { B: { ren: 50.0, nren: 200.0 }, A: { ren: 50, nren: 200 } } });

check('J2 Base + PV kexp=1.0', epfromfile('ejemploJ2_basePV.csv', TESTFPJ, TESTKEXP), { EP: { B: { ren: 75.0, nren: 100.0 }, A: { ren: 75, nren: 100 } } });

check('J3 Base + PV excess kexp=1.0', epfromfile('ejemploJ3_basePVexcess.csv', TESTFPJ, TESTKEXP), { EP: { B: { ren: 120, nren: -80.0 }, A: { ren: 100, nren: 0 } } });

check('J4 Base + PV excess kexp=0.0', epfromfile('ejemploJ3_basePVexcess.csv', TESTFPJ, 0.0), { EP: { B: { ren: 100, nren: 0.0 }, A: { ren: 100, nren: 0 } } });

check('J5 Gas boiler + PV for auxiliaries kexp=1.0', epfromfile('ejemploJ5_gasPV.csv', TESTFPJ, TESTKEXP), { EP: { B: { ren: 30, nren: 169 }, A: { ren: 20, nren: 209 } } });

check('J6 Heat pump + PV kexp=1.0', epfromfile('ejemploJ6_HPPV.csv', TESTFPJ, TESTKEXP), { EP: { B: { ren: 181, nren: 38 }, A: { ren: 181, nren: 38 } } });

check('J7 Co-generator (gas) + Gas boiler kexp=1.0', epfromfile('ejemploJ7_cogenfuelgasboiler.csv', TESTFPJ7, TESTKEXP), { EP: { B: { ren: -14, nren: 229 }, A: { ren: 0, nren: 215 } } });

check('J8 Co-generator (biogas) + Gas boiler kexp=1.0', epfromfile('ejemploJ8_cogenbiogasboiler.csv', TESTFPJ8, TESTKEXP), { EP: { B: { ren: 144, nren: 71 }, A: { ren: 96, nren: 120 } } });

check('J9 electricity monthly kexp=1.0', epfromfile('ejemploJ9_electr.csv', TESTFPJ9, TESTKEXP), { EP: { B: { ren: 1386.0, nren: -662.0 }, A: { ren: 1010, nren: 842 } } }, true);

// ---------------------------------------------------------------

console.log("*** Lectura de cadena de factores de paso");
{
  var fp_list = (0, _energycalculations.parse_weighting_factors)(CTEFPSTRING);
  var metas = fp_list.filter(function (e) {
    return e.type === 'META';
  });
  var fps = fp_list.filter(function (e) {
    return e.type === 'FACTOR';
  });
  console.log(metas[0]);
  console.log(fps[0]);
  if (metas.length === 1 && fps.length === 21) {
    console.log('[OK] Encontrados (META/FACTOR) ' + metas.length + ' / ' + fps.length);
  } else {
    console.log('[ERROR] Encontrados (META/FACTOR) ' + metas.length + ' / ' + fps.length + '. Esperados 1 / 21');
  }
}

console.log("*** Lectura de archivo .csv con metadatos");
{
  var datapath = path.resolve(__dirname, 'examples', 'cteEPBD-N_R09_unif-ET5-V048R070-C1_peninsula.csv');
  var datastring = fs.readFileSync(datapath, 'utf-8');
  var datalist = (0, _energycalculations.parse_carrier_list)(datastring);
  var _metas = datalist.filter(function (e) {
    return e.type === 'META';
  });
  var carriers = datalist.filter(function (e) {
    return e.type === 'CARRIER';
  }).filter(_cteepbd.carrier_isvalid);
  // console.log(metas2[0]);
  // console.log(carriers[0]);
  if (_metas.length === 70 && carriers.length === 4) {
    console.log('[OK] Encontrados (META/CARRIER) ' + _metas.length + ' / ' + carriers.length);
  } else {
    console.log('[ERROR] Encontrados (META/CARRIER) ' + _metas.length + ' / ' + carriers.length + '. Esperados 1 / 21');
  }
}

console.log("*** Lectura de archivo .csv con definición de servicios");
{
  var _datapath = path.resolve(__dirname, 'examples', 'newServicesFormat.csv');
  var _datastring = fs.readFileSync(_datapath, 'utf-8');
  var _datalist = (0, _energycalculations.parse_carrier_list)(_datastring);
  var _metas2 = _datalist.filter(function (e) {
    return e.type === 'META';
  });
  var _carriers = _datalist.filter(function (e) {
    return e.type === 'CARRIER';
  }).filter(_cteepbd.carrier_isvalid);
  if (_metas2.length === 3 && _carriers.length === 4) {
    console.log('[OK] Encontrados (META/CARRIER) ' + _metas2.length + ' / ' + _carriers.length);
  } else {
    console.log('[ERROR] Encontrados (META/CARRIER) ' + _metas2.length + ' / ' + _carriers.length + '. Esperados 1 / 21');
  }
}
