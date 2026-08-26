// DirectoryList.jsx
import React from "react";
import { useDirectoryContext } from "../context/DirectoryContext";
import DirectoryItem from "./DirectoryItem";

function DirectoryList({ items }) {
  const { progressMap } = useDirectoryContext();

  const folderCount = items.filter((i) => i.isDirectory).length;
  const fileCount = items.length - folderCount;

  return (
    <div className="space-y-3">
      {/* Header bar showing counts and column labels */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80 dark:bg-slate-800/80 rounded-xl border border-gray-200/60 dark:border-slate-700/60 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span>Name</span>
          <span className="text-[10px] lowercase font-normal text-gray-400 dark:text-slate-500">
            ({folderCount} {folderCount === 1 ? "folder" : "folders"}, {fileCount} {fileCount === 1 ? "file" : "files"})
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden sm:inline-block w-[80px] text-right">Size</span>
          <span className="hidden md:inline-block w-[100px] text-right">Created</span>
          <span className="w-8 text-center">Actions</span>
        </div>
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {items.map((item) => {
          const uploadProgress = progressMap[item.id] || 0;
          return (
            <DirectoryItem
              key={item.id}
              item={item}
              uploadProgress={uploadProgress}
            />
          );
        })}
      </div>
    </div>
  );
}

export default DirectoryList;
