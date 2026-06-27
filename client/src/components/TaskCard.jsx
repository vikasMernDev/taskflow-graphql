export default function TaskCard({ task, onEdit, onDelete, onToggle }) {
  return (
    <div className={`task-card ${task.completed ? "completed" : ""}`}>
      <div className="task-main">
        <button className="task-toggle" onClick={() => onToggle(task)}>
          {task.completed ? "Undo" : "Done"}
        </button>
        <div>
          <div className="task-title">{task.title}</div>
          <div className="task-meta">Created {new Date(task.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div className="task-actions">
        <button className="button secondary" onClick={() => onEdit(task)}>Edit</button>
        <button className="button danger" onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </div>
  );
}
