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

import { veclistsum, vecvecdif } from './vecops.js';

// ---------------------------------------------------------------------------------------------------------
// Default values for energy efficiency calculation
//
// These are aimed towards energy efficiency evaluation in the spanish
// building code regulations (Código Técnico de la Edificación CTE).
//
// Weighting factors are based on primary energy use.
// Weighting factors are considered constant through timesteps
// ---------------------------------------------------------------------------------------------------------

export const K_EXP = 0.0;
export const FACTORESDEPASO = [
        // FpA - weighting factors accounting for the resources used to produce this energy
        // FpB - weighting factors accounting for the resources avoided by the external grid due to the export
        //  Energy carrier       source          dest        step Fpren  Fpnren
        ['ELECTRICIDAD',        'RED',          'input',     'A', 0.414, 1.954], // Delivered energy
        ['ELECTRICIDAD',        'INSITU',       'input',     'A', 1.000, 0.000], // Produced energy
        ['ELECTRICIDAD',        'INSITU',       'to_grid',   'A', 1.000, 0.000], // Produced and exported to the grid
        ['ELECTRICIDAD',        'INSITU',       'to_nEPB',   'A', 1.000, 0.000], // Produced and exported to nEPB uses
        ['ELECTRICIDAD',        'INSITU',       'to_grid',   'B', 0.414, 1.954], // Savings to the grid due to produced and exported to the grid energy
        ['ELECTRICIDAD',        'INSITU',       'to_nEPB',   'B', 0.414, 1.954], // Savings to the grid due to produced and exported to nEPB uses
        ['ELECTRICIDAD',        'COGENERACION', 'input',     'A', 0.000, 0.000], // There is no delivery from grid for this carrier
        ['ELECTRICIDAD',        'COGENERACION', 'to_grid',   'A', 0.000, 2.500], // User defined!
        ['ELECTRICIDAD',        'COGENERACION', 'to_nEPB',   'A', 0.000, 2.500], // User defined!
        ['ELECTRICIDAD',        'COGENERACION', 'to_grid',   'B', 0.414, 1.954], // Savings to the grid when exporting to the grid
        ['ELECTRICIDAD',        'COGENERACION', 'to_nEPB',   'B', 0.414, 1.954], // Savings to the grid when exporting to nEPB uses

        ['ELECTRICIDADBALEARES','RED',          'input',     'A', 0.082, 2.968], // Delivered energy
        ['ELECTRICIDADBALEARES','INSITU',       'input',     'A', 1.000, 0.000], // Produced energy
        ['ELECTRICIDADBALEARES','INSITU',       'to_grid',   'A', 1.000, 0.000], // Produced and exported to the grid
        ['ELECTRICIDADBALEARES','INSITU',       'to_nEPB',   'A', 1.000, 0.000], // Produced and exported to nEPB uses
        ['ELECTRICIDADBALEARES','INSITU',       'to_grid',   'B', 0.082, 2.968], // Savings to the grid due to produced and exported to the grid energy
        ['ELECTRICIDADBALEARES','INSITU',       'to_nEPB',   'B', 0.082, 2.968], // Savings to the grid due to produced and exported to nEPB uses
        ['ELECTRICIDADBALEARES','COGENERACION', 'input',     'A', 0.000, 0.000], // There is no delivery from grid for this carrier
        ['ELECTRICIDADBALEARES','COGENERACION', 'to_grid',   'A', 0.000, 2.500], // User defined!
        ['ELECTRICIDADBALEARES','COGENERACION', 'to_nEPB',   'A', 0.000, 2.500], // User defined!
        ['ELECTRICIDADBALEARES','COGENERACION', 'to_grid',   'B', 0.082, 2.968], // Savings to the grid when exporting to the grid
        ['ELECTRICIDADBALEARES','COGENERACION', 'to_nEPB',   'B', 0.082, 2.968], // Savings to the grid when exporting to nEPB uses

        ['ELECTRICIDADCANARIAS','RED',          'input',     'A', 0.070, 2.924], // Delivered energy
        ['ELECTRICIDADCANARIAS','INSITU',       'input',     'A', 1.000, 0.000], // Produced energy
        ['ELECTRICIDADCANARIAS','INSITU',       'to_grid',   'A', 1.000, 0.000], // Produced and exported to the grid
        ['ELECTRICIDADCANARIAS','INSITU',       'to_nEPB',   'A', 1.000, 0.000], // Produced and exported to nEPB uses
        ['ELECTRICIDADCANARIAS','INSITU',       'to_grid',   'B', 0.070, 2.924], // Savings to the grid due to produced and exported to the grid energy
        ['ELECTRICIDADCANARIAS','INSITU',       'to_nEPB',   'B', 0.070, 2.924], // Savings to the grid due to produced and exported to nEPB uses
        ['ELECTRICIDADCANARIAS','COGENERACION', 'input',     'A', 0.000, 0.000], // There is no delivery from grid for this carrier
        ['ELECTRICIDADCANARIAS','COGENERACION', 'to_grid',   'A', 0.000, 2.500], // User defined!
        ['ELECTRICIDADCANARIAS','COGENERACION', 'to_nEPB',   'A', 0.000, 2.500], // User defined!
        ['ELECTRICIDADCANARIAS','COGENERACION', 'to_grid',   'B', 0.070, 2.924], // Savings to the grid when exporting to the grid
        ['ELECTRICIDADCANARIAS','COGENERACION', 'to_nEPB',   'B', 0.070, 2.924], // Savings to the grid when exporting to nEPB uses

        ['ELECTRICIDADCEUTAMELILLA','RED',      'input',     'A', 0.072, 2.718], // Delivered energy
        ['ELECTRICIDADCEUTAMELILLA','INSITU',   'input',     'A', 1.000, 0.000], // Produced energy
        ['ELECTRICIDADCEUTAMELILLA','INSITU',   'to_grid',   'A', 1.000, 0.000], // Produced and exported to the grid
        ['ELECTRICIDADCEUTAMELILLA','INSITU',   'to_nEPB',   'A', 1.000, 0.000], // Produced and exported to nEPB uses
        ['ELECTRICIDADCEUTAMELILLA','INSITU',   'to_grid',   'B', 0.072, 2.718], // Savings to the grid due to produced and exported to the grid energy
        ['ELECTRICIDADCEUTAMELILLA','INSITU',   'to_nEPB',   'B', 0.072, 2.718], // Savings to the grid due to produced and exported to nEPB uses
        ['ELECTRICIDADCEUTAMELILLA','COGENERACION','input',  'A', 0.000, 0.000], // There is no delivery from grid for this carrier
        ['ELECTRICIDADCEUTAMELILLA','COGENERACION','to_grid','A', 0.000, 2.500], // User defined!
        ['ELECTRICIDADCEUTAMELILLA','COGENERACION','to_nEPB','A', 0.000, 2.500], // User defined!
        ['ELECTRICIDADCEUTAMELILLA','COGENERACION','to_grid','B', 0.072, 2.718], // Savings to the grid when exporting to the grid
        ['ELECTRICIDADCEUTAMELILLA','COGENERACION','to_nEPB','B', 0.072, 2.718], // Savings to the grid when exporting to nEPB uses

        ['MEDIOAMBIENTE',       'RED',          'input',     'A', 1.000, 0.000], // Grid is able to deliver this carrier
        ['MEDIOAMBIENTE',       'INSITU',       'input',     'A', 1.000, 0.000], // in-situ production of this carrier
        ['MEDIOAMBIENTE',       'INSITU',       'to_grid',   'A', 0.000, 0.000], // export to grid is not accounted for
        ['MEDIOAMBIENTE',       'INSITU',       'to_nEPB',   'A', 1.000, 0.000], // export to nEPB uses in step A
        ['MEDIOAMBIENTE',       'INSITU',       'to_grid',   'B', 0.000, 0.000], // Savings to the grid when exporting to grid
        ['MEDIOAMBIENTE',       'INSITU',       'to_nEPB',   'B', 1.000, 0.000], // Savings to the grid when exporting to nEPB uses

        // BIOCARBURANTE == BIOMASA DENSIFICADA (PELLETS)
        ['BIOCARBURANTE',       'RED',          'input',     'A', 1.028, 0.085], // Delivered energy
        ['BIOMASA',             'RED',          'input',     'A', 1.003, 0.034], // Delivered energy
        ['BIOMASADENSIFICADA',  'RED',          'input',     'A', 1.028, 0.085], // Delivered energy
        ['CARBON',              'RED',          'input',     'A', 0.002, 1.082], // Delivered energy
        // FUELOIL == GASOLEO
        ['FUELOIL',             'RED',          'input',     'A', 0.003, 1.179], // Delivered energy
        ['GASNATURAL',          'RED',          'input',     'A', 0.005, 1.190], // Delivered energy
        ['GASOLEO',             'RED',          'input',     'A', 0.003, 1.179], // Delivered energy
        ['GLP',                 'RED',          'input',     'A', 0.030, 1.201], // Delivered energy
        ['RED1',                'RED',          'input',     'A', 0.000, 1.300], // User defined!, district heating/cooling carrier
        ['RED2',                'RED',          'input',     'A', 0.000, 1.300]  // User defined!, district heating/cooling carrier
].map(([carrier, source, dest, step, ren, nren]) => {
  return { type: 'FACTOR', carrier, source, dest, step, ren, nren };
});

