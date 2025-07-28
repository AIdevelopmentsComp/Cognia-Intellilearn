'use client'
import { useState } from 'react'
import Image from 'next/image'
import { FaUser, FaCog, FaShieldAlt, FaBell, FaChartLine, FaLock, FaLanguage, FaPalette, FaSave, FaCheck, FaCamera, FaEdit, FaGlobe, FaThumbsUp } from 'react-icons/fa'

type TabType = 'personal' | 'preferences' | 'privacy' | 'notifications'

const Profile = () => {
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  
  // User example data
  const user = {
    name: 'Luis Arturo',
    email: 'luis.arturo@example.com',
    avatar: '/assets/images/Image.svg',
    country: 'México',
    profession: 'Student',
    interests: ['Machine Learning', 'Web Development', 'Data Science'],
    language: 'es',
    theme: 'light',
    emailNotifications: true,
    pushNotifications: false,
    progressUpdates: true,
    newsletterUpdates: false,
    dataSharing: 'minimal',
    coursesCompleted: 12,
    hoursLearned: 245,
    certificatesEarned: 8,
    currentStreak: 15
  }
  
  // Function to save changes
  const saveChanges = () => {
    setSuccessMessage('Changes saved successfully')
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }
  
  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#132944] mb-2">Profile</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="mb-6 neuro-card p-4 rounded-xl bg-green-50 border border-green-100">
          <div className="flex items-center text-green-800">
            <FaCheck className="mr-3 text-green-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      
      {/* Main profile container */}
      <div className="neuro-card rounded-2xl overflow-hidden">
        {/* Profile header with user info */}
        <div className="relative bg-gradient-to-br from-[#8b5cf6] via-[#6366f1] to-[#3b82f6] p-8 text-white">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Avatar section */}
            <div className="relative group">
              <div className="relative w-32 h-32 rounded-full overflow-hidden neuro-inset-white border-4 border-white/20">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <button className="absolute bottom-2 right-2 neuro-button-enhanced bg-white text-[#8b5cf6] p-2 rounded-full hover:shadow-lg transition-all duration-300">
                <FaCamera className="text-sm" />
              </button>
            </div>
            
            {/* User info */}
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
              <p className="text-white/90 text-lg mb-4">{user.email}</p>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
                <span className="neuro-badge bg-white/20 text-white px-4 py-2 rounded-full font-medium">
                  <FaGlobe className="inline mr-2" />
                  {user.country}
                </span>
                <span className="neuro-badge bg-white/20 text-white px-4 py-2 rounded-full font-medium">
                  <FaUser className="inline mr-2" />
                  {user.profession}
                </span>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="neuro-card-white p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-[#8b5cf6]">{user.coursesCompleted}</div>
                  <div className="text-sm text-gray-600">Courses</div>
                </div>
                <div className="neuro-card-white p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-[#10b981]">{user.hoursLearned}</div>
                  <div className="text-sm text-gray-600">Hours</div>
                </div>
                <div className="neuro-card-white p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-[#f59e0b]">{user.certificatesEarned}</div>
                  <div className="text-sm text-gray-600">Certificates</div>
                </div>
                <div className="neuro-card-white p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-[#ef4444]">{user.currentStreak}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="neuro-inset">
          <div className="flex overflow-x-auto">
            <button
              className={`py-4 px-6 text-sm font-medium transition-all duration-300 ${
                activeTab === 'personal' 
                  ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-white/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
              }`}
              onClick={() => setActiveTab('personal')}
            >
              <FaUser className="inline mr-2" /> Personal Information
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium transition-all duration-300 ${
                activeTab === 'preferences' 
                  ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-white/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
              }`}
              onClick={() => setActiveTab('preferences')}
            >
              <FaCog className="inline mr-2" /> Preferences
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium transition-all duration-300 ${
                activeTab === 'privacy' 
                  ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-white/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
              }`}
              onClick={() => setActiveTab('privacy')}
            >
              <FaShieldAlt className="inline mr-2" /> Privacy
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium transition-all duration-300 ${
                activeTab === 'notifications' 
                  ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-white/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell className="inline mr-2" /> Notifications
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="p-8">
          {/* Personal Information */}
          {activeTab === 'personal' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#132944]">Personal Information</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="neuro-button-enhanced bg-[#8b5cf6] text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  <FaEdit className="mr-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="neuro-card p-6 rounded-xl">
                  <label className="block text-sm font-semibold text-[#132944] mb-3">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={user.name}
                    disabled={!isEditing}
                    className="neuro-input w-full px-4 py-3 rounded-xl text-gray-700 disabled:opacity-70"
                  />
                </div>
                
                <div className="neuro-card p-6 rounded-xl">
                  <label className="block text-sm font-semibold text-[#132944] mb-3">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={user.email}
                    disabled={!isEditing}
                    className="neuro-input w-full px-4 py-3 rounded-xl text-gray-700 disabled:opacity-70"
                  />
                </div>
                
                <div className="neuro-card p-6 rounded-xl">
                  <label className="block text-sm font-semibold text-[#132944] mb-3">Country</label>
                  <select 
                    defaultValue={user.country}
                    disabled={!isEditing}
                    className="neuro-input w-full px-4 py-3 rounded-xl text-gray-700 disabled:opacity-70"
                  >
                    <option value="México">México</option>
                    <option value="España">España</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                  </select>
                </div>
                
                <div className="neuro-card p-6 rounded-xl">
                  <label className="block text-sm font-semibold text-[#132944] mb-3">Profession</label>
                  <input 
                    type="text" 
                    defaultValue={user.profession}
                    disabled={!isEditing}
                    className="neuro-input w-full px-4 py-3 rounded-xl text-gray-700 disabled:opacity-70"
                  />
                </div>
              </div>
              
              <div className="neuro-card p-6 rounded-xl">
                <label className="block text-sm font-semibold text-[#132944] mb-4">Interests</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {['Machine Learning', 'Web Development', 'Data Science', 'UX/UI', 'Cloud Computing', 'Cybersecurity'].map((interest) => (
                    <div key={interest} className="flex items-center neuro-inset p-3 rounded-lg">
                      <input
                        type="checkbox"
                        id={`interest-${interest}`}
                        defaultChecked={user.interests.includes(interest)}
                        disabled={!isEditing}
                        className="h-4 w-4 text-[#8b5cf6] focus:ring-[#8b5cf6] border-gray-300 rounded disabled:opacity-70"
                      />
                      <label htmlFor={`interest-${interest}`} className="ml-3 text-sm text-gray-700 font-medium">
                        {interest}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {isEditing && (
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="neuro-button px-6 py-3 rounded-xl text-gray-600 hover:shadow-lg transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    className="neuro-button-enhanced bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <FaSave className="mr-2" /> Save Changes
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-[#132944] mb-6">Preferences</h3>
              
              <div className="neuro-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-[#132944] flex items-center mb-4">
                  <FaLanguage className="mr-3 text-[#8b5cf6]" /> Language
                </h4>
                <p className="text-gray-600 mb-4">Select your preferred platform language</p>
                <select 
                  defaultValue={user.language}
                  className="neuro-input px-4 py-3 rounded-xl text-gray-700 max-w-xs"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              
              <div className="neuro-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-[#132944] flex items-center mb-4">
                  <FaPalette className="mr-3 text-[#8b5cf6]" /> Theme
                </h4>
                <p className="text-gray-600 mb-4">Customize the platform appearance</p>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  <div className={`neuro-card p-4 rounded-xl cursor-pointer transition-all duration-300 ${user.theme === 'light' ? 'ring-2 ring-[#8b5cf6]' : ''}`}>
                    <div className="h-12 bg-white neuro-inset rounded-lg mb-3"></div>
                    <p className="text-sm font-medium text-center text-gray-700">Light</p>
                  </div>
                  <div className={`neuro-card p-4 rounded-xl cursor-pointer transition-all duration-300 ${user.theme === 'dark' ? 'ring-2 ring-[#8b5cf6]' : ''}`}>
                    <div className="h-12 bg-gray-800 rounded-lg mb-3"></div>
                    <p className="text-sm font-medium text-center text-gray-700">Dark</p>
                  </div>
                  <div className={`neuro-card p-4 rounded-xl cursor-pointer transition-all duration-300 ${user.theme === 'system' ? 'ring-2 ring-[#8b5cf6]' : ''}`}>
                    <div className="h-12 bg-gradient-to-r from-white to-gray-800 rounded-lg mb-3"></div>
                    <p className="text-sm font-medium text-center text-gray-700">System</p>
                  </div>
                </div>
              </div>
              
              <div className="neuro-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-[#132944] flex items-center mb-4">
                  <FaChartLine className="mr-3 text-[#8b5cf6]" /> Learning Progress
                </h4>
                <p className="text-gray-600 mb-4">Configure how your progress is measured</p>
                <div className="space-y-3">
                  {[
                    { id: 'time', label: 'Based on study time', checked: true },
                    { id: 'completion', label: 'Based on completed lessons', checked: false },
                    { id: 'score', label: 'Based on obtained scores', checked: false }
                  ].map((option) => (
                    <div key={option.id} className="flex items-center neuro-inset p-4 rounded-lg">
                      <input
                        type="radio"
                        id={`progress-${option.id}`}
                        name="progress-type"
                        defaultChecked={option.checked}
                        className="h-4 w-4 text-[#8b5cf6] focus:ring-[#8b5cf6] border-gray-300"
                      />
                      <label htmlFor={`progress-${option.id}`} className="ml-3 text-sm font-medium text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveChanges}
                  className="neuro-button-enhanced bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  <FaSave className="mr-2" /> Save Changes
                </button>
              </div>
            </div>
          )}
          
          {/* Privacy */}
          {activeTab === 'privacy' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-[#132944] mb-6">Privacy & Security</h3>
              
              <div className="neuro-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-[#132944] flex items-center mb-4">
                  <FaLock className="mr-3 text-[#8b5cf6]" /> Security
                </h4>
                <p className="text-gray-600 mb-4">Manage your password and security options</p>
                <button className="neuro-button px-4 py-2 rounded-xl text-gray-700 hover:shadow-lg transition-all duration-300">
                  Change Password
                </button>
              </div>
              
              <div className="neuro-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-[#132944] flex items-center mb-4">
                  <FaShieldAlt className="mr-3 text-[#8b5cf6]" /> Data Privacy
                </h4>
                <p className="text-gray-600 mb-6">Configure how your learning data is shared</p>
                
                <div className="space-y-4">
                  {[
                    { 
                      id: 'minimal', 
                      title: 'Minimal', 
                      description: 'Only essential data is collected for service functionality.',
                      checked: user.dataSharing === 'minimal'
                    },
                    { 
                      id: 'moderate', 
                      title: 'Moderate', 
                      description: 'Includes data to improve your personalized learning experience.',
                      checked: user.dataSharing === 'moderate'
                    },
                    { 
                      id: 'full', 
                      title: 'Complete', 
                      description: 'Allows use of all your data to improve the platform and personalized experience.',
                      checked: user.dataSharing === 'full'
                    }
                  ].map((option) => (
                    <div key={option.id} className="neuro-inset p-4 rounded-lg">
                      <div className="flex items-start">
                        <input
                          type="radio"
                          id={`data-${option.id}`}
                          name="data-sharing"
                          defaultChecked={option.checked}
                          className="mt-1 h-4 w-4 text-[#8b5cf6] focus:ring-[#8b5cf6] border-gray-300"
                        />
                        <div className="ml-3">
                          <label htmlFor={`data-${option.id}`} className="font-semibold text-[#132944]">{option.title}</label>
                          <p className="text-gray-600 text-sm mt-1">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="neuro-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-[#132944] mb-4">Download Your Data</h4>
                <p className="text-gray-600 mb-4">Get a copy of your personal and learning data</p>
                <button className="neuro-button px-4 py-2 rounded-xl text-gray-700 hover:shadow-lg transition-all duration-300">
                  Request My Data
                </button>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveChanges}
                  className="neuro-button-enhanced bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  <FaSave className="mr-2" /> Save Changes
                </button>
              </div>
            </div>
          )}
          
          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-[#132944] mb-6">Notifications</h3>
              <p className="text-gray-600 mb-8">Configure what notifications you want to receive and how.</p>
              
              <div className="neuro-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-[#132944] mb-6 flex items-center">
                  <FaBell className="mr-3 text-[#8b5cf6]" />
                  Email Notifications
                </h4>
                <div className="space-y-4">
                  {[
                    {
                      id: 'courses',
                      title: 'Course Updates',
                      description: 'Notifications about new content in your courses',
                      checked: user.emailNotifications
                    },
                    {
                      id: 'progress',
                      title: 'Progress Reminders',
                      description: 'Reminders to continue with your studies',
                      checked: user.progressUpdates
                    },
                    {
                      id: 'newsletter',
                      title: 'Newsletter',
                      description: 'News, tips and special offers',
                      checked: user.newsletterUpdates
                    }
                  ].map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between neuro-inset p-4 rounded-lg">
                      <div>
                        <p className="font-medium text-[#132944]">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.description}</p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          id={`email-${notification.id}`}
                          defaultChecked={notification.checked}
                          className="sr-only"
                        />
                        <label
                          htmlFor={`email-${notification.id}`}
                          className={`block w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ${
                            notification.checked ? 'bg-[#8b5cf6]' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                            notification.checked ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`}></span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="neuro-card p-6 rounded-xl">
                <h4 className="text-lg font-semibold text-[#132944] mb-6 flex items-center">
                  <FaThumbsUp className="mr-3 text-[#8b5cf6]" />
                  Push Notifications
                </h4>
                <div className="flex items-center justify-between neuro-inset p-4 rounded-lg">
                  <div>
                    <p className="font-medium text-[#132944]">Enable Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive alerts on your device</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="push-active"
                      defaultChecked={user.pushNotifications}
                      className="sr-only"
                    />
                    <label
                      htmlFor="push-active"
                      className={`block w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ${
                        user.pushNotifications ? 'bg-[#8b5cf6]' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        user.pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={saveChanges}
                  className="neuro-button-enhanced bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  <FaSave className="mr-2" /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile