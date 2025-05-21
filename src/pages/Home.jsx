import { useState } from 'react'
import { motion } from 'framer-motion'
import { getIcon } from '../utils/iconUtils'
import MainFeature from '../components/MainFeature'

const MoonIcon = getIcon('moon')
const SunIcon = getIcon('sun')
const GithubIcon = getIcon('github')

const Home = ({ darkMode, toggleDarkMode }) => {
  const [activeTab, setActiveTab] = useState('all')
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800">
      <header className="border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TaskFlow
            </h1>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5 text-yellow-400" />
              ) : (
                <MoonIcon className="h-5 w-5 text-surface-600" />
              )}
            </motion.button>
            
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              aria-label="GitHub"
            >
              <GithubIcon className="h-5 w-5 text-surface-600 dark:text-surface-300" />
            </a>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            variants={itemVariants}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold mb-1 text-surface-800 dark:text-surface-100">
              Welcome to TaskFlow
            </h2>
            <p className="text-surface-600 dark:text-surface-400">
              Organize your tasks efficiently and boost your productivity
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <div className="mb-6 bg-white dark:bg-surface-800 p-4 rounded-xl shadow-soft overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                <TabButton 
                  active={activeTab === 'all'} 
                  onClick={() => setActiveTab('all')}
                  label="All Tasks"
                  iconName="list-checks"
                  count={12}
                />
                <TabButton 
                  active={activeTab === 'today'} 
                  onClick={() => setActiveTab('today')}
                  label="Today"
                  iconName="calendar-check"
                  count={5}
                />
                <TabButton 
                  active={activeTab === 'upcoming'} 
                  onClick={() => setActiveTab('upcoming')}
                  label="Upcoming"
                  iconName="calendar"
                  count={7}
                />
                <TabButton 
                  active={activeTab === 'completed'} 
                  onClick={() => setActiveTab('completed')}
                  label="Completed"
                  iconName="check-circle"
                  count={23}
                />
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <MainFeature activeTab={activeTab} />
          </motion.div>
        </motion.div>
      </main>
      
      <footer className="mt-auto py-6 border-t border-surface-200 dark:border-surface-700">
        <div className="container mx-auto px-4 text-center text-surface-500 dark:text-surface-400 text-sm">
          <p>© {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// Tab Button Component
const TabButton = ({ active, onClick, label, iconName, count }) => {
  const Icon = getIcon(iconName)
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative
        ${active 
          ? 'bg-primary/10 text-primary dark:bg-primary/20'
          : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'}
      `}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {count > 0 && (
        <span className={`
          text-xs rounded-full px-2 py-0.5
          ${active 
            ? 'bg-primary/20 text-primary-dark dark:text-primary-light' 
            : 'bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300'}
        `}>
          {count}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  )
}

export default Home