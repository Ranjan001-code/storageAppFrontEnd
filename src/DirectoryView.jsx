import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DirectoryHeader from "./components/DirectoryHeader";
import CreateDirectoryModal from "./components/CreateDirectoryModal";
import RenameModal from "./components/RenameModal";
import DirectoryList from "./components/DirectoryList";
import { DirectoryContext } from "./context/DirectoryContext";

import {
  getDirectoryItems,
  createDirectory,
  deleteDirectory,
  renameDirectory,
} from "./api/directoryApi";

import {
  deleteFile,
  renameFile,
  uploadComplete,
  uploadInitiate,
} from "./api/fileApi";
import DetailsPopup from "./components/DetailsPopup";
import ConfirmDeleteModal from "./components/ConfirmDeleteModel"; 
import { fetchUser } from "./api/userApi";

function DirectoryView() {
  const { dirId } = useParams();
  const navigate = useNavigate();

  const [directoryName, setDirectoryName] = useState("My Drive");
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateDirModal, setShowCreateDirModal] = useState(false);
  const [newDirname, setNewDirname] = useState("New Folder");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const fileInputRef = useRef(null);

  // Single-file upload state
  const [uploadItem, setUploadItem] = useState(null);
  const xhrRef = useRef(null);

  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [detailsItem, setDetailsItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const openDetailsPopup = (item) => setDetailsItem(item);
  const closeDetailsPopup = () => setDetailsItem(null);

  // ─── Load Directory ──────────────────────────────────────────

  const loadDirectory = async () => {
    try {
      const data = await getDirectoryItems(dirId);
      setDirectoryName(dirId ? data.name : "My Drive");
      setDirectoriesList([...data.directories].reverse());
      setFilesList([...data.files].reverse());
      setErrorMessage("");
    } catch (err) {
      console.error("Load directory error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setErrorMessage(err.response?.data?.error || err.message || "Failed to load directory");
      }
    }
  };

  // ─── Effects ──────────────────────────────────────────────────

  useEffect(() => {
    loadDirectory();
    setActiveContextMenu(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirId]);

  useEffect(() => {
    const handleDocumentClick = () => setActiveContextMenu(null);
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // ─── Helper Functions ────────────────────────────────────────

  function getFileIcon(filename) {
    if (!filename) return "alt";
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const iconMap = {
      pdf: "pdf",
      png: "image",
      jpg: "image",
      jpeg: "image",
      gif: "image",
      webp: "image",
      svg: "image",
      mp4: "video",
      mov: "video",
      avi: "video",
      mkv: "video",
      zip: "archive",
      rar: "archive",
      tar: "archive",
      gz: "archive",
      "7z": "archive",
      js: "code",
      jsx: "code",
      ts: "code",
      tsx: "code",
      html: "code",
      css: "code",
      py: "code",
      java: "code",
      cpp: "code",
      c: "code",
      go: "code",
      rs: "code",
      json: "code",
      xml: "code",
      yaml: "code",
      yml: "code",
      md: "code",
      txt: "code",
      doc: "document",
      docx: "document",
      xls: "document",
      xlsx: "document",
      ppt: "document",
      pptx: "document",
    };
    return iconMap[ext] || "alt";
  }

  function handleRowClick(type, id) {
    if (type === "directory") {
      navigate(`/directory/${id}`);
    } else {
      // For files, open in new tab or download
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:4000";
      window.open(`${backendUrl}/file/${id}`, "_blank");
    }
  }

  // ─── File Upload ─────────────────────────────────────────────

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadItem?.isUploading) {
      setErrorMessage("An upload is already in progress. Please wait.");
      setTimeout(() => setErrorMessage(""), 3000);
      e.target.value = "";
      return;
    }

    const tempItem = {
      file,
      name: file.name,
      size: file.size,
      id: `temp-${Date.now()}`,
      isUploading: true,
      progress: 0,
    };

    try {
      const data = await uploadInitiate({
        name: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
        parentDirId: dirId,
      });

      const { uploadSignedUrl, fileId } = data;
      console.log("Upload initiated:", { uploadSignedUrl, fileId });

      // Optimistically show the file in the list
      setFilesList((prev) => [tempItem, ...prev]);
      setUploadItem(tempItem);
      e.target.value = "";

      await startUpload({ item: tempItem, uploadUrl: uploadSignedUrl, fileId });
    } catch (err) {
      console.error("Upload init error:", err);
      setErrorMessage(err.response?.data?.error || "Failed to initiate upload");
      setTimeout(() => setErrorMessage(""), 3000);
      // Remove temp item from the list
      setFilesList((prev) => prev.filter((f) => f.id !== tempItem.id));
    }
  }

  function startUpload({ item, uploadUrl, fileId }) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open("PUT", uploadUrl);

      xhr.upload.addEventListener("progress", (evt) => {
        if (evt.lengthComputable) {
          const progress = (evt.loaded / evt.total) * 100;
          setUploadItem((prev) => (prev ? { ...prev, progress } : prev));
        }
      });

      xhr.onload = async () => {
        if (xhr.status === 200 || xhr.status === 204) {
          try {
            await uploadComplete(fileId);
            setUploadItem(null);
            await loadDirectory();
            resolve();
          } catch (err) {
            console.error("Upload complete error:", err);
            setErrorMessage("Failed to complete upload");
            setUploadItem(null);
            reject(err);
          }
        } else {
          console.error("Upload failed:", xhr.status, xhr.responseText);
          setErrorMessage("File upload failed");
          setUploadItem(null);
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => {
        console.error("XHR error:", xhr.statusText);
        setErrorMessage("Something went wrong during upload!");
        setFilesList((prev) => prev.filter((f) => f.id !== item.id));
        setUploadItem(null);
        reject(new Error("XHR error"));
      };

      xhr.onabort = () => {
        setFilesList((prev) => prev.filter((f) => f.id !== item.id));
        setUploadItem(null);
        reject(new Error("Upload aborted"));
      };

      xhr.send(item.file);
    });
  }

  function handleCancelUpload(tempId) {
    if (uploadItem && uploadItem.id === tempId && xhrRef.current) {
      xhrRef.current.abort();
    }
    setFilesList((prev) => prev.filter((f) => f.id !== tempId));
    setUploadItem(null);
  }

  // ─── CRUD Operations ─────────────────────────────────────────

  async function confirmDelete(item) {
    try {
      if (item.isDirectory) {
        await deleteDirectory(item.id);
      } else {
        await deleteFile(item.id);
      }
      setDeleteItem(null);
      await loadDirectory();
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMessage(err.response?.data?.error || err.message || "Failed to delete");
    }
  }

  async function handleCreateDirectory(e) {
    e.preventDefault();
    if (!newDirname.trim()) {
      setErrorMessage("Folder name cannot be empty");
      return;
    }
    try {
      await createDirectory(dirId, newDirname.trim());
      setNewDirname("New Folder");
      setShowCreateDirModal(false);
      await loadDirectory();
    } catch (err) {
      console.error("Create directory error:", err);
      setErrorMessage(err.response?.data?.error || err.message || "Failed to create folder");
    }
  }

  function openRenameModal(type, id, currentName) {
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName || "");
    setShowRenameModal(true);
  }

  async function handleRenameSubmit(e) {
    e.preventDefault();
    if (!renameValue.trim()) {
      setErrorMessage("Name cannot be empty");
      return;
    }
    try {
      if (renameType === "file") {
        await renameFile(renameId, renameValue.trim());
      } else {
        await renameDirectory(renameId, renameValue.trim());
      }

      setShowRenameModal(false);
      setRenameValue("");
      setRenameType(null);
      setRenameId(null);
      await loadDirectory();
    } catch (err) {
      console.error("Rename error:", err);
      setErrorMessage(err.response?.data?.error || err.message || "Failed to rename");
    }
  }

  // ─── Context Menu Handlers ───────────────────────────────────

  const handleContextMenu = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveContextMenu((prev) => (prev === id ? null : id));
  };

  // ─── Render ───────────────────────────────────────────────────

  const combinedItems = [
    ...directoriesList.map((d) => ({ ...d, isDirectory: true })),
    ...filesList.map((f) => ({ ...f, isDirectory: false })),
  ];

  const isUploading = !!uploadItem?.isUploading;
  const progressMap = uploadItem ? { [uploadItem.id]: uploadItem.progress || 0 } : {};

  const isDisabled = errorMessage === "Directory not found or you do not have access to it!";

  return (
    <DirectoryContext.Provider
      value={{
        handleRowClick,
        activeContextMenu,
        handleContextMenu,
        getFileIcon,
        isUploading,
        progressMap,
        handleCancelUpload,
        setDeleteItem,
        openRenameModal,
        openDetailsPopup,
      }}
    >
      <div className="mx-2 md:mx-4">
        {errorMessage && errorMessage !== "Directory not found or you do not have access to it!" && (
          <div className="error-message text-red-500 text-xs text-center mt-1 bg-red-50/50 px-4 py-2 rounded-lg border border-red-100/60 mb-2">
            {errorMessage}
          </div>
        )}

        <DirectoryHeader
          directoryName={directoryName}
          onCreateFolderClick={() => setShowCreateDirModal(true)}
          onUploadFilesClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          disabled={isDisabled}
        />

        {showCreateDirModal && (
          <CreateDirectoryModal
            newDirname={newDirname}
            setNewDirname={setNewDirname}
            onClose={() => {
              setShowCreateDirModal(false);
              setNewDirname("New Folder");
            }}
            onCreateDirectory={handleCreateDirectory}
          />
        )}

        {showRenameModal && (
          <RenameModal
            renameType={renameType}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            onClose={() => {
              setShowRenameModal(false);
              setRenameValue("");
              setRenameType(null);
              setRenameId(null);
            }}
            onRenameSubmit={handleRenameSubmit}
          />
        )}

        {detailsItem && (
          <DetailsPopup item={detailsItem} onClose={closeDetailsPopup} />
        )}

        {combinedItems.length === 0 ? (
          isDisabled ? (
            <p className="text-center text-gray-600 dark:text-slate-400 mt-4 italic">
              Directory not found or you do not have access to it!
            </p>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-500 dark:text-slate-400 text-lg">This folder is empty</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
                Upload a file or create a folder to get started
              </p>
            </div>
          )
        ) : (
          <DirectoryList items={combinedItems} />
        )}

        {deleteItem && (
          <ConfirmDeleteModal
            item={deleteItem}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteItem(null)}
          />
        )}
      </div>
    </DirectoryContext.Provider>
  );
}

export default DirectoryView;