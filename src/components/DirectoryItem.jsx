// DirectoryItem.jsx
import React, { useState } from "react";
import {
  FaFolder,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
} from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import ContextMenu from "./ContextMenu";
import { useDirectoryContext } from "../context/DirectoryContext";
import { formatSize } from "./DetailsPopup";

function DirectoryItem({ item, uploadProgress }) {
  const {
    handleRowClick,
    activeContextMenu,
    handleContextMenu,
    getFileIcon,
    isUploading,
  } = useDirectoryContext();

  const [showTooltip, setShowTooltip] = useState(false);

  const isUploadingItem = item.id.startsWith("temp-");
  const iconType = item.isDirectory ? "folder" : getFileIcon(item.name);

  function getIconBadge(type) {
    switch (type) {
      case "folder":
        return {
          icon: <FaFolder className="text-amber-500 text-lg" />,
          bg: "bg-amber-50 border-amber-100/80 dark:bg-amber-950/20 dark:border-amber-900/50",
        };
      case "pdf":
        return {
          icon: <FaFilePdf className="text-red-500 text-lg" />,
          bg: "bg-red-50 border-red-100/80 dark:bg-red-950/20 dark:border-red-900/50",
        };
      case "image":
        return {
          icon: <FaFileImage className="text-emerald-500 text-lg" />,
          bg: "bg-emerald-50 border-emerald-100/80 dark:bg-emerald-950/20 dark:border-emerald-900/50",
        };
      case "video":
        return {
          icon: <FaFileVideo className="text-purple-500 text-lg" />,
          bg: "bg-purple-50 border-purple-100/80 dark:bg-purple-950/20 dark:border-purple-900/50",
        };
      case "archive":
        return {
          icon: <FaFileArchive className="text-orange-500 text-lg" />,
          bg: "bg-orange-50 border-orange-100/80 dark:bg-orange-950/20 dark:border-orange-900/50",
        };
      case "code":
        return {
          icon: <FaFileCode className="text-blue-500 text-lg" />,
          bg: "bg-blue-50 border-blue-100/80 dark:bg-blue-950/20 dark:border-blue-900/50",
        };
      case "alt":
      default:
        return {
          icon: <FaFileAlt className="text-gray-500 text-lg" />,
          bg: "bg-gray-50 border-gray-100/80 dark:bg-slate-800 dark:border-slate-700",
        };
    }
  }

  const badge = getIconBadge(iconType);
  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="relative group">
      <div
        className={`
          flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 dark:hover:from-slate-750 dark:hover:to-slate-700
          border border-gray-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-500 rounded-xl transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer relative
          ${activeContextMenu === item.id ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20" : ""}
        `}
        onClick={() =>
          !(activeContextMenu || isUploading) &&
          handleRowClick(item.isDirectory ? "directory" : "file", item.id)
        }
        onContextMenu={(e) => handleContextMenu(e, item.id)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Left section: Icon + Name */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 ${badge.bg}`}
          >
            {badge.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-slate-100 hover:text-blue-600 transition-colors text-sm truncate">
                {item.name}
              </span>
              {item.isDirectory && (
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/50 shrink-0">
                  Folder
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-450 font-medium truncate mt-0.5">
              {item.isDirectory
                ? `${item.numberOfFiles || 0} files, ${item.numberOfFolders || 0} subfolders`
                : (item.name.split(".").pop()?.toUpperCase() || "FILE") + " file"}
            </p>
          </div>
        </div>

        {/* Right section: Size, Date, Actions */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden sm:flex flex-col items-end min-w-[80px]">
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">
              {formatSize(item.size)}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Size</span>
          </div>

          <div className="hidden md:flex flex-col items-end min-w-[100px]">
            <span className="text-xs font-medium text-gray-600 dark:text-slate-350">
              {formattedDate || "—"}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Created</span>
          </div>

          <button
            className="text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-xl transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, item.id);
            }}
            title="More actions"
          >
            <BsThreeDotsVertical className="text-sm" />
          </button>
        </div>

        {/* Upload Progress Bar */}
        {isUploadingItem && (
          <div className="absolute inset-x-0 bottom-0 px-4 pb-1 bg-white/90 rounded-b-xl backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 mb-1">
              <span>Uploading...</span>
              <span>{Math.floor(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Context Menu */}
        {activeContextMenu === item.id && (
          <ContextMenu item={item} isUploadingItem={isUploadingItem} />
        )}
      </div>

      {/* Custom Sleek Floating Tooltip */}
      {showTooltip && !activeContextMenu && (
        <div className="absolute left-12 -top-14 z-50 pointer-events-none transition-all duration-150">
          <div className="bg-gray-900/95 text-white text-xs rounded-xl py-2 px-3.5 shadow-2xl backdrop-blur-md border border-gray-700/60 max-w-xs space-y-1">
            <div className="font-semibold text-white truncate">{item.name}</div>
            <div className="flex items-center gap-3 text-[11px] text-gray-300">
              <span>Size: <strong className="text-blue-300">{formatSize(item.size)}</strong></span>
              {item.isDirectory ? (
                <span>Items: <strong className="text-amber-300 font-medium">{(item.numberOfFiles || 0) + (item.numberOfFolders || 0)}</strong></span>
              ) : (
                <span>Type: <strong className="text-gray-200 uppercase">{item.name.split(".").pop() || "File"}</strong></span>
              )}
            </div>
            {formattedDate && (
              <div className="text-[10px] text-gray-400 border-t border-gray-800/80 pt-1 mt-1">
                Created: {new Date(item.createdAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectoryItem;
