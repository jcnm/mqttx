/**
 * ACLs Tab Component
 * Display and manage Access Control List rules
 */

import { useState } from 'react';
import { useBrokerStore } from '../../stores/brokerStore';
import type { ACLRule } from '../../types/broker.types';

export function ACLsTab() {
  const { acls, addACL, removeACL } = useBrokerStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<ACLRule, 'id'>>({
    clientId: '',
    topic: '',
    access: 'allow',
    permission: 'readwrite',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.clientId && formData.topic) {
      addACL(formData as ACLRule);
      setFormData({
        clientId: '',
        topic: '',
        access: 'allow',
        permission: 'readwrite',
      });
      setShowAddForm(false);
    }
  };

  const handleDelete = (clientId: string, topic: string) => {
    if (confirm(`Remove ACL rule for "${clientId}" on topic "${topic}"?`)) {
      removeACL(clientId, topic);
    }
  };

  const allowedRules = acls.filter((acl) => acl.access === 'allow');
  const deniedRules = acls.filter((acl) => acl.access === 'deny');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Access Control Lists</h3>
          <p className="text-sm text-slate-400 mt-1">
            Manage client permissions for publishing and subscribing to topics
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-4">New ACL Rule</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client ID */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Client ID Pattern
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="e.g., client-*, admin, sensor-01"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            {/* Topic Pattern */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Topic Pattern
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., spBv1.0/+/NDATA/#"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            {/* Access */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Access</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, access: 'allow' })}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    formData.access === 'allow'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  Allow
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, access: 'deny' })}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    formData.access === 'deny'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  Deny
                </button>
              </div>
            </div>

            {/* Permission */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Permission</label>
              <select
                value={formData.permission}
                onChange={(e) =>
                  setFormData({ ...formData, permission: e.target.value as ACLRule['permission'] })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="read">Read (Subscribe)</option>
                <option value="write">Write (Publish)</option>
                <option value="readwrite">Read & Write (Both)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add Rule
          </button>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Total Rules</p>
          <p className="text-xl font-bold text-white">{acls.length}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Allow Rules</p>
          <p className="text-xl font-bold text-green-500">{allowedRules.length}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-400">Deny Rules</p>
          <p className="text-xl font-bold text-red-500">{deniedRules.length}</p>
        </div>
      </div>

      {/* Rules Table */}
      {acls.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-800">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-slate-400">No ACL rules configured</p>
          <p className="text-sm text-slate-500 mt-2">
            Click "Add Rule" to create your first access control rule
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Client ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Topic Pattern
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Access
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Permission
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {acls.map((acl, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm text-blue-400 font-mono">{acl.clientId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-yellow-400 font-mono">{acl.topic}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        acl.access === 'allow'
                          ? 'bg-green-900/30 text-green-400 border border-green-700'
                          : 'bg-red-900/30 text-red-400 border border-red-700'
                      }`}
                    >
                      {acl.access.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-slate-300">
                      {acl.permission === 'read' && '📖 Subscribe'}
                      {acl.permission === 'write' && '✍️ Publish'}
                      {acl.permission === 'readwrite' && '📖✍️ Both'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(acl.clientId, acl.topic)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-400 mb-2">ACL Pattern Matching</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Use <code className="text-yellow-400">*</code> as wildcard in client IDs (e.g., <code className="text-yellow-400">sensor-*</code>)</li>
              <li>• Use <code className="text-yellow-400">+</code> for single-level topic wildcards (e.g., <code className="text-yellow-400">spBv1.0/+/NDATA</code>)</li>
              <li>• Use <code className="text-yellow-400">#</code> for multi-level topic wildcards (e.g., <code className="text-yellow-400">spBv1.0/#</code>)</li>
              <li>• <span className="text-green-400">Allow</span> rules grant access, <span className="text-red-400">Deny</span> rules block access</li>
              <li>• More specific rules take precedence over general rules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