// TODO: function cte_weighting_factors(loc, extradata=null) {}
// TODO: función que genere lista de factores de paso según localización (PENINSULA, CANARIAS, BALEARES, CEUTAYMELILLA)
// TODO: y factores de paso de cogeneración, y factores para RED1 y RED2

// ------------------------------------------------------------------------------------
// Constraints
// ------------------------------------------------------------------------------------

export const VALIDDATA = {
  CONSUMO: {
    EPB: ['BIOCARBURANTE', 'BIOMASA', 'BIOMASADENSIFICADA', 'CARBON',
          // 'COGENERACION',
          'ELECTRICIDAD', 'ELECTRICIDADBALEARES',
          'ELECTRICIDADCANARIAS', 'ELECTRICIDADCEUTAMELILLA', 'FUELOIL',
          'GASNATURAL', 'GASOLEO', 'GLP', 'MEDIOAMBIENTE', 'RED1', 'RED2'],
    NEPB: ['BIOCARBURANTE', 'BIOMASA', 'BIOMASADENSIFICADA', 'CARBON',
           // 'COGENERACION',
           'ELECTRICIDAD', 'ELECTRICIDADBALEARES',
           'ELECTRICIDADCANARIAS', 'ELECTRICIDADCEUTAMELILLA', 'FUELOIL',
           'GASNATURAL', 'GASOLEO', 'GLP', 'MEDIOAMBIENTE', 'RED1', 'RED2']
  },
  PRODUCCION: {
    INSITU: ['ELECTRICIDAD', 'ELECTRICIDADBALEARES',
             'ELECTRICIDADCANARIAS', 'ELECTRICIDADCEUTAMELILLA',
             'MEDIOAMBIENTE'],
    COGENERACION: ['ELECTRICIDAD', 'ELECTRICIDADBALEARES',
                   'ELECTRICIDADCANARIAS', 'ELECTRICIDADCEUTAMELILLA']
  }
};

