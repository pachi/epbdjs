/* -*- coding: utf-8 -*-

Copyright (c) 2016-2017 Ministerio de Fomento
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

/* eslint-disable no-console */
import { 
  parse_wfactordata,
  serialize_wfactordata,
  energy_performance,
  cte
} from './index.js';
import * as fs from 'fs';
import * as path from 'path';

const TESTFPJ = parse_wfactordata(`vector, fuente, uso, step, ren, nren
ELECTRICIDAD, RED, input, A, 0.5, 2.0
ELECTRICIDAD, INSITU, input,   A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0
GASNATURAL, RED, input,A, 0.0, 1.1
BIOCARBURANTE, RED, input, A, 1.1, 0.1
MEDIOAMBIENTE, INSITU, input,  A, 1.0, 0.0
MEDIOAMBIENTE, RED, input,  A, 1.0, 0.0
`);

const TESTFPJ7 = parse_wfactordata(`vector, fuente, uso, step, ren, nren
ELECTRICIDAD, RED, input, A, 0.5, 2.0
GASNATURAL, RED, input,A, 0.0, 1.1
ELECTRICIDAD, COGENERACION, input, A, 0.0, 0.0
ELECTRICIDAD, COGENERACION, to_grid, A, 0.0, 2.5
ELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0`);

const TESTFPJ8 = parse_wfactordata(`vector, fuente, uso, step, ren, nren
ELECTRICIDAD, RED, input, A, 0.5, 2.0
GASNATURAL, RED, input,A, 0.0, 1.1
BIOCARBURANTE, RED, input, A, 1.0, 0.1
ELECTRICIDAD, COGENERACION, input, A, 0.0, 0.0
ELECTRICIDAD, COGENERACION, to_grid, A, 2.27, 0.23
ELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0`);

const TESTFPJ9 = parse_wfactordata(`vector, fuente, uso, step, ren, nren
ELECTRICIDAD, RED, input, A, 0.5, 2.0
ELECTRICIDAD, INSITU, input,   A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_nEPB, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0
ELECTRICIDAD, INSITU, to_nEPB, B, 0.5, 2.0`);

const TESTFP = parse_wfactordata(`vector, fuente, uso, step, ren, nren

ELECTRICIDAD, RED, input, A, 0.5, 2.0

ELECTRICIDAD, INSITU, input,   A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_nEPB, A, 1.0, 0.0
ELECTRICIDAD, INSITU, to_grid, B, 0.5, 2.0
ELECTRICIDAD, INSITU, to_nEPB, B, 0.5, 2.0

GASNATURAL, RED, input,A, 0.0, 1.1

BIOCARBURANTE, RED, input, A, 1.1, 0.1

MEDIOAMBIENTE, INSITU, input,  A, 1.0, 0.0
MEDIOAMBIENTE, RED, input,  A, 1.0, 0.0

ELECTRICIDAD, COGENERACION, input,   A, 0.0, 0.0
ELECTRICIDAD, COGENERACION, to_grid, A, 0.0, 2.5
ELECTRICIDAD, COGENERACION, to_nEPB, A, 1.0, 0.0
ELECTRICIDAD, COGENERACION, to_grid, B, 0.5, 2.0
ELECTRICIDAD, COGENERACION, to_nEPB, B, 0.5, 2.0`);

const CTEFP = cte.CTE_FP;

// data from ejemplo3PVBdC_normativo
const ENERGYDATALIST = { cmeta: [], cdata: [
  { values: [9.67, 7.74, 4.84, 4.35, 2.42, 2.9, 3.87, 3.39, 2.42, 3.87, 5.8, 7.74],
    carrier: 'ELECTRICIDAD', ctype: 'CONSUMO', csubtype: 'EPB' },
  { values: [1.13, 1.42, 1.99, 2.84, 4.82, 5.39, 5.67, 5.11, 4.54, 3.40, 2.27, 1.42],
    carrier: 'ELECTRICIDAD', ctype: 'PRODUCCION', csubtype: 'INSITU' },
  { values: [21.48, 17.18, 10.74, 9.66, 5.37, 6.44, 8.59, 7.52, 5.37, 8.59, 12.89, 17.18],
    carrier: 'MEDIOAMBIENTE', ctype: 'CONSUMO', csubtype: 'EPB' },
  { values: [21.48, 17.18, 10.74, 9.66, 5.37, 6.44, 8.59, 7.52, 5.37, 8.59, 12.89, 17.18],
    carrier: 'MEDIOAMBIENTE', ctype: 'PRODUCCION', csubtype: 'INSITU' }
] };

const TESTKEXP = 1.0;

// Utilities ------------------------------------------------------------

