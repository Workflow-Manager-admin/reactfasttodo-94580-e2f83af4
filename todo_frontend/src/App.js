import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// CONFIG
const API_BASE_URL = "http://localhost:8000"; // Can be changed for production
const COLORS = {
  primary: "#2563eb",
  secondary: "#64748b",
  accent: "#38bdf8",
};

// =====================
// Task API functions
// =====================
// PUBLIC_INTERFACE
async function fetchTasks(setLoading, setError) {
  setLoading(true);
  setError("");
  try {
    const res = await fetch(`${API_BASE_URL}/tasks`);
    if (!res.ok) throw new Error("Failed to fetch tasks.");
    const data = await res.json();
    setLoading(false);
    return data;
  } catch (e) {
    setError(e.message);
    setLoading(false);
    return [];
  }
}
// PUBLIC_INTERFACE
async function createTask(task, onSuccess, onError) {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error adding task");
    }
    const data = await res.json();
    onSuccess(data);
  } catch (e) {
    onError(e.message);
  }
}
// PUBLIC_INTERFACE
async function updateTask(task, onSuccess, onError) {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error updating task");
    }
    const data = await res.json();
    onSuccess(data);
  } catch (e) {
    onError(e.message);
  }
}
// PUBLIC_INTERFACE
async function deleteTask(id, onSuccess, onError) {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error deleting task");
    }
    onSuccess();
  } catch (e) {
    onError(e.message);
  }
}
// PUBLIC_INTERFACE
async function toggleTaskComplete(id, onSuccess, onError) {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/toggle`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Error toggling complete status");
    }
    const data = await res.json();
    onSuccess(data);
  } catch (e) {
    onError(e.message);
  }
}

// Simple modern spinner
function Spinner({ color }) {
  return (
    <div className="spinner" style={{ borderTopColor: color || COLORS.primary }} aria-label="Loading"></div>
  );
}

// ===================
// TaskForm component
// ===================
// PUBLIC_INTERFACE
function TaskForm({ onSubmit, submitting, initial, onCancel, error }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setTitle(initial?.title || "");
    setDesc(initial?.description || "");
    setFormError("");
  }, [initial]);

  // Validate before submit
  function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (title.length > 80) {
      setFormError("Title must be less than 80 characters.");
      return;
    }
    if (desc.length > 200) {
      setFormError("Description must be under 200 characters.");
      return;
    }
    onSubmit({
      title: title.trim(),
      description: desc.trim(),
    });
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        className="task-input"
        autoFocus
        placeholder="Task title"
        value={title}
        maxLength={80}
        onChange={e => setTitle(e.target.value)}
        disabled={submitting}
        aria-label="Task title"
        data-testid="add-title"
      />
      <input
        className="task-input"
        placeholder="Description (optional)"
        value={desc}
        maxLength={200}
        onChange={e => setDesc(e.target.value)}
        disabled={submitting}
        aria-label="Task description"
      />
      <button
        className="task-btn"
        type="submit"
        style={{ background: COLORS.primary }}
        disabled={submitting}
      >
        {submitting ? <Spinner color="#fff" /> : initial ? "Save" : "Add"}
      </button>
      {onCancel && (
        <button className="task-btn secondary" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      )}
      <div className="form-error" aria-live="polite">{formError || error}</div>
    </form>
  );
}

// =====================
// TaskItem component
// =====================
// PUBLIC_INTERFACE
function TaskItem({ task, onToggle, onEdit, onDelete, loading }) {
  return (
    <div className={`task-item ${task.completed ? "completed" : ""}`}>
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task)}
          disabled={loading}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        />
      </div>
      <div className="task-main">
        <div className="task-title-desc">
          <span className="task-title" title={task.title}>{task.title}</span>
          {task.description && <span className="task-desc" title={task.description}> — {task.description}</span>}
        </div>
      </div>
      <div className="task-actions">
        <button
          className="icon-btn"
          title="Edit"
          onClick={() => onEdit(task)}
          aria-label="Edit"
          disabled={loading}
        >
          ✏️
        </button>
        <button
          className="icon-btn"
          title="Delete"
          onClick={() => onDelete(task)}
          aria-label="Delete"
          disabled={loading}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// =====================
// TaskList component
// =====================
// PUBLIC_INTERFACE
function TaskList({ tasks, onToggle, onEdit, onDelete, loading, filter }) {
  const filtered =
    filter === "all"
      ? tasks
      : filter === "completed"
      ? tasks.filter(t => t.completed)
      : tasks.filter(t => !t.completed);

  // Sort: incomplete tasks first, then by id DESC
  const sorted = [...filtered].sort((a, b) => a.completed - b.completed || b.id - a.id);

  return (
    <div>
      {sorted.length === 0 && <div className="empty-text">No tasks</div>}
      {sorted.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          loading={loading}
        />
      ))}
    </div>
  );
}

// ========================
// Main App component
// ========================
// PUBLIC_INTERFACE
export default function App() {
  // THEME
  const [theme] = useState("light"); // Only light theme per requirements

  // STATE
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "completed", "incomplete"

  // LOAD tasks
  const loadTasks = useCallback(() => {
    fetchTasks(setLoading, setError).then(t => setTasks(t));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    loadTasks();
  }, [loadTasks, theme]);

  // NOTIFY helpers
  function showNotification(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2000);
  }

  // CRUD
  function handleAddTask(newTask) {
    setActionLoading(true);
    setFormError("");
    createTask(
      newTask,
      t => {
        setTasks(prev => [t, ...prev]);
        setActionLoading(false);
        showNotification("Task added!");
      },
      msg => {
        setActionLoading(false);
        setFormError(msg);
      }
    );
  }
  function handleEditTask(edited) {
    setActionLoading(true);
    setFormError("");
    updateTask(
      { ...editTask, ...edited },
      updated => {
        setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        setEditTask(null);
        setShowModal(false);
        setActionLoading(false);
        showNotification("Task updated!");
      },
      msg => {
        setFormError(msg);
        setActionLoading(false);
      }
    );
  }
  function startEdit(task) {
    setEditTask(task);
    setShowModal(true);
    setFormError("");
  }
  function cancelEdit() {
    setEditTask(null);
    setShowModal(false);
    setFormError("");
  }
  function handleDeleteTask(task) {
    if (!window.confirm("Delete this task?")) return;
    setActionLoading(true);
    deleteTask(
      task.id,
      () => {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setActionLoading(false);
        showNotification("Task deleted!");
      },
      msg => {
        setActionLoading(false);
        setError(msg);
      }
    );
  }
  function handleToggle(task) {
    setActionLoading(true);
    toggleTaskComplete(
      task.id,
      updated => {
        setTasks(prev =>
          prev.map(t => (t.id === updated.id ? updated : t))
        );
        setActionLoading(false);
        showNotification(task.completed ? "Marked incomplete" : "Marked complete!");
      },
      msg => {
        setActionLoading(false);
        setError(msg);
      }
    );
  }

  // Filter status
  function FilterTabs() {
    return (
      <div className="filter-tabs" style={{ margin: "0 0 1.5rem 0" }}>
        {[
          { key: "all", label: "All" },
          { key: "completed", label: "Completed" },
          { key: "incomplete", label: "Incomplete" },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn${filter === tab.key ? " active" : ""}`}
            style={{
              color: filter === tab.key ? "#fff" : COLORS.secondary,
              background: filter === tab.key ? COLORS.primary : "#e7eefe",
              borderColor: COLORS.primary,
            }}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="app-root" style={{ minHeight: '100vh', background: "#fff" }}>
      <header className="app-header" style={{
        background: "#f8fafc",
        borderBottom: `1px solid ${COLORS.secondary}`,
        padding: "1.8rem 0 1.2rem 0",
        marginBottom: "1.2rem",
        boxShadow: "0 2px 16px rgba(40,99,250,0.02)",
      }}>
        <h1 className="app-title" style={{
          color: COLORS.primary,
          fontWeight: 900,
          letterSpacing: "-2px",
          fontSize: "2.2rem",
          marginBottom: 0,
          lineHeight: 1.1
        }}>Todo List</h1>
        <div className="app-subtitle" style={{ color: COLORS.secondary, fontSize: "1.18rem", marginTop: ".2rem" }}>
          Minimal, modern &mdash; <span style={{ color: COLORS.accent }}>FastAPI + React</span>
        </div>
      </header>

      <main className="main-area" style={{ maxWidth: "540px", margin: "0 auto", padding: "0 1rem 2.5rem" }}>
        <section
          className="add-task-section"
          style={{
            border: `1.5px solid ${COLORS.secondary}22`,
            background: "#f9fafb",
            borderRadius: 14,
            padding: "1.3rem 1.3rem 1rem 1.3rem",
            marginBottom: "1.7rem",
            boxShadow: "0 1px 4px rgba(100,100,100,0.03)",
          }}
        >
          <h2 style={{ margin: 0, color: COLORS.primary, fontSize: "1.27rem", fontWeight: 600, marginBottom: ".6rem", letterSpacing: "-1px" }}>Add new task</h2>
          <TaskForm
            onSubmit={handleAddTask}
            submitting={actionLoading}
            error={formError}
          />
        </section>

        <section
          className="task-list-section"
          style={{ marginTop: "1.5rem" }}
        >
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <h2 style={{ color: COLORS.primary, fontWeight: 700, fontSize: 20, margin:0, letterSpacing:"-1px" }}>Tasks</h2>
            <FilterTabs />
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
              <Spinner color={COLORS.primary} />
            </div>
          ) : error ? (
            <div role="alert" style={{ color: "#b00", marginTop: "16px" }}>{error}</div>
          ) : (
            <TaskList
              tasks={tasks}
              onToggle={handleToggle}
              onEdit={startEdit}
              onDelete={handleDeleteTask}
              loading={actionLoading}
              filter={filter}
            />
          )}
        </section>
      </main>

      {/* Edit Modal */}
      {showModal &&
        <div className="modal-bg" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h2 style={{ color: COLORS.primary, marginTop: 0, fontWeight:700, fontSize:"1.16rem" }}>Edit Task</h2>
            <TaskForm
              onSubmit={handleEditTask}
              submitting={actionLoading}
              initial={editTask}
              error={formError}
              onCancel={cancelEdit}
            />
          </div>
        </div>
      }

      {/* Feedback notification */}
      {notification && (
        <div className="notif" style={{ background: COLORS.primary }}>
          {notification}
        </div>
      )}

      {/* App credits */}
      <footer className="app-footer" style={{
        textAlign: "center",
        color: COLORS.secondary,
        fontSize: ".93rem",
        marginTop: 36,
        padding: "18px 0 0"
      }}>
        <span>Powered by React & FastAPI</span>
      </footer>
    </div>
  );
}