export const VALIDSERVICES = [ 'ACS', 'CAL', 'REF', 'VEN', 'ILU', 'HU', 'DHU', 'NODEFINIDO' ];
export const LEGACYSERVICES = { 'WATERSYSTEMS': 'ACS', 'HEATING': 'CAL', 'COOLING': 'REF', 'FANS': 'VEN' };

// -------------------------------------------------------------------------------------
// Validation utilities and functions
// -------------------------------------------------------------------------------------

// Custom exception
export function CteValidityException(message) {
  this.message = message;
  this.name = 'UserException';
}


// Validate carrier data coherence
export function carrier_isvalid(carrier_obj) {
  const { type, carrier, ctype, csubtype, service } = carrier_obj;
  if (type !== 'CARRIER') return false;
  let validcarriers;
  try {
    validcarriers = VALIDDATA[ctype][csubtype];
  } catch (e) {
    return false;
  }
  if (validcarriers.includes(carrier)) return true;
  return false;
}

// TODO: reescribe servicios legacy
export function checked_carriers(carrierlist) {
  // Vectores con valores coherentes
  const carriers = carrierlist.filter(e => e.type === 'CARRIER');
  const all_carriers_ok = carriers.every(c => carrier_isvalid(c) && VALIDSERVICES.includes(c.service));
  // Completa consumos de energía térmica insitu (MEDIOAMBIENTE) sin producción declarada
  if (all_carriers_ok) {
    const envcarriers = carrierlist.filter(c => c.carrier === 'MEDIOAMBIENTE');
    const services = [... new Set(envcarriers.map(c => c.service))];
    const balancecarriers = services.map(service => {
      const produced = envcarriers.filter(c => c.ctype === 'PRODUCCION');
      const consumed = envcarriers.filter(c => c.ctype === 'CONSUMO');
      if (consumed.length === 0) return null;
      let unbalanced = veclistsum(consumed.map(v => v.values));
      if (produced.length !== 0) {
        const totproduced = veclistsum(produced.map(v => v.values));
        unbalanced = vecvecdif(unbalanced, totproduced).map(v => Math.max(0, v));
      }
      return { type: 'CARRIER', carrier: 'MEDIOAMBIENTE', ctype: 'PRODUCCION', csubtype: 'INSITU', service,
        values: unbalanced, comment: 'Equilibrado de energía térmica insitu (MEDIOAMBIENTE) consumida y sin producción declarada' };
    }).filter(v => v !== null);
    return [... carrierlist, ...balancecarriers];
  }
  throw new CteValidityException(`Vectores energéticos con valores no coherentes:\n${ JSON.stringify(carriers.filter(c => !carrier_isvalid(c))) }`);
}

