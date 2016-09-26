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

import { weighted_energy,
         readenergydata, readenergystring, readfactors,
         ep2string } from './energycalculations.js';
import * as fs from 'fs';
import * as path from 'path';

const TESTFP = readfactors(`vector, fuente, uso, step, ren, nren

ELECTRICIDAD, grid, input, A, 0.5, 2.0

ELECTRICIDAD, INSITU, input,   A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_nEPB, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0
ELECTRICIDAD, INSITU, to_nEPB, B, 0.5, 2.0

GASNATURAL, grid, input,A, 0.0, 1.1

BIOCARBURANTE, grid, input, A, 1.1, 0.1

MEDIOAMBIENTE, INSITU, input,  A, 1.0, 0.0

ELECTRICIDAD, COGENERACION, input,   A, 0.0, 0.0
ELECTRICIDAD, COGENERACION, to_grid, A, 1.0, 0.0
ELECTRICIDAD, COGENERACION, to_nEPB, A, 1.0, 0.0
ELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0
ELECTRICIDAD, COGENERACION, to_nEPB, B, 0.5, 2.0`);

const CTEFP = readfactors(`vector, fuente, uso, step, ren, nren
#valores de la propuesta del documento reconocido del IDAE de 03/02/2014, página 14

ELECTRICIDAD, grid, input, A, 0.341, 2.082

ELECTRICIDADBALEARES, grid, input, A, 0.094, 3.060
ELECTRICIDADCANARIAS, grid, input, A, 0.059, 3.058
ELECTRICIDADCEUTAMELILLA, grid, input, A, 0.066, 2.759

ELECTRICIDAD, INSITU, input,   A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_nEPB, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0
ELECTRICIDAD, INSITU, to_nEPB, B, 0.5, 2.0

GASOLEO, grid, input, A, 0.003, 1.179

GLP, grid, input, A, 0.03, 1.201

GASNATURAL, grid, input,A, 0.005, 1.190

CARBON, grid, input, A, 0.002, 1.082

BIOCARBURANTE, grid, input, A, 1.028, 0.085 #BIOMASA DENSIFICADA (PELLETS)

MEDIOAMBIENTE, INSITU, input,  A, 1.0, 0.0

ELECTRICIDAD, COGENERACION, input,   A, 0.0, 0.0
ELECTRICIDAD, COGENERACION, to_grid, A, 1.0, 0.0
ELECTRICIDAD, COGENERACION, to_nEPB, A, 1.0, 0.0
ELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0
ELECTRICIDAD, COGENERACION, to_nEPB, B, 0.5, 2.0`);

// data from ejemplo3PVBdC_normativo
const ENERGYDATALIST = [
  { values: [9.67, 7.74, 4.84, 4.35, 2.42, 2.9, 3.87, 3.39, 2.42, 3.87, 5.8, 7.74],
    carrier: 'ELECTRICIDAD', ctype: 'CONSUMO', originoruse: 'EPB' },
  { values: [1.13, 1.42, 1.99, 2.84, 4.82, 5.39, 5.67, 5.11, 4.54, 3.40, 2.27, 1.42],
    carrier: 'ELECTRICIDAD', ctype: 'PRODUCCION', originoruse: 'INSITU' },
  { values: [21.48, 17.18, 10.74, 9.66, 5.37, 6.44, 8.59, 7.52, 5.37, 8.59, 12.89, 17.18],
    carrier: 'MEDIOAMBIENTE', ctype: 'CONSUMO', originoruse: 'EPB' },
  { values: [21.48, 17.18, 10.74, 9.66, 5.37, 6.44, 8.59, 7.52, 5.37, 8.59, 12.89, 17.18],
    carrier: 'MEDIOAMBIENTE', ctype: 'PRODUCCION', originoruse: 'INSITU' }
];

const TESTKRDEL = 1.0;
const TESTKEXP = 1.0;

// Utilities ------------------------------------------------------------

// Check that result is within valid range
// isok is true if result must match to succeed
function check(casename, EPB, result, shouldpass = true) {
  const ep = EPB.EP;
  const reserr = Math.sqrt(Math.pow((ep.ren - result[0]), 2) + Math.pow((ep.nren - result[1]), 2));
  const gotvalue = result[0] + result[1];
  const expectedvalue = ep.ren + ep.nren;
  let outstr = `${ casename } (${ EPB.path })`;
  if ((shouldpass && reserr > 2.0) || (!shouldpass && !(reserr > 2.0))) {
    outstr = `ERROR - ${ outstr } -- Got: ${ gotvalue.toFixed(1) }, expected: ${ expectedvalue.toFixed(1) }
${ ep2string(EPB) }`;
  } else {
    outstr = `OK - ${ outstr }`;
  }
  console.log(outstr);
}

