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
import { parse_carrier_list, parse_weighting_factors } from './epbd.js';
import { LEGACY_SERVICE_TAG_REGEX, new_carrier, new_factor, new_meta } from './utils.js';

// ---------------------------------------------------------------------------------------------------------
// Valores reglamentarios
//
// Orientados al cumplimiento del DB-HE del (Código Técnico de la Edificación CTE).
//
// Factores de paso basados en el consumo de energía primaria
// Factores de paso constantes a lo largo de los intervalos de cálculo
// ---------------------------------------------------------------------------------------------------------

export const K_EXP = 0.0;
export const CTEFPSTR = `
#META CTE_SRC1: Factores de paso del documento reconocido del IDAE de 03/02/2014, página 14
#META CTE_SRC2: CTE2013
ELECTRICIDAD, RED, input, A, 0.414, 1.954 # Recursos usados para suministrar electricidad (peninsular) desde la red
ELECTRICIDAD, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDAD, INSITU, to_grid, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad exportada a la red
ELECTRICIDAD, INSITU, to_nEPB, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad exportada a usos no EPB
ELECTRICIDAD, INSITU, to_grid, B, 0.414, 1.954 # Recursos ahorrados a la red (península) por la electricidad producida in situ y exportada a la red
ELECTRICIDAD, INSITU, to_nEPB, B, 0.414, 1.954 # Recursos ahorrados a la red (península) por la electricidad producida in situ y exportada a usos no EPB
ELECTRICIDAD, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la energía (0 porque se constabiliza el vector que alimenta el cogenerador)
ELECTRICIDAD, COGENERACION, to_grid, A, 0.000, 2.500 # Recursos usados para producir la electricidad cogenerada exportada a la red (definible por usuario)
ELECTRICIDAD, COGENERACION, to_nEPB, A, 0.000, 2.500 # Recursos usados para producir la electricidad cogenerada exportada a usos no EPB (definible por usuario)
ELECTRICIDAD, COGENERACION, to_grid, B, 0.414, 1.954 # Recursos ahorrados a la red (península) por la electricidad cogenerada y exportada a la red
ELECTRICIDAD, COGENERACION, to_nEPB, B, 0.414, 1.954 # Recursos ahorrados a la red (península) por la electricidad cogenerada y exportada a la red
ELECTRICIDADBALEARES, RED, input, A, 0.082, 2.968 # Recursos usados para suministrar electricidad (Baleares) desde la red
ELECTRICIDADBALEARES, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDADBALEARES, INSITU, to_grid, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad exportada a la red
ELECTRICIDADBALEARES, INSITU, to_nEPB, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad exportada a usos no EPB
ELECTRICIDADBALEARES, INSITU, to_grid, B, 0.082, 2.968 # Recursos ahorrados a la red (Baleares) por la electricidad producida in situ y exportada a la red
ELECTRICIDADBALEARES, INSITU, to_nEPB, B, 0.082, 2.968 # Recursos ahorrados a la red (Baleares) por la electricidad producida in situ y exportada a usos no EPB
ELECTRICIDADBALEARES, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la electricidad cogenerada (0 porque se constabiliza el vector que alimenta el cogenerador)
ELECTRICIDADBALEARES, COGENERACION, to_grid, A, 0.000, 2.500 # Recursos usados para producir la electricidad cogenerada exportada a la red (definible por usuario)
ELECTRICIDADBALEARES, COGENERACION, to_nEPB, A, 0.000, 2.500 # Recursos usados para producir la electricidad cogenerada exportada a usos no EPB (definible por usuario)
ELECTRICIDADBALEARES, COGENERACION, to_grid, B, 0.082, 2.968 # Recursos ahorrados a la red (Baleares) por la electricidad cogenerada y exportada a la red
ELECTRICIDADBALEARES, COGENERACION, to_nEPB, B, 0.082, 2.968 # Recursos ahorrados a la red (península) por la electricidad cogenerada y exportada a la red
ELECTRICIDADCANARIAS, RED, input, A, 0.070, 2.924 # Recursos usados para suministrar electricidad (Canarias) desde la red
ELECTRICIDADCANARIAS, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDADCANARIAS, INSITU, to_grid, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad exportada a la red
ELECTRICIDADCANARIAS, INSITU, to_nEPB, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad exportada a usos no EPB
ELECTRICIDADCANARIAS, INSITU, to_grid, B, 0.070, 2.924 # Recursos ahorrados a la red (Canarias) por la electricidad producida in situ y exportada a la red
ELECTRICIDADCANARIAS, INSITU, to_nEPB, B, 0.070, 2.924 # Recursos ahorrados a la red (Canarias) por la electricidad producida in situ y exportada a usos no EPB
ELECTRICIDADCANARIAS, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar electricidad cogenerada (0 porque se constabiliza el vector que alimenta el cogenerador)
ELECTRICIDADCANARIAS, COGENERACION, to_grid, A, 0.000, 2.500 # Recursos usados para producir la electricidad cogenerada exportada a la red (definible por usuario)
ELECTRICIDADCANARIAS, COGENERACION, to_nEPB, A, 0.000, 2.500 # Recursos usados para producir la electricidad cogenerada exportada a usos no EPB (definible por usuario)
ELECTRICIDADCANARIAS, COGENERACION, to_grid, B, 0.070, 2.924 # Recursos ahorrados a la red (Canarias) por la electricidad cogenerada y exportada a la red
ELECTRICIDADCANARIAS, COGENERACION, to_nEPB, B, 0.070, 2.924 # Recursos ahorrados a la red (península) por la electricidad cogenerada y exportada a la red
ELECTRICIDADCEUTAMELILLA, RED, input, A, 0.072, 2.718 # Recursos usados para suministrar electricidad (Ceuta y Melilla) desde la red
ELECTRICIDADCEUTAMELILLA, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad
ELECTRICIDADCEUTAMELILLA, INSITU, to_grid, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad exportada a la red
ELECTRICIDADCEUTAMELILLA, INSITU, to_nEPB, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad exportada a usos no EPB
ELECTRICIDADCEUTAMELILLA, INSITU, to_grid, B, 0.072, 2.718 # Recursos ahorrados a la red (Ceuta y Melilla) por la electricidad producida in situ y exportada a la red
ELECTRICIDADCEUTAMELILLA, INSITU, to_nEPB, B, 0.072, 2.718 # Recursos ahorrados a la red (Ceuta y Melilla) por la electricidad producida in situ y exportada a usos no EPB
ELECTRICIDADCEUTAMELILLA, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la electricidad cogenerada (0 porque se constabiliza el vector que alimenta el cogenerador)
ELECTRICIDADCEUTAMELILLA, COGENERACION, to_grid, A, 0.000, 2.500 # Recursos usados para producir la electricidad cogenerada exportada a la red (definible por usuario)
ELECTRICIDADCEUTAMELILLA, COGENERACION, to_nEPB, A, 0.000, 2.500 # Recursos usados para producir la electricidad cogenerada exportada a usos no EPB (definible por usuario)
ELECTRICIDADCEUTAMELILLA, COGENERACION, to_grid, B, 0.072, 2.718 # Recursos ahorrados a la red (Ceuta y Melilla) por la electricidad cogenerada y exportada a la red
ELECTRICIDADCEUTAMELILLA, COGENERACION, to_nEPB, B, 0.072, 2.718 # Recursos ahorrados a la red (península) por la electricidad cogenerada y exportada a la red
MEDIOAMBIENTE, RED, input, A, 1.000, 0.000 # Recursos usados para suministrar energía térmica del medioambiente (red de suministro ficticia)
MEDIOAMBIENTE, INSITU, input, A, 1.000, 0.000 # Recursos usados para generar in situ energía térmica del medioambiente (vector renovable)
MEDIOAMBIENTE, INSITU, to_grid, A, 1.000, 0.000 # Recursos usados para la energía térmica del medioambiente producida in situ y exportada a la red (vector sin exportación)
MEDIOAMBIENTE, INSITU, to_nEPB, A, 1.000, 0.000 # Recursos usados para la energía térmica del medioambiente producida in situ y exportada a usos no EPB (vector sin exportación)
MEDIOAMBIENTE, INSITU, to_grid, B, 1.000, 0.000 # Recursos ahorrados a la red (ficticia) por la energía producida in situ y exportada a la red (ficticia)
MEDIOAMBIENTE, INSITU, to_nEPB, B, 1.000, 0.000 # Recursos ahorrados a la red (ficticia) por la energía producida in situ y exportada a usos no EPB (ficticia)
BIOCARBURANTE, RED, input, A, 1.028, 0.085 # Recursos usados para suministrar el vector desde la red (Biocarburante = biomasa densificada (pellets))
BIOMASA, RED, input, A, 1.003, 0.034 # Recursos usados para suministrar el vector desde la red
BIOMASADENSIFICADA, RED, input, A, 1.028, 0.085 # Recursos usados para suministrar el vector desde la red
CARBON, RED, input, A, 0.002, 1.082 # Recursos usados para suministrar el vector desde la red
FUELOIL, RED, input, A, 0.003, 1.179 # Recursos usados para suministrar el vector desde la red (Fueloil = Gasóleo)
GASNATURAL, RED, input, A, 0.005, 1.190 # Recursos usados para suministrar el vector desde la red
GASOLEO, RED, input, A, 0.003, 1.179 # Recursos usados para suministrar el vector desde la red
GLP, RED, input, A, 0.030, 1.201 # Recursos usados para suministrar el vector desde la red
RED1, RED, input, A, 0.000, 1.300 # Recursos usados para suministrar el vector desde la red de distrito 1 (definible por el usuario)
RED2, RED, input, A, 0.000, 1.300 # Recursos usados para suministrar el vector desde la red de distrito 2 (definible por el usuario)
`
export const CTEFP = cte_parse_weighting_factors(CTEFPSTR);
export const FACTORESDEPASO = CTEFP; // Alias por compatibilidad