// Sanea factores de paso y genera los que falten si se pueden deducir
export function checked_fps(fplist) {
  const CARRIERS = [... new Set(fplist.map(f => f.carrier))];

  let outlist = [...fplist];

  // Asegura que existe MEDIOAMBIENTE, INSITU, input, A, ren, nren
  const envinsitu = outlist.find(f => f.carrier === 'MEDIOAMBIENTE' && f.source === 'INSITU' && f.dest === 'input');
  if (!envinsitu) {
    outlist.push({
      type: 'FACTOR', carrier: 'MEDIOAMBIENTE', source: 'INSITU', dest: 'input', step: 'A',
      ren: 1.0, nren: 0.0, comment: 'Factor de paso generado'
    });
  }

  // Asegura que existe MEDIOAMBIENTE, RED, input, A, ren, nren
  const envgrid = outlist.find(f => f.carrier === 'MEDIOAMBIENTE' && f.source === 'RED' && f.dest === 'input');
  if (!envgrid) {
    // MEDIOAMBIENTE, RED, input, A, ren, nren === MEDIOAMBIENTE, INSITU, input, A, ren, nren
    const envinsitu = outlist.find(f => f.carrier === 'MEDIOAMBIENTE' && f.source === 'INSITU' && f.dest === 'input');
    outlist.push({ ...envinsitu, source: 'RED', comment: 'Factor de paso generado' });
  }

  // Asegura que existe ELECTRICIDAD, INSITU, input, A, ren, nren si hay ELECTRICIDAD
  const eleinsitu = outlist.find(f => f.carrier === 'ELECTRICIDAD' && f.source === 'INSITU' && f.dest === 'input');
  if (!eleinsitu && CARRIERS.includes('ELECTRICIDAD')) {
    outlist.push({
      type: 'FACTOR', carrier: 'ELECTRICIDAD', source: 'INSITU', dest: 'input', step: 'A',
      ren: 1.0, nren: 0.0, comment: 'Factor de paso generado'
    });
  }

  // Asegura definición de factores de red para todos los vectores energéticos
  const carrier_has_input = CARRIERS.map(c => outlist.find(
      f => f.carrier === c && f.source === 'RED' && f.dest === 'input' && f.step === 'A'
  ));
  if (!carrier_has_input.every(v => v)) {
    const missing_carriers = CARRIERS.filter((c, i) => !carrier_has_input[i]);
    throw new CteValidityException(`Todos los vectores deben definir los factores de paso de red: "VECTOR, INSITU, input, A, fren?, fnren?". Error en "${ missing_carriers }"`);
  }

  // Asegura que todos los vectores con exportación tienen factores de paso hacia la red y hacia nEPB
  [
    ['ELECTRICIDAD', 'INSITU'],
    ['ELECTRICIDAD', 'COGENERACION'],
    ['MEDIOAMBIENTE', 'INSITU']
  ].map(([c, s]) => {
    const cfpsA = outlist.filter(f => f.carrier === c && f.source === s && f.step === 'A');
    const cfpsB = outlist.filter(f => f.carrier === c && f.source === s && f.step === 'B');
    const fpAinput = cfpsA.find(f => f.dest === 'input');
    const fpAredinput = outlist.find(f =>
      f.carrier === c && f.source === 'RED' && f.dest === 'input' && f.step === 'A');
    if (!cfpsA.find(f => f.dest === 'to_grid')) {
      // VECTOR, SRC, to_grid, A, ren, nren === VECTOR, SRC, input, A, ren, nren
      const newvec = { ...fpAinput, dest: 'to_grid', comment: 'Factor de paso generado' };
      outlist.push(newvec);
    }
    if (!cfpsA.find(f => f.dest === 'to_nEPB')) {
      // VECTOR, SRC, to_nEPB, A, ren, nren === VECTOR, SRC, input, A, ren, nren
      outlist.push({ ...fpAinput, dest: 'to_nEPB', comment: 'Factor de paso generado' });
    }
    if (!cfpsB.find(f => f.dest === 'to_grid')) {
      // VECTOR, SRC, to_grid, B, ren, nren === VECTOR, RED, input, A, ren, nren
      outlist.push({ ...fpAredinput, source: s, dest: 'to_grid', step: 'B', comment: 'Factor de paso generado' });
    }
    if (!cfpsB.find(f => f.dest === 'to_nEPB')) {
      // VECTOR, SRC, to_nEPB, B, ren, nren === VECTOR, RED, input, A, ren, nren
      outlist.push({ ...fpAredinput, source: s, dest: 'to_nEPB', step: 'B', comment: 'Factor de paso generado' });
    }
  });

  // El factor input de cogeneración es 0.0, 0.0 ya que el impacto se tiene en cuenta en el suministro del vector de generación
  const cogeninput = outlist.find(f => f.carrier === 'ELECTRICIDAD' && f.source === 'COGENERACION' && f.dest === 'input');
  if (!cogeninput && outlist.map(v => v.source).includes('COGENERACION')) {
    outlist.push({
      type: 'FACTOR', carrier: 'ELECTRICIDAD', source: 'COGENERACION', dest: 'input', step: 'A',
      ren: 0.0, nren: 0.0, comment: 'Factor de paso generado (el impacto de la cogeneración se tiene en cuenta en el vector de suministro)'
    });
  }

  return outlist;
}