// Compute primary energy (weighted energy) from data in filename
function epfromfile(filename, krdel, kexp, fp) {
  const datapath = path.resolve(__dirname, 'examples', filename);
  const datastring = fs.readFileSync(datapath, 'utf-8');
  const data = readenergydata(readenergystring(datastring).components);
  return { ...weighted_energy(data, krdel, fp, kexp), path: filename };
}

// Compute primary energy (weighted energy) from datalist
function epfromdata(datalist, krdel, kexp, fp) {
  const data = readenergydata(datalist);
  return { ...weighted_energy(data, krdel, fp, kexp), path: 'data' };
}

// Tests ----------------------------------------------------------

check('ejemplo1base',
      epfromfile('ejemplo1base.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [50.0, 200.0]);

check('ejemplo1base_fail',
      epfromfile('ejemplo1base.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [53.0, 200.0], false);

check('ejemplo1base_normativo',
      epfromfile('ejemplo1base.csv', TESTKRDEL, TESTKEXP, CTEFP),
      [34.1, 208.20]);

check('ejemplo1PV',
      epfromfile('ejemplo1PV.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [75.0, 100.0]);

check('ejemplo1PV_normativo',
      epfromfile('ejemplo1PV.csv', TESTKRDEL, TESTKEXP, CTEFP),
      [67.1, 104.1]);

check('ejemplo1xPV',
      epfromfile('ejemplo1xPV.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [120.0, -80.0]);

check('ejemplo1xPV_normativo',
      epfromfile('ejemplo1xPV.csv', TESTKRDEL, TESTKEXP, CTEFP),
      [120.0, -80.0]);

check('ejemplo1xPVk0',
      epfromfile('ejemplo1xPV.csv', TESTKRDEL, 0.0, TESTFP),
      [100.0, 0.0]);

check('ejemplo1xPVk0_normativo',
      epfromfile('ejemplo1xPV.csv', TESTKRDEL, 0.0, CTEFP),
      [100.0, 0.0]);

check('ejemplo2xPVgas',
      epfromfile('ejemplo2xPVgas.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [30.0, 169.0]);

check('ejemplo2xPVgas_normativo',
      epfromfile('ejemplo2xPVgas.csv', TESTKRDEL, TESTKEXP, CTEFP),
      [30.9, 186.1]);

check('ejemplo3PVBdC',
      epfromfile('ejemplo3PVBdC.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [180.0, 38.0]);

check('ejemplo3PVBdC_normativo',
      epfromfile('ejemplo3PVBdC.csv', TESTKRDEL, TESTKEXP, CTEFP),
      [177.5, 39.6]);

check('ejemplo4cgnfosil',
      epfromfile('ejemplo4cgnfosil.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [-14.0, 227.0]);

check('ejemplo4cgnfosil_normativo',
      epfromfile('ejemplo4cgnfosil.csv', TESTKRDEL, TESTKEXP, CTEFP),
      [-12.7, 251]);

check('ejemplo5cgnbiogas',
      epfromfile('ejemplo5cgnbiogas.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [159.0, 69.0]);

check('ejemplo5cgnbiogas_normativo',
      epfromfile('ejemplo5cgnbiogas.csv', TESTKRDEL, TESTKEXP, CTEFP),
      [148.9, 76.4]);

check('ejemplo6K3',
      epfromfile('ejemplo6K3.csv', TESTKRDEL, TESTKEXP, TESTFP),
      [1385.5, -662]);

check('ejemplo6K3_normativo',
      epfromfile('ejemplo6K3.csv', TESTKRDEL, TESTKEXP, CTEFP),
      [1385.5, -662]);

check('ejemplo3PVBdC_normativo_from_data',
      epfromdata(ENERGYDATALIST, TESTKRDEL, TESTKEXP, CTEFP),
      [177.5, 39.6]);

// ---------------------------------------------------------------

// console.log(TESTFP);
// console.log(CTEFP);