import React from "react";
import { getApiMode, setApiMode } from "../apiToggle";

export default function ApiModeToggle() {
  const [mode, setModeState] = React.useState(getApiMode());

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as "real" | "mock";
    setModeState(newMode);
    setApiMode(newMode);
  };

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
      <label style={{ fontSize: 12, marginRight: 8 }}>API Mode:</label>
      <select value={mode} onChange={handleChange} style={{ fontSize: 12, padding: 4 }}>
        <option value="real">Real API</option>
        <option value="mock">Mock Data</option>
      </select>
    </div>
  );
}
