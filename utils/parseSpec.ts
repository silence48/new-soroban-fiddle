// utils/parseSpec.ts
import { Spec } from '@stellar/stellar-sdk/contract';
import { xdr } from '@stellar/stellar-sdk';



interface FunctionSpec {
    name: string;
    doc: string;
    inputs: { name: string; type: string }[];
    outputs: { name: string; type: string }[];
  }
  
  export function parseSpec(spec: Spec): FunctionSpec[] {
    return spec.funcs().map(fn => ({
      name: fn.name().toString(),
      doc: fn.doc().toString(),
      inputs: fn.inputs().map(input => ({
        name: input.name().toString(),
        type: input.type().switch().name
      })),
      outputs: fn.outputs().map(output => ({
        name: output.switch().name,
        type: output.switch().name
      }))
    }));
  }