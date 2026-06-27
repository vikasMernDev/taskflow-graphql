import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client/core";
import { GET_ME, LOGOUT } from "../auth";
import Card from "../components/Card";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import TaskCard from "../components/TaskCard";

const GET_TASKS = gql`
  query GetTasks { tasks { id title completed createdAt } }
`;

const ADD_TASK = gql`
  mutation AddTask($title: String!) { addTask(title: $title) { id title completed createdAt } }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $title: String, $completed: Boolean) { updateTask(id: $id, title: $title, completed: $completed) { id title completed createdAt } }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) { deleteTask(id: $id) }
`;

export default function TasksPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ newTask: "", editId: null, editTitle: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: meData } = useQuery(GET_ME);
  const { data, loading, error: queryError, refetch } = useQuery(GET_TASKS, { fetchPolicy: "network-only" });
  const [addTask] = useMutation(ADD_TASK);
  const [updateTask] = useMutation(UPDATE_TASK);
  const [deleteTask] = useMutation(DELETE_TASK);
  const [logout] = useMutation(LOGOUT, { refetchQueries: [{ query: GET_ME }], awaitRefetchQueries: true });

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!form.newTask.trim()) return;
    setError("");
    try {
      await addTask({ variables: { title: form.newTask.trim() } });
      setForm((prev) => ({ ...prev, newTask: "" }));
      setMessage("Task added successfully.");
      await refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!form.editTitle.trim()) return;
    setError("");
    try {
      await updateTask({ variables: { id: form.editId, title: form.editTitle.trim() } });
      setForm({ newTask: "", editId: null, editTitle: "" });
      setMessage("Task updated.");
      await refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await deleteTask({ variables: { id } });
      setMessage("Task deleted.");
      await refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleCompleted = async (task) => {
    setError("");
    try {
      await updateTask({ variables: { id: task.id, completed: !task.completed } });
      setMessage(task.completed ? "Task marked incomplete." : "Task completed.");
      await refetch();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) return <div className="page center-screen">Loading tasks...</div>;
  if (queryError) return <div className="page center-screen error">{queryError.message}</div>;

  return (
    <div className="page task-page">
      <header className="topbar">
        <div>
          <h2>Task Manager</h2>
          <p className="muted">Logged in as {meData?.me.email}</p>
        </div>
        <button className="button secondary" onClick={handleLogout}>Logout</button>
      </header>

      <div className="panel">
        <Card title="Your Tasks" subtitle="Add, edit, delete, and mark tasks completed." className="task-panel-card">
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          <form className="task-form" onSubmit={form.editId ? handleUpdate : handleAdd}>
            <TextInput label={form.editId ? "Edit task title" : "Add a new task"}>
              <input
                value={form.editId ? form.editTitle : form.newTask}
                onChange={(e) => setForm((prev) => ({ ...prev, [form.editId ? "editTitle" : "newTask"]: e.target.value }))}
                placeholder={form.editId ? "Edit task title" : "Add a new task"}
              />
            </TextInput>
            <div className="task-form-actions">
              <Button type="submit" variant="primary">{form.editId ? "Save" : "Add Task"}</Button>
              {form.editId && <Button type="button" variant="secondary" onClick={() => setForm({ newTask: "", editId: null, editTitle: "" })}>Cancel</Button>}
            </div>
          </form>
        </Card>

        <div className="task-grid">
          {data?.tasks?.length ? data.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(task) => setForm({ newTask: "", editId: task.id, editTitle: task.title })}
              onDelete={handleDelete}
              onToggle={handleToggleCompleted}
            />
          )) : (
            <div className="empty-state">
              <p>No tasks yet.</p>
              <p>Start by adding your first task.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
