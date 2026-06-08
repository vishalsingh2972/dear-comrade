import { prisma } from './lib/prisma';

export default async function Home() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div style={{ 
      backgroundColor: '#f3f4f6', 
      minHeight: '100vh', 
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
          Patient Reports
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => (
            <div key={report.id} style={{ 
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: report.isCritical ? '2px solid #ef4444' : '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
                  {report.sender}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  borderRadius: '6px',
                  backgroundColor: report.isCritical ? '#fee2e2' : '#dcfce7',
                  color: report.isCritical ? '#991b1b' : '#166534'
                }}>
                  {report.isCritical ? 'CRITICAL' : 'NORMAL'}
                </span>
              </div>
              
              <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#374151', margin: '0 0 12px 0' }}>
                {report.summary}
              </p>
              
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                {new Date(report.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}