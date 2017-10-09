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
import {
  new_carrier, new_factor, new_meta,
  LEGACY_SERVICE_TAG_REGEX,
  parse_carrier_list as epbd_parse_carrier_list,
  parse_weighting_factors as epbd_parse_weighting_factors
} from './epbd.js';

// ---------------------------------------------------------------------------------------------------------
// Valores reglamentarios
//
// Orientados al cumplimiento del DB-HE del (Código Técnico de la Edificación CTE).
//
// Factores de paso basados en el consumo de energía primaria
// Factores de paso constantes a lo largo de los intervalos de cálculo
// ---------------------------------------------------------------------------------------------------------

export const K_EXP = 0.0;

// Valores por defecto para exportación (paso A) de electricidad cogenerada
const CTE_COGEN_DEFAULTS = {
  'to_grid': { ren: 0, nren: 2.5 }, // ELECTRICIDAD, COGENERACION, to_grid, A, ren, nren
  'to_nEPB': { ren: 0, nren: 2.5 }  // ELECTRICIDAD, COGENERACION, to_nEPB, A, ren, nren
};

// Valores por defecto para redes de distrito
const CTE_RED_DEFAULTS = {
  'RED1': { ren: 0, nren: 1.3 }, // RED1, RED, input, A, ren, nren
  'RED2': { ren: 0, nren: 1.3 }  // RED2, RED, input, A, ren, nren
}

// Localizaciones válidas para CTE
const CTE_LOCS = ['PENINSULA', 'BALEARES', 'CANARIAS', 'CEUTAMELILLA'];

// Factores de paso según documento reconocido
export const CTE_FP_STR = `
#META CTE_FUENTE: CTE2013
#META CTE_COMENTARIO: Factores de paso del documento reconocido del IDAE de 03/02/2014, página 14
ELECTRICIDAD, RED, input, A, 0.414, 1.954 # Recursos usados para suministrar electricidad (peninsular) desde la red
ELECTRICIDAD, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDAD, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la energía (0 porque se constabiliza el vector que alimenta el cogenerador)
ELECTRICIDADBALEARES, RED, input, A, 0.082, 2.968 # Recursos usados para suministrar electricidad (Baleares) desde la red
ELECTRICIDADBALEARES, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDADBALEARES, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la electricidad cogenerada (0 porque se constabiliza el vector que alimenta el cogenerador)
ELECTRICIDADCANARIAS, RED, input, A, 0.070, 2.924 # Recursos usados para suministrar electricidad (Canarias) desde la red
ELECTRICIDADCANARIAS, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDADCANARIAS, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar electricidad cogenerada (0 porque se constabiliza el vector que alimenta el cogenerador)
ELECTRICIDADCEUTAMELILLA, RED, input, A, 0.072, 2.718 # Recursos usados para suministrar electricidad (Ceuta y Melilla) desde la red
ELECTRICIDADCEUTAMELILLA, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad
ELECTRICIDADCEUTAMELILLA, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la electricidad cogenerada (0 porque se constabiliza el vector que alimenta el cogenerador)
MEDIOAMBIENTE, RED, input, A, 1.000, 0.000 # Recursos usados para suministrar energía térmica del medioambiente (red de suministro ficticia)
MEDIOAMBIENTE, INSITU, input, A, 1.000, 0.000 # Recursos usados para generar in situ energía térmica del medioambiente (vector renovable)
BIOCARBURANTE, RED, input, A, 1.028, 0.085 # Recursos usados para suministrar el vector desde la red (Biocarburante = biomasa densificada (pellets))
BIOMASA, RED, input, A, 1.003, 0.034 # Recursos usados para suministrar el vector desde la red
BIOMASADENSIFICADA, RED, input, A, 1.028, 0.085 # Recursos usados para suministrar el vector desde la red
CARBON, RED, input, A, 0.002, 1.082 # Recursos usados para suministrar el vector desde la red
FUELOIL, RED, input, A, 0.003, 1.179 # Recursos usados para suministrar el vector desde la red (Fueloil = Gasóleo)
GASNATURAL, RED, input, A, 0.005, 1.190 # Recursos usados para suministrar el vector desde la red
GASOLEO, RED, input, A, 0.003, 1.179 # Recursos usados para suministrar el vector desde la red
GLP, RED, input, A, 0.030, 1.201 # Recursos usados para suministrar el vector desde la red
`
// ------------------------ Datos para validación y por defecto ------------------------

