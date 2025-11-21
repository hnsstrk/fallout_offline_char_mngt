import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../services/store';
import { Upload } from 'lucide-react';

export default function DashboardPage() {
  const { characters, isLoadingCharacters, loadCharacters } = useStore();

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  if (isLoadingCharacters) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vault-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">My Characters</h1>
        <button className="btn-primary flex items-center space-x-2">
          <Upload size={18} />
          <span>Import Character</span>
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-wasteland-600 text-lg mb-4">No characters yet</p>
          <p className="text-wasteland-500 mb-6">
            Import your first character from FoundryVTT to get started
          </p>
          <button className="btn-primary">
            Import Character
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <Link
              key={character.id}
              to={`/characters/${character.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start space-x-4">
                {character.json_data.img && (
                  <img
                    src={character.json_data.img}
                    alt={character.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{character.name}</h3>
                  <p className="text-sm text-wasteland-600">
                    Level {character.json_data.system?.level?.value || 1}
                  </p>
                  {character.json_data.system?.origin && (
                    <p className="text-xs text-wasteland-500 truncate">
                      {character.json_data.system.origin}
                    </p>
                  )}
                  <p className="text-xs text-wasteland-400 mt-2">
                    {new Date(character.last_modified).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
