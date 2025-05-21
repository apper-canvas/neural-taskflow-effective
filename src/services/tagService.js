// Tag Service for tag1 table
const getApperClient = () => {
  const { ApperClient } = window.ApperSDK;
  return new ApperClient({
    apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
    apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
  });
};

// Table name from the provided JSON
const TABLE_NAME = 'tag1';

// Field names for tag table
const TAG_FIELDS = [
  'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
  'ModifiedOn', 'ModifiedBy'
];

// Updateable fields (for create/update operations)
const UPDATEABLE_FIELDS = [
  'Name', 'Tags', 'Owner'
];

// Format tag data from API to UI format
const formatTagForUI = (tag) => {
  if (!tag) return null;
  
  return {
    id: tag.Id,
    name: tag.Name,
    tags: tag.Tags ? tag.Tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [],
    createdOn: tag.CreatedOn,
    modifiedOn: tag.ModifiedOn
  };
};

// Format tag data from UI to API format (only including updateable fields)
const formatTagForAPI = (tag) => {
  // Process tags to be comma-separated
  const tags = Array.isArray(tag.tags) ? tag.tags.join(',') : tag.tags;
  
  // Create API format object
  const apiTag = {
    Name: tag.name,
    Tags: tags
  };
  
  // If it's an update operation, include the ID
  if (tag.id) {
    apiTag.Id = tag.id;
  }
  
  return apiTag;
};

// Fetch all tags
export const fetchTags = async () => {
  try {
    const apperClient = getApperClient();
    
    // Set up query parameters
    const params = {
      fields: TAG_FIELDS,
      orderBy: [
        {
          field: "Name",
          direction: "asc"
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
    return response.data.map(formatTagForUI);
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
};

// Create a new tag
export const createTag = async (tagData) => {
  try {
    const apperClient = getApperClient();
    
    // Format tag for API
    const apiTag = formatTagForAPI(tagData);
    
    // Create params with only updateable fields
    const params = {
      records: [{
        ...Object.fromEntries(
          Object.entries(apiTag).filter(([key]) => 
            UPDATEABLE_FIELDS.includes(key)
          )
        )
      }]
    };
    
    const response = await apperClient.createRecord(TABLE_NAME, params);
    
    if (!response || !response.success || !response.results || !response.results[0] || !response.results[0].data) {
      throw new Error("Failed to create tag");
    }
    
    // Return the created tag in UI format
    return formatTagForUI(response.results[0].data);
  } catch (error) {
    console.error("Error creating tag:", error);
    throw error;
  }
};

// Get existing tags or create new ones based on names
export const getOrCreateTags = async (tagNames) => {
  try {
    if (!tagNames || !tagNames.length) {
      return [];
    }
    
    // First, fetch all existing tags
    const existingTags = await fetchTags();
    const existingTagMap = new Map(existingTags.map(tag => [tag.name.toLowerCase(), tag]));
    
    // Identify which tags need to be created
    const tagsToCreate = tagNames.filter(name => 
      name && !existingTagMap.has(name.toLowerCase())
    );
    
    // Create any missing tags
    const createdTags = [];
    for (const tagName of tagsToCreate) {
      const newTag = await createTag({ name: tagName });
      createdTags.push(newTag);
    }
    
    // Combine existing and newly created tags
    const result = tagNames.map(name => {
      // Try to find in existing tags
      const existingTag = existingTagMap.get(name.toLowerCase());
      if (existingTag) {
        return existingTag;
      }
      
      // Try to find in newly created tags
      const createdTag = createdTags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (createdTag) {
        return createdTag;
      }
      
      // Shouldn't reach here, but just in case
      return null;
    }).filter(Boolean);
    
    return result;
  } catch (error) {
    console.error("Error getting or creating tags:", error);
    throw error;
  }
};