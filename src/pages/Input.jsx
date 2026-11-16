import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SCHEMAS } from "../data/schemas";
import { API_BASE, CASE_FILES } from "../adapters";

// 입력값을 서버로 보내서 실제로 해석하는 케이스
const RUNNABLE = ["flange", "beam", "desk", "pressure_vessel", "tsb"];

// 처음 입력값 만들기: 숫자 칸마다 문자열로 저장
function makeInitial(schema) {
  const v = {};
  schema.sections.forEach((s) =>
    s.fields.forEach((f) => {
      if (f.kind === "range") {
        v[f.key + "_min"] = String(f.min);
        v[f.key + "_max"] = String(f.max);
      } else {
        v[f.key] = String(f.value);
      }
    })
  );
  return v;
}

const inputStyle = {
  width: 90,
  padding: "6px 8px",
  border: "1px solid #bbb",
  borderRadius: 6,
  fontSize: 14,
};

function InputForm({ caseId, schema }) {
  const navigate = useNavigate();
  const [vals, setVals] = useState(() => makeInitial(schema));
  const [serverMessage, setServerMessage] = useState("");
  const [starting, setStarting] = useState(false);

  const set = (key, value) => setVals((p) => ({ ...p, [key]: value }));

  // 검사: 빈 칸, 최소 ≥ 최대, 0 이하
  const problems = [];
  schema.sections.forEach((s) =>
    s.fields.forEach((f) => {
      if (f.kind === "range") {
        const lo = Number(vals[f.key + "_min"]);
        const hi = Number(vals[f.key + "_max"]);
        if (vals[f.key + "_min"] === "" || vals[f.key + "_max"] === "")
          problems.push(`${f.label}: 빈 칸이 있어요`);
        else if (lo >= hi) problems.push(`${f.label}: 최소가 최대보다 작아야 해요`);
      } else if (vals[f.key] === "") {
        problems.push(`${f.label}: 빈 칸이 있어요`);
      } else if (f.allowNegative) {
        if (Number(vals[f.key]) === 0) problems.push(`${f.label}: 0이 아닌 숫자를 넣어 주세요`);
      } else if (Number(vals[f.key]) <= 0) {
        problems.push(`${f.label}: 0보다 큰 숫자를 넣어 주세요`);
      }
    })
  );

  // 숫자로 바꾼 입력값 (이론 검산과 서버 전송에 써요)
  const numeric = {};
  Object.keys(vals).forEach((k) => (numeric[k] = Number(vals[k])));
  const theoryText = schema.theory ? schema.theory(numeric) : null;

  const realRun = RUNNABLE.includes(caseId);
  const hasData = Boolean(CASE_FILES[caseId]);
  const canRun = problems.length === 0 && hasData && !starting;

  const startRun = async () => {
    // 서버 실행이 연결되지 않은 케이스는 실행 화면(시뮬레이션)으로만 이동
    if (!realRun) {
      navigate("/run/" + caseId);
      return;
    }
    setStarting(true);
    setServerMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: numeric }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerMessage(
          typeof json.detail === "string" ? json.detail : "입력값을 확인해 주세요."
        );
      } else {
        navigate(`/run/${caseId}?run=${json.run_id}`);
      }
    } catch (e) {
      setServerMessage("서버에 연결하지 못했어요. 서버가 켜져 있는지 확인하세요.");
    }
    setStarting(false);
  };

  return (
    <div>
      <h2>② 설계 입력 · {schema.title}</h2>

      {/* 케이스 바꿔 보기 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Link to="/input/pressure_vessel">압력용기</Link>
        <Link to="/input/desk">책상</Link>
        <Link to="/input/flange">플랜지</Link>
        <Link to="/input/beam">외팔보</Link>
      </div>

      {realRun ? (
        <p style={{ color: "#1565c0", fontSize: 13 }}>
          입력한 값으로 서버가 ANSYS 해석을 실제로 실행해요.
        </p>
      ) : (
        <p style={{ color: "#888", fontSize: 13 }}>
          ※ 이 케이스는 서버 실행이 연결되지 않아서 입력값이 해석에 반영되지는 않아요.
        </p>
      )}

      {schema.sections.map((s) => (
        <div
          key={s.name}
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}
        >
          <h3 style={{ marginTop: 0 }}>{s.name}</h3>
          {s.note && <p style={{ color: "#888", fontSize: 13, marginTop: -8 }}>{s.note}</p>}
          {s.fields.map((f) => (
            <div
              key={f.key}
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
            >
              <label style={{ width: 150, fontSize: 14 }}>{f.label}</label>
              {f.kind === "range" ? (
                <>
                  <input
                    type="number"
                    style={inputStyle}
                    value={vals[f.key + "_min"]}
                    onChange={(e) => set(f.key + "_min", e.target.value)}
                  />
                  <span>~</span>
                  <input
                    type="number"
                    style={inputStyle}
                    value={vals[f.key + "_max"]}
                    onChange={(e) => set(f.key + "_max", e.target.value)}
                  />
                </>
              ) : (
                <input
                  type="number"
                  step="any"
                  style={inputStyle}
                  value={vals[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
              <span style={{ color: "#666", fontSize: 14 }}>{f.unit}</span>
            </div>
          ))}
        </div>
      ))}

      {theoryText && (
        <div
          style={{
            background: "#e3f2fd",
            borderLeft: "6px solid #1565c0",
            borderRadius: 6,
            padding: 12,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          <b>이론 검산</b>
          <div>{theoryText}</div>
        </div>
      )}

      {problems.length > 0 && (
        <div style={{ color: "#c62828", fontSize: 14, marginBottom: 12 }}>
          {problems.map((p) => (
            <div key={p}>! {p}</div>
          ))}
        </div>
      )}

      {serverMessage && (
        <div style={{ color: "#c62828", fontSize: 14, marginBottom: 12 }}>
          ! {serverMessage}
        </div>
      )}

      <button
        disabled={!canRun}
        onClick={startRun}
        style={{
          padding: "10px 20px",
          borderRadius: 6,
          border: "none",
          background: canRun ? "#1565c0" : "#bbb",
          color: "white",
          fontSize: 15,
          cursor: canRun ? "pointer" : "not-allowed",
        }}
      >
        {starting ? "시작하는 중..." : realRun ? "입력값으로 해석 시작 →" : "해석 시작 →"}
      </button>
      {!hasData && (
        <p style={{ color: "#888", fontSize: 13 }}>
          이 케이스는 아직 결과 파일이 없어서 실행 화면을 볼 수 없어요.
        </p>
      )}
    </div>
  );
}

function Input() {
  const { caseId } = useParams();
  const schema = SCHEMAS[caseId];
  if (!schema) return <p>아직 준비되지 않은 케이스예요.</p>;
  // key를 주면 케이스를 바꿀 때 입력칸이 새로 만들어져요
  return <InputForm key={caseId} caseId={caseId} schema={schema} />;
}

export default Input;