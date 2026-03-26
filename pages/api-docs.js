import dynamic from 'next/dynamic';
import Head from 'next/head';
import 'swagger-ui-react/swagger-ui.css';

// SwaggerUI must be rendered client-side
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Timesheet Automator | API Documentation</title>
      </Head>
      <div className="pt-20 px-4 md:px-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-800 border-b pb-4">Internal API Specification</h1>
        <SwaggerUI url="/openapi.json" />
      </div>
    </div>
  );
}
