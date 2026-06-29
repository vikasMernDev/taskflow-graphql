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
  const [errorMessage, setErrorMessage] = useState("");

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN, { refetchQueries: [{ query: GET_ME }], awaitRefetchQueries: true });
  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER, { refetchQueries: [{ query: GET_ME }], awaitRefetchQueries: true });
  const submitting = loginLoading || registerLoading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      if (mode === "login") {
        await loginMutation({ variables: { email: form.email, password: form.password } });
      } else {
        await registerMutation({ variables: { email: form.email, password: form.password } });
      }
      navigate("/tasks");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="page auth-page">
      <Card className="auth-card" headingLevel="h1" title={mode === "login" ? "Welcome back" : "Create an account"} subtitle={mode === "login" ? "Login to manage your tasks." : "Register to start tracking tasks."}>
        {errorMessage && <div className="alert error" role="alert">{errorMessage}</div>}
        <form onSubmit={handleSubmit} className="form-grid" aria-busy={submitting}>
          <TextInput label="Email">
            <input type="email" autoComplete="email" maxLength={254} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </TextInput>
          <TextInput label="Password">
            <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </TextInput>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "login" ? "Login" : "Register"}
          </Button>
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
