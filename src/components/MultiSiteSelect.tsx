import React, { useState, useRef, useEffect } from 'react';
import type { Site } from '../types';
import { Building, ChevronDown, Check, X, Search, Plus } from 'lucide-react';

interface MultiSiteSelectProps {
  sites: Site[];
  selectedSiteIds: string[];
  onChange: (siteIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const MultiSiteSelect: React.FC<MultiSiteSelectProps> = ({
  sites,
  selectedSiteIds = [],
  onChange,
  disabled = false,
  placeholder = 'Select Project Site(s)',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280 && rect.top > 250) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const filteredSites = sites.filter((site) => {
    const q = searchQuery.toLowerCase();
    return (
      site.name.toLowerCase().includes(q) ||
      (site.code && site.code.toLowerCase().includes(q)) ||
      (site.location && site.location.toLowerCase().includes(q))
    );
  });

  const selectedSites = sites.filter((s) => selectedSiteIds.includes(s.id));

  const toggleSite = (siteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled) return;
    if (selectedSiteIds.includes(siteId)) {
      onChange(selectedSiteIds.filter((id) => id !== siteId));
    } else {
      onChange([...selectedSiteIds, siteId]);
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(sites.map((s) => s.id));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className={`relative ${className} ${isOpen ? 'z-50' : 'z-10'}`} ref={containerRef}>
      {/* Trigger Button / Display Box */}
      <div
        onClick={handleToggle}
        className={`min-h-[40px] w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 ${
          isOpen ? 'ring-2 ring-[#16A34A] bg-white border-[#16A34A]' : 'hover:bg-white hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
      >
        <div className="flex items-center space-x-2 flex-1 flex-wrap gap-1.5 overflow-hidden">
          <Building className="w-4 h-4 text-[#6B7280] shrink-0" />

          {selectedSites.length === 0 ? (
            <span className="text-[13px] text-[#6B7280] font-normal italic">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1 max-w-full items-center">
              {selectedSites.map((site) => (
                <span
                  key={site.id}
                  className="inline-flex items-center space-x-1 bg-[#E8F7EE] text-[#16A34A] border border-[#16A34A]/30 px-2 py-0.5 rounded-full text-[12px] font-medium leading-tight shadow-2xs"
                >
                  <span className="truncate max-w-[120px]">{site.code || site.name}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => toggleSite(site.id, e)}
                      className="hover:bg-[#16A34A]/20 p-0.5 rounded-full text-[#16A34A] transition shrink-0"
                      title="Remove site"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {selectedSiteIds.length > 0 && !disabled && (
            <span className="text-[11px] font-bold bg-[#16A34A] text-white px-1.5 py-0.5 rounded-full mr-1">
              {selectedSiteIds.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#16A34A]' : ''}`} />
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className={`absolute left-0 right-0 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_10px_25px_rgba(0,0,0,0.15)] z-50 p-2 min-w-[280px] animate-fade-in ${
          dropUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
        }`}>
          {/* Search Header */}
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search site location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[36px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] pl-9 pr-3 text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition"
              autoFocus
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB] text-[12px] px-1 font-medium text-[#6B7280]">
            <span>{selectedSiteIds.length} selected</span>
            <div className="space-x-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#16A34A] hover:underline font-semibold cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[#EF4444] hover:underline font-semibold cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* List of Sites */}
          <div className="max-h-[220px] overflow-y-auto space-y-0.5 pr-1">
            {filteredSites.length === 0 ? (
              <div className="p-3 text-center text-[13px] text-[#6B7280] italic">
                No matching sites found
              </div>
            ) : (
              filteredSites.map((site) => {
                const isSelected = selectedSiteIds.includes(site.id);
                return (
                  <div
                    key={site.id}
                    onClick={() => toggleSite(site.id)}
                    className={`flex items-center justify-between p-2 rounded-[8px] cursor-pointer text-[13px] transition ${
                      isSelected
                        ? 'bg-[#E8F7EE] text-[#16A34A] font-semibold'
                        : 'hover:bg-[#F8FAFC] text-[#111827]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? 'bg-[#16A34A] border-[#16A34A] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="truncate">
                        <span className="block truncate">{site.name}</span>
                        {site.code && (
                          <span className="text-[11px] text-[#6B7280] block font-mono">
                            {site.code} {site.location ? `• ${site.location}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[11px] font-semibold bg-[#16A34A]/10 text-[#16A34A] px-2 py-0.5 rounded-full shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