// const myround = (num, ndigits = 2) => Math.round(num * Math.pow(10, ndigits)) / Math.pow(10, ndigits);
const reserr = (ep1, ep2) => {
  const res = Math.sqrt(Math.pow(ep1.ren - ep2.ren, 2) + Math.pow(ep1.nren - ep2.nren, 2));
  return isNaN(res) || (res > 2.0);
};
const showEP = (ep, step) => `EP(${ step })`
  + `: ren = ${ ep.ren.toFixed(1) }`
  + `, nren= ${ ep.nren.toFixed(1) }`
  + `, tot = ${ (ep.ren + ep.nren).toFixed(1) }`
  + `, RER = ${ (ep.ren / (ep.ren + ep.nren)).toFixed(2) }`;


// Check that the computed value is within a valid range of precomputed result
function check(casename, computed, result, verbose = false) {
  let errA = false;
  let errB = false;

  if (result.balance.hasOwnProperty('A')) {
    errA = reserr(computed.balance.A, result.balance.A);
  }

  if (result.balance.hasOwnProperty('B')) {
    errB = reserr(computed.balance.B, result.balance.B);
  }

  const isError = errA || errB;

  let outstr;
  if (isError) {
    outstr = `[ERROR] ${casename} (${computed.path})`;
    if (errA) {
      outstr += `\n  Found:    ${ showEP(computed.balance.A, 'A') }`
        + `\n  Expected: ${ showEP(result.balance.A, 'A')}`;
    } else if (verbose) {
      outstr += `\n  ${ showEP(computed.balance.A, 'A') }`;
    }
    if (errB) {
      outstr += `\n  Found:    ${ showEP(computed.balance.B, 'B') }`
        + `\n  Expected: ${ showEP(result.balance.B, 'B')}`;
    } else if (verbose) {
      outstr += `\n  ${ showEP(computed.balance.B, 'B') }`;
    }
    if (verbose) {
      outstr += `\n\n**** Balance ****\n\n${ JSON.stringify(computed, null, 4) }`;
    }
  } else {
    const path = computed.path;
    outstr = `[OK] ${casename} ${ path ? '(' + path + ')' : '' }`;
    if (verbose) {
      outstr += `\n  ${ showEP(computed.balance.A, 'A') }`
        + `\n  ${ showEP(computed.balance.B, 'B')}`;
    }
  }
  console.log(outstr);
}

// Compute primary energy (weighted energy) from datalist
function epfromdata(carrierdata, fpdata, kexp) {
  return energy_performance(carrierdata, fpdata, kexp);
}

// Compute primary energy (weighted energy) from data in filename
function epfromfile(filename, fpdata, kexp) {
  const datapath = path.resolve(__dirname, 'examples', filename);
  const datastring = fs.readFileSync(datapath, 'utf-8');
  const carrierdata = cte.parse_carrierdata(datastring)
  return epfromdata(carrierdata, fpdata, kexp);
}

// Return carrier data from filename (path relative to this test file)
function carrierdatafromfile(filename) {
  const datapath = path.resolve(__dirname, filename);
  const datastring = fs.readFileSync(datapath, 'utf-8');
  return cte.parse_carrierdata(datastring);
}

// Tests ----------------------------------------------------------
console.log("*** Ejemplos FprEN 15603:2014\n");

check('1 base',
      epfromfile('ejemplo1base.csv', TESTFP, TESTKEXP),
      { balance: { B: { ren: 50.0, nren: 200.0 } } });

check('1 base_normativo',
      epfromfile('ejemplo1base.csv', CTEFP, TESTKEXP),
      { balance: { B: { ren: 41.4, nren: 195.4 } } });

check('1 PV',
      epfromfile('ejemplo1PV.csv', TESTFP, TESTKEXP),
      { balance: { B: { ren: 75.0, nren: 100.0 } } });

check('1 PV_normativo',
      epfromfile('ejemplo1PV.csv', CTEFP, TESTKEXP),
      { balance: { B: { ren: 70.7, nren: 97.7 } } });

check('1 xPV',
      epfromfile('ejemplo1xPV.csv', TESTFP, TESTKEXP),
      { balance: { B: { ren: 120.0, nren: -80.0 } } });

check('1 xPV_normativo',
      epfromfile('ejemplo1xPV.csv', CTEFP, TESTKEXP),
      { balance: { B: { ren: 123.4, nren: -78.2 } } });

check('1 xPVk0',
      epfromfile('ejemplo1xPV.csv', TESTFP, 0.0),
      { balance: { B: { ren: 100.0, nren: 0.0 } } });

check('1 xPVk0_normativo',
      epfromfile('ejemplo1xPV.csv', CTEFP, 0.0),
      { balance: { B: { ren: 100.0, nren: 0.0 } } });

