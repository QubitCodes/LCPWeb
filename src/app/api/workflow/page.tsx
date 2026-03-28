import React from 'react';
import { FileText, ArrowRight, ShieldCheck, LayoutDashboard, AlertTriangle, Key, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ApiWorkflowPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-lg shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">API Integration Workflow</h1>
          </div>
          <Link
            href="/api/docs"
            target="_blank"
            className="flex items-center justify-center w-full sm:w-auto text-sm font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-md transition-colors"
          >
            Open Scalar Reference <ExternalLink className="h-4 w-4 ml-2 shrink-0" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">

        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-28 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 px-2 tracking-wide uppercase text-xs">Navigation</h3>
            <nav className="space-y-1">
              <a href="#base-rules" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white transition-colors">The Base Rules</a>
              <a href="#authentication" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white transition-colors">Authentication</a>
              <a href="#pages" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white transition-colors">Pages</a>
              <a href="#dashboard" className="block px-3 py-2 ml-4 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-gray-700/50 dark:hover:text-white transition-colors text-xs border-l border-gray-200 dark:border-gray-700">2.1 Dashboard</a>
              <a href="#error-handling" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white transition-colors">Error Handling</a>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-10 pb-20">

          {/* Intro */}
          <section id="base-rules" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 scroll-mt-28">
            <h2 className="text-lg font-semibold flex items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <Key className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
              1. The Base Rules
            </h2>
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
              <p>
                Welcome to the Mobile API Integration guide. All APIs in this system expect standard JSON interaction.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Content Type:</strong> Always send <code className="bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono text-xs border border-gray-200 dark:border-gray-700">application/json</code> in your POST/PUT headers.</li>
                <li><strong>Authorization:</strong> Once you successfully log in, you will receive a <code className="bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono text-xs border border-gray-200 dark:border-gray-700">token</code> inside the <code className="bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono text-xs border border-gray-200 dark:border-gray-700">data</code> object. For all subsequent requests, pass this token in the header as: <br />
                  <span className="inline-block mt-3 bg-gray-900 text-green-400 p-3 rounded-lg w-full overflow-x-auto font-mono text-sm shadow-inner">Authorization: Bearer YOUR_TOKEN_HERE</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Phase 1: Authentication */}
          <section id="phase-1" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 scroll-mt-28">
            <h2 className="text-lg font-semibold flex items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <ShieldCheck className="h-5 w-5 mr-3 text-indigo-500" />
              Phase 1: Authentication & Registration
            </h2>
            <div className="space-y-6 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
              <p>
                Your first interaction with the system is establishing a session. We support both traditional Email and Firebase OTP workflows.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 p-5 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Path A: Standard Email Login</h3>
                <p className="mb-3 text-sm text-blue-900/80 dark:text-blue-200/80">If the mobile app supports standard email forms, simply hit the login endpoint.</p>
                <Link href="/api/docs#tag/mobile---auth/operation/post-api-v1-auth-login" target="_blank" className="inline-flex items-center text-sm font-medium bg-blue-100 dark:bg-blue-800/50 px-3 py-1.5 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  View POST /api/v1/auth/login <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 p-5 rounded-lg">
                <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-3">Path B: Firebase OTP (Phone Number)</h3>
                <ol className="list-decimal pl-5 space-y-3 text-sm text-indigo-900/80 dark:text-indigo-200/80 mb-4">
                  <li>Verify the user's phone number natively via the Firebase mobile SDK to obtain an <code className="font-mono bg-white dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-1.5 rounded text-indigo-600 dark:text-indigo-400">idToken</code>.</li>
                  <li>
                    Send the <code className="font-mono bg-white dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-1.5 rounded text-indigo-600 dark:text-indigo-400">idToken</code> to
                    {' '}
                    <Link href="/api/docs#tag/mobile---auth/operation/post-api-v1-auth-firebase-phone" target="_blank" className="text-indigo-700 dark:text-indigo-300 underline font-medium hover:text-indigo-900 dark:hover:text-indigo-200">
                      /api/v1/auth/firebase/phone
                    </Link>.
                  </li>
                  <li>If the user exists, the API returns a <code className="font-mono bg-white dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-1.5 rounded text-indigo-600 dark:text-indigo-400">token</code>. <strong className="text-indigo-700 dark:text-indigo-300">You are logged in!</strong></li>
                  <li>
                    If the user DOES NOT exist, the API returns <code className="font-mono bg-white dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-1.5 rounded text-rose-600 dark:text-rose-400">is_new_user: true</code>. Prompt the user for Registration.
                  </li>
                  <li>
                    Submit their profile details to
                    {' '}
                    <Link href="/api/docs#tag/mobile---auth/operation/post-api-v1-auth-register-phone" target="_blank" className="text-indigo-700 dark:text-indigo-300 underline font-medium hover:text-indigo-900 dark:hover:text-indigo-200">
                      /api/v1/auth/register-phone
                    </Link>
                    {' '}
                    (or register-supervisor).
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Phase 2: Pages */}
          <section id="pages" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 scroll-mt-28">
            <h2 className="text-lg font-semibold flex items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <LayoutDashboard className="h-5 w-5 mr-3 text-emerald-500" />
              Phase 2: Pages
            </h2>
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
              <p>
                This section documents the primary screens in the mobile application framework.
              </p>

              {/* 2.1 Dashboard */}
              <div id="dashboard" className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 mt-6 scroll-mt-32">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2 border-b border-emerald-200/50 dark:border-emerald-800/50 pb-2">2.1 Dashboard</h3>
                <p className="mb-4 text-sm text-emerald-900/80 dark:text-emerald-200/80">Loaded immediately upon successful authentication to initialize the user's home screen.</p>
                
                <Link href="/api/docs#tag/mobile---dashboard/operation/get-api-v1-page-dashboard" target="_blank" className="inline-flex items-center text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-800/80 transition-colors mb-4">
                  View GET /api/v1/page/dashboard <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Link>
                
                <ul className="list-disc pl-5 space-y-4 text-sm text-gray-700 dark:text-gray-300 mb-6">
                  <li>
                    <strong>If <code className="font-mono bg-white dark:bg-gray-800 px-1 border border-gray-200 dark:border-gray-700 rounded text-emerald-600 dark:text-emerald-400">data.role === 'SUPERVISOR'</code>:</strong><br />
                    <span className="opacity-90">Route the mobile app to the Supervisor UI. The payload generates the required metrics (Readiness %, Active Certs, etc) and an aggregated recent activity feed mapped directly to your UI's structure.</span>
                  </li>
                  <li>
                    <strong>If <code className="font-mono bg-white dark:bg-gray-800 px-1 border border-gray-200 dark:border-gray-700 rounded text-emerald-600 dark:text-emerald-400">data.role === 'WORKER'</code>:</strong><br />
                    <span className="opacity-90">Route the mobile app to the Worker UI. The payload provides their <code>enrollments</code> and detailed <code>progress_records</code>.</span>
                  </li>
                </ul>

                <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200 mt-6">Supervisor Example Payload:</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono shadow-inner border border-gray-800">
{`{
  "role": "SUPERVISOR",
  "company_name": "GLOBAL LOGISTICS CORP",
  "metrics": {
    "certification_readiness": 54,
    "total_workers": 124,
    "active_certs": 98,
    "pending_approvals": 12,
    "in_progress": 14
  },
  "recent_activity": [
    {
      "user": "John Doe",
      "action": "Completed Safety 101",
      "status": "DONE",
      "time_ago": "2026-03-27T10:00:00.000Z"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Phase 3: Error Handling */}
          <section id="phase-3" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 scroll-mt-28">
            <h2 className="text-lg font-semibold flex items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <AlertTriangle className="h-5 w-5 mr-3 text-rose-500" />
              Phase 3: Handling Responses & Errors
            </h2>
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
              <p>
                Every single endpoint in the entire API suite follows the exact same JSON response envelope. Mobile applications can build a single interceptor to handle parsing.
              </p>
              <pre className="bg-gray-900 text-gray-100 p-5 rounded-lg overflow-x-auto text-sm font-mono shadow-inner">
                {`{
  "status": true,       // Boolean (Was the logic successful?)
  "message": "...",     // Human-readable string for Toast alerts
  "code": 100,          // Internal operation code
  "data": { ... },      // The actual payload (or null)
  "errors": [ ... ]     // Zod validation traces (if code === 201)
}`}
              </pre>
              <div className="mt-6 space-y-3">
                <p><strong>Crucial Internal Codes:</strong></p>
                <div className="flex items-start space-x-3 bg-rose-50 dark:bg-rose-900/10 p-3 rounded-md border border-rose-100 dark:border-rose-900/30">
                  <code className="bg-white dark:bg-gray-800 shrink-0 px-2 py-1 rounded text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800 text-sm">201</code>
                  <span className="text-sm"><strong>Validation Error.</strong> Check the <code>errors</code> array in the response to highlight red borders on your mobile input fields.</span>
                </div>
                <div className="flex items-start space-x-3 bg-orange-50 dark:bg-orange-900/10 p-3 rounded-md border border-orange-100 dark:border-orange-900/30">
                  <code className="bg-white dark:bg-gray-800 shrink-0 px-2 py-1 rounded text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800 text-sm">210</code>
                  <span className="text-sm"><strong>Authentication Error.</strong> The Bearer token has expired or is invalid. Log the user out immediately and show the Login screen.</span>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
