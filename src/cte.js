// @flow
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
import type {
  TComponent, TComponents, TFactors, TBalance
} from './types.js';

import { veclistsum, vecvecdif } from './vecops.js';
import {
  new_carrier, new_factor, new_meta,
  LEGACY_SERVICE_TAG_REGEX,
  parse_components as epbd_parse_components,
  parse_wfactors as epbd_parse_wfactors
} from './epbd.js';

// ---------------------------------------------------------------------------------------------------------
// Valores reglamentarios
//
// Orientados al cumplimiento del DB-HE del (Código Técnico de la Edificación CTE).
//
// Factores de paso basados en el consumo de energía primaria
// Factores de paso constantes a lo largo de los intervalos de cálculo
// ---------------------------------------------------------------------------------------------------------

export const KEXP_DEFAULT = 0.0;

// Valores por defecto para exportación (paso A) de electricidad cogenerada
export const CTE_COGEN_DEFAULTS = {
  'to_grid': { ren: 0, nren: 2.5 }, // ELECTRICIDAD, COGENERACION, to_grid, A, ren, nren
  'to_nEPB': { ren: 0, nren: 2.5 }  // ELECTRICIDAD, COGENERACION, to_nEPB, A, ren, nren
};

// Valores por defecto para redes de distrito
export const CTE_RED_DEFAULTS = {
  'RED1': { ren: 0, nren: 1.3 }, // RED1, RED, input, A, ren, nren
  'RED2': { ren: 0, nren: 1.3 }  // RED2, RED, input, A, ren, nren
}

// Localizaciones válidas para CTE
export const CTE_LOCS = ['PENINSULA', 'BALEARES', 'CANARIAS', 'CEUTAMELILLA'];

