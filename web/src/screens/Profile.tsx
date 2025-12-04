import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { MapPin, Edit2, User } from 'lucide-react';
import './Profile.css';

/**
 * Profile Screen
 * Modern user profile with tabs for My Items and Settings
 */
const Profile = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'settings'>('items');

  // Mock user data
  const user = {
    name: 'tester',
    location: 'Abuja',
    bio: 'Odio sit quo rerum similique.',
    itemsCount: 4,
    tradesCount: 12,
  };

  // Mock items
  const items = [
    { id: 1, title: 'AirPod Pro', image: 'https://via.placeholder.com/300x300/990033/FFFFFF?text=AirPod+Pro' },
    { id: 2, title: 'Camera', image: 'https://via.placeholder.com/300x300/330033/FFFFFF?text=Camera' },
    { id: 3, title: 'Shoes', image: 'https://via.placeholder.com/300x300/990033/FFFFFF?text=Shoes' },
    { id: 4, title: 'Headphones', image: 'https://via.placeholder.com/300x300/330033/FFFFFF?text=Headphones' },
  ];

  return (
    <MainLayout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Scrollable Content */}
        <div className="profile-container">
          {/* Gradient Header Background */}
          <div className="profile-header-gradient">
            <div className="profile-header-content">
              {/* Avatar */}
              <div className="profile-avatar">
                <User size={48} color="#FFFFFF" strokeWidth={1.5} />
              </div>

              {/* User Name */}
              <h2 className="profile-name">{user.name}</h2>

              {/* Location */}
              <div className="profile-location">
                <MapPin size={14} color="rgba(255, 255, 255, 0.9)" />
                <span>{user.location}</span>
              </div>
            </div>
          </div>

          {/* White Content Card */}
          <div className="profile-content-card">
            {/* Stats Row */}
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-value">{user.itemsCount}</div>
                <div className="profile-stat-label">Items</div>
              </div>
              <div className="profile-stat-divider"></div>
              <div className="profile-stat">
                <div className="profile-stat-value">{user.tradesCount}</div>
                <div className="profile-stat-label">Trades</div>
              </div>
            </div>

            {/* Bio */}
            <p className="profile-bio">{user.bio}</p>

            {/* Edit Profile Button */}
            <button className="profile-edit-button" onClick={() => console.log('Edit profile')}>
              <Edit2 size={18} />
              <span>Edit Profile</span>
            </button>

            {/* Tabs */}
            <div className="profile-tabs">
              <button
                onClick={() => setActiveTab('items')}
                className={`profile-tab ${activeTab === 'items' ? 'active' : ''}`}
              >
                My Items
                {activeTab === 'items' && <div className="profile-tab-indicator" />}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
              >
                Settings
                {activeTab === 'settings' && <div className="profile-tab-indicator" />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="profile-tab-content">
              {activeTab === 'items' ? (
                <div className="profile-items-grid">
                  {items.map((item) => (
                    <div key={item.id} className="profile-item-card">
                      <div className="profile-item-image-wrapper">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="profile-item-image"
                        />
                        <div className="profile-item-overlay">
                          <span className="profile-item-view">View</span>
                        </div>
                      </div>
                      <p className="profile-item-title">{item.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-settings-placeholder">
                  <div className="settings-icon">⚙️</div>
                  <p className="settings-text">Settings content coming soon...</p>
                  <p className="settings-subtext">Manage your preferences and account settings</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;

