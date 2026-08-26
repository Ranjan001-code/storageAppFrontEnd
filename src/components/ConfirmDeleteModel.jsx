function ConfirmDeleteModal({ item, onConfirm, onCancel }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md w-[90%] max-w-md border dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Deletion</h2>
        <p className="text-sm mb-6 text-gray-600 dark:text-slate-300">
          Are you sure you want to delete the "{item.name}"{" "}
          {item.isDirectory ? "folder" : "file"}?
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={() => onConfirm(item)}
          >
            Yes, Delete
          </button>
          <button
            className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
