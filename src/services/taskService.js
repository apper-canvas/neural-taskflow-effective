// Task Service for task32 table
const getApperClient = () => {
  const { ApperClient } = window.ApperSDK;
  return new ApperClient({
    apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
    apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
  });
};

// Table name from the provided JSON
const TABLE_NAME = 'task32';

// Field names for task table
const TASK_FIELDS = [
  'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
  'ModifiedOn', 'ModifiedBy', 'title', 'description', 
  'completed', 'priority', 'dueDate'
];

// Updateable fields (for create/update operations)
const UPDATEABLE_FIELDS = [
  'Name', 'Tags', 'Owner', 'title', 'description', 
  'completed', 'priority', 'dueDate'
];

// Format task data from API to UI format
const formatTaskForUI = (task) => {
  if (!task) return null;
  
  return {
    id: task.Id,
    title: task.title || task.Name, // Fallback to Name if title is not available
    description: task.description || '',
    completed: task.completed || false,
    priority: task.priority || 'medium',
    dueDate: task.dueDate || '',
    tags: task.Tags ? task.Tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
    createdOn: task.CreatedOn,
    modifiedOn: task.ModifiedOn
  };
};

// Format task data from UI to API format (only including updateable fields)
const formatTaskForAPI = (task) => {
  // Process tags to be comma-separated
  const tags = Array.isArray(task.tags) ? task.tags.join(',') : task.tags;
  
  // Create API format object
  const apiTask = {
    Name: task.title, // Use title as Name for consistency
    Tags: tags,
    title: task.title,
    description: task.description || '',
    completed: !!task.completed,
    priority: task.priority || 'medium',
    dueDate: task.dueDate || ''
  };
  
  // If it's an update operation, include the ID
  if (task.id) {
    apiTask.Id = task.id;
  }
  
  return apiTask;
};