check('2 xPV gas',
      epfromfile('ejemplo2xPVgas.csv', TESTFP, TESTKEXP),
      { balance: { B: { ren: 30.0, nren: 169.0 } } });

check('2 xPV gas_normativo',
      epfromfile('ejemplo2xPVgas.csv', CTEFP, TESTKEXP),
      { balance: { B: { ren: 32.7, nren: 187.0 } } });

check('3 PV BdC',
      epfromfile('ejemplo3PVBdC.csv', TESTFP, TESTKEXP),
      { balance: { B: { ren: 180.0, nren: 38.0 } } });

check('3 PV BdC_normativo',
      epfromfile('ejemplo3PVBdC.csv', CTEFP, TESTKEXP),
      { balance: { B: { ren: 178.9, nren: 37.1 } } });

check('4 cgn fosil',
      epfromfile('ejemplo4cgnfosil.csv', TESTFP, TESTKEXP),
      { balance: { B: { ren: -14.0, nren: 227.0 } } });

check('4 cgn fosil_normativo',
      epfromfile('ejemplo4cgnfosil.csv', CTEFP, TESTKEXP),
      { balance: { B: { ren: -10.3, nren: 252.4 } } });

check('5 cgn biogas',
      epfromfile('ejemplo5cgnbiogas.csv', TESTFP, TESTKEXP),
      { balance: { B: { ren: 159.0, nren: 69.0 } } });

check('5 cgn biogas_normativo',
      epfromfile('ejemplo5cgnbiogas.csv', CTEFP, TESTKEXP),
      { balance: { B: { ren: 151.3, nren: 77.8 } } });

check('6 K3',
      epfromfile('ejemplo6K3.csv', TESTFP, TESTKEXP),
      { balance: { B: { ren: 1385.5, nren: -662 } } });

check('3 PV BdC_normativo_from_partial_data',
      epfromdata(ENERGYDATALIST, CTEFP, TESTKEXP),
      { balance: { B: { ren: 178.9, nren: 37.1 } } });

// -----------------------------------------------------------

console.log("*** Ejemplos ISO/TR 52000-2:2016\n");

check('J1 Base kexp=1.0',
      epfromfile('ejemploJ1_base.csv', TESTFPJ, TESTKEXP),
      { balance: { B: { ren: 50.0, nren: 200.0 }, A: { ren: 50, nren: 200 } } });

check('J2 Base + PV kexp=1.0',
      epfromfile('ejemploJ2_basePV.csv', TESTFPJ, TESTKEXP),
      { balance: { B: { ren: 75.0, nren: 100.0 }, A: { ren: 75, nren: 100 } } });

check('J3 Base + PV excess kexp=1.0',
      epfromfile('ejemploJ3_basePVexcess.csv', TESTFPJ, TESTKEXP),
      { balance: { B: { ren: 120, nren: -80.0 }, A: { ren: 100, nren: 0 } } });

check('J4 Base + PV excess kexp=0.0',
      epfromfile('ejemploJ3_basePVexcess.csv', TESTFPJ, 0.0),
      { balance: { B: { ren: 100, nren: 0.0 }, A: { ren: 100, nren: 0 } } });

check('J5 Gas boiler + PV for auxiliaries kexp=1.0',
      epfromfile('ejemploJ5_gasPV.csv', TESTFPJ, TESTKEXP),
      { balance: { B: { ren: 30, nren: 169 }, A: { ren: 20, nren: 209 } } });

check('J6 Heat pump + PV kexp=1.0',
      epfromfile('ejemploJ6_HPPV.csv', TESTFPJ, TESTKEXP),
      { balance: { B: { ren: 181, nren: 38 }, A: { ren: 181, nren: 38 } } });

check('J7 Co-generator (gas) + Gas boiler kexp=1.0',
      epfromfile('ejemploJ7_cogenfuelgasboiler.csv', TESTFPJ7, TESTKEXP),
      { balance: { B: { ren: -14, nren: 229 }, A: { ren: 0, nren: 215 } } });

check('J8 Co-generator (biogas) + Gas boiler kexp=1.0',
      epfromfile('ejemploJ8_cogenbiogasboiler.csv', TESTFPJ8, TESTKEXP),
      { balance: { B: { ren: 144, nren: 71 }, A: { ren: 96, nren: 120 } } });

check('J9 electricity monthly kexp=1.0',
      epfromfile('ejemploJ9_electr.csv', TESTFPJ9, TESTKEXP),
      { balance: { B: { ren: 1386.0, nren: -662.0 }, A: { ren: 1010, nren: 842 } } }, true);

// ---------------------------------------------------------------

