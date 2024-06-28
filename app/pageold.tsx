import { use } from 'react';

interface FunctionSpec {
  name: string;
  doc: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
}

async function fetchSpec(contractId: string): Promise<FunctionSpec[] | null> {
  try {
    const response = await fetch('http://localhost:3000/api/getSpec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contractId }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.spec;
  } catch (error) {
    console.error('Error fetching spec:', error);
    return null;
  }
}

export default async function Home({ searchParams }: { searchParams: { contractId?: string } }) {
  let spec: FunctionSpec[] | null = null;
  let error: string | null = null;

  if (searchParams.contractId) {
    spec = await fetchSpec(searchParams.contractId);
    if (!spec) {
      error = 'Error loading spec';
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <form method="GET" action="/" style={{ marginBottom: '20px', maxWidth: '75%', margin: '0 auto', padding: '20px', backgroundColor: '#222', borderRadius: '10px' }}>
        <input
          type="text"
          name="contractId"
          defaultValue={searchParams.contractId || ''}
          placeholder="Enter contract address"
          required
          style={{ padding: '10px', fontSize: '16px', width: '500px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Load Spec</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {spec && (
        <div style={{ maxWidth: '75%', margin: '0 auto' }}>
          {spec.map((fn, index) => (
            <div key={index} style={{
              display: 'flex',
              marginBottom: '20px',
              borderBottom: '1px solid #ccc',
              paddingBottom: '10px',
              backgroundColor: index % 2 === 0 ? '#333' : '#444',
              color: '#fff'
            }}>
              <div style={{ flex: '1' }}>
                <h3 style={{ margin: '10px 0' }}>{fn.name}</h3>
                <p style={{ margin: '10px 0', fontStyle: 'italic' }}>{fn.doc}</p>
              </div>
              <div style={{ flex: '2' }}>
                {fn.inputs.map((input, idx) => (
                  <div key={idx} style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>{input.name} ({input.type})</label>
                    <input
                      type="text"
                      name={input.name}
                      readOnly
                      style={{ padding: '10px', fontSize: '16px', width: '100%', borderRadius: '5px' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {fn.inputs.length === 0 ? (
                  <button style={{
                    marginRight: '10px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}>Read</button>
                ) : (
                  <>
                    <button style={{
                      marginRight: '10px',
                      padding: '10px 20px',
                      fontSize: '16px',
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}>Simulate</button>
                    <button style={{
                      padding: '10px 20px',
                      fontSize: '16px',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}>Invoke</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
