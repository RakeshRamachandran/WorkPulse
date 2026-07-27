import React, { useState } from 'react';
import type { Site } from '../types';
import { Building2, Plus, Edit2, Trash2, X, Save, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';

interface SiteLocationsManagerProps {
  sites: Site[];
  onSaveSite: (site: Partial<Site>) => Promise<Site>;
  onDeleteSite: (siteId: string) => Promise<void>;
}

export const SiteLocationsManager: React.FC<SiteLocationsManagerProps> = ({
  sites,
  onSaveSite,
  onDeleteSite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Partial<Site> | null>(null);
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenModal = (site?: Site) => {
    if (site) {
      setEditingSite(site);
    } else {
      setEditingSite({
        name: '',
        code: '',
        location: '',
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSite && editingSite.name && editingSite.code) {
      await onSaveSite(editingSite);
      setModalOpen(false);
      setEditingSite(null);
    }
  };

  const confirmDelete = async (siteId: string) => {
    await onDeleteSite(siteId);
    setDeletingSiteId(null);
  };

  return (
    <div className="space-y-[24px]">
      {/* Header Toolbar Card (Card Specs: 14px radius, 20px padding) */}
      <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#E8F7EE] text-[#16A34A] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-[#111827]">Site Locations Directory</h2>
            <p className="text-[14px] text-[#6B7280]">
              Manage project sites and field deployment locations ({sites.length} active sites)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Input (Height 40px, Radius 10px) */}
          <div className="relative min-w-[240px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search site by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] pl-10 pr-4 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          {/* Add Site Button (Height 40px, Radius 10px) */}
          <button
            onClick={() => handleOpenModal()}
            className="h-[40px] bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-[14px] px-4 rounded-[10px] shadow-xs transition-all duration-200 flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Site</span>
          </button>
        </div>
      </div>

      {/* Main Table Container (Radius 12px, Sticky Header #FAFAFA, Row Height 52px) */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[13px] uppercase tracking-wider text-[#6B7280] font-semibold border-b border-[#E5E7EB] h-[48px]">
                <th className="py-3 px-5 w-24">Site Code</th>
                <th className="py-3 px-5">Site Location Name</th>
                <th className="py-3 px-5">City / Region</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[14px] text-[#111827]">
              {filteredSites.map((site) => (
                <tr key={site.id} className="h-[52px] hover:bg-[#F9FBFA] transition-colors duration-150">
                  {/* Site Code Pill Badge */}
                  <td className="py-2.5 px-5">
                    <span className="bg-[#E8F7EE] text-[#16A34A] font-semibold px-3 py-1 rounded-full text-[12px] inline-block">
                      {site.code}
                    </span>
                  </td>

                  {/* Site Name */}
                  <td className="py-2.5 px-5 font-semibold text-[#111827]">
                    {site.name}
                  </td>

                  {/* Location */}
                  <td className="py-2.5 px-5 text-[14px] text-[#6B7280]">
                    {site.location || 'Kerala'}
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-5 text-center">
                    {site.is_active ? (
                      <span className="inline-flex items-center space-x-1 bg-[#E8F7EE] text-[#16A34A] text-[12px] font-medium px-3 py-1 rounded-full border border-[#16A34A]/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-slate-100 text-[#6B7280] text-[12px] font-medium px-3 py-1 rounded-full border border-slate-200">
                        <span>Inactive</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(site)}
                        className="p-1.5 text-[#6B7280] hover:text-[#16A34A] hover:bg-[#E8F7EE] rounded-[10px] transition cursor-pointer"
                        title="Edit Site"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingSiteId(site.id)}
                        className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-rose-50 rounded-[10px] transition cursor-pointer"
                        title="Delete Site"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSites.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#6B7280] text-[14px]">
                    No site locations found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Site Modal */}
      {modalOpen && editingSite && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] w-full max-w-md p-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.15)] space-y-[20px] relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] p-1.5 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F7EE] text-[#16A34A] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[22px] font-semibold text-[#111827]">
                  {editingSite.id ? 'Edit Site Location' : 'Create New Site Location'}
                </h3>
                <p className="text-[14px] text-[#6B7280]">Update project site parameters.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[14px] font-medium text-[#111827] block mb-1">
                  Site Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amara Resort"
                  value={editingSite.name || ''}
                  onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                  className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3.5 text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[14px] font-medium text-[#111827] block mb-1">
                    Site Code <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AR"
                    value={editingSite.code || ''}
                    onChange={(e) => setEditingSite({ ...editingSite, code: e.target.value.toUpperCase() })}
                    className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3.5 text-[14px] font-semibold text-[#16A34A] uppercase focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-medium text-[#111827] block mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Trivandrum"
                    value={editingSite.location || ''}
                    onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })}
                    className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3.5 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-[40px] px-4 rounded-[10px] text-[14px] font-medium text-[#6B7280] bg-[#F8FAFC] hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[40px] bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-[14px] px-5 rounded-[10px] shadow-xs transition-all duration-200 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSiteId && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] w-full max-w-sm p-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.15)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#EF4444] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[22px] font-semibold text-[#111827]">Delete Site Location?</h3>
              <p className="text-[14px] text-[#6B7280] mt-1">
                Are you sure you want to delete this site location?
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingSiteId(null)}
                className="h-[40px] px-4 rounded-[10px] text-[14px] font-medium text-[#6B7280] bg-[#F8FAFC] hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deletingSiteId)}
                className="h-[40px] bg-[#EF4444] hover:bg-rose-600 text-white font-medium text-[14px] px-5 rounded-[10px] shadow-xs transition cursor-pointer"
              >
                Delete Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
