import React, { useState } from 'react';
import type { Employee } from '../types';
import { isSubcontractor } from '../types';
import { Users, Plus, Edit2, Trash2, X, Save, AlertTriangle, HardHat, CheckCircle2 } from 'lucide-react';
import { DataService } from '../lib/supabaseClient';

interface MasterDataManagerProps {
  employees: Employee[];
  onSaveEmployee: (employee: Partial<Employee>) => Promise<Employee>;
  onDeleteEmployee?: (empId: string) => Promise<void>;
}

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  employees,
  onSaveEmployee,
  onDeleteEmployee,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'subcontractors'>('employees');

  // Employee Modal State
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Partial<Employee> | null>(null);

  // Delete Confirmation State
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);

  // Separate employees into Direct Staff and Subcontractors (sorted alphabetically by name)
  const directEmployees = employees
    .filter((e) => !isSubcontractor(e))
    .sort((a, b) => a.name.localeCompare(b.name));
  const subcontractors = employees
    .filter((e) => isSubcontractor(e))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenModal = (isSub: boolean, emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
    } else {
      const nextId = `E${String(employees.length + 1).padStart(3, '0')}`;
      setEditingEmp({
        emp_id: nextId,
        name: isSub ? 'SUB-' : '',
        designation: isSub ? 'Subcontractor' : 'Worker',
        category: isSub ? 'Subcontractor' : 'Worker',
        is_active: true,
      });
    }
    setEmpModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp && editingEmp.name) {
      await onSaveEmployee(editingEmp);
      setEmpModalOpen(false);
      setEditingEmp(null);
    }
  };

  const confirmDelete = async (empId: string) => {
    if (onDeleteEmployee) {
      await onDeleteEmployee(empId);
    } else {
      await DataService.deleteEmployee(empId);
    }
    setDeletingEmpId(null);
  };

  const currentList = activeSubTab === 'employees' ? directEmployees : subcontractors;

  return (
    <div className="space-y-[24px]">
      {/* Sub Tab Switcher & Add Button Header Card (Specs: 14px radius, 20px padding) */}
      <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveSubTab('employees')}
            className={`h-[40px] flex items-center space-x-2 px-4 rounded-[10px] font-semibold text-[14px] transition-all duration-200 cursor-pointer ${activeSubTab === 'employees'
                ? 'bg-[#E8F7EE] text-[#16A34A] border border-[#16A34A]/30 shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>Direct Employees ({directEmployees.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('subcontractors')}
            className={`h-[40px] flex items-center space-x-2 px-4 rounded-[10px] font-semibold text-[14px] transition-all duration-200 cursor-pointer ${activeSubTab === 'subcontractors'
                ? 'bg-amber-50 text-[#F59E0B] border border-amber-200 shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]'
              }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Subcontractors ({subcontractors.length})</span>
          </button>
        </div>

        <div>
          <button
            onClick={() => handleOpenModal(activeSubTab === 'subcontractors')}
            className="h-[40px] bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-[14px] px-5 rounded-[10px] shadow-xs transition-all duration-200 flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeSubTab === 'employees' ? 'Add New Employee' : 'Add New Subcontractor'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Roster Table Container (Radius 12px, Header #FAFAFA, Row Height 52px) */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[13px] uppercase tracking-wider text-[#6B7280] font-semibold border-b border-[#E5E7EB] h-[48px]">
                <th className="py-3 px-5 w-28">Emp ID</th>
                <th className="py-3 px-5">Staff Name</th>
                <th className="py-3 px-5">Designation</th>
                <th className="py-3 px-5 text-center">Category</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[14px] text-[#111827]">
              {currentList.map((emp) => (
                <tr key={emp.id} className="h-[52px] hover:bg-[#F9FBFA] transition-colors duration-150">
                  {/* Emp ID Badge */}
                  <td className="py-2.5 px-5 font-mono text-[12px] font-medium text-[#16A34A]">
                    <span className="bg-[#E8F7EE] text-[#16A34A] px-3 py-1 rounded-full inline-block">
                      {emp.emp_id}
                    </span>
                  </td>

                  {/* Staff Name */}
                  <td className="py-2.5 px-5 font-semibold text-[#111827]">
                    {emp.name}
                  </td>

                  {/* Designation */}
                  <td className="py-2.5 px-5 text-[14px] text-[#6B7280]">
                    {emp.designation}
                  </td>

                  {/* Category Badge */}
                  <td className="py-2.5 px-5 text-center">
                    <span
                      className={`text-[12px] px-3 py-0.5 rounded-full font-medium border ${emp.category === 'Engineer'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : emp.category === 'Subcontractor' || emp.designation === 'Subcontractor'
                            ? 'bg-amber-50 text-[#F59E0B] border-amber-200'
                            : 'bg-[#E8F7EE] text-[#16A34A] border-[#16A34A]/30'
                        }`}
                    >
                      {emp.category || emp.designation}
                    </span>
                  </td>

                  {/* Active Status */}
                  <td className="py-2.5 px-5 text-center">
                    {emp.is_active ? (
                      <span className="inline-flex items-center space-x-1 bg-[#E8F7EE] text-[#16A34A] text-[12px] font-medium px-3 py-0.5 rounded-full border border-[#16A34A]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-slate-100 text-[#6B7280] text-[12px] font-medium px-3 py-0.5 rounded-full border border-slate-200">
                        <span>Inactive</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(isSubcontractor(emp), emp)}
                        className="p-1.5 text-[#6B7280] hover:text-[#16A34A] hover:bg-[#E8F7EE] rounded-[10px] transition cursor-pointer"
                        title="Edit Staff Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingEmpId(emp.id)}
                        className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-rose-50 rounded-[10px] transition cursor-pointer"
                        title="Delete Personnel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {currentList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B7280] text-[14px]">
                    No personnel found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Employee Modal */}
      {empModalOpen && editingEmp && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] w-full max-w-md p-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.15)] space-y-[20px] relative">
            <button
              onClick={() => setEmpModalOpen(false)}
              className="absolute top-5 right-5 text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] p-1.5 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F7EE] text-[#16A34A] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[22px] font-semibold text-[#111827]">
                  {editingEmp.id ? 'Edit Roster Personnel' : 'Register New Staff Member'}
                </h3>
                <p className="text-[14px] text-[#6B7280]">Update employee details and category.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[14px] font-medium text-[#111827] block mb-1">Emp ID</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.emp_id || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, emp_id: e.target.value })}
                    className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3.5 text-[14px] font-semibold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-medium text-[#111827] block mb-1">Category</label>
                  <select
                    value={editingEmp.category || 'Worker'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, category: e.target.value })}
                    className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3.5 text-[14px] font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  >
                    <option value="Engineer">Engineer</option>
                    <option value="Worker">Worker</option>
                    <option value="Subcontractor">Subcontractor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[14px] font-medium text-[#111827] block mb-1">
                  Full Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIRMAL KUMAR"
                  value={editingEmp.name || ''}
                  onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3.5 text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div>
                <label className="text-[14px] font-medium text-[#111827] block mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Site Engineer / Subcontractor"
                  value={editingEmp.designation || ''}
                  onChange={(e) => setEditingEmp({ ...editingEmp, designation: e.target.value })}
                  className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3.5 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[14px] font-medium text-[#111827]">Active Roster Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEmp.is_active ?? true}
                    onChange={(e) => setEditingEmp({ ...editingEmp, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]"></div>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="h-[40px] px-4 rounded-[10px] text-[14px] font-medium text-[#6B7280] bg-[#F8FAFC] hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[40px] bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-[14px] px-5 rounded-[10px] shadow-xs transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Personnel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmpId && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] w-full max-w-sm p-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.15)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#EF4444] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[22px] font-semibold text-[#111827]">Delete Personnel Record?</h3>
              <p className="text-[14px] text-[#6B7280] mt-1">
                Are you sure you want to remove this staff record?
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingEmpId(null)}
                className="h-[40px] px-4 rounded-[10px] text-[14px] font-medium text-[#6B7280] bg-[#F8FAFC] hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deletingEmpId)}
                className="h-[40px] bg-[#EF4444] hover:bg-rose-600 text-white font-medium text-[14px] px-5 rounded-[10px] shadow-xs transition cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
