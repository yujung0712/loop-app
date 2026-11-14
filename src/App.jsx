import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Input from "./pages/Input";
import Run from "./pages/Run";
import Result from "./pages/Result";
import { DEMO } from "./adapters";

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 16, display: "flex", gap: 16, alignItems: "center" }}>
        <Link to="/" style={{ textDecoration: "none", fontWeight: "bold", fontSize: 18 }}>
          LOOP · 홈
        </Link>
        {DEMO && (
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 10,
              background: "#fff4e5",
              color: "#ef6c00",
            }}
          >
            데모 버전
          </span>
        )}
      </nav>
      <div style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* 데모 버전에서는 입력과 실행 화면 대신 홈으로 보내요 */}
          <Route
            path="/input/:caseId"
            element={DEMO ? <Navigate to="/" replace /> : <Input />}
          />
          <Route
            path="/run/:caseId"
            element={DEMO ? <Navigate to="/" replace /> : <Run />}
          />
          <Route path="/result/:caseId" element={<Result />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;