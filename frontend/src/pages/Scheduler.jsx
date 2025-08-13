import React, { useState, useEffect } from 'react';
import { schedulerApi } from '../services/schedulerApi';

const Scheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Form state for scheduling new posts
  const [scheduleForm, setScheduleForm] = useState({
    content: '',
    platform: 'linkedin',
    scheduled_date: '',
    scheduled_time: '',
    timezone: 'Europe/Berlin',
    title: '',
    image_url: ''
  });

  // Load scheduled posts on component mount
  useEffect(() => {
    loadScheduledPosts();
  }, [selectedStatus]);

  const loadScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await schedulerApi.getScheduledPosts(selectedStatus || null);
      setScheduledPosts(response.scheduled_posts || []);
    } catch (err) {
      setError('Fehler beim Laden der geplanten Posts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePost = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      // Validate form
      if (!scheduleForm.content || !scheduleForm.scheduled_date || !scheduleForm.scheduled_time) {
        setError('Bitte füllen Sie alle erforderlichen Felder aus.');
        return;
      }

      // Check if scheduled time is in the future
      const scheduledDateTime = new Date(`${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        setError('Der geplante Zeitpunkt muss in der Zukunft liegen.');
        return;
      }

      await schedulerApi.schedulePost({
        ...scheduleForm
      });

      setSuccess('Post erfolgreich geplant!');
      setShowScheduleForm(false);
      setScheduleForm({
        content: '',
        platform: 'linkedin',
        scheduled_date: '',
        scheduled_time: '',
        timezone: 'Europe/Berlin',
        title: '',
        image_url: ''
      });
      
      // Reload scheduled posts
      loadScheduledPosts();
    } catch (err) {
      setError('Fehler beim Planen des Posts: ' + err.message);
    }
  };

  const handleCancelPost = async (postId) => {
    try {
      setError('');
      setSuccess('');
      
      await schedulerApi.cancelScheduledPost(postId);
      setSuccess('Geplanter Post erfolgreich storniert!');
      
      // Reload scheduled posts
      loadScheduledPosts();
    } catch (err) {
      setError('Fehler beim Stornieren des Posts: ' + err.message);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Geplant' },
      published: { color: 'bg-green-100 text-green-800', text: 'Veröffentlicht' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Fehlgeschlagen' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Storniert' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Get minimum date (today) for date input
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum time for today
  const getMinTime = () => {
    if (scheduleForm.scheduled_date === getMinDate()) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes() + 1).padStart(2, '0'); // Add 1 minute buffer
      return `${hours}:${minutes}`;
    }
    return '00:00';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post-Planer</h1>
        <p className="text-gray-600">Planen Sie Ihre LinkedIn-Posts für bestimmte Zeiten</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowScheduleForm(!showScheduleForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showScheduleForm ? 'Formular schließen' : 'Neuen Post planen'}
        </button>
        
        <button
          onClick={loadScheduledPosts}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Aktualisieren
        </button>
      </div>

      {/* Schedule Form */}
      {showScheduleForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Neuen Post planen</h2>
          
          <form onSubmit={handleSchedulePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel (optional)
              </label>
              <input
                type="text"
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Post-Titel..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inhalt *
              </label>
              <textarea
                value={scheduleForm.content}
                onChange={(e) => setScheduleForm({...scheduleForm, content: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Post-Inhalt..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bild-URL (optional)
              </label>
              <input
                type="url"
                value={scheduleForm.image_url}
                onChange={(e) => setScheduleForm({...scheduleForm, image_url: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plattform *
                </label>
                <select
                  value={scheduleForm.platform}
                  onChange={(e) => setScheduleForm({...scheduleForm, platform: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="linkedin">LinkedIn</option>
                  {/* Add more platforms later */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zeitzone
                </label>
                <select
                  value={scheduleForm.timezone}
                  onChange={(e) => setScheduleForm({...scheduleForm, timezone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Europe/Berlin">Europa/Berlin</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Amerika/New York</option>
                  <option value="America/Los_Angeles">Amerika/Los Angeles</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum *
                </label>
                <input
                  type="date"
                  value={scheduleForm.scheduled_date}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                  min={getMinDate()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uhrzeit *
                </label>
                <input
                  type="time"
                  value={scheduleForm.scheduled_time}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                  min={getMinTime()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post planen
              </button>
              
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nach Status filtern:
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Alle Status</option>
          <option value="scheduled">Geplant</option>
          <option value="published">Veröffentlicht</option>
          <option value="failed">Fehlgeschlagen</option>
          <option value="cancelled">Storniert</option>
        </select>
      </div>

      {/* Scheduled Posts List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Geplante Posts</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Lade geplante Posts...</p>
          </div>
        ) : scheduledPosts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Keine geplanten Posts gefunden.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    {post.title && (
                      <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                    )}
                    <p className="text-gray-600 mb-2 line-clamp-3">{post.content}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {formatDateTime(post.scheduled_time)}</span>
                      <span>🌐 {post.platform}</span>
                      <span>🌍 {post.timezone}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end gap-2">
                    {getStatusBadge(post.status)}
                    
                    {post.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancelPost(post.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Stornieren
                      </button>
                    )}
                  </div>
                </div>

                {post.generated_image_url && (
                  <div className="mt-3">
                    <img
                      src={post.generated_image_url}
                      alt="Post Bild"
                      className="max-w-xs rounded-lg border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {post.error_message && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <strong>Fehler:</strong> {post.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduler;

