import * as LucideIcons from 'lucide-react';

export const getIcon = (iconName) => {
  // Handle null/undefined case
  if (!iconName) {
    console.warn('No icon name provided, using Smile as fallback');
    return LucideIcons.Smile;
  }

  // Step 1: Try direct match first (if already PascalCase)
  if (LucideIcons[iconName] && typeof LucideIcons[iconName] === 'function') {
    return LucideIcons[iconName];
  }

  // Step 2: Handle various transformations from kebab-case to PascalCase
  let componentName = '';
  if (iconName.includes('-')) {
    // Handle kebab-case with numbers (bar-chart-2 → BarChart2)
    componentName = iconName
      .split('-')
      .map(part => {
        // Check if the part is just a number and attach it without capitalization
        if (/^\d+$/.test(part)) {
          return part;
        }
        // Otherwise capitalize the first letter
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');
  } else {
    // For single word icons, just capitalize first letter
    componentName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  }

  // Step 3: Check if we have a valid component after transformation
  if (LucideIcons[componentName] && typeof LucideIcons[componentName] === 'function') {
    return LucideIcons[componentName];
  }

  // Step 4: Advanced retry - try various transformations if needed
  // Try removing spaces and underscores (user_circle → UserCircle)
  const noSpaces = componentName.replace(/[\s_]/g, '');
  if (LucideIcons[noSpaces] && typeof LucideIcons[noSpaces] === 'function') {
    return LucideIcons[noSpaces];
  }

  // Try inserting number without space (barChart2 → BarChart2)
  const numberPattern = /([A-Za-z])(\d+)$/;
  const withNumber = componentName.replace(numberPattern, '$1$2');
  if (LucideIcons[withNumber] && typeof LucideIcons[withNumber] === 'function') {
    return LucideIcons[withNumber];
  }

  // Fallback with console warning for debugging
  console.warn(`Icon "${iconName}" not found in Lucide (tried "${componentName}"), using Smile instead`);
  return LucideIcons.Smile;
};