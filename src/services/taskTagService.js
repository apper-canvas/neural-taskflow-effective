// Task-Tag Service for task_tag2 table
const getApperClient = () => {
  const { ApperClient } = window.ApperSDK;
  return new ApperClient({
    apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
    apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
  });
};

// Table name from the provided JSON
const TABLE_NAME = 'task_tag2';

// Field names for task-tag table
const TASK_TAG_FIELDS = [
  'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
  'ModifiedOn', 'ModifiedBy', 'task_id', 'tag_id'
];

// Updateable fields (for create/update operations)
const UPDATEABLE_FIELDS = [
  'Name', 'Tags', 'Owner', 'task_id', 'tag_id'
];

// Format task-tag data from API to UI format
const formatTaskTagForUI = (taskTag) => {
  if (!taskTag) return null;
  
  return {
    id: taskTag.Id,
    taskId: taskTag.task_id,
    tagId: taskTag.tag_id,
    createdOn: taskTag.CreatedOn,
    modifiedOn: taskTag.ModifiedOn
  };
};

// Format task-tag data from UI to API format (only including updateable fields)
const formatTaskTagForAPI = (taskTag) => {
  // Create API format object
  const apiTaskTag = {
    Name: `${taskTag.taskId}-${taskTag.tagId}`,
    task_id: taskTag.taskId,
    tag_id: taskTag.tagId
  };
  
  // If it's an update operation, include the ID
  if (taskTag.id) {
    apiTaskTag.Id = taskTag.id;
  }
  
  return apiTaskTag;
};

// Fetch task-tag relationships by task ID
export const fetchTaskTags = async (taskId) => {
  try {
    const apperClient = getApperClient();
    
    // Set up query parameters
    const params = {
      fields: TASK_TAG_FIELDS,
      where: [
        {
          fieldName: "task_id",
          operator: "ExactMatch",
          values: [taskId]
        }
      ],
      pagingInfo: {
        limit: 100,
        offset: 0
      }
    };
    
    const response = await apperClient.fetchRecords(TABLE_NAME, params);
    
    if (!response || !response.data) {
      return [];
    }
    
    // Convert API format to UI format
    return response.data.map(formatTaskTagForUI);
  } catch (error) {
    console.error("Error fetching task tags:", error);
    throw error;
  }
};

// Create a new task-tag relationship
export const createTaskTag = async (taskTagData) => {
  try {
    const apperClient = getApperClient();
    
    // Format task-tag for API
    const apiTaskTag = formatTaskTagForAPI(taskTagData);
    
    // Create params with only updateable fields
    const params = {
      records: [{
        ...Object.fromEntries(
          Object.entries(apiTaskTag).filter(([key]) => 
            UPDATEABLE_FIELDS.includes(key)
          )
        )
      }]
    };
    
    const response = await apperClient.createRecord(TABLE_NAME, params);
    
    if (!response || !response.success || !response.results || !response.results[0] || !response.results[0].data) {
      throw new Error("Failed to create task-tag relationship");
    }
    
    // Return the created task-tag in UI format
    return formatTaskTagForUI(response.results[0].data);
  } catch (error) {
    console.error("Error creating task-tag relationship:", error);
    throw error;
  }
};

// Delete task-tag relationships by task ID
export const deleteTaskTagsByTaskId = async (taskId) => {
  try {
    // First fetch all task-tag relationships for this task
    const taskTags = await fetchTaskTags(taskId);
    
    if (!taskTags || taskTags.length === 0) {
      return true; // No relationships to delete
    }
    
    const apperClient = getApperClient();
    
    // Delete all found relationships
    const params = {
      RecordIds: taskTags.map(tt => tt.id)
    };
    
    const response = await apperClient.deleteRecord(TABLE_NAME, params);
    
    if (!response || !response.success) {
      throw new Error("Failed to delete task-tag relationships");
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting task-tag relationships:", error);
    throw error;
  }
};

// Update task-tag relationships for a task
export const updateTaskTags = async (taskId, tagIds) => {
  try {
    // First delete all existing relationships
    await deleteTaskTagsByTaskId(taskId);
    
    // Create new relationships
    const createdRelationships = [];
    
    for (const tagId of tagIds) {
      const newTaskTag = await createTaskTag({
        taskId: taskId,
        tagId: tagId
      });
      
      createdRelationships.push(newTaskTag);
    }
    
    return createdRelationships;
  } catch (error) {
    console.error("Error updating task-tag relationships:", error);
    throw error;
  }
};