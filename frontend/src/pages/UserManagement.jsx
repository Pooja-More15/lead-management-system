import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import Button from '../components/Button';
import Input from '../components/Input';
import { 
  UserCog, Search, Plus, Edit, Eye, X, Shield, Calendar, 
  Mail, User, Info, ArrowUpDown, ChevronLeft, ChevronRight,
  UserCheck, UserX, Key, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';

// Zod schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
  isActive: z.boolean(),
});

const UserManagement = () => {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  
  // List State
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [updatingId, setUpdatingId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // React Hook Form for Create
  const { 
    register: registerCreate, 
    handleSubmit: handleCreateSubmit, 
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating } 
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'AGENT',
    }
  });

  // React Hook Form for Edit
  const { 
    register: registerEdit, 
    handleSubmit: handleEditSubmit, 
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: isUpdating } 
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      role: 'AGENT',
      isActive: true,
    }
  });

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
      };
      
      const res = await apiClient.get('/users', { params });
      setUsers(res.data.data);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle create submit
  const onCreateUser = async (data) => {
    try {
      await apiClient.post('/users', data);
      toast.success(`User "${data.name}" created successfully`);
      setIsCreateOpen(false);
      resetCreate();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  // Handle edit open
  const openEditModal = (user) => {
    if (user.id === currentUser.id) {
      toast.error('You cannot modify your own profile settings from User Management');
      return;
    }
    setSelectedUser(user);
    setEditValue('name', user.name);
    setEditValue('role', user.role);
    setEditValue('isActive', user.isActive);
    setIsEditOpen(true);
  };

  // Handle edit submit
  const onEditUser = async (data) => {
    try {
      await apiClient.put(`/users/${selectedUser.id}`, data);
      toast.success(`User "${data.name}" updated successfully`);
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Toggle user active status
  const toggleStatus = async (user) => {
    if (user.id === currentUser.id) {
      toast.error('You cannot modify your own account status');
      return;
    }

    setUpdatingId(user.id);
    try {
      if (user.isActive) {
        // Deactivate (Soft Delete)
        await apiClient.patch(`/users/${user.id}/status`);
        toast.success(`Account for "${user.name}" has been suspended`);
      } else {
        // Activate (using PUT endpoint as updates allow changing isActive)
        await apiClient.put(`/users/${user.id}`, {
          isActive: true
        });
        toast.success(`Account for "${user.name}" has been activated`);
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // View User Details
  const openDetailsModal = async (user) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await apiClient.get(`/users/${user.id}`);
      setSelectedUserDetails(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user details');
      setIsDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-slate-100 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Users Found: <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span>
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => { resetCreate(); setIsCreateOpen(true); }}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-md shadow-indigo-500/10"
        >
          <Plus className="w-4.5 h-4.5" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="card-premium p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Name or Email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-slate-100"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-slate-100 font-medium text-slate-650"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="AGENT">AGENT</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-slate-100 font-medium text-slate-650"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th onClick={() => handleSort('name')} className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
                  <span className="flex items-center gap-1 font-semibold">Name <ArrowUpDown className="w-3.5 h-3.5" /></span>
                </th>
                <th className="font-semibold">Email</th>
                <th onClick={() => handleSort('role')} className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
                  <span className="flex items-center gap-1 font-semibold">Role <ArrowUpDown className="w-3.5 h-3.5" /></span>
                </th>
                <th className="font-semibold">Status</th>
                <th onClick={() => handleSort('lastLogin')} className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
                  <span className="flex items-center gap-1 font-semibold">Last Login <ArrowUpDown className="w-3.5 h-3.5" /></span>
                </th>
                <th onClick={() => handleSort('createdAt')} className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
                  <span className="flex items-center gap-1 font-semibold">Created Date <ArrowUpDown className="w-3.5 h-3.5" /></span>
                </th>
                <th className="text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/80 animate-pulse">
                    <td className="h-14"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" /></td>
                    <td><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
                    <td><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" /></td>
                    <td><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" /></td>
                    <td><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No users found matching query filters.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800/40 table-row-hover">
                    <td className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs font-medium">{user.email}</td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30'
                          : user.role === 'MANAGER'
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/30'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        user.isActive 
                          ? 'bg-emerald-55/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' 
                          : 'bg-rose-55/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30'
                      }`}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : <span className="text-slate-400 italic">Never</span>}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openDetailsModal(user)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.id !== currentUser.id && (
                          <>
                            <button 
                              onClick={() => openEditModal(user)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              disabled={updatingId === user.id}
                              onClick={() => toggleStatus(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.isActive 
                                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' 
                                  : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                              }`}
                              title={user.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              {updatingId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              ) : user.isActive ? (
                                <UserX className="w-4 h-4 text-rose-500" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-emerald-500" />
                              )}
                            </button>
                          </>
                        )}
                        {user.id === currentUser.id && (
                          <span className="text-xs text-slate-400 italic px-2">Owner</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1"
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-800/80">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Create New User
              </h2>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit(onCreateUser)} className="p-6 space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. John Miller"
                error={createErrors.name?.message}
                {...registerCreate('name')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john.miller@example.com"
                error={createErrors.email?.message}
                {...registerCreate('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Minimum 6 characters"
                error={createErrors.password?.message}
                {...registerCreate('password')}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Access Role
                </label>
                <select
                  className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
                    createErrors.role ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all dark:text-slate-100`}
                  {...registerCreate('role')}
                >
                  <option value="AGENT">AGENT</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {createErrors.role && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{createErrors.role.message}</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-800/80 mt-6">
                <Button 
                  variant="secondary" 
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  isLoading={isCreating}
                >
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-800/80">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Edit User Settings
              </h2>
              <button 
                onClick={() => { setIsEditOpen(false); setSelectedUser(null); }} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit(onEditUser)} className="p-6 space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. John Miller"
                error={editErrors.name?.message}
                {...registerEdit('name')}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Access Role
                </label>
                <select
                  className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
                    editErrors.role ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all dark:text-slate-100`}
                  {...registerEdit('role')}
                >
                  <option value="AGENT">AGENT</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {editErrors.role && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{editErrors.role.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl mt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    Account Status
                  </label>
                  <p className="text-xs text-slate-500">Enable or disable access to the CRM</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  {...registerEdit('isActive')}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-800/80 mt-6">
                <Button 
                  variant="secondary" 
                  onClick={() => { setIsEditOpen(false); setSelectedUser(null); }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  isLoading={isUpdating}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {isDetailsOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 dark:border-slate-800/80">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> User Profile Summary
              </h2>
              <button 
                onClick={() => { setIsDetailsOpen(false); setSelectedUser(null); setSelectedUserDetails(null); }} 
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-sm text-slate-500 font-medium">Fetching profile details...</p>
                </div>
              ) : selectedUserDetails ? (
                <div className="space-y-4">
                  {/* Avatar / Name Header */}
                  <div className="flex items-center gap-4 p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-indigo-600/10 dark:bg-indigo-400/10 border border-indigo-200/40 flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{selectedUserDetails.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedUserDetails.role === 'ADMIN' 
                          ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30'
                          : selectedUserDetails.role === 'MANAGER'
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/30'
                      }`}>
                        {selectedUserDetails.role}
                      </span>
                    </div>
                  </div>

                  {/* Fields list */}
                  <div className="space-y-3.5 text-sm">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5"><Mail className="w-4 h-4" /> Email Address</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedUserDetails.email}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5"><Shield className="w-4 h-4" /> Account Status</span>
                      <span className={`font-bold ${selectedUserDetails.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {selectedUserDetails.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5"><Key className="w-4 h-4" /> Last Login</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedUserDetails.lastLogin ? new Date(selectedUserDetails.lastLogin).toLocaleString() : <span className="text-slate-400 italic">Never</span>}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Registration Date</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(selectedUserDetails.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> Registered By</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedUserDetails.creator ? (
                          `${selectedUserDetails.creator.name} (${selectedUserDetails.creator.role})`
                        ) : (
                          <span className="text-slate-400 italic">System Owner / Seeding</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 italic">Failed to load details.</div>
              )}

              {/* Modal Action */}
              <div className="pt-4 border-t border-slate-150 dark:border-slate-800/80 flex justify-end">
                <Button 
                  variant="secondary" 
                  onClick={() => { setIsDetailsOpen(false); setSelectedUser(null); setSelectedUserDetails(null); }}
                >
                  Close Summary
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