// Fetch all tasks with optional filtering
export const fetchTasks = async (filters = {}) => {
  try {
    const apperClient = getApperClient();
    
    // Set up query parameters
    const params = {
      fields: TASK_FIELDS,
      orderBy: [
        {
          field: "ModifiedOn",
          direction: filters.sortDirection || "desc"
        }
      ],
      pagingInfo: {
        limit: filters.limit || 100,
        offset: filters.offset || 0
      }
    };
    
    // Add where conditions for filtering
    const whereConditions = [];
    
    // Filter by completed status if specified
    if (filters.completed !== undefined) {
      whereConditions.push({
        fieldName: "completed",
        operator: "ExactMatch",
        values: [filters.completed]
      });
    }
    
    // Filter by search text
    if (filters.search) {
      whereConditions.push({
        fieldName: "title",
        operator: "Contains",
        values: [filters.search]
      });
    }
    
    // Filter by priority
    if (filters.priority) {
      whereConditions.push({
        fieldName: "priority",
        operator: "ExactMatch",
        values: [filters.priority]
      });
    }
    
    // Filter by due date
    if (filters.dueDate) {
      whereConditions.push({
        fieldName: "dueDate",
        operator: "ExactMatch",
        values: [filters.dueDate]
      });
    }
    
    // Add where conditions to params if any exist
    if (whereConditions.length > 0) {
      params.where = whereConditions;
    }
    
    const response = await apperClient.fetchRecords(TABLE_NAME, params);
    
    if (!response || !response.data) {
      return [];
    }
    
    // Convert API format to UI format
    return response.data.map(formatTaskForUI);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

// Create a new task
export const createTask = async (taskData) => {
  try {
    const apperClient = getApperClient();
    
    // Format task for API
    const apiTask = formatTaskForAPI(taskData);
    
    // Create params with only updateable fields
    const params = {
      records: [{
        ...Object.fromEntries(
          Object.entries(apiTask).filter(([key]) => 
            UPDATEABLE_FIELDS.includes(key)
          )
        )
      }]
    };
    
    const response = await apperClient.createRecord(TABLE_NAME, params);
    
    if (!response || !response.success || !response.results || !response.results[0] || !response.results[0].data) {
      throw new Error("Failed to create task");
    }
    
    // Return the created task in UI format
    return formatTaskForUI(response.results[0].data);
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (taskData) => {
  try {
    if (!taskData.id) {
      throw new Error("Task ID is required for updates");
    }
    
    const apperClient = getApperClient();
    
    // Format task for API
    const apiTask = formatTaskForAPI(taskData);
    
    // Create params with only updateable fields plus Id
    const params = {
      records: [{
        Id: apiTask.Id,
        ...Object.fromEntries(
          Object.entries(apiTask).filter(([key]) => 
            UPDATEABLE_FIELDS.includes(key)
          )
        )
      }]
    };
    
    const response = await apperClient.updateRecord(TABLE_NAME, params);
    
    if (!response || !response.success || !response.results || !response.results[0] || !response.results[0].data) {
      throw new Error("Failed to update task");
    }
    
    // Return the updated task in UI format
    return formatTaskForUI(response.results[0].data);
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    if (!taskId) {
      throw new Error("Task ID is required for deletion");
    }
    
    const apperClient = getApperClient();
    
    const params = {
      RecordIds: [taskId]
    };
    
    const response = await apperClient.deleteRecord(TABLE_NAME, params);
    
    if (!response || !response.success) {
      throw new Error("Failed to delete task");
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// Toggle a task's completed status
export const toggleTaskCompletion = async (taskId) => {
  try {
    if (!taskId) {
      throw new Error("Task ID is required");
    }
    
    const apperClient = getApperClient();
    
    // First fetch the current task to get its completion status
    const params = {
      fields: TASK_FIELDS,
      where: [
        {
          fieldName: "Id",
          operator: "ExactMatch",
          values: [taskId]
        }
      ]
    };
    
    const response = await apperClient.fetchRecords(TABLE_NAME, params);
    
    if (!response || !response.data || !response.data[0]) {
      throw new Error("Task not found");
    }
    
    const task = response.data[0];
    const newCompletionStatus = !task.completed;
    
    // Now update the task with the toggled completion status
    const updateParams = {
      records: [{
        Id: taskId,
        completed: newCompletionStatus
      }]
    };
    
    const updateResponse = await apperClient.updateRecord(TABLE_NAME, updateParams);
    
    if (!updateResponse || !updateResponse.success) {
      throw new Error("Failed to update task completion status");
    }
    
    // Return the updated task in UI format
    return formatTaskForUI(updateResponse.results[0].data);
  } catch (error) {
    console.error("Error toggling task completion:", error);
    throw error;
  }
};

// Get task counts by status (for tabs display)
export const getTaskCounts = async () => {
  try {
    const apperClient = getApperClient();
    
    // Get current date for "today" filter
    const today = new Date().toISOString().split('T')[0];
    
    // Get all tasks (we'll filter them client-side for simplicity)
    const params = {
      fields: ['Id', 'completed', 'dueDate'],
      pagingInfo: {
        limit: 1000 // Fetch a high limit to get all tasks
      }
    };
    
    const response = await apperClient.fetchRecords(TABLE_NAME, params);
    
    if (!response || !response.data) {
      return {
        all: 0,
        completed: 0,
        today: 0,
        upcoming: 0
      };
    }
    
    const tasks = response.data;
    
    // Calculate counts
    const counts = {
      all: tasks.length,
      completed: tasks.filter(task => task.completed).length,
      today: tasks.filter(task => task.dueDate === today).length,
      upcoming: tasks.filter(task => task.dueDate && task.dueDate > today).length
    };
    
    return counts;
  } catch (error) {
    console.error("Error getting task counts:", error);
    return {
      all: 0,
      completed: 0,
      today: 0,
      upcoming: 0
    };
  }
};