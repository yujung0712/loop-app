import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Input from "./pages/Input";
import Run from "./pages/Run";
import Result from "./pages/Result";

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 16, display: "flex", gap: 16 }}>
        <Link to="/">홈</Link>
                <Link to="/input/pressure_vessel">입력</Link>
        <Link to="/run/pressure_vessel">실행</Link>
        <Link to="/result/pressure_vessel">결과</Link>
      </nav>
      <div style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/input/:caseId" element={<Input />} />
          <Route path="/run/:caseId" element={<Run />} />
          <Route path="/result/:caseId" element={<Result />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;