import React, { useState } from 'react';
import { generatePlannerIdeas } from '../services/plannerApi';
import { generatePost } from '../services/api';

const Planner = () => {
  // State management
  const [mode, setMode] = useState('url'); // 'url' or 'idea'
  const [urls, setUrls] = useState('');
  const [idea, setIdea] = useState('');
  const [persona, setPersona] = useState('');
  const [channels, setChannels] = useState(['LI']);
  const [limit, setLimit] = useState(10);
  
  const [ideas, setIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPosts, setIsCreatingPosts] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [error, setError] = useState('');

  // Available channels
  const availableChannels = [
    { id: 'LI', name: 'LinkedIn', color: 'bg-blue-500' },
    { id: 'FB', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'IG', name: 'Instagram', color: 'bg-pink-500' },
    { id: 'X', name: 'X (Twitter)', color: 'bg-gray-800' }
  ];

  // Handle channel selection
  const toggleChannel = (channelId) => {
    setChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
  };

  // Handle idea selection
  const toggleIdeaSelection = (ideaId) => {
    setSelectedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
      } else {
        newSet.add(ideaId);
      }
      return newSet;
    });
  };

  // Generate ideas
  const handleGenerateIdeas = async () => {
    setError('');
    setWarnings([]);
    setIdeas([]);
    setSelectedIdeas(new Set());

    // Validation
    if (mode === 'url') {
      const urlList = urls.trim().split('\n').filter(url => url.trim());
      if (urlList.length === 0) {
        setError('Bitte geben Sie mindestens eine URL ein.');
        return;
      }
      if (urlList.length > 3) {
        setError('Maximal 3 URLs sind erlaubt.');
        return;
      }
    } else if (mode === 'idea') {
      if (!idea.trim()) {
        setError('Bitte geben Sie eine Idee ein.');
        return;
      }
      if (idea.trim().length < 5) {
        setError('Die Idee muss mindestens 5 Zeichen lang sein.');
        return;
      }
    }

    if (channels.length === 0) {
      setError('Bitte wählen Sie mindestens einen Kanal aus.');
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        mode,
        limit,
        persona: persona.trim() || undefined,
        channels
      };

      if (mode === 'url') {
        payload.urls = urls.trim().split('\n').filter(url => url.trim());
      } else {
        payload.idea = idea.trim();
      }

      const result = await generatePlannerIdeas(payload);
      
      setIdeas(result.ideas || []);
      setWarnings(result.warnings || []);

      if (result.ideas && result.ideas.length === 0) {
        setError('Keine Ideen generiert. Bitte versuchen Sie es erneut.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Create posts from selected ideas
  const handleCreatePosts = async () => {
    if (selectedIdeas.size === 0) {
      setError('Bitte wählen Sie mindestens eine Idee aus.');
      return;
    }

    setIsCreatingPosts(true);
    setError('');

    try {
      const selectedIdeaObjects = ideas.filter(idea => selectedIdeas.has(idea.id));
      const createdPosts = [];

      for (const selectedIdea of selectedIdeaObjects) {
        try {
          // Create prompt for post generation
          const prompt = `Erstelle einen Social-Media-Post basierend auf: ${selectedIdea.title} – ${selectedIdea.hook}. Persona: ${selectedIdea.persona}. Funnel: ${selectedIdea.funnel}. Kanal(e): ${selectedIdea.channels.join(', ')}. Nutze klaren Hook→Nutzen→CTA.`;
          
          // Generate post using existing API
          const postData = await generatePost({
            prompt: prompt,
            channels: selectedIdea.channels.includes('LI') ? ['linkedin'] : ['facebook'], // Map to existing channel format
            generateImage: true
          });

          createdPosts.push(postData);
        } catch (err) {
          console.error(`Error creating post for idea ${selectedIdea.id}:`, err);
        }
      }

      if (createdPosts.length > 0) {
        // Navigate to posts page or show success message
        alert(`${createdPosts.length} Beiträge erfolgreich erstellt! Sie finden sie in der Beiträge-Übersicht.`);
        
        // Reset selections
        setSelectedIdeas(new Set());
      } else {
        setError('Fehler beim Erstellen der Beiträge. Bitte versuchen Sie es erneut.');
      }

    } catch (err) {
      setError(`Fehler beim Erstellen der Beiträge: ${err.message}`);
    } finally {
      setIsCreatingPosts(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content-Planner</h1>
          <p className="text-gray-600">
            Generieren Sie Ideen aus URLs oder eigenen Eingaben und erstellen Sie daraus direkt Social Media Posts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Ideen generieren</h2>

            {/* Mode Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Modus</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setMode('url')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Aus URL(s)
                </button>
                <button
                  onClick={() => setMode('idea')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'idea'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Aus Idee
                </button>
              </div>
            </div>

            {/* URL Input */}
            {mode === 'url' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URLs (max. 3, eine pro Zeile)
                </label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://www.greven.de&#10;https://www.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            )}

            {/* Idea Input */}
            {mode === 'idea' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ihre Idee
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Stärke lokale Sichtbarkeit in Köln"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            )}

            {/* Persona Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persona (optional)
              </label>
              <input
                type="text"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Inhaber:in KMU Köln"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Channels Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Kanäle
              </label>
              <div className="flex flex-wrap gap-2">
                {availableChannels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      channels.includes(channel.id)
                        ? `${channel.color} text-white`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {channel.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anzahl Ideen
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 Ideen</option>
                <option value={10}>10 Ideen</option>
                <option value={15}>15 Ideen</option>
                <option value={20}>20 Ideen</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateIdeas}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generiere Ideen...' : `${limit} Themen generieren`}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Warnings Display */}
            {warnings.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700 text-sm font-medium mb-1">Warnungen:</p>
                {warnings.map((warning, index) => (
                  <p key={index} className="text-yellow-700 text-sm">• {warning}</p>
                ))}
              </div>
            )}
          </div>

          {/* Ideas Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Generierte Ideen ({ideas.length})
              </h2>
              {ideas.length > 0 && (
                <button
                  onClick={handleCreatePosts}
                  disabled={selectedIdeas.size === 0 || isCreatingPosts}
                  className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingPosts 
                    ? 'Erstelle Beiträge...' 
                    : `Beiträge erstellen (${selectedIdeas.size})`
                  }
                </button>
              )}
            </div>

            {/* Ideas List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {ideas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Noch keine Ideen generiert.</p>
                  <p className="text-sm mt-1">Verwenden Sie das Formular links, um Ideen zu erstellen.</p>
                </div>
              ) : (
                ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedIdeas.has(idea.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleIdeaSelection(idea.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{idea.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{idea.hook}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {idea.persona}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {idea.funnel}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {idea.channels.map(channel => {
                            const channelInfo = availableChannels.find(c => c.id === channel);
                            return (
                              <span
                                key={channel}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${channelInfo?.color || 'bg-gray-500'}`}
                              >
                                {channelInfo?.name || channel}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="ml-3">
                        <input
                          type="checkbox"
                          checked={selectedIdeas.has(idea.id)}
                          onChange={() => toggleIdeaSelection(idea.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Channel Limits Info */}
            {ideas.length > 0 && (
              <div className="mt-6 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 font-medium mb-1">Zeichenlimits:</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• LinkedIn: 3.000 Zeichen</p>
                  <p>• Facebook/Instagram: 2.200 Zeichen</p>
                  <p>• X (Twitter): 280 Zeichen</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planner;

