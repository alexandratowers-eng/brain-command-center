// Notion Sync Helper for Brain Command Center
// This script is used by the OpenSwarm agent to sync meeting notes to Notion.
// It reads localStorage data and provides the meetings that need syncing.
//
// Notion Database ID: 33473e82-25d5-80e8-970e-fe099a79b98f
// Properties: Meeting name (title), Date (date), Summary (rich_text), Category (multi_select)
//
// Usage: The agent reads this file for the database ID, then uses the Notion MCP
// tools to create pages for any meetings with notionSynced === 'pending'.

const NOTION_DB_ID = '33473e82-25d5-80e8-970e-fe099a79b98f';

// Category mapping from Brain Command Center templates to Notion multi_select
const CATEGORY_MAP = {
  '1on1': 'Planning',
  'research': 'Presentation',
  'tpp': 'Customer call',
  'general': 'Planning',
  'prep': 'Planning',
};
