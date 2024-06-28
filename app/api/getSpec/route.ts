import { NextRequest, NextResponse } from 'next/server';
import { getSpec } from '../../../utils/getSpec';
import { parseSpec } from '../../../utils/parseSpec';

export async function POST(request: NextRequest) {
  const { contractId } = await request.json();

  try {
    const spec = await getSpec(contractId);
    const parsedSpec = parseSpec(spec);
    return NextResponse.json({ spec: parsedSpec });
  } catch (error) {
    console.error('Error loading spec:', error);
    return NextResponse.json({ error: 'Error loading spec' }, { status: 500 });
  }
}
