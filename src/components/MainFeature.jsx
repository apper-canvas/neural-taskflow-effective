import { useState, useRef, useEffect, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getIcon } from '../utils/iconUtils'
import { toast } from 'react-toastify' 
import { 
  fetchTasks, createTask, updateTask, deleteTask, toggleTaskCompletion 
} from '../services/taskService'
import { getOrCreateTags } from '../services/tagService'
import { useSelector } from 'react-redux'

import { format } from 'date-fns'

// Initialize icons
const CheckCircleIcon = getIcon('check-circle')
const CircleIcon = getIcon('circle')
const PlusIcon = getIcon('plus')
const ClockIcon = getIcon('clock')
const TagIcon = getIcon('tag')
const TrashIcon = getIcon('trash-2')
const EditIcon = getIcon('edit-3')
const SearchIcon = getIcon('search')
const XIcon = getIcon('x')
const ArrowUpIcon = getIcon('arrow-up')
const ArrowDownIcon = getIcon('arrow-down')
const FilterIcon = getIcon('filter')
const InfoIcon = getIcon('info')

// Priority badges
const PriorityBadge = ({ priority }) => {
  const getColor = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
    }
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${getColor()}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

// Task Item Component
const TaskItem = forwardRef(({ task, onToggleComplete, onDelete, onEdit }, ref) => {
  return (
    <motion.div ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        p-4 mb-3 rounded-xl transition-all
        ${task.completed 
          ? 'bg-surface-100/80 dark:bg-surface-800/50' 
          : 'bg-white dark:bg-surface-800 shadow-card'}
      `}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors
            ${task.completed
              ? 'bg-primary/10 text-primary dark:bg-primary/20'
              : 'border-2 border-surface-300 dark:border-surface-600 hover:border-primary dark:hover:border-primary'
            }`}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed ? <CheckCircleIcon className="h-5 w-5" /> : <span className="sr-only">Complete</span>}
        </button>
        
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className={`font-medium ${task.completed ? 'line-through text-surface-500 dark:text-surface-500' : 'text-surface-800 dark:text-surface-200'}`}>
              {task.title}
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              
              {task.dueDate && (
                <span className="text-xs flex items-center gap-1 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full text-surface-600 dark:text-surface-400">
                  <ClockIcon className="h-3 w-3" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
            </div>
          </div>
          
          {task.description && (
            <p className={`mt-1 text-sm ${task.completed ? 'text-surface-500 dark:text-surface-500' : 'text-surface-600 dark:text-surface-400'}`}>
              {task.description}
            </p>
          )}
          
          {task.tags && task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark dark:bg-primary/20 dark:text-primary-light"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-surface-500 hover:text-primary hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700 transition-colors"
            aria-label="Edit task"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg text-surface-500 hover:text-red-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700 transition-colors"
            aria-label="Delete task"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
)
// Task Form Component
const TaskForm = ({ onSubmit, initialTask = null, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    priority: initialTask?.priority || 'medium',
    dueDate: initialTask?.dueDate || '',
    tags: initialTask?.tags?.join(', ') || ''
  })
  
  const [errors, setErrors] = useState({})
  const titleInputRef = useRef(null)
  
  useEffect(() => {
    // Focus title input when form opens
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Process tags
    const processedTags = formData.tags
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : []
    
    // Submit the form
    onSubmit({
      ...formData,
      tags: processedTags,
      id: initialTask?.id || Date.now().toString()
    })
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="label">
          Task Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          ref={titleInputRef}
          value={formData.title}
          onChange={handleChange}
          className={`input ${errors.title ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          placeholder="What needs to be done?"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="description" className="label">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="input"
          placeholder="Add details about this task..."
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="label">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="dueDate" className="label">Due Date (Optional)</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="input"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="tags" className="label">
          Tags (Optional, comma-separated)
        </label>
        <div className="relative">
          <div className="absolute left-3 top-2.5 text-surface-400">
            <TagIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="input pl-9"
            placeholder="work, project, meeting"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {initialTask ? 'Update Task' : 'Add Task'}
        </button>
      </div>
    </form>
  )
}

// TaskFilter Component
const TaskFilter = ({ filter, onFilterChange }) => {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl shadow-card p-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-surface-400" />
          </div>
          <input
            type="text"
            value={filter.search}
            onChange={e => onFilterChange({ ...filter, search: e.target.value })}
            placeholder="Search tasks..."
            className="input pl-9"
          />
          {filter.search && (
            <button 
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-surface-600"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          <select
            value={filter.priority}
            onChange={e => onFilterChange({ ...filter, priority: e.target.value })}
            className="input py-2 pl-3 pr-8"
          >
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          <button
            onClick={() => onFilterChange({ 
              ...filter, 
              sortDirection: filter.sortDirection === 'asc' ? 'desc' : 'asc' 
            })}
            className="p-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            aria-label="Sort direction"
          >
            {filter.sortDirection === 'asc' ? (
              <ArrowUpIcon className="h-4 w-4 text-surface-600 dark:text-surface-400" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-surface-600 dark:text-surface-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Empty State Component
const EmptyState = ({ onAddNew }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
        <InfoIcon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-surface-800 dark:text-surface-200 mb-2">
        No tasks found
      </h3>
      <p className="text-surface-600 dark:text-surface-400 max-w-md mb-6">
        Get started by adding your first task or try adjusting your filters to find what you're looking for.
      </p>
      <button
        onClick={onAddNew}
        className="btn-primary flex items-center gap-2"
      >
        <PlusIcon className="h-4 w-4" />
        Add New Task
      </button>
    </div>
  )
}

// Main Feature Component
const MainFeature = ({ activeTab }) => {
  // State
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useSelector(state => state.user)
  
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState({
    search: '',
    priority: '',
    sortDirection: 'desc', // newest first
  })
  
  // Load tasks when component mounts or filters change
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Build filters based on activeTab
        const apiFilters = { ...filter }
        
        if (activeTab === 'completed') {
          apiFilters.completed = true
        } else if (activeTab === 'today') {
          apiFilters.dueDate = new Date().toISOString().split('T')[0]
        } else if (activeTab === 'upcoming') {
          // The API will handle upcoming dates in fetchTasks
        }
        
        const fetchedTasks = await fetchTasks(apiFilters)
        setTasks(fetchedTasks)
      } catch (err) {
        setError('Failed to load tasks. Please try again.')
        toast.error('Error loading tasks')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadTasks()
  }, [activeTab, filter])
  
        {loading ? (
          // Loading state
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-surface-600 dark:text-surface-300">Loading tasks...</p>
          </div>
        ) : error ? (
          // Error state
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XIcon className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
              Error Loading Tasks
            </h3>
            <p className="text-surface-600 dark:text-surface-400 max-w-md mb-6">
              {error}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.length > 0 ? (
              tasks.map(task => (
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={setEditingTask}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="empty-state"
              >
                <EmptyState onAddNew={() => setIsAddingTask(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
  const handleUpdateTask = async (updatedTask) => {
    try {
      setLoading(true)
      
      // Update task in the Apper backend
      const updated = await updateTask(updatedTask)
      
      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === updated.id ? updated : task
        )
      )
      setEditingTask(null)
      toast.success('Task updated successfully')
    } catch (err) {
      toast.error('Failed to update task')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleToggleComplete = async (taskId) => {
    try {
      setLoading(true)
      
      // Toggle task completion in the Apper backend
      const updatedTask = await toggleTaskCompletion(taskId)
      
      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? updatedTask
            : task
        )
      )
      
      toast.info(`Task marked as ${updatedTask.completed ? 'completed' : 'incomplete'}`)
    } catch (err) {
      toast.error('Failed to update task')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true)
      
      // Delete task from the Apper backend
      await deleteTask(taskId)
      
      // Update local state
      setTasks(prev => prev.filter(task => task.id !== taskId))
      toast.error('Task deleted')
    } catch (err) {
      toast.error('Failed to delete task')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
          {activeTab === 'today' && 'Today\'s Tasks'}
          {activeTab === 'upcoming' && 'Upcoming Tasks'}
          {activeTab === 'completed' && 'Completed Tasks'}
          {activeTab === 'all' && 'All Tasks'}
        </h2>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsAddingTask(true)}
          className="btn-primary flex items-center justify-center gap-2"
          disabled={isAddingTask || editingTask}
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Task</span>
        </motion.button>
      </div>
      
      {/* Task Filter */}
      <TaskFilter filter={filter} onFilterChange={setFilter} />
      
      {/* Add/Edit Task Form */}
      <AnimatePresence>
        {(isAddingTask || editingTask) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-surface-800 rounded-xl shadow-card p-4 sm:p-6 mb-6"
          >
            <h3 className="text-lg font-medium mb-4 text-surface-800 dark:text-surface-200">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <TaskForm 
              onSubmit={editingTask ? handleUpdateTask : handleAddTask}
              initialTask={editingTask}
              onCancel={() => {
                setIsAddingTask(false)
                setEditingTask(null)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Task List */}
      <div className="bg-surface-100/50 dark:bg-surface-800/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={setEditingTask}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="empty-state"
            >
              <EmptyState onAddNew={() => setIsAddingTask(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MainFeature