// ------------------------ Datos para validación y por defecto ------------------------

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
export const LEGACYSERVICESMAP = { 'WATERSYSTEMS': 'ACS', 'HEATING': 'CAL', 'COOLING': 'REF', 'FANS': 'VEN' };

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

// Genera factores de paso a partir de localización
// Usa localización (PENINSULA, CANARIAS, BALEARES, CEUTAYMELILLA),
// factores de paso de cogeneración, y factores de paso para RED1 y RED2
export function cte_weighting_factors(loc=CTE_LOCS[0], cogen=CTE_COGEN_DEFAULTS, red=CTE_RED_DEFAULTS) {
  if (!CTE_LOCS.includes(loc)) {
    throw new CteValidityException(`Localización "${ loc }" desconocida al generar factores de paso`);
  }
  // Selecciona factores de electricidad según localización
  const leaveout = CTE_LOCS
    .filter(l => l !== loc)
    .map(`ELECTRICIDAD${ (loc === 'PENINSULA') ? '' : loc }`);
  const factors = FACTORESDEPASO.filter(f => !leaveout.includes(f.carrier));

  // Factores de paso de cogeneración. Factores de exportación de electricidad cogenerada a la
  // red o a usos nEPB: ELECTRICIDAD, COGENENRACION, to_grid | to_nEPB, A, ren, nren
  const cogfp = factors
    .filter(f =>
      f.source === 'COGENERACION'
      && f.step === 'A'
      && ['to_grid', 'to_nEPB'].includes(f.dest)
    );
  if(cogfp.length > 0) {
    const cogfpgrid = cogfp.find(f => f.dest === 'to_grid');
    cogfpgrid.ren = cogen.to_grid.ren;
    cogfpgrid.nren = cogen.to_grid.nren;
    const cogfpnepb = cogfp.find(f => f.dest === 'to_nEPB');
    cogfpnepb.ren = cogen.to_nEPB.ren;
    cogfpnepb.nren = cogen.to_nEPB.nren;
  } else {
    factors.push(new_factor('ELECTRICIDAD', 'COGENERACION', 'to_grid', 'A', cogen.to_grid.ren, cogen.to_grid.nren));
    factors.push(new_factor('ELECTRICIDAD', 'COGENERACION', 'to_nEPB', 'A', cogen.to_nEPB.ren, cogen.to_nEPB.nren));
  }
  // Factores de redes de distrito 1 y 2: RED[1|2], RED, input, A, ren, nren
  const redfp =  factors.filter(f => ['RED1', 'RED2'].includes(f.carrier));
  if(redfp.length > 0) {
    const redfp1 = redfp.find(f => f.carrier === 'RED1' && f.dest === 'input' && f.step === 'A');
    redfp1.ren = red.RED1.ren;
    redfp1.nren = red.RED1.nren;
    const redfp2 = cogfp.find(f => f.carrier === 'RED2' && f.dest === 'input' && f.step === 'A');
    redfp2.ren = red.RED2.ren;
    redfp2.nren = red.RED2.nren;
  } else {
    factors.push(new_factor('RED1', 'RED', 'input', 'A', red.RED1.ren, red.RED1.nren));
    factors.push(new_factor('RED2', 'RED', 'input', 'A', red.RED2.ren, red.RED2.nren));
  }
  factors.push(new_meta('CTE_LOC', loc));
  factors.push(new_meta('CTE_SRC1', 'Valores de la propuesta del documento reconocido del IDAE de 03/02/2014 (pág. 14)'));
  factors.push(new_meta('CTE_SRC2', 'CTE2013'));
  return factors;
}