// Factores de paso según documento reconocido
export const CTE_FP_STR = `
#META CTE_FUENTE: CTE2013
#META CTE_FUENTE_COMENTARIO: Factores de paso del documento reconocido del RITE de 20/07/2014
ELECTRICIDAD, RED, input, A, 0.414, 1.954 # Recursos usados para suministrar electricidad (peninsular) desde la red
ELECTRICIDAD, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDAD, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la energía (0 porque se contabiliza el vector que alimenta el cogenerador)
ELECTRICIDADBALEARES, RED, input, A, 0.082, 2.968 # Recursos usados para suministrar electricidad (Baleares) desde la red
ELECTRICIDADBALEARES, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDADBALEARES, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la electricidad cogenerada (0 porque se contabiliza el vector que alimenta el cogenerador)
ELECTRICIDADCANARIAS, RED, input, A, 0.070, 2.924 # Recursos usados para suministrar electricidad (Canarias) desde la red
ELECTRICIDADCANARIAS, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir electricidad in situ
ELECTRICIDADCANARIAS, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar electricidad cogenerada (0 porque se contabiliza el vector que alimenta el cogenerador)
ELECTRICIDADCEUTAMELILLA, RED, input, A, 0.072, 2.718 # Recursos usados para suministrar electricidad (Ceuta y Melilla) desde la red
ELECTRICIDADCEUTAMELILLA, INSITU, input, A, 1.000, 0.000 # Recursos usados para producir in situ la electricidad
ELECTRICIDADCEUTAMELILLA, COGENERACION, input, A, 0.000, 0.000 # Recursos usados para suministrar la electricidad cogenerada (0 porque se contabiliza el vector que alimenta el cogenerador)
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

export const CTE_VALIDSERVICES = [ 'ACS', 'CAL', 'REF', 'VEN', 'ILU', 'HU', 'DHU', 'NDEF' ];
export const LEGACYSERVICESMAP = { 'WATERSYSTEMS': 'ACS', 'HEATING': 'CAL', 'COOLING': 'REF', 'FANS': 'VEN' };

// -------------------------------------------------------------------------------------
// Utilidades de validación y generación
// -------------------------------------------------------------------------------------

// Custom exception
export function CteValidityException(message: string) {
  this.message = message;
  this.name = 'UserException';
}

// -------------------- vectores energéticos -------------------------------------------

// Detecta si el vector energético es formalmente correcto
export function carrier_isvalid(carrier_obj: any): bool {
  const { carrier, ctype, csubtype } = carrier_obj;
  if (!carrier_obj.hasOwnProperty('values')) return false;
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
export function fix_components(components: any): TComponents {
  // Reescribe servicios legacy
  const fixeddata: TComponent[] = components.cdata.map(c =>
    c.service.match(LEGACY_SERVICE_TAG_REGEX) ? ({ ...c, service: LEGACYSERVICESMAP[c.service] }) : c
  );

  // Vectores con valores coherentes
  const all_carriers_ok = fixeddata.every(c => carrier_isvalid(c) && CTE_VALIDSERVICES.includes(c.service));
  if (!all_carriers_ok) {
    throw new CteValidityException(`Vectores energéticos con valores no coherentes:\n${ JSON.stringify(fixeddata.filter(c => !carrier_isvalid(c))) }`);
  }

  // Completa consumos de energía térmica insitu (MEDIOAMBIENTE) sin producción declarada
  const envcarriers = fixeddata.filter(c => c.carrier === 'MEDIOAMBIENTE');
  const services = [... new Set(envcarriers.map(c => c.service))];
  const balancecarriers: TComponent[] = services.map((service: any): any => {
    const envcarriersforservice = envcarriers.filter(c => c.service === service);
    const consumed = envcarriersforservice.filter(c => c.ctype === 'CONSUMO');
    if (consumed.length === 0) return null;
    let unbalanced_values = veclistsum(consumed.map(v => v.values));
    const produced = envcarriersforservice.filter(c => c.ctype === 'PRODUCCION');
    if (produced.length !== 0) {
      const totproduced = veclistsum(produced.map(v => v.values));
      unbalanced_values = vecvecdif(unbalanced_values, totproduced).map(v => Math.max(0, v));
    }
    return new_carrier('MEDIOAMBIENTE', 'PRODUCCION', 'INSITU', service, unbalanced_values,
      'Equilibrado de energía térmica insitu (MEDIOAMBIENTE) consumida y sin producción declarada');
  }).filter(v => v !== null);

  return { cmeta: components.cmeta, cdata: [...fixeddata, ...balancecarriers] };
}

// Devuelve objetos CARRIER y META a partir de cadena, intentando asegurar los tipos
export function parse_components(datastring: string): TComponents {
  const components = epbd_parse_components(datastring);
  return fix_components(components);
}

// ---------------------- Factores de paso -----------------------------------------------

// Asegura consistencia de factores de paso definidos y deduce algunos de los que falten
// También elimina los destinados a exportación to_nEPB por defecto (pueden dejarse con opción a false)
export function fix_wfactors(wfactors: TFactors, { cogen=CTE_COGEN_DEFAULTS, red=CTE_RED_DEFAULTS, stripnepb=true }: any={}) {
  // Vectores existentes
  const CARRIERS = [... new Set(wfactors.wdata.map(f => f.carrier))];
  let newdata = [...wfactors.wdata];
  // Asegura que existe MEDIOAMBIENTE, INSITU, input, A, 1.0, 0.0
  const envinsitu = newdata.find(f => f.carrier === 'MEDIOAMBIENTE' && f.source === 'INSITU' && f.dest === 'input');
  if (!envinsitu) {
    newdata.push(new_factor('MEDIOAMBIENTE', 'INSITU', 'input', 'A', 1.0, 0.0, 'Recursos usados para obtener energía térmica del medioambiente'));
  }
  // Asegura que existe MEDIOAMBIENTE, RED, input, A, 1.0, 0.0
  const envgrid = newdata.find(f => f.carrier === 'MEDIOAMBIENTE' && f.source === 'RED' && f.dest === 'input');
  if (!envgrid) {
    // MEDIOAMBIENTE, RED, input, A, ren, nren === MEDIOAMBIENTE, INSITU, input, A, ren, nren
    newdata.push(new_factor('MEDIOAMBIENTE', 'RED', 'input', 'A', 1.0, 0.0, 'Recursos usados para obtener energía térmica del medioambiente (red ficticia)'));
  }
  // Asegura que existe ELECTRICIDAD, INSITU, input, A, 1.0, 0.0 si hay ELECTRICIDAD
  const eleinsitu = newdata.find(f => f.carrier === 'ELECTRICIDAD' && f.source === 'INSITU' && f.dest === 'input');
  if (!eleinsitu && CARRIERS.includes('ELECTRICIDAD')) {
    newdata.push(new_factor('ELECTRICIDAD', 'INSITU', 'input', 'A', 1.0, 0.0, 'Recursos usados para generar electricidad in situ'));
  }
  // Asegura definición de factores de red para todos los vectores energéticos
  const carrier_has_input = CARRIERS.map(c => newdata.find(
      f => f.carrier === c && f.source === 'RED' && f.dest === 'input' && f.step === 'A'
  ));
  if (!carrier_has_input.every(v => v)) {
    const missing_carriers = CARRIERS.filter((c, i) => !carrier_has_input[i]);
    throw new CteValidityException(`Todos los vectores deben definir los factores de paso de red: "VECTOR, INSITU, input, A, fren?, fnren?". Error en "${ missing_carriers.join(', ') }"`);
  }
  // En paso A, el factor input de cogeneración es 0.0, 0.0 ya que el impacto se tiene en cuenta en el suministro del vector de generación
  if (!newdata.find(({source, dest }) => source === 'COGENERACION' && dest === 'input')) {
    newdata.push(new_factor('ELECTRICIDAD', 'COGENERACION', 'input', 'A', 0.0, 0.0,
      'Factor de paso generado (el impacto de la cogeneración se tiene en cuenta en el vector de suministro)'));
  }
  // Asegura que todos los vectores con exportación tienen factores de paso a la red y a usos no EPB
  [
    ['ELECTRICIDAD', 'INSITU'],
    ['ELECTRICIDAD', 'COGENERACION'],
    ['MEDIOAMBIENTE', 'INSITU']
  ].map(([c, s]) => {
    const cfpsA = newdata.filter(f => f.carrier === c && f.source === s && f.step === 'A');
    const cfpsB = newdata.filter(f => f.carrier === c && f.source === s && f.step === 'B');
    const fpAinput = cfpsA.find(f => f.dest === 'input');
    const fpAredinput = newdata.find(f => f.carrier === c && f.source === 'RED' && f.dest === 'input' && f.step === 'A');
    // Asegura que existe VECTOR, SRC, to_grid | to_nEPB, A, ren, nren
    if (!cfpsA.find(f => f.dest === 'to_grid')) {
      if (s !== 'COGENERACION') {
        // VECTOR, SRC, to_grid, A, ren, nren === VECTOR, SRC, input, A, ren, nren
        if (fpAinput) {
          newdata.push(new_factor(fpAinput.carrier, fpAinput.source, 'to_grid', 'A', fpAinput.ren, fpAinput.nren,
            'Recursos usados para producir la energía exportada a la red'));
        } else {
          throw new CteValidityException(`No se ha definido el factor de paso de suministro del vector ${ c } y es necesario para definir el factor de exportación a la red en paso A`);
        }
      } else {
        // Valores por defecto para ELECTRICIDAD, COGENERACION, to_grid, A, ren, nren - ver 9.6.6.2.3
        const is_default = ((cogen.to_grid.ren === CTE_COGEN_DEFAULTS.to_grid.ren) && (cogen.to_grid.nren === CTE_COGEN_DEFAULTS.to_grid.nren));
        newdata.push(new_factor('ELECTRICIDAD', 'COGENERACION', 'to_grid', 'A', cogen.to_grid.ren, cogen.to_grid.nren,
          `Recursos usados para producir la electricidad cogenerada y exportada a la red (ver EN ISO 52000-1 9.6.6.2.3)${ is_default ? '(Valor predefinido)' : '(Valor de usuario)'}`));
      }
    }
    if (!cfpsA.find(f => f.dest === 'to_nEPB')) {
      if (s !== 'COGENERACION') {
        // VECTOR, SRC, to_nEPB, A, ren, nren === VECTOR, SRC, input, A, ren, nren
        if (fpAinput) {
          newdata.push(new_factor(fpAinput.carrier, fpAinput.source, 'to_nEPB', 'A', fpAinput.ren, fpAinput.nren,
            'Recursos usados para producir la energía exportada a usos no EPB'));
        } else {
          throw new CteValidityException(`No se ha definido el factor de paso de suministro del vector ${ c } y es necesario para definir el factor de exportación a usos no EPB en paso A`);
        }
      } else {
        // TODO: Si está definido para to_grid (no por defecto) y no para to_nEPB, qué hacemos? usamos por defecto? usamos igual a to_grid?
        // Valores por defecto para ELECTRICIDAD, COGENERACION, to_nEPB, A, ren, nren - ver 9.6.6.2.3
        const is_default = (cogen.to_nEPB.ren === CTE_COGEN_DEFAULTS.to_nEPB.ren) && (cogen.to_nEPB.nren === CTE_COGEN_DEFAULTS.to_nEPB.nren);
        newdata.push(new_factor('ELECTRICIDAD', 'COGENERACION', 'to_nEPB', 'A', cogen.to_nEPB.ren, cogen.to_nEPB.nren,
          `Recursos usados para producir la electricidad cogenerada y exportada a usos no EPB (ver EN ISO 52000-1 9.6.6.2.3)${ is_default ? '(Valor predefinido)' : '(Valor de usuario)'}`));
      }
    }
    // Asegura que existe VECTOR, SRC, to_grid | to_nEPB, B, ren, nren
    if (!cfpsB.find(f => f.dest === 'to_grid')) {
      // VECTOR, SRC, to_grid, B, ren, nren === VECTOR, RED, input, A, ren, nren
      if (fpAredinput) {
        newdata.push(new_factor(fpAredinput.carrier, s, 'to_grid', 'B', fpAredinput.ren, fpAredinput.nren,
          'Recursos ahorrados a la red por la energía producida in situ y exportada a la red'));
      } else {
        throw new CteValidityException(`No se ha definido el factor de paso de suministro del vector ${ c } y es necesario para definir el factor de exportación a la red en paso B`);
      }
    }
    if (!cfpsB.find(f => f.dest === 'to_nEPB')) {
      // VECTOR, SRC, to_nEPB, B, ren, nren === VECTOR, RED, input, A, ren, nren
      if (fpAredinput) {
        newdata.push(new_factor(fpAredinput.carrier, s, 'to_nEPB', 'B', fpAredinput.ren, fpAredinput.nren,
          'Recursos ahorrados a la red por la energía producida in situ y exportada a usos no EPB'));
      } else {
        throw new CteValidityException(`No se ha definido el factor de paso de suministro del vector ${ c } y es necesario para definir el factor de exportación a usos no EPB en paso B`);
      }
    }
  });
  // Asegura que existe RED1 | RED2, RED, input, A, ren, nren
  const red1 = newdata.find(f => f.carrier === 'RED1' && f.source === 'RED' && f.dest === 'input');
  if (!red1) {
    newdata.push(new_factor(('RED1': any), 'RED', 'input', 'A',
      red.RED1.ren, red.RED1.nren, 'Recursos usados para suministrar energía de la red de distrito 1 (definible por el usuario)'));
  }
  const red2 = newdata.find(f => f.carrier === 'RED2' && f.source === 'RED' && f.dest === 'input');
  if (!red2) {
    newdata.push(new_factor(('RED2': any), 'RED', 'input', 'A',
      red.RED2.ren, red.RED2.nren, 'Recursos usados para suministrar energía de la red de distrito 2 (definible por el usuario)'));
  }

  // Elimina destino nEPB si stripnepb es true
  if(stripnepb) {
    newdata = newdata.filter(e => e.dest !== 'to_nEPB');
  }

  return { wmeta: wfactors.wmeta, wdata: newdata };
}

// Lee factores de paso desde cadena y sanea los resultados
export function parse_wfactors(wfactorsstring: string, { cogen=CTE_COGEN_DEFAULTS, red=CTE_RED_DEFAULTS, stripnepb=true }: any={}): TFactors {
  const wfactors = epbd_parse_wfactors(wfactorsstring);
  return fix_wfactors(wfactors, { cogen, red, stripnepb });
}


// Actualiza objeto de metadatos con nuevo valor de la clave o inserta clave y valor si no existe
function updatemeta(metaobj, key, value) {
  const match = metaobj.find(c => c.key === key)
  if(match) {
    match.value = value;
  } else {
    metaobj.push(new_meta(key, value));
  }
}

// Genera factores de paso a partir de localización
// Usa localización (PENINSULA, CANARIAS, BALEARES, CEUTAYMELILLA),
// factores de paso de cogeneración, y factores de paso para RED1 y RED2
export function new_wfactors(loc: string=CTE_LOCS[0], { cogen=CTE_COGEN_DEFAULTS, red=CTE_RED_DEFAULTS, stripnepb=true }: any={}): TFactors {
  if (!CTE_LOCS.includes(loc)) {
    throw new CteValidityException(`Localización "${ loc }" desconocida al generar factores de paso`);
  }
  // Vectores ELECTRICIDAD* de otras localizaciones
  const OTHERLOCELEC = CTE_LOCS.filter(l => l !== loc).map(l => `ELECTRICIDAD${ (l === 'PENINSULA') ? '' : l }`);
  // Selecciona vectores ELECTRICIDAD* de la localización y renombra a ELECTRICIDAD
  const wdata = CTE_FP.wdata
    .filter(f => !OTHERLOCELEC.includes(f.carrier))
    .map(f => f.carrier.startsWith('ELECTRICIDAD') ? { ...f, carrier: 'ELECTRICIDAD' } : f);

  // Actualiza metadatos con valores bien conocidos
  const wmeta = [ ...CTE_FP.wmeta ];
  updatemeta(wmeta, 'CTE_FUENTE', 'CTE2013');
  updatemeta(wmeta, 'CTE_FUENTE_COMENTARIO', 'Factores de paso del documento reconocido del RITE de 20/07/2014');
  updatemeta(wmeta, 'CTE_LOCALIZACION', loc);
  updatemeta(wmeta, 'CTE_COGEN', `${ cogen.to_grid.ren.toFixed(3) }, ${ cogen.to_grid.nren.toFixed(3) }`);
  updatemeta(wmeta, 'CTE_COGENNEPB', `${ cogen.to_nEPB.ren.toFixed(3) }, ${ cogen.to_nEPB.nren.toFixed(3) }`);
  updatemeta(wmeta, 'CTE_RED1', `${ red.RED1.ren.toFixed(3) }, ${ red.RED1.nren.toFixed(3) }`);
  updatemeta(wmeta, 'CTE_RED2', `${ red.RED2.ren.toFixed(3) }, ${ red.RED2.nren.toFixed(3) }`);

  return fix_wfactors({ wmeta, wdata }, { cogen, red, stripnepb });
}

// Elimina factores de paso no usados en los datos de vectores energéticos
//
// Elimina los factores:
//  - de vectores que no aparecen en los datos
//  - de cogeneración si no hay cogeneración
//  - para exportación a usos no EPB si no se aparecen en los datos
//  - de electricidad in situ si no aparece una producción de ese tipo
export function strip_wfactors(wfactors: TFactors, components: TComponents): TFactors {
  const cdata = components.cdata;
  const CARRIERS = [... new Set(cdata.map(c => c.carrier))];
  const HASCOGEN = cdata.map(c => c.csubtype).includes('COGENERACION');
  const HASNEPB =  cdata.map(c => c.csubtype).includes('NEPB');
  const HASELECINSITU = (cdata.filter(c => c.carrier.startsWith('ELECTRICIDAD') && c.csubtype === 'INSITU')).length > 0;

  const wdata = wfactors.wdata
  .filter(f => CARRIERS.includes(f.carrier))
  .filter(f => f.source !== 'COGENERACION' || HASCOGEN)
  .filter(f => f.dest !== 'to_nEPB' || HASNEPB)
  .filter(f => f.carrier !== 'ELECTRICIDAD' || f.source !== 'INSITU' || HASELECINSITU);
  return { wmeta: wfactors.wmeta, wdata };
}

export const CTE_FP = parse_wfactors(CTE_FP_STR);
export const FACTORESDEPASO = CTE_FP; // Alias por compatibilidad

// Métodos de salida -------------------------------------------------------------------

// Muestra balance, paso B, de forma simplificada
export function balance_to_plain(balanceobj: TBalance) {
  const { k_exp, arearef, balance_m2 } = balanceobj;
  const { ren, nren } = balance_m2.B;

  return `Area_ref = ${ arearef.toFixed(2) } [m2]\n`
    + `k_exp = ${ k_exp.toFixed(2) }\n`
    +
    `C_ep [kWh/m2.an]`
    + `: ren = ${ ren.toFixed(1) }`
    + `, nren = ${ nren.toFixed(1) }`
    + `, tot = ${ (ren + nren).toFixed(1) }`
    + `, RER = ${ (ren / (ren + nren)).toFixed(2) }`;
}

// Muestra balance y área de referencia en formato JSON
export function balance_to_JSON(balanceobj: TBalance) {
  return JSON.stringify(balanceobj, null, '  ');
}

const escapeXML = unescaped => unescaped.replace(
  /[<>&'"]/g,
  (m: any): any => {
    switch (m) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  }
);

export function balance_to_XML(balanceobj: TBalance) {
  const { components, wfactors, k_exp, arearef, balance_m2 } = balanceobj;
  const { ren, nren } = balance_m2.B;
  const cmeta = components.cmeta;
  const cdata = components.cdata;
  const wmeta = wfactors.wmeta;
  const wdata = wfactors.wdata;
  const wmetastring = wmeta.map(m =>
    `      <Metadato><Clave>${ escapeXML(m.key) }</Clave><Valor>${ typeof m.value === "string" ? escapeXML(m.value) : m.value }</Valor></Metadato>`).join('\n');
    const wdatastring = wdata.map(f => {
      const { carrier, source, dest, step, ren, nren, comment } = f;
      return `      <Dato>
          <Vector>${ carrier }</Vector><Origen>${ source }</Origen><Destino>${ dest }</Destino>
          <Paso>${ step }</Paso><ren>${ ren.toFixed(3) }</ren><nren>${ nren.toFixed(3) }</nren>
          <Comentario>${ escapeXML(comment) }</Comentario>
        </Dato>`;
    }).join('\n');
  const cmetastring = cmeta.map(m =>
    `      <Metadato><Clave>${ escapeXML(m.key) }</Clave><Valor>${ typeof m.value === "string" ? escapeXML(m.value) : m.value }</Valor></Metadato>`).join('\n');
  const cdatastring = cdata.map(c => {
    const { carrier, ctype, csubtype, service, values, comment } = c;
    const vals = values.map(v => `${ v.toFixed(2) }`).join(',');
    return `      <Dato>
        <Vector>${ carrier }</Vector><Tipo>${ ctype }</Tipo><Subtipo>${ csubtype }</Subtipo><Servicio>${ service }</Servicio>
        <Valores>${ vals }</Valores>
        <Comentario>${ escapeXML(comment) }</Comentario>
      </Dato>`;
  }).join('\n');

  return `<BalanceEPB>
  <FactoresDePaso>
    <Metadatos>
${ wmetastring }
    </Metadatos>
    <Datos>
${ wdatastring }
    </Datos>
  </FactoresDePaso>
  <Componentes>
    <Metadatos>
${ cmetastring }
    </Metadatos>
    <Datos>
${ cdatastring }
    </Datos>
  <Componentes/>
  <kexp>${ k_exp.toFixed(2) }</kexp>
  <AreaRef>${ arearef.toFixed(2) }</AreaRef><!-- área de referencia [m2] -->
  <Epm2><!-- ep [kWh/m2.a] -->
    <ren>${ ren.toFixed(1) }</ren>
    <nren>${ nren.toFixed(1) }</nren>
  </Epm2>
</BalanceEPB>`;
}
