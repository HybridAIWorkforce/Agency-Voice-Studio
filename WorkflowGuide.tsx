import React from 'react';

const WorkflowGuide: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 border border-indigo-500/20 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Agency White Label Strategy</h2>
        <p className="text-indigo-200 text-sm max-w-2xl mx-auto">
          This is your roadmap to taking a raw AI voice design and turning it into a profitable product for your GoHighLevel sub-accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Phase 1 */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl font-black text-white">1</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-indigo-600 text-xs px-2 py-1 rounded">PHASE 1</span>
            Voice Design & Cloning
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Use the <strong>Voice Studio</strong> tab (Chatterbox) to perfect the audio aesthetic.
          </p>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside marker:text-indigo-500">
            <li>Select a base voice (e.g., Kore, Puck).</li>
            <li>Use the generator to test brand-specific phrases ("Welcome to...").</li>
            <li>Export WAV files for IVR menus or Voicemail Drops.</li>
            <li><strong>Value Add:</strong> Sell "Branded Voice Assets" to clients immediately.</li>
          </ul>
        </div>

        {/* Phase 2 */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl font-black text-white">2</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-indigo-600 text-xs px-2 py-1 rounded">PHASE 2</span>
            Prompt Engineering
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Use the <strong>Personality & Prompt</strong> tab to define behavior.
          </p>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside marker:text-indigo-500">
            <li>Paste client FAQs into the Knowledge Base.</li>
            <li>Define strict guardrails (e.g., "Never quote prices under $500").</li>
            <li>Use the <strong>Live Conversation</strong> button to stress-test the bot.</li>
            <li><strong>Value Add:</strong> Charge a setup fee for "Knowledge Base Training".</li>
          </ul>
        </div>

        {/* Phase 3 */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl font-black text-white">3</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-indigo-600 text-xs px-2 py-1 rounded">PHASE 3</span>
            Telephony Connection
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Connect the brain to the phone network via <strong>Telephony</strong> tab.
          </p>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside marker:text-indigo-500">
            <li>Input your <strong>Retell AI</strong> or Twilio credentials.</li>
            <li>Provision a phone number directly in this dashboard.</li>
            <li>Ensure the latency is low by testing in the simulator.</li>
            <li><strong>Value Add:</strong> Recurring subscription for line maintenance.</li>
          </ul>
        </div>

        {/* Phase 4 */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl font-black text-white">4</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="bg-indigo-600 text-xs px-2 py-1 rounded">PHASE 4</span>
            GHL Integration
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Embed this into GoHighLevel to automate the entire lifecycle.
          </p>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside marker:text-indigo-500">
            <li><strong>Embed:</strong> Add this app URL as a "Custom Menu Link" (iFrame).</li>
            <li><strong>Triggers:</strong> Create a GHL Workflow: <em>Form Submit &rarr; Webhook &rarr; Voice Agent</em>.</li>
            <li><strong>Sync:</strong> Ensure call outcomes update Custom Fields in GHL.</li>
            <li><strong>Value Add:</strong> "AI Employee" retainer package for clients.</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mt-8">
          <h3 className="text-white font-bold mb-4">Checklist for Client Handoff</h3>
          <div className="space-y-3">
              <CheckItem text="Voice confirmed by client (sent WAV samples from Studio)." />
              <CheckItem text="Knowledge base approved (FAQs & Pricing)." />
              <CheckItem text="Guardrails tested (Simulated 10 hostile calls)." />
              <CheckItem text="Webhook connected to Client Sub-account." />
              <CheckItem text="Twilio/Retell billing configured." />
          </div>
      </div>
    </div>
  );
};

const CheckItem: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center">
            <div className="w-3 h-3 bg-slate-800 rounded-sm"></div>
        </div>
        <span className="text-slate-300 text-sm">{text}</span>
    </div>
);

export default WorkflowGuide;