// -------------------------------------------------------------------------------------
// Validation utilities and functions
// -------------------------------------------------------------------------------------

// Custom exception
export function CteValidityException(message) {
  this.message = message;
  this.name = 'UserException';
}

// -------------------- vectores energéticos -------------------------------------------

// Validate carrier data coherence
export function carrier_isvalid(carrier_obj) {
  const { type, carrier, ctype, csubtype } = carrier_obj;
  if (type !== 'CARRIER') return false;
  let validcarriers;
  try {
    validcarriers = VALIDDATA[ctype][csubtype];
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
export function cte_fix_carrier_list(carrierdata) {
  const carrierlist = carrierdata.map(c => { // Reescribe servicios legacy
    if (c.type === 'CARRIER' && c.service.match(LEGACY_SERVICE_TAG_REGEX)) {
      return { ...c, service: LEGACYSERVICESMAP[c.service] }
    } else {
      return c;
    }
  })

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
      return {
        type: 'CARRIER', carrier: 'MEDIOAMBIENTE', ctype: 'PRODUCCION', csubtype: 'INSITU', service,
        values: unbalanced, comment: 'Equilibrado de energía térmica insitu (MEDIOAMBIENTE) consumida y sin producción declarada'
      };
    }).filter(v => v !== null);
    return [...carrierlist, ...balancecarriers];
  }
  throw new CteValidityException(`Vectores energéticos con valores no coherentes:\n${ JSON.stringify(carriers.filter(c => !carrier_isvalid(c))) }`);
}

