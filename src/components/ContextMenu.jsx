import { useDirectoryContext } from "../context/DirectoryContext";

function ContextMenu({ item, isUploadingItem }) {
  const {
    handleCancelUpload,
    setDeleteItem,
    openRenameModal,
    openDetailsPopup,
    BASE_URL,
  } = useDirectoryContext();

  const menuClass =
    "absolute bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl text-sm z-40 right-4 top-10 overflow-hidden min-w-[140px] py-1 transition-all duration-200 animate-in fade-in zoom-in-95";
  const itemClass = "px-4 py-2 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium cursor-pointer transition-colors duration-150 flex items-center gap-2";

  if (item.isDirectory) {
    return (
      <div className={menuClass}>
        <div
          className={itemClass}
          onClick={() => openRenameModal("directory", item.id, item.name)}
        >
          Rename
        </div>
        <div className={itemClass} onClick={() => setDeleteItem(item)}>
          Delete
        </div>
        <div className={itemClass} onClick={() => openDetailsPopup(item)}>
          Details
        </div>
      </div>
    );
  }

  if (isUploadingItem && item.isUploading) {
    return (
      <div className={menuClass}>
        <div className={itemClass} onClick={() => handleCancelUpload(item.id)}>
          Cancel
        </div>
      </div>
    );
  }

  return (
    <div className={menuClass}>
      <div
        className={itemClass}
        onClick={() =>
          (window.location.href = `http://localhost:4000/file/${item.id}?action=download`)
        }
      >
        Download
      </div>
      <div
        className={itemClass}
        onClick={() => openRenameModal("file", item.id, item.name)}
      >
        Rename
      </div>
      <div className={itemClass} onClick={() => setDeleteItem(item)}>
        Delete
      </div>
      <div className={itemClass} onClick={() => openDetailsPopup(item)}>
        Details
      </div>
    </div>
  );
}

export default ContextMenu;
