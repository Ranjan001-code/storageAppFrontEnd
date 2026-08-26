import { useEffect, useState } from "react";

export const formatSize = (bytes = 0) => {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
  if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
  if (bytes >= KB) return (bytes / KB).toFixed(2) + " KB";
  return bytes + " B";
};

function DetailsPopup({ item, onClose }) {
  if (!item) return null;

  const {
    name,
    isDirectory,
    size = 0,
    createdAt,
    updatedAt,
    numberOfFiles = 0,
    numberOfFolders = 0,
  } = item;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{isDirectory ? "📁" : "📄"}</span>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">
                {isDirectory ? "Folder Details" : "File Details"}
              </h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Item information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700">
            <span className="text-gray-500 dark:text-slate-400 font-medium">Name</span>
            <span className="font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[220px]" title={name}>
              {name}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700">
            <span className="text-gray-500 dark:text-slate-400 font-medium">Type</span>
            <span className="font-semibold text-gray-700 dark:text-slate-300 capitalize">
              {isDirectory ? "Folder" : (name.split(".").pop()?.toUpperCase() || "File")}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700">
            <span className="text-gray-500 dark:text-slate-400 font-medium">Size</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 rounded-full text-xs">
              {formatSize(size)}
            </span>
          </div>

          {isDirectory && (
            <>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700">
                <span className="text-gray-500 dark:text-slate-400 font-medium">Total Files</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{numberOfFiles}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700">
                <span className="text-gray-500 dark:text-slate-400 font-medium">Subfolders</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{numberOfFolders}</span>
              </div>
            </>
          )}

          {createdAt && (
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-slate-400 font-medium">Created</span>
              <span className="text-xs font-medium text-gray-600 dark:text-slate-300">
                {new Date(createdAt).toLocaleString()}
              </span>
            </div>
          )}

          {updatedAt && (
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-slate-400 font-medium">Modified</span>
              <span className="text-xs font-medium text-gray-600 dark:text-slate-300">
                {new Date(updatedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-900/30 flex justify-end">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm shadow-blue-500/30 active:scale-95 cursor-pointer"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailsPopup;