// ========== STYLES ==========

/*
 * All additional app UI classes for modern/minimal/clean appearance.
 * Further overrides/additions come after built-in App.css base.
 */

/* Spinner */
const styleSheet = `
.spinner {
  width: 28px;
  height: 28px;
  border: 3.5px solid #e0e7ef;
  border-radius: 50%;
  border-top: 3.5px solid ${COLORS.primary};
  animation: spin 1.1s linear infinite;
  margin: 0 auto;
}
@keyframes spin {
  0% { transform: rotate(0);}
  100%{ transform: rotate(360deg);}
}

/* Buttons */
.task-btn, .icon-btn {
  border: none;
  border-radius: 8px;
  background: ${COLORS.primary};
  color: #fff;
  font-weight: 600;
  padding: 9px 22px;
  margin: 0 .4rem 0 0;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: .7rem;
  transition: background .18s, color .18s;
  outline: none;
  box-shadow: 0 2px 8px rgba(50,120,228,0.04);
  display: inline-block;
}
.task-btn.secondary {
  background: #e7eefe;
  color: ${COLORS.primary};
  border: 1.5px solid ${COLORS.primary};
}
.task-btn:disabled, .icon-btn:disabled {
  opacity: 0.8; cursor: not-allowed;
}
.icon-btn {
  padding: 7px 8px;
  margin-left: 4px;
  font-size: 1.07rem;
  border: none;
  background: none;
  color: ${COLORS.secondary};
}

.icon-btn:hover:not(:disabled) {
  color: ${COLORS.primary};
  transform: translateY(-2px);
  background: #e7eefe;
}
.icon-btn:active {
  color: ${COLORS.accent};
}

/* Forms */
.task-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: .3rem;
}
.task-input {
  flex: 1 1 36%;
  padding: 10px;
  font-size: 1rem;
  border: 1.3px solid #cfd8e3;
  border-radius: 8px;
  margin-bottom: .7rem;
  min-width: 120px;
  background: #fff;
  outline: none;
  transition: border-color .15s;
}
.task-input:focus { border-color: ${COLORS.accent}; }
.form-error {
  color: #b91c1c;
  width: 100%;
  text-align: left;
  min-height: 21px;
  font-size: .92rem;
  margin: 0 0 7px 2px;
}

/* Lists */
.task-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f1f3;
  padding: 11px 0;
  font-size: 1.04rem;
  gap: 1rem;
  transition: background .15s;
  border-radius: 6px;
}
.task-item.completed {
  color: #9ca3af;
  text-decoration: line-through;
  background: #f8fafc;
}
.task-checkbox {
  margin-right: 3px;
  display:flex;align-items:center
}
.task-checkbox input[type="checkbox"] {
  width: 21px; height: 21px;
  accent-color: ${COLORS.primary};
}
.task-title, .task-desc {
  display: inline-block;
  word-break: break-word;
}
.task-title { font-weight: 600; font-size: 1.05em; }
.task-desc { color: ${COLORS.secondary}; font-size: .98em; margin-left: 2px; }

/* Modal */
.modal-bg {
  position: fixed;
  top: 0; left:0; right:0; bottom:0;
  background: rgba(36,46,68, 0.12);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #fff;
  min-width: 310px;
  min-height: 130px;
  padding: 2.1rem 1.9rem 1.1rem;
  border-radius: 14px;
  box-shadow: 0 14px 40px rgba(40,99,250,0.11);
  z-index: 101;
}

/* Tabs */
.filter-tabs {
  display: flex;
  gap: .7rem;
}
.tab-btn {
  background: #e7eefe;
  color: ${COLORS.secondary};
  font-weight: 600;
  border: 1.5px solid ${COLORS.primary};
  border-radius: 20px;
  padding: .5em 1.5em;
  cursor: pointer;
  margin-top:0;
  margin-bottom:0;
  transition: background .13s,color .13s;
  font-size: 1rem;
}
.tab-btn.active, .tab-btn:hover {
  background: ${COLORS.primary};
  color: #fff;
}

/* Empty states */
.empty-text {
  color: ${COLORS.secondary};
  text-align: center;
  padding: 23px 0 15px 0;
  font-size: 1.06rem;
}

/* Notification */
.notif {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  background: ${COLORS.primary};
  padding: 13px 40px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 1.09rem;
  box-shadow: 0 3px 20px rgba(40,99,250,0.08);
  z-index: 150;
  opacity: 0.97;
}

/* Misc */
.app-title { font-family: inherit; }
@media (max-width:700px) {
  .app-title{ font-size:1.3rem;}
  .main-area{padding:0 2vw;}
}
@media (max-width:500px) {
  .modal-content{ min-width:170px;padding: 1rem; }
  .task-input{font-size:.95rem;}
  .task-btn{font-size:.96rem;}
}
`;

if (typeof document !== "undefined") {
  // Inject style tag only once
  const id = "todo-custom-css";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = styleSheet;
    document.head.appendChild(style);
  }
}
