import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { LOGIN, REGISTER, GET_ME } from "../auth";
import Card from "../components/Card";
import Button from "../components/Button";
import TextInput from "../components/TextInput";

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [loginMutation] = useMutation(LOGIN, { refetchQueries: [{ query: GET_ME }], awaitRefetchQueries: true });
  const [registerMutation] = useMutation(REGISTER, { refetchQueries: [{ query: GET_ME }], awaitRefetchQueries: true });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    try {
      if (mode === "login") {
        await loginMutation({ variables: { email: form.email, password: form.password } });
        setStatusMessage("Logged in successfully.");
      } else {
        await registerMutation({ variables: { email: form.email, password: form.password } });
        setStatusMessage("Account created successfully.");
      }
      navigate("/tasks");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="page auth-page">
      <Card className="auth-card" title={mode === "login" ? "Welcome back" : "Create an account"} subtitle={mode === "login" ? "Login to manage your tasks." : "Register to start tracking tasks."}>
        {errorMessage && <div className="alert error">{errorMessage}</div>}
        {statusMessage && <div className="alert success">{statusMessage}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <TextInput label="Email">
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </TextInput>
          <TextInput label="Password">
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </TextInput>
          <Button type="submit" variant="primary">{mode === "login" ? "Login" : "Register"}</Button>
        </form>
        <div className="form-footer">
          {mode === "login" ? (
            <p>New here? <Link to="/register">Create an account</Link></p>
          ) : (
            <p>Already have an account? <Link to="/login">Login</Link></p>
          )}
        </div>
      </Card>
    </div>
  );
}