export const CTE_VALIDDATA = {
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

export const CTE_VALIDSERVICES = [ 'ACS', 'CAL', 'REF', 'VEN', 'ILU', 'HU', 'DHU', 'NODEFINIDO' ];
export const LEGACYSERVICESMAP = { 'WATERSYSTEMS': 'ACS', 'HEATING': 'CAL', 'COOLING': 'REF', 'FANS': 'VEN' };

// -------------------------------------------------------------------------------------
// Utilidades de validación y generación
// -------------------------------------------------------------------------------------

// Custom exception
export function CteValidityException(message) {
  this.message = message;
  this.name = 'UserException';
}

// -------------------- vectores energéticos -------------------------------------------

// Detecta si el vector energético es formalmente correcto
export function carrier_isvalid(carrier_obj) {
  const { type, carrier, ctype, csubtype } = carrier_obj;
  if (type !== 'CARRIER') return false;
  let validcarriers;
  try {
    validcarriers = CTE_VALIDDATA[ctype][csubtype];
  } catch (e) {
    return false;
  }
  if (!validcarriers.includes(carrier)) return false;

  return true;
}

// Asegura vectores válidos y balance de consumos de vectores de producción in situ
//
// Comprueba que los vectores energéticos declarados son reconocidos
// Completa el balance de las producciones in situ cuando el consumo de esos vectores supera la producción
export function fix_carrier_list(carrierdata) {
  const carrierlist = carrierdata.map(c => { // Reescribe servicios legacy
    if (c.type === 'CARRIER' && c.service.match(LEGACY_SERVICE_TAG_REGEX)) {
      return { ...c, service: LEGACYSERVICESMAP[c.service] }
    } else {
      return c;
    }
  })
  // Vectores con valores coherentes
  const carriers = carrierlist.filter(e => e.type === 'CARRIER');
  const all_carriers_ok = carriers.every(c => carrier_isvalid(c) && CTE_VALIDSERVICES.includes(c.service));
  // Completa consumos de energía térmica insitu (MEDIOAMBIENTE) sin producción declarada
  if (all_carriers_ok) {
    const envcarriers = carriers.filter(c => c.carrier === 'MEDIOAMBIENTE');
    const services = [... new Set(envcarriers.map(c => c.service))];
    const balancecarriers = services.map(service => {
      const envcarriersforservice = envcarriers.filter(c => c.service === service);
      const produced = envcarriersforservice.filter(c => c.ctype === 'PRODUCCION');
      const consumed = envcarriersforservice.filter(c => c.ctype === 'CONSUMO');
      if (consumed.length === 0) return null;
      let unbalanced_values = veclistsum(consumed.map(v => v.values));
      if (produced.length !== 0) {
        const totproduced = veclistsum(produced.map(v => v.values));
        unbalanced_values = vecvecdif(unbalanced_values, totproduced).map(v => Math.max(0, v));
      }
      return new_carrier('MEDIOAMBIENTE', 'PRODUCCION', 'INSITU', service, unbalanced_values,
        'Equilibrado de energía térmica insitu (MEDIOAMBIENTE) consumida y sin producción declarada');
    }).filter(v => v !== null);
    return [...carrierlist, ...balancecarriers];
  }
  throw new CteValidityException(`Vectores energéticos con valores no coherentes:\n${ JSON.stringify(carriers.filter(c => !carrier_isvalid(c))) }`);
}

// Devuelve objetos CARRIER y META a partir de cadena, intentando asegurar los tipos
export function parse_carrier_list(datastring) {
  const carrierdata = epbd_parse_carrier_list(datastring);
  return fix_carrier_list(carrierdata);
}

// ---------------------- Factores de paso -----------------------------------------------

// Asegura consistencia de factores de paso definidos y deduce algunos de los que falten
export function fix_weighting_factors(factorsdata, options={ cogen: CTE_COGEN_DEFAULTS, red: CTE_RED_DEFAULTS }) {
  // Valores por defecto
  let { cogen, red } = options;
  cogen = cogen || CTE_COGEN_DEFAULTS;
  red = red || CTE_RED_DEFAULTS;
  // Vectores existentes
  const CARRIERS = [... new Set(factorsdata.filter(e => e.type === 'FACTOR').map(f => f.carrier))];
  let outlist = [...factorsdata];
  // Asegura que existe MEDIOAMBIENTE, INSITU, input, A, 1.0, 0.0
  const envinsitu = outlist.find(f => f.carrier === 'MEDIOAMBIENTE' && f.source === 'INSITU' && f.dest === 'input');
  if (!envinsitu) {
    outlist.push(new_factor('MEDIOAMBIENTE', 'INSITU', 'input', 'A', 1.0, 0.0, 'Recursos usados para obtener energía térmica del medioambiente'));
  }
  // Asegura que existe MEDIOAMBIENTE, RED, input, A, 1.0, 0.0
  const envgrid = outlist.find(f => f.carrier === 'MEDIOAMBIENTE' && f.source === 'RED' && f.dest === 'input');
  if (!envgrid) {
    // MEDIOAMBIENTE, RED, input, A, ren, nren === MEDIOAMBIENTE, INSITU, input, A, ren, nren
    outlist.push(new_factor('MEDIOAMBIENTE', 'RED', 'input', 'A', 1.0, 0.0, 'Recursos usados para obtener energía térmica del medioambiente (red ficticia)'));
  }
  // Asegura que existe ELECTRICIDAD, INSITU, input, A, 1.0, 0.0 si hay ELECTRICIDAD
  const eleinsitu = outlist.find(f => f.carrier === 'ELECTRICIDAD' && f.source === 'INSITU' && f.dest === 'input');
  if (!eleinsitu && CARRIERS.includes('ELECTRICIDAD')) {
    outlist.push(new_factor('ELECTRICIDAD', 'INSITU', 'input', 'A', 1.0, 0.0, 'Recursos usados para generar electricidad in situ'));
  }
  // Asegura definición de factores de red para todos los vectores energéticos
  const carrier_has_input = CARRIERS.map(c => outlist.find(
      f => f.carrier === c && f.source === 'RED' && f.dest === 'input' && f.step === 'A'
  ));
  if (!carrier_has_input.every(v => v)) {
    const missing_carriers = CARRIERS.filter((c, i) => !carrier_has_input[i]);
    throw new CteValidityException(`Todos los vectores deben definir los factores de paso de red: "VECTOR, INSITU, input, A, fren?, fnren?". Error en "${ missing_carriers }"`);
  }
  // En paso A, el factor input de cogeneración es 0.0, 0.0 ya que el impacto se tiene en cuenta en el suministro del vector de generación
  if (!outlist.find(({type, source, dest }) => type === 'FACTOR' && source === 'COGENERACION' && dest === 'input')) {
    outlist.push(new_factor('ELECTRICIDAD', 'COGENERACION', 'input', 'A', 0.0, 0.0,
      'Factor de paso generado (el impacto de la cogeneración se tiene en cuenta en el vector de suministro)'));
  }
  // Asegura que todos los vectores con exportación tienen factores de paso a la red y a usos no EPB
  [
    ['ELECTRICIDAD', 'INSITU'],
    ['ELECTRICIDAD', 'COGENERACION'],
    ['MEDIOAMBIENTE', 'INSITU']
  ].map(([c, s]) => {
    const cfpsA = outlist.filter(f => f.carrier === c && f.source === s && f.step === 'A');
    const cfpsB = outlist.filter(f => f.carrier === c && f.source === s && f.step === 'B');
    const fpAinput = cfpsA.find(f => f.dest === 'input');
    const fpAredinput = outlist.find(f => f.carrier === c && f.source === 'RED' && f.dest === 'input' && f.step === 'A');
    // Asegura que existe VECTOR, SRC, to_grid | to_nEPB, A, ren, nren
    if (!cfpsA.find(f => f.dest === 'to_grid')) {
      if (s !== 'COGENERACION') {
        // VECTOR, SRC, to_grid, A, ren, nren === VECTOR, SRC, input, A, ren, nren
        outlist.push(new_factor(fpAinput.carrier, fpAinput.source, 'to_grid', 'A', fpAinput.ren, fpAinput.nren,
          'Recursos usados para producir la energía exportada a la red'));
      } else {
        // Valores por defecto para ELECTRICIDAD, COGENERACION, to_grid, A, ren, nren - ver 9.6.6.2.3
        const is_default = ((cogen.to_grid.ren === CTE_COGEN_DEFAULTS.to_grid.ren) && (cogen.to_grid.nren === CTE_COGEN_DEFAULTS.to_grid.nren));
        outlist.push(new_factor('ELECTRICIDAD', 'COGENERACION', 'to_grid', 'A', cogen.to_grid.ren, cogen.to_grid.nren,
          `Recursos usados para producir la electricidad cogenerada y exportada a la red (ver EN ISO 52000-1 9.6.6.2.3)${ is_default ? '(Valor predefinido)' : '(Valor de usuario)'}`));
      }
    }
    if (!cfpsA.find(f => f.dest === 'to_nEPB')) {
      if (s !== 'COGENERACION') {
        // VECTOR, SRC, to_nEPB, A, ren, nren === VECTOR, SRC, input, A, ren, nren
        outlist.push(new_factor(fpAinput.carrier, fpAinput.source, 'to_nEPB', 'A', fpAinput.ren, fpAinput.nren,
          'Recursos usados para producir la energía exportada a usos no EPB'));
      } else {
        // TODO: Si está definido para to_grid (no por defecto) y no para to_nEPB, qué hacemos? usamos por defecto? usamos igual a to_grid?
        // Valores por defecto para ELECTRICIDAD, COGENERACION, to_nEPB, A, ren, nren - ver 9.6.6.2.3
        const is_default = (cogen.to_nEPB.ren === CTE_COGEN_DEFAULTS.to_nEPB.ren) && (cogen.to_nEPB.nren === CTE_COGEN_DEFAULTS.to_nEPB.nren);
        outlist.push(new_factor('ELECTRICIDAD', 'COGENERACION', 'to_nEPB', 'A', cogen.to_nEPB.ren, cogen.to_nEPB.nren,
          `Recursos usados para producir la electricidad cogenerada y exportada a usos no EPB (ver EN ISO 52000-1 9.6.6.2.3)${ is_default ? '(Valor predefinido)' : '(Valor de usuario)'}`));
      }
    }
    // Asegura que existe VECTOR, SRC, to_grid | to_nEPB, B, ren, nren
    if (!cfpsB.find(f => f.dest === 'to_grid')) {
      // VECTOR, SRC, to_grid, B, ren, nren === VECTOR, RED, input, A, ren, nren
      outlist.push(new_factor(fpAredinput.carrier, s, 'to_grid', 'B', fpAredinput.ren, fpAredinput.nren,
        'Recursos ahorrados a la red por la energía producida in situ y exportada a la red'));
    }
    if (!cfpsB.find(f => f.dest === 'to_nEPB')) {
      // VECTOR, SRC, to_nEPB, B, ren, nren === VECTOR, RED, input, A, ren, nren
      outlist.push(new_factor(fpAredinput.carrier, s, 'to_nEPB', 'B', fpAredinput.ren, fpAredinput.nren,
        'Recursos ahorrados a la red por la energía producida in situ y exportada a usos no EPB'));
    }
  });
  // Asegura que existe RED1 | RED2, RED, input, A, ren, nren
  const red1 = outlist.find(f => f.carrier === 'RED1' && f.source === 'RED' && f.dest === 'input');
  if (!red1) {
    outlist.push(new_factor('RED1', 'RED', 'input', 'A',
      red.RED1.ren, red.RED1.nren, 'Recursos usados para suministrar energía de la red de distrito 1 (definible por el usuario)'));
  }
  const red2 = outlist.find(f => f.carrier === 'RED2' && f.source === 'RED' && f.dest === 'input');
  if (!red2) {
    outlist.push(new_factor('RED2', 'RED', 'input', 'A',
      red.RED2.ren, red.RED2.nren, 'Recursos usados para suministrar energía de la red de distrito 2 (definible por el usuario)'));
  }
  return outlist;
}

// Lee factores de paso desde cadena y sanea los resultados
export function parse_weighting_factors(factorsstring, options={ cogen: CTE_COGEN_DEFAULTS, red: CTE_RED_DEFAULTS }) {
  const factorsdata = epbd_parse_weighting_factors(factorsstring);
  let { cogen, red } = options;
  cogen = cogen || CTE_COGEN_DEFAULTS;
  red = red || CTE_RED_DEFAULTS;
  return fix_weighting_factors(factorsdata, { cogen, red });
}

// Genera factores de paso a partir de localización
// Usa localización (PENINSULA, CANARIAS, BALEARES, CEUTAYMELILLA),
// factores de paso de cogeneración, y factores de paso para RED1 y RED2
export function new_weighting_factors(loc=CTE_LOCS[0], options={ cogen: CTE_COGEN_DEFAULTS, red: CTE_RED_DEFAULTS }) {
  if (!CTE_LOCS.includes(loc)) {
    throw new CteValidityException(`Localización "${ loc }" desconocida al generar factores de paso`);
  }
  // Selecciona factores de electricidad según localización
  const leaveout = CTE_LOCS
    .filter(l => l !== loc)
    .map(l => `ELECTRICIDAD${ (l === 'PENINSULA') ? '' : l }`);
  const factors = FACTORESDEPASO
    .filter(f => !leaveout.includes(f.carrier))
    .map(f => f.type === 'FACTOR' && f.carrier.startsWith('ELECTRICIDAD') ? { ...f, carrier: 'ELECTRICIDAD' } : f);
  // Incluye metadatos
  const cte_metas = [];
  if (!factors.find(f => f.type === 'META' && f.key === 'CTE_FUENTE')) {
    cte_metas.push(new_meta('CTE_FUENTE', 'CTE2013'));
  }
  if (!factors.find(f => f.type === 'META' && f.key === 'CTE_COMENTARIO')) {
    cte_metas.push(new_meta('CTE_COMENTARIO', 'Valores de la propuesta del documento reconocido del IDAE de 03/02/2014 (pág. 14)'));
  }
  cte_metas.push(new_meta('CTE_LOC', loc));
  // Completa factores resultantes
  let { cogen, red } = options;
  cogen = cogen || CTE_COGEN_DEFAULTS;
  red = red || CTE_RED_DEFAULTS;
  return fix_weighting_factors([ ...cte_metas, ...factors], { cogen, red });
}

// Elimina factores de paso no usados en los datos de vectores energéticos
//
// Elimina los factores:
//  - de vectores que no aparecen en los datos
//  - de cogeneración si no hay cogeneración
//  - para exportación a usos no EPB si no se aparecen en los datos
//  - de electricidad in situ si no aparece una producción de ese tipo
export function strip_weighting_factors(factorsdata, carriersdata) {
  const CARRIERS = [... new Set(carriersdata.filter(c => c.type === 'CARRIER').map(c => c.carrier))];
  const HASCOGEN = carriersdata.map(c => c.csubtype).includes('COGENERACION');
  const HASNEPB =  carriersdata.map(c => c.csubtype).includes('NEPB');
  const HASELECINSITU = (carriersdata.filter(c => c.type === 'CARRIER' && c.carrier.startsWith('ELECTRICIDAD') && c.csubtype === 'INSITU')).length > 0;

  const filteredfactors = factorsdata
  .filter(f => f.type === 'META' || CARRIERS.includes(f.carrier))
  .filter(f => f.type === 'META' || f.source !== 'COGENERACION' || HASCOGEN)
  .filter(f => f.type === 'META' || f.dest !== 'to_nEPB' || HASNEPB)
  .filter(f => f.type === 'META' || f.carrier !== 'ELECTRICIDAD' || f.source !== 'INSITU' || HASELECINSITU);
  return filteredfactors;
}

export const CTE_FP = parse_weighting_factors(CTE_FP_STR);
export const FACTORESDEPASO = CTE_FP; // Alias por compatibilidad
