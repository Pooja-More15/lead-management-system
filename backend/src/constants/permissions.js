const PERMISSIONS = {
  ADMIN: [
    'create_users',
    'manage_users',
    'create_leads',
    'update_leads',
    'delete_leads',
    'assign_leads',
    'view_all_leads',
    'view_dashboard',
    'view_logs',
    'manage_system'
  ],
  MANAGER: [
    'create_leads',
    'update_leads',
    'assign_leads',
    'view_all_leads',
    'view_dashboard'
  ],
  AGENT: [
    'view_assigned_leads',
    'update_assigned_leads_status',
    'add_notes',
    'view_dashboard'
  ]
};

module.exports = PERMISSIONS;