console.log("*** Lectura de cadena de factores de paso");
{
  const wmeta = CTEFP.wmeta;
  const wdata = CTEFP.wdata;
  //console.log(metas[0]);
  //console.log(fps[0]);
  if (wmeta.length === 2 && wdata.length === 36) {
    console.log(`[OK] Encontrados (META/FACTOR) ${ wmeta.length } / ${ wdata.length }`);
  } else {
    console.log(`[ERROR] Encontrados (META/FACTOR) ${ wmeta.length } / ${ wdata.length }. Esperados 1 / 21`);
  }
}

console.log("*** Serialización de factores de paso");
{
  try {
    serialize_wfactordata(CTEFP);
  } catch(e) {
    console.log("[ERROR] al serializar factores de paso");
  } finally {
    console.log("[OK] Serialización correcta de factores de paso");
  }
}

console.log("*** Lectura de archivo .csv (formato obsoleto) con metadatos");
{
  const components = carrierdatafromfile('examples/cteEPBD-N_R09_unif-ET5-V048R070-C1_peninsula.csv')
  const cmetas = components.cmeta;
  const cdata = components.cdata
    .filter(cte.carrier_isvalid);

  if (cmetas.length === 70 && cdata.length === 4) {
    console.log(`[OK] Encontrados (META/CARRIER) ${ cmetas.length } / ${ cdata.length }`);
  } else {
    console.log(`[ERROR] Encontrados (META/CARRIER) ${ cmetas.length } / ${ cdata.length }. Esperados 1 / 21`);
  }
}

console.log("*** Lectura de archivo .csv con definición de servicios");
{
  const components = carrierdatafromfile('examples/newServicesFormat.csv');
  const cmetas = components.cmeta;
  const cdata = components.cdata
    .filter(cte.carrier_isvalid);
  if (cmetas.length === 3 && cdata.length === 4) {
    console.log(`[OK] Encontrados (META/CARRIER) ${ cmetas.length } / ${ cdata.length }`);
  } else {
    console.log(`[ERROR] Encontrados (META/CARRIER) ${ cmetas.length } / ${ cdata.length }. Esperados 1 / 21`);
  }
}

console.log("*** Lectura, generación y simplificación de factores de paso");
{
  const FPFILE = path.resolve(__dirname, 'examples', 'factores_paso_20140203.csv');
  const KEXP = 0.0;
  const components = carrierdatafromfile('examples/cte_test_carriers.csv');

  // Read weighting factors
  const fpstring = fs.readFileSync(FPFILE, 'utf-8');
  const fp = cte.parse_wfactordata(fpstring);
  if(fp) {
    console.log("[OK] Lectura correcta de factores de paso del archivo: ", path.basename(FPFILE));
  }
  const fpgen = cte.new_wfactordata('PENINSULA');
  if(fpgen) {
    console.log("[OK] Generación correcta de factores de paso para PENINSULA");
  }
  const fpstrip = cte.strip_wfactordata(fpgen, components);
  if (fpgen.length === 30 && fpstrip.length === 11) {
    console.log(`[OK] Reducción factores de paso de ${ fpgen.length } a ${ fpstrip.length }`);
  } else {
    console.log(`[ERROR] Encontrados (META/CARRIER) ${ fpgen.length } / ${ fpstrip.length }. Esperados 30 / 11`);
  }

  const res = energy_performance(components, fp, KEXP);
  const res1 = energy_performance(components, fpgen, KEXP);
  const res2 = energy_performance(components, fpstrip, KEXP);

  if(res.balance.B.ren === res1.balance.B.ren && res.balance.B.nren === res1.balance.B.nren) {
    console.log("[OK] Coincide balance con factores de paso leídos y generados")
  } else {
    console.log("[ERROR]");
    console.log("[ERROR] Balance con factores leídos: ", showEP(res.balance.B, 'B'));
    console.log("[ERROR] Balance con factores generados: ", showEP(res1.balance.B, 'B'));
  }

  if(res1.balance.B.ren === res2.balance.B.ren && res1.balance.B.nren === res2.balance.B.nren) {
    console.log("[OK] Coincide balance con factores de paso generados y simplificados")
  } else {
    console.log("[ERROR]");
    console.log("[ERROR] Balance con factores generados: ", showEP(res1.balance.B, 'B'));
    console.log("[ERROR] Balance con factores simplificados: ", showEP(res2.balance.B, 'B'));
  }
  console.log(cte.balance_to_plain(res));
  const balxml = cte.balance_to_XML(res);
  console.log("[OK] Salida de Balance en XML");
  const baljson = cte.balance_to_JSON(res);
  console.log("[OK] Salida de Balance en JSON");
}
