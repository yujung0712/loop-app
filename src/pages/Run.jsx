import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CASE_FILES, adaptCase } from "../adapters";

const STEPS = [
  "입력",
  "형상 생성",
  "메시 크기",
  "메시 생성",
  "해석",
  "허용응력 평가",
  "결과 출력",
];
const SUB = 5; // 설계 하나를 평가할 때 거치는 단계 수 (②~⑥)

function pad(n) {
  return String(n).padStart(3, "0");
}

function Run() {
  const { caseId } = useParams();
  const [view, setView] = useState(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);

  // 케이스가 바뀌면 파일을 다시 읽고 처음 상태로
  useEffect(() => {
    setView(null);
    setError(false);
    setTick(0);
    setRunning(false);
    const files = CASE_FILES[caseId];
    if (!files) return;
    fetch(files.json)
      .then((res) => {
        if (!res.ok) throw new Error("load failed");
        return res.json();
      })
      .then((json) => setView(adaptCase(caseId, json)))
      .catch(() => setError(true));
  }, [caseId]);

  const total = view ? view.history.length : 0;
  const t = Math.min(tick, total * SUB);
  const finished = view !== null && t >= total * SUB;

  // 0.2초마다 한 단계씩 진행
  useEffect(() => {
    if (!running || !view) return;
    const id = setInterval(() => setTick((x) => x + 1), 200);
    return () => clearInterval(id);
  }, [running, view]);

  // 끝나면 멈춤
  useEffect(() => {
    if (finished) setRunning(false);
  }, [finished]);

  if (!CASE_FILES[caseId]) return <p>아직 준비되지 않은 케이스예요.</p>;
  if (error) return <p>파일을 불러오지 못했어요.</p>;
  if (!view) return <p>불러오는 중...</p>;

  const evalIdx = Math.floor(t / SUB);
  const sub = t % SUB;

  // 지금 어느 단계인지
  let active;
  if (finished) active = STEPS.length;
  else if (t === 0 && !running) active = 0;
  else active = sub + 1;

  const done = view.history.slice(0, evalIdx);
  const current = !finished && (running || t > 0) ? view.history[evalIdx] : null;
  const percent = total === 0 ? 0 : Math.round((evalIdx / total) * 100);

  const btn = {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #bbb",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
  };

  return (
    <div>
      <h2>③ 실행 · 진행 · {view.title}</h2>

      {/* 케이스 바꿔 보기 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/run/pressure_vessel">압력용기</Link>
        <Link to="/run/desk">책상</Link>
      </div>

      <p style={{ color: "#888", fontSize: 13 }}>
        ※ 서버 연결 전이라, 이미 받은 해석 기록을 재생하는 시뮬레이션이에요.
      </p>

      {/* 7단계 표시줄 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "16px 0" }}>
        {STEPS.map((name, i) => {
          const isDone = i < active;
          const isActive = i === active;
          return (
            <div
              key={name}
              style={{
                padding: "6px 12px",
                borderRadius: 16,
                fontSize: 13,
                border: "1px solid " + (isActive ? "#1565c0" : "#ddd"),
                background: isDone ? "#e8f5e9" : isActive ? "#e3f2fd" : "white",
                color: isDone ? "#2e7d32" : isActive ? "#1565c0" : "#999",
                fontWeight: isActive ? "bold" : "normal",
              }}
            >
              {isDone ? "✓" : i + 1} {name}
            </div>
          );
        })}
      </div>

      {/* 진행률 */}
      <div style={{ marginBottom: 4, fontSize: 14 }}>
        해석 {evalIdx} / {total}회 ({percent}%)
      </div>
      <div style={{ height: 10, background: "#eee", borderRadius: 5 }}>
        <div
          style={{
            height: 10,
            width: percent + "%",
            background: "#1565c0",
            borderRadius: 5,
            transition: "width 0.2s",
          }}
        />
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {!running && !finished && (
          <button style={btn} onClick={() => setRunning(true)}>
            {t === 0 ? "▶ 시작" : "▶ 계속"}
          </button>
        )}
        {running && (
          <button style={btn} onClick={() => setRunning(false)}>
            ⏸ 일시정지
          </button>
        )}
        {t > 0 && (
          <button
            style={btn}
            onClick={() => {
              setRunning(false);
              setTick(0);
            }}
          >
            ↺ 처음부터
          </button>
        )}
        {finished && (
          <Link
            to={"/result/" + caseId}
            style={{ ...btn, textDecoration: "none", color: "#2e7d32", borderColor: "#2e7d32" }}
          >
            결과 보기 →
          </Link>
        )}
      </div>

      {/* 로그 창 */}
      <div
        style={{
          background: "#1e1e1e",
          color: "#d4d4d4",
          fontFamily: "monospace",
          fontSize: 13,
          padding: 12,
          borderRadius: 8,
          minHeight: 160,
          maxHeight: 280,
          overflow: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {done.length === 0 && !current && <div>시작 버튼을 누르면 로그가 나와요.</div>}
        {done.map((h) => (
          <div key={h.eval}>
            {`[EVAL ${pad(h.eval)}] `}
            {Object.entries(h.design)
              .map(([k, v]) => `${k}=${v}`)
              .join(" ")}
            {` → Smax=${h.value.toFixed(1)} MPa `}
            <span style={{ color: h.feasible ? "#81c784" : "#e57373" }}>
              {h.feasible ? "합격" : "불합격"}
            </span>
          </div>
        ))}
        {current && (
          <div style={{ color: "#90caf9" }}>
            {`[EVAL ${pad(current.eval)}] ${STEPS[active]} 중...`}
          </div>
        )}
        {finished && <div style={{ color: "#81c784" }}>[DONE] 모든 해석이 끝났어요.</div>}
      </div>
    </div>
  );
}

export default Run;