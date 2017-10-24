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

/* Flow types definitions */
// Common (carriers + weighting factors)
export type carrierType =
  'ELECTRICIDAD' | 'ELECTRICIDADBALEARES' | 'ELECTRICIDADCANARIAS'
  | 'ELECTRICIDADCEUTAYMELILLA' | 'MEDIOAMBIENTE' | 'BIOCARBURANTE' | 'BIOMASA'
  | 'BIOMASADENSIFICADA' | 'CARBON' | 'FUELOIL' | 'GASNATURAL' | 'GASOLEO' | 'GLP';
// Energy Components
export type ctypeType = 'PRODUCCION' | 'CONSUMO';
export type pcsubtypeType = 'INSITU' | 'COGENERACION';
export type ccsubtypeType = 'EPB' | 'NEPB';
export type csubtypeType = pcsubtypeType | ccsubtypeType;
export type legacyserviceType = 'WATERSYSTEMS' | 'HEATING' | 'COOLING' | 'FANS';
export type cteserviceType = 'NDEF' | 'ACS' | 'CAL' | 'REF' | 'VEN' | 'ILU' | 'HU' | 'DHU';
export type serviceType = legacyserviceType | cteserviceType;
// Weighting factors
export type sourceType = 'RED' | 'INSITU' | 'COGENERACION';
export type destType = 'input' | 'to_grid' | 'to_nEPB';
export type stepType = 'A' | 'B';

export type TMeta = { key: string, value: string|number };
export type TComponent = { carrier: carrierType, ctype: ctypeType, csubtype: csubtypeType,
  service: serviceType | legacyserviceType, values: number[],
  comment: string };
export type TFactor = { carrier: carrierType, source: sourceType, dest: destType,
  step: stepType, ren: number, nren: number, comment: string };

export type TComponents = {| cmeta: TMeta[], cdata: TComponent[] |};
export type TFactors = {| wmeta: TMeta[], wdata: TFactor[] |};
export type TBalance = {| components: TComponents, wfactors: TFactors,
  k_exp: number, arearef: number,
  balance_cr_i: any, balance: any, balance_m2: any
|};
