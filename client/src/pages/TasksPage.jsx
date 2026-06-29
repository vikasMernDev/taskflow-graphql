import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client/core";
import { LOGOUT } from "../auth";
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

const TASK_FRAGMENT = gql`
  fragment TaskFields on Task { id title completed createdAt }
`;

export default function TasksPage({ user }) {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [form, setForm] = useState({ newTask: "", editId: null, editTitle: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data, loading, error: queryError } = useQuery(GET_TASKS, { fetchPolicy: "network-only" });
  const [addTask, { loading: adding }] = useMutation(ADD_TASK, {
    update(cache, { data: mutationData }) {
      const task = mutationData?.addTask;
      if (!task) return;
      const taskReference = cache.writeFragment({ data: task, fragment: TASK_FRAGMENT });
      cache.modify({ fields: { tasks: (existing = []) => [taskReference, ...existing] } });
    },
  });
  const [updateTask, { loading: updating }] = useMutation(UPDATE_TASK);
  const [deleteTask, { loading: deleting }] = useMutation(DELETE_TASK, {
    update(cache, { data: mutationData }, { variables }) {
      if (!mutationData?.deleteTask) return;
      cache.modify({
        fields: {
          tasks(existing = [], { readField }) {
            return existing.filter((taskReference) => readField("id", taskReference) !== variables.id);
          },
        },
      });
      const cacheId = cache.identify({ __typename: "Task", id: variables.id });
      if (cacheId) cache.evict({ id: cacheId });
      cache.gc();
    },
  });
  const [logout, { loading: loggingOut }] = useMutation(LOGOUT);
  const mutating = adding || updating || deleting || loggingOut;

  const beginAction = () => {
    setError("");
    setMessage("");
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!form.newTask.trim()) return;
    beginAction();
    try {
      await addTask({ variables: { title: form.newTask.trim() } });
      setForm((prev) => ({ ...prev, newTask: "" }));
      setMessage("Task added successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!form.editTitle.trim()) return;
    beginAction();
    try {
      await updateTask({ variables: { id: form.editId, title: form.editTitle.trim() } });
      setForm((prev) => ({ ...prev, editId: null, editTitle: "" }));
      setMessage("Task updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    beginAction();
    try {
      await deleteTask({ variables: { id } });
      setMessage("Task deleted.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleCompleted = async (task) => {
    beginAction();
    try {
      await updateTask({ variables: { id: task.id, completed: !task.completed } });
      setMessage(task.completed ? "Task marked incomplete." : "Task completed.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    beginAction();
    try {
      await logout();
      await apolloClient.clearStore();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page center-screen">Loading tasks...</div>;
  if (queryError) return <div className="page center-screen error">{queryError.message}</div>;

  return (
    <div className="page task-page">
      <header className="topbar">
        <div>
          <h1>Task Manager</h1>
          <p className="muted">Logged in as {user.email}</p>
        </div>
        <button type="button" className="button secondary" disabled={mutating} onClick={handleLogout}>Logout</button>
      </header>

      <div className="panel">
        <Card title="Your Tasks" subtitle="Add, edit, delete, and mark tasks completed." className="task-panel-card">
          {error && <div className="alert error" role="alert">{error}</div>}
          {message && <div className="alert success" role="status" aria-live="polite">{message}</div>}

          <form className="task-form" aria-busy={adding || updating} onSubmit={form.editId ? handleUpdate : handleAdd}>
            <TextInput label={form.editId ? "Edit task title" : "Add a new task"}>
              <input
                value={form.editId ? form.editTitle : form.newTask}
                onChange={(e) => setForm((prev) => ({ ...prev, [form.editId ? "editTitle" : "newTask"]: e.target.value }))}
                placeholder={form.editId ? "Edit task title" : "Add a new task"}
                maxLength={200}
                required
              />
            </TextInput>
            <div className="task-form-actions">
              <Button type="submit" variant="primary" disabled={mutating}>{form.editId ? "Save" : "Add Task"}</Button>
              {form.editId && <Button type="button" variant="secondary" disabled={mutating} onClick={() => setForm((prev) => ({ ...prev, editId: null, editTitle: "" }))}>Cancel</Button>}
            </div>
          </form>
        </Card>

        <div className="task-grid">
          {data?.tasks?.length ? data.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(task) => setForm((prev) => ({ ...prev, editId: task.id, editTitle: task.title }))}
              onDelete={handleDelete}
              onToggle={handleToggleCompleted}
              disabled={mutating}
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
