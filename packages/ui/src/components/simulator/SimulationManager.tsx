/**
 * Simulation Manager Component
 * UI for saving, loading, and managing simulation snapshots
 * Sparkplug B Compliant - Manages bdSeq state persistence
 */

import { useState, useEffect } from 'react';
import { SimulationPersistenceService, type SimulationMetadata } from '../../services/simulationPersistence';
import { format } from 'date-fns';

interface SimulationManagerProps {
  onClose: () => void;
  onLoad: (simulationId: string) => void;
  onSave: (name: string, description?: string) => void;
  canSave: boolean;
}

export function SimulationManager({ onClose, onLoad, onSave, canSave }: SimulationManagerProps) {
  const [simulations, setSimulations] = useState<SimulationMetadata[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load simulations list
  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = () => {
    const sims = SimulationPersistenceService.getAllSimulations();
    setSimulations(sims.sort((a, b) => b.lastModified - a.lastModified));
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      alert('Veuillez entrer un nom pour la simulation');
      return;
    }

    onSave(saveName.trim(), saveDescription.trim() || undefined);
    setShowSaveDialog(false);
    setSaveName('');
    setSaveDescription('');
    loadSimulations();
  };

  const handleLoad = (id: string) => {
    onLoad(id);
    onClose();
  };

  const handleDelete = (id: string) => {
    SimulationPersistenceService.deleteSimulation(id);
    setShowDeleteConfirm(null);
    loadSimulations();
  };

  const handleExport = (id: string) => {
    SimulationPersistenceService.exportSimulation(id);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await SimulationPersistenceService.importSimulation(file);
      loadSimulations();
      alert('Simulation importée avec succès!');
    } catch (error) {
      alert('Erreur lors de l\'importation: ' + error);
    }

    // Reset input
    event.target.value = '';
  };

  const stats = SimulationPersistenceService.getStorageStats();
  const hasAutoSave = SimulationPersistenceService.hasAutoSave();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90vw] max-w-4xl h-[80vh] bg-slate-900 rounded-xl shadow-2xl border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">💾 Gestionnaire de Simulations</h2>
              <p className="text-sm text-slate-400 mt-1">
                Sauvegardez et rechargez vos simulations avec état Sparkplug B (bdSeq, seq)
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              ✕ Fermer
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-slate-850 border-b border-slate-700 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">Simulations: </span>
              <span className="text-white font-semibold">{stats.totalSimulations}</span>
            </div>
            <div>
              <span className="text-slate-400">Stockage: </span>
              <span className="text-white font-semibold">{stats.sizeFormatted}</span>
            </div>
            {hasAutoSave && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-400 text-xs">Auto-save disponible</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={!canSave}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"
            >
              💾 Sauvegarder
            </button>
            <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition-colors cursor-pointer">
              📥 Importer
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Simulations List */}
        <div className="flex-1 overflow-y-auto p-6">
          {simulations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗂️</div>
              <p className="text-slate-400 text-lg mb-2">Aucune simulation sauvegardée</p>
              <p className="text-slate-500 text-sm">
                Créez une simulation et sauvegardez-la pour la recharger plus tard
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulations.map((sim) => (
                <div
                  key={sim.id}
                  className={`bg-slate-800 rounded-lg border-2 p-4 transition-all cursor-pointer ${
                    selectedId === sim.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedId(sim.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{sim.name}</h3>
                      {sim.description && (
                        <p className="text-slate-400 text-sm mt-1">{sim.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-900 rounded px-2 py-1.5">
                      <span className="text-slate-500">Nodes:</span>
                      <span className="text-white ml-2 font-semibold">{sim.nodeCount}</span>
                    </div>
                    <div className="bg-slate-900 rounded px-2 py-1.5">
                      <span className="text-slate-500">Devices:</span>
                      <span className="text-white ml-2 font-semibold">{sim.deviceCount}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mb-3">
                    <div>Créé: {format(sim.createdAt, 'dd/MM/yyyy HH:mm')}</div>
                    <div>Modifié: {format(sim.lastModified, 'dd/MM/yyyy HH:mm')}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(sim.id);
                      }}
                      className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                    >
                      📂 Charger
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(sim.id);
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                      title="Exporter"
                    >
                      📤
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(sim.id);
                      }}
                      className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-sm transition-colors"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sparkplug B Compliance Notice */}
        <div className="px-6 py-3 bg-blue-900/20 border-t border-blue-800/30">
          <div className="flex items-start gap-3 text-sm">
            <div className="text-xl">⚡</div>
            <div>
              <div className="text-blue-300 font-semibold">Conformité Sparkplug B</div>
              <div className="text-blue-400/70 text-xs mt-1">
                Lors du chargement d'une simulation, le <strong>bdSeq</strong> est automatiquement
                incrémenté pour respecter la spécification Sparkplug B. Les séquences <strong>seq</strong> continuent
                depuis la dernière valeur sauvegardée.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-[500px]">
            <h3 className="text-xl font-bold text-white mb-4">💾 Sauvegarder la Simulation</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom de la simulation *
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex: Production Water Treatment Plant"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Décrivez cette simulation..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="bg-slate-900 rounded p-3 text-xs text-slate-400">
                <div className="font-semibold text-slate-300 mb-1">État sauvegardé :</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Configuration des nodes et devices</li>
                  <li>bdSeq actuel de chaque node (incrémenté au chargement)</li>
                  <li>Numéro de séquence (seq) actuel</li>
                  <li>État de tous les métriques</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded font-medium transition-colors"
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveName('');
                  setSaveDescription('');
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 w-[400px]">
            <h3 className="text-xl font-bold text-white mb-4">🗑️ Supprimer la Simulation</h3>
            <p className="text-slate-300 mb-6">
              Êtes-vous sûr de vouloir supprimer cette simulation ? Cette action est irréversible.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
              >
                Supprimer
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
