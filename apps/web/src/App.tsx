import { useState } from "react";
import testkubeLogo from "./assets/testkube.svg";
import reactLogo from "./assets/react.svg";
import "./App.css";

function App() {
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-col items-center">
        <div className="flex gap-5 items-center">
          <a href="https://testkube.io" target="_blank">
            <img src={testkubeLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Testkube + React</h1>
      </div>

      <div className="w-full flex flex-col md:flex-row items-center gap-3">
        <Counter />
        <HelloServer />
        <HelloDatabase />
      </div>

      <p className="read-the-docs">
        Run TestWorkflows to test this application.
      </p>
    </div>
  );
}

export default App;

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="card">
      <h2 className="self-start text-lg font-bold">Webapp counts</h2>
      <button data-cy="count" onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </div>
  );
}

function HelloServer() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [response, setResponse] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const url = new URL("/api/hello", window.location.origin);
    if (name) {
      url.searchParams.append("name", name);
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setResponse(data.message);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="card">
      <h2 className="self-start  text-lg font-bold">Server says hello</h2>

      <button data-cy="greet-api" onClick={onSubmit}>
        Greet
      </button>

      <div className="flex flex-col items-start">
        <label>Your name:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col items-start">
        <label>Server response:</label>
        <div>
          {loading ? (
            <code>loading…</code>
          ) : error ? (
            <code>error!</code>
          ) : (
            <code>{response}</code>
          )}
        </div>
      </div>
    </div>
  );
}

function HelloDatabase() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [response, setResponse] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    fetch("/api/hello-pg")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setResponse(data.message);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="card">
      <h2 className="self-start  text-lg font-bold">Database says hello</h2>

      <button data-cy="greet-db" onClick={onSubmit}>
        Greet
      </button>

      <div className="flex flex-col items-start">
        <label>Server response:</label>
        <div>
          {loading ? (
            <code>loading…</code>
          ) : error ? (
            <code>error!</code>
          ) : (
            <code>{response}</code>
          )}
        </div>
      </div>
    </div>
  );
}
