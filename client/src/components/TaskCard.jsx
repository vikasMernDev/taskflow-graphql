export default function TaskCard({ task, onEdit, onDelete, onToggle, disabled = false }) {
  const createdAt = new Date(task.createdAt);
  const formattedCreatedAt = Number.isNaN(createdAt.getTime())
    ? "Unknown"
    : createdAt.toLocaleString();

  return (
    <div className={`task-card ${task.completed ? "completed" : ""}`}>
      <div className="task-main">
        <button
          type="button"
          className="task-toggle"
          aria-pressed={task.completed}
          disabled={disabled}
          onClick={() => onToggle(task)}
        >
          {task.completed ? "Undo" : "Done"}
        </button>
        <div>
          <div className="task-title">{task.title}</div>
          <div className="task-meta">
            Created <time dateTime={task.createdAt}>{formattedCreatedAt}</time>
          </div>
        </div>
      </div>
      <div className="task-actions">
        <button type="button" className="button secondary" disabled={disabled} onClick={() => onEdit(task)}>Edit</button>
        <button type="button" className="button danger" disabled={disabled} onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </div>
  );
}
