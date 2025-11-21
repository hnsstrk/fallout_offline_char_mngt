import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../services/store';
import { ArrowLeft } from 'lucide-react';

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCharacter, loadCharacter } = useStore();

  useEffect(() => {
    if (id) {
      loadCharacter(id);
    }
  }, [id, loadCharacter]);

  if (!currentCharacter) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vault-600"></div>
      </div>
    );
  }

  const system = currentCharacter.json_data.system;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-wasteland-600 hover:text-wasteland-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Characters</span>
        </button>

        <div className="flex items-start space-x-4">
          {currentCharacter.json_data.img && (
            <img
              src={currentCharacter.json_data.img}
              alt={currentCharacter.name}
              className="w-24 h-24 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{currentCharacter.name}</h1>
            <p className="text-wasteland-600">
              Level {system.level.value} {system.origin && `• ${system.origin}`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* S.P.E.C.I.A.L. */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">S.P.E.C.I.A.L.</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(system.attributes || {}).map(([key, attr]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium uppercase text-sm">{key}</span>
                <span className="text-2xl font-bold text-vault-600">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health & Combat */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Health & Combat</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Health</span>
              <span className="font-bold">{system.health.value} / {system.health.max}</span>
            </div>
            <div className="flex justify-between">
              <span>Defense</span>
              <span className="font-bold">{system.defense.value}</span>
            </div>
            <div className="flex justify-between">
              <span>Initiative</span>
              <span className="font-bold">{system.initiative.value}</span>
            </div>
            <div className="flex justify-between">
              <span>Luck Points</span>
              <span className="font-bold">{system.luckPoints}</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Conditions</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Hunger</span>
              <span>{system.conditions.hunger}</span>
            </div>
            <div className="flex justify-between">
              <span>Thirst</span>
              <span>{system.conditions.thirst}</span>
            </div>
            <div className="flex justify-between">
              <span>Sleep</span>
              <span>{system.conditions.sleep}</span>
            </div>
            <div className="flex justify-between">
              <span>Radiation</span>
              <span>{system.radiation}</span>
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Currency & Resources</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Caps</span>
              <span className="font-bold">{system.currency.caps}</span>
            </div>
            {system.currency.other && (
              <div className="text-sm text-wasteland-600">
                {system.currency.other}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full JSON View (Debug) */}
      <div className="card mt-6">
        <h2 className="text-xl font-bold mb-4">Character Data (JSON)</h2>
        <pre className="bg-wasteland-100 p-4 rounded-lg overflow-auto text-xs max-h-96">
          {JSON.stringify(currentCharacter.json_data.system, null, 2)}
        </pre>
      </div>
    </div>
  );
}