// Devuelve objetos CARRIER y META a partir de cadena, intentando asegurar los tipos
export function cte_parse_carrier_list(datastring) {
  const carrierdata = parse_carrier_list(datastring);
  return cte_fix_carrier_list(carrierdata);
}

// ---------------------- Factores de paso -----------------------------------------------

// Asegura consistencia de factores de paso definidos y deduce algunos de los que falten
  const FPLIST = parse_weighting_factors(factorsstring);
  const CARRIERS = [... new Set(FPLIST.filter(e => e.type === 'FACTOR').map(f => f.carrier))];
  let outlist = [...FPLIST];

  // Asegura que existe MEDIOAMBIENTE, INSITU, input, A, ren, nren
  const envinsitu = outlist.find(f =>
    f.carrier === 'MEDIOAMBIENTE'
    && f.source === 'INSITU'
    && f.dest === 'input');
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

  // En paso A, el factor input de cogeneración es 0.0, 0.0 ya que el impacto se tiene en cuenta en el suministro del vector de generación
  if (!outlist.find(({type, source, dest }) => type === 'FACTOR' && source === 'COGENERACION' && dest === 'input')) {
    outlist.push({
      type: 'FACTOR', carrier: 'ELECTRICIDAD', source: 'COGENERACION', dest: 'input', step: 'A',
      ren: 0.0, nren: 0.0, comment: 'Factor de paso generado (el impacto de la cogeneración se tiene en cuenta en el vector de suministro)'
    });
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
      if (s !== 'COGENERACION') {
        // VECTOR, SRC, to_grid, A, ren, nren === VECTOR, SRC, input, A, ren, nren
        const newvec = { ...fpAinput, dest: 'to_grid', comment: 'Factor de paso generado' };
        outlist.push(newvec);
      } else {
        // Valores por defecto para COGENERACION (A, to_grid|to_nEPB) - ver 9.6.6.2.3
        outlist.push({
          type: 'FACTOR', carrier: 'ELECTRICIDAD', source: 'COGENERACION', dest: 'to_grid', step: 'A',
          ren: cogen.to_grid.ren, nren: cogen.to_grid.nren,
          comment: 'Factor de paso predefinido (ver EN ISO 52000-1 9.6.6.2.3)'
        });
      }
    }
    if (!cfpsA.find(f => f.dest === 'to_nEPB')) {
      if (s !== 'COGENERACION') {
        // VECTOR, SRC, to_nEPB, A, ren, nren === VECTOR, SRC, input, A, ren, nren
        outlist.push({ ...fpAinput, dest: 'to_nEPB', comment: 'Factor de paso generado' });
      } else {
        // Valores por defecto para COGENERACION (A, to_grid|to_nEPB) - ver 9.6.6.2.3
        outlist.push({
          type: 'FACTOR', carrier: 'ELECTRICIDAD', source: 'COGENERACION', dest: 'to_nEPB', step: 'A',
          ren: cogen.to_nEPB.ren, nren: cogen.to_nEPB.nren,
          comment: 'Factor de paso predefinido (ver EN ISO 52000-1 9.6.6.2.3)'
        });
      }
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

  return outlist;
}
