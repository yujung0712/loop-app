import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { API_BASE, CASE_FILES, adaptCase } from "../adapters";

// 실제로 해석을 돌릴 수 있는 케이스
const RUNNABLE = ["flange", "beam", "desk", "pressure_vessel", "tsb"];

// 플랜지 / 책상 / 압력용기 / TSB / 시뮬레이션용 단계
const STEPS = [
  "입력",
  "형상 생성",
  "메시 크기",
  "메시 생성",
  "해석",
  "허용값 평가",
  "결과 출력",
];
// 외팔보용 단계
const BEAM_STEPS = [
  "입력",
  "형상 생성",
  "메시 생성",
  "ANSYS 연결",
  "해석",
  "결과 정리",
  "결과 출력",
];
const SUB = 5; // (시뮬레이션) 설계 하나를 평가할 때 거치는 단계 수 (②~⑥)

// 케이스별 화면 설정
const RUN_INFO = {
  flange: {
    title: "플랜지 파이프",
    hint: "서버가 노트북의 ANSYS로 실제 해석을 돌려요. 1~2분 걸려요.",
    steps: STEPS,
    labels: {
      pipe_thk_min: "두께 최소(mm)",
      pipe_thk_max: "두께 최대(mm)",
      stress_limit_MPa: "허용응력(MPa)",
      tol_mm: "허용오차(mm)",
      length: "길이(mm)",
      inner_d: "내경(mm)",
      flange_outer_d: "플랜지 외경(mm)",
      flange_thk: "플랜지 두께(mm)",
      bolt_holes: "볼트 구멍(개)",
      pressure_MPa: "내압(MPa)",
    },
  },
  desk: {
    title: "책상",
    hint: "서버가 노트북의 ANSYS로 해석을 여러 번 돌려요. 설정에 따라 3분 이상 걸릴 수 있어요.",
    steps: STEPS,
    labels: {
      leg_size_mm_min: "다리 굵기 최소(mm)",
      leg_size_mm_max: "다리 굵기 최대(mm)",
      tabletop_thk_mm_min: "상판 두께 최소(mm)",
      tabletop_thk_mm_max: "상판 두께 최대(mm)",
      stress_limit_MPa: "허용응력(MPa)",
      max_eval: "최대 해석 횟수",
      tabletop_length: "상판 길이(mm)",
      tabletop_width: "상판 폭(mm)",
      desk_height: "책상 높이(mm)",
      load_N: "하중(N)",
      E_MPa: "탄성계수(MPa)",
    },
  },
  pressure_vessel: {
    title: "압력용기",
    hint: "서버가 노트북의 ANSYS로 해석을 여러 번 돌려요. 보통 10분 안팎 걸려요. ※ 이 케이스는 해석 모델에 알려진 문제가 있어서 결과를 그대로 믿으면 안 돼요 (결과 화면의 자동 점검 참고).",
    steps: STEPS,
    labels: {
      main_thk_min: "주관 두께 최소(mm)",
      main_thk_max: "주관 두께 최대(mm)",
      nozzle_thk_min: "노즐 두께 최소(mm)",
      nozzle_thk_max: "노즐 두께 최대(mm)",
      pad_thk_min: "패드 두께 최소(mm)",
      pad_thk_max: "패드 두께 최대(mm)",
      stress_limit_MPa: "허용응력(MPa)",
      weight_limit_N: "자중 제한(N)",
      max_eval: "최대 해석 횟수",
      main_length: "주관 길이(mm)",
      main_inner_d: "주관 안지름(mm)",
      nozzle_length: "노즐 길이(mm)",
      nozzle_inner_d: "노즐 안지름(mm)",
      pad_outer_d: "패드 바깥지름(mm)",
      pressure_MPa: "내압(MPa)",
    },
  },
  tsb: {
    title: "TSB 봉",
    hint: "서버가 노트북의 ANSYS로 지름을 반씩 좁혀 가며 해석해요. 해석 한 번에 약 40초, 허용오차 0.5 mm면 약 8번(5분 안팎)이에요.",
    steps: STEPS,
    labels: {
      cyl_d_min: "지름 최소(mm)",
      cyl_d_max: "지름 최대(mm)",
      u_limit_mm: "허용 변위(mm)",
      tol_mm: "허용오차(mm)",
      max_iter: "최대 반복 횟수",
      L_total: "전체 길이(mm)",
      L_sq: "사각 구간 길이(mm)",
      sq_w: "사각 폭(mm)",
      sq_h: "사각 높이(mm)",
      load_N: "하중(N)",
      E_MPa: "탄성계수(MPa)",
      lc_mm: "메시 크기(mm)",
    },
  },
  beam: {
    title: "외팔보",
    hint: "서버가 노트북의 ANSYS로 실제 해석을 돌려요. 외팔보는 해석을 1번만 하고, 1~2분 걸려요.",
    steps: BEAM_STEPS,
    labels: {
      length: "보 길이(mm)",
      width: "폭(mm)",
      height: "높이(mm)",
      E_MPa: "탄성계수(MPa)",
      nu: "포아송비",
      load_N: "하중(N)",
      lc_mm: "메시 크기(mm)",
    },
  },
};

const btn = {
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #bbb",
  background: "white",
  cursor: "pointer",
  fontSize: 14,
};

function pad(n) {
  return String(n).padStart(3, "0");
}

function CaseLinks() {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
      <Link to="/run/pressure_vessel">압력용기</Link>
      <Link to="/run/desk">책상</Link>
      <Link to="/run/flange">플랜지</Link>
      <Link to="/run/beam">외팔보</Link>
      <Link to="/run/tsb">TSB 봉</Link>
    </div>
  );
}

// 단계 표시줄 (active보다 앞은 완료, active는 진행 중)
function StepBar({ steps = STEPS, active, failed }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "16px 0" }}>
      {steps.map((name, i) => {
        const isDone = i < active;
        const isActive = i === active;
        const color = isActive ? (failed ? "#c62828" : "#1565c0") : isDone ? "#2e7d32" : "#999";
        return (
          <div
            key={name}
            style={{
              padding: "6px 12px",
              borderRadius: 16,
              fontSize: 13,
              border: "1px solid " + (isActive ? color : "#ddd"),
              background: isDone ? "#e8f5e9" : isActive ? (failed ? "#fdecea" : "#e3f2fd") : "white",
              color,
              fontWeight: isActive ? "bold" : "normal",
            }}
          >
            {isDone ? "✓" : i + 1} {name}
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div style={{ height: 10, background: "#eee", borderRadius: 5 }}>
      <div
        style={{
          height: 10,
          width: percent + "%",
          background: "#1565c0",
          borderRadius: 5,
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

// ---- 플랜지 / 책상 / 압력용기 / TSB: 로그 한 줄을 보고 지금 어느 단계인지 추정해요 (모르면 null) ----
function flangeStepOf(line) {
  if (line.includes("[RESULT]") || line.includes("[BISECTION]")) return 5;
  if (line.includes("post done")) return 5;
  if (line.includes("solve done") || line.includes("POST1") || line.includes("save PNG")) return 5;
  if (line.includes("SOLU start") || line.includes("fixed base nodes") || line.includes("pressure="))
    return 4;
  if (line.includes("extract done")) return 3;
  if (line.includes("[2/3]") || line.includes("[MAPDL]")) return 3;
  if (line.includes("mesh.generate") || line.includes("[GMSH] detect")) return 3;
  if (line.includes("[GMSH] initialize")) return 2;
  if (line.includes("[1/3]") || line.includes("[EVAL") || line.includes("[ITER")) return 1;
  return null;
}

// ---- 외팔보: 로그를 보고 지금 단계를 추정해요 ----
function beamActive(lines, done) {
  if (done) return BEAM_STEPS.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (l.includes("[DONE]")) return 5;
    if (l.includes("[MAPDL] launched")) return 4;
    if (l.includes("[MAPDL] launch") || l.includes("FIXED nodes") || l.includes("[GMSH] nodes="))
      return 3;
    if (l.includes("Step File Name")) return 2;
    if (l.includes("[GMSH] build")) return 1;
  }
  return 1;
}

// 외팔보 결과 요약에 보여줄 줄
const BEAM_SUMMARY_KEYS = [
  "MAPDL LOAD UZ avg",
  "EB tip UZ",
  "UZ error vs EB",
  "MAPDL max SEQV",
  "EB max bend stress",
];

// "[RESULT] ..." 줄을 읽기 좋게 바꿔요 (플랜지 / 책상 / 압력용기 / TSB)
// evalLine: 같은 순서의 "[EVAL 003] ..." 또는 "[ITER 003] ..." 줄 (설계 값이 들어 있어요)
function describeResult(line, evalLine, pvLimit) {
  // TSB: Uabs=... mm | limit=... mm | feasible=...
  const ts = line.match(
    /Uabs=([\d.eE+-]+) mm \| limit=([\d.eE+-]+) mm \| feasible=(True|False)/
  );
  if (ts) {
    let design = "";
    if (evalLine) {
      const d = evalLine.match(/cyl_d = ([\d.]+) mm/);
      if (d) design = `지름 ${Number(d[1]).toFixed(3)} mm`;
    }
    return {
      value: Number(ts[1]),
      limit: Number(ts[2]),
      ok: ts[3] === "True",
      design,
      unit: "mm",
      digits: 3,
      failedSolve: false,
    };
  }

  // 압력용기: Smax=... | self-weight=... | feasible=...
  const pv = line.match(
    /Smax=([\d.eE+-]+) MPa \| self-weight=([\d.eE+-]+) N \| feasible=(True|False)/
  );
  if (pv) {
    let design = "";
    if (evalLine) {
      const d = evalLine.match(
        /main_wall_thk=([\d.]+) \| nozzle_wall_thk=([\d.]+) \| pad_thk=([\d.]+)/
      );
      if (d) design = `주관 ${Number(d[1])} · 노즐 ${Number(d[2])} · 패드 ${Number(d[3])} mm`;
    }
    const smax = Number(pv[1]);
    return {
      value: smax,
      limit: pvLimit,
      ok: pv[3] === "True",
      design,
      unit: "MPa",
      digits: 2,
      failedSolve: Math.abs(smax - 10000) < 0.001, // 풀리지 않은 설계에 서버 코드가 주는 벌점 값(정확히 10000)
    };
  }

  // 플랜지 / 책상: Smax=... | limit=... | feasible=... | thk=... (또는 volume=...)
  const m = line.match(
    /Smax=([\d.eE+-]+) MPa \| limit=([\d.eE+-]+) MPa \| feasible=(True|False)(?: \| (.*))?/
  );
  if (!m) return null;
  const extra = m[4] || "";
  let design = "";
  const thk = extra.match(/thk=([\d.]+) mm/);
  if (thk) design = `두께 ${Number(thk[1]).toFixed(3)} mm`;
  const vol = extra.match(/volume=([\d.eE+-]+)/);
  if (evalLine) {
    const d = evalLine.match(/leg_size = ([\d.]+) mm \| tabletop_thk = ([\d.]+) mm/);
    if (d) design = `다리 ${Number(d[1])} · 상판 ${Number(d[2])} mm`;
  }
  if (vol) design += ` · 부피 ${(Number(vol[1]) / 1e6).toFixed(2)} L`;
  return {
    value: Number(m[1]),
    limit: Number(m[2]),
    ok: m[3] === "True",
    design,
    unit: "MPa",
    digits: 2,
    failedSolve: false,
  };
}

/* ---------- 실제 해석 (서버가 ANSYS를 돌려요) ---------- */
function RealRun({ caseId }) {
  const cfg = RUN_INFO[caseId];
  const isBeam = caseId === "beam";
  const isDesk = caseId === "desk";
  const isPV = caseId === "pressure_vessel";
  const isTsb = caseId === "tsb";
  const [searchParams, setSearchParams] = useSearchParams();
  const runId = searchParams.get("run");
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);

  // 2초마다 서버에 진행 상황을 물어봐요
  useEffect(() => {
    if (!runId) {
      setInfo(null);
      return;
    }
    let stop = false;
    const load = () =>
      fetch(`${API_BASE}/api/runs/${runId}`)
        .then((res) => {
          if (!res.ok) throw new Error("not found");
          return res.json();
        })
        .then((json) => {
          if (!stop) {
            setInfo(json);
            setMessage("");
          }
          return json;
        })
        .catch(() => {
          if (!stop)
            setMessage(
              "진행 상황을 불러오지 못했어요. 서버가 켜져 있는지 확인하세요. (서버를 다시 켰다면 해석을 다시 시작해야 해요.)"
            );
          return null;
        });
    load();
    const id = setInterval(() => {
      load().then((json) => {
        if (json && json.status !== "running") clearInterval(id);
      });
    }, 2000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [runId]);

  const params = info && info.params ? info.params : {};
  const hasParams = Object.keys(params).length > 0;

  // 같은 입력값으로 (없으면 서버 기본값으로) 시작
  const start = async () => {
    setStarting(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params }),
      });
      const json = await res.json();
      if (!res.ok)
        setMessage(typeof json.detail === "string" ? json.detail : "해석을 시작하지 못했어요.");
      else setSearchParams({ run: json.run_id });
    } catch (e) {
      setMessage("서버에 연결하지 못했어요. 서버가 켜져 있는지 확인하세요.");
    }
    setStarting(false);
  };

  const status = info ? info.status : null;
  const running = status === "running";
  const done = status === "done";
  const failed = status === "failed";
  const logLines = info ? info.log : [];
  const evalLines = info && info.eval_lines ? info.eval_lines : [];

  // 지금 단계 추정
  let active = 0;
  if (info) {
    if (isBeam) {
      active = beamActive(logLines, done);
    } else {
      active = 1;
      for (let i = logLines.length - 1; i >= 0; i--) {
        const s = flangeStepOf(logLines[i]);
        if (s !== null) {
          active = s;
          break;
        }
      }
      if (done) active = cfg.steps.length;
    }
  }

  // 예상 해석 횟수 (추정)
  let est;
  if (isTsb) {
    // 이분법: 지름 범위를 허용오차 이하로 좁힐 때까지 반으로 줄여요
    const lo = params.cyl_d_min ?? 40;
    const hi = params.cyl_d_max ?? 120;
    const tol = params.tol_mm ?? 0.01;
    const maxIter = params.max_iter ?? 20;
    est = Math.max(1, Math.min(maxIter, Math.ceil(Math.log2((hi - lo) / tol))));
  } else if (isPV) {
    // 이웃 설계를 한 칸씩 바꿔 보는 탐색이라 횟수가 달라져요. 보통 15~25번이에요
    est = 18;
  } else if (isDesk) {
    // 거친 탐색: 다리 굵기 10 mm 간격마다 2번, 세밀 탐색: 약 8번
    const legMin = params.leg_size_mm_min ?? 30;
    const legMax = params.leg_size_mm_max ?? 70;
    est = (Math.floor((legMax - legMin) / 10) + 1) * 2 + 8;
  } else {
    // 플랜지(이분법): 양 끝 2번 + log2(범위 / 허용오차)
    const lo = params.pipe_thk_min ?? 5;
    const hi = params.pipe_thk_max ?? 15;
    const tol = params.tol_mm ?? 0.5;
    est = Math.max(2, 2 + Math.ceil(Math.log2((hi - lo) / tol)));
  }
  const completed = info ? info.results.length : 0;

  // 진행률
  let percent = 0;
  if (isBeam) {
    const table = [0, 10, 30, 50, 70, 90, 95];
    percent = done ? 100 : info ? table[Math.min(active, 6)] : 0;
  } else {
    percent = done ? 100 : Math.min(95, Math.round((completed / est) * 100));
  }

  // 지금 평가 중인 설계 (가장 최근 [EVAL ...] 또는 [ITER ...] 줄)
  let current = null;
  const lastEval = evalLines.length > 0 ? evalLines[evalLines.length - 1] : "";
  if (lastEval) {
    const f = lastEval.match(/wall_thk = ([\d.]+) mm/);
    const d = lastEval.match(/leg_size = ([\d.]+) mm \| tabletop_thk = ([\d.]+) mm/);
    const p = lastEval.match(
      /main_wall_thk=([\d.]+) \| nozzle_wall_thk=([\d.]+) \| pad_thk=([\d.]+)/
    );
    const t = lastEval.match(/cyl_d = ([\d.]+) mm/);
    if (f) current = `지금 두께 ${Number(f[1])} mm 평가 중`;
    else if (d) current = `지금 다리 ${Number(d[1])} · 상판 ${Number(d[2])} mm 평가 중`;
    else if (p)
      current = `지금 주관 ${Number(p[1])} · 노즐 ${Number(p[2])} · 패드 ${Number(p[3])} mm 평가 중`;
    else if (t) current = `지금 지름 ${Number(t[1]).toFixed(2)} mm 평가 중`;
  }

  // 외팔보: 결과 요약 줄
  const beamSummary = logLines
    .filter((l) => BEAM_SUMMARY_KEYS.some((k) => l.includes(k)))
    .map((l) => l.replace(/\s+/g, " ").trim());

  return (
    <div>
      <h2>③ 실행 · 진행 · {cfg.title}</h2>
      <CaseLinks />
      <p style={{ color: "#1565c0", fontSize: 13 }}>{cfg.hint}</p>

      {/* 이번 실행의 입력값 */}
      {info && (
        <div
          style={{
            background: "#f5f5f5",
            borderRadius: 6,
            padding: 10,
            fontSize: 13,
            color: "#444",
            marginBottom: 8,
          }}
        >
          <b>이번 실행 입력값</b>
          {hasParams ? (
            <div>
              {Object.entries(params)
                .map(([k, v]) => `${cfg.labels[k] || k} ${v}`)
                .join("  ·  ")}
            </div>
          ) : (
            <div>입력 화면을 거치지 않아 서버의 기본값으로 실행했어요.</div>
          )}
        </div>
      )}

      <StepBar steps={cfg.steps} active={active} failed={failed} />

      <div style={{ marginBottom: 4, fontSize: 14 }}>
        {isBeam ? (
          <>
            해석 1회 ({percent}%)
            {info && `  ·  경과 ${info.elapsed_s}초`}
          </>
        ) : (
          <>
            해석 {completed}회 완료 (예상 약 {est}회 · {percent}%)
            {info && `  ·  경과 ${info.elapsed_s}초`}
            {running && current && `  ·  ${current}`}
          </>
        )}
      </div>
      <ProgressBar percent={percent} />
      {(isDesk || isPV) && (
        <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
          탐색 중에 해석 횟수가 달라질 수 있어서 예상 횟수는 대략적인 값이에요.
        </p>
      )}

      {/* 버튼 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "16px 0" }}>
        <button style={btn} onClick={start} disabled={starting || running}>
          {runId
            ? hasParams
              ? "↺ 같은 입력값으로 다시 실행"
              : "↺ 다시 실행"
            : "▶ 기본 입력값으로 해석 시작"}
        </button>
        {done && (
          <Link
            to={`/result/${caseId}?run=${runId}`}
            style={{
              ...btn,
              textDecoration: "none",
              color: "#2e7d32",
              borderColor: "#2e7d32",
            }}
          >
            결과 보기 →
          </Link>
        )}
        <Link to={`/input/${caseId}`} style={{ fontSize: 14 }}>
          입력값 바꾸기
        </Link>
      </div>

      {message && <p style={{ color: "#c62828", fontSize: 14 }}>! {message}</p>}

      {failed && (
        <p style={{ color: "#c62828", fontSize: 14 }}>
          해석이 실패했어요. 아래 로그의 마지막 줄을 확인하세요. ANSYS가 남아 있다면
          작업 관리자에서 끄고 다시 실행해 보세요.
          {isPV &&
            " 이 코드는 해석 횟수가 '최대 해석 횟수'에 닿으면 결과 없이 끝나니, 값을 늘려 보세요."}
        </p>
      )}

      {/* 플랜지 / 책상 / 압력용기 / TSB: 끝난 해석 결과 */}
      {!isBeam && info && info.results.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {info.results.map((line, i) => {
            const r = describeResult(line, evalLines[i], params.stress_limit_MPa ?? 180);
            if (!r)
              return (
                <div key={i} style={{ fontSize: 14, fontFamily: "monospace" }}>
                  {`#${i} ${line.replace("[RESULT] ", "")}`}
                </div>
              );
            if (r.failedSolve)
              return (
                <div
                  key={i}
                  style={{ fontSize: 14, fontFamily: "monospace", color: "#ef6c00" }}
                >
                  {`#${i}  ${r.design} → ANSYS가 풀지 못함 (불합격으로 처리)`}
                </div>
              );
            return (
              <div
                key={i}
                style={{
                  fontSize: 14,
                  fontFamily: "monospace",
                  color: r.ok ? "#2e7d32" : "#c62828",
                }}
              >
                {`#${i}  ${r.design} → ${r.value.toFixed(r.digits)} ${r.unit} (허용 ${r.limit})  `}
                {r.ok ? "✓ 합격" : "✕ 불합격"}
              </div>
            );
          })}
        </div>
      )}

      {/* 외팔보: 결과 요약 */}
      {isBeam && beamSummary.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            fontSize: 14,
            fontFamily: "monospace",
            color: "#2e7d32",
          }}
        >
          {beamSummary.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}

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
        {logLines.length === 0 && <div>시작 버튼을 누르면 로그가 나와요.</div>}
        {logLines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        {done && <div style={{ color: "#81c784" }}>[DONE] 모든 해석이 끝났어요.</div>}
      </div>
    </div>
  );
}

/* ---------- 시뮬레이션 (받아 둔 기록 재생) ---------- */
function SimRun() {
  const { caseId } = useParams();
  const [view, setView] = useState(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);

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

  useEffect(() => {
    if (!running || !view) return;
    const id = setInterval(() => setTick((x) => x + 1), 200);
    return () => clearInterval(id);
  }, [running, view]);

  useEffect(() => {
    if (finished) setRunning(false);
  }, [finished]);

  if (!CASE_FILES[caseId]) return <p>아직 준비되지 않은 케이스예요.</p>;
  if (error) return <p>파일을 불러오지 못했어요.</p>;
  if (!view) return <p>불러오는 중...</p>;

  const evalIdx = Math.floor(t / SUB);
  const sub = t % SUB;

  let active;
  if (finished) active = STEPS.length;
  else if (t === 0 && !running) active = 0;
  else active = sub + 1;

  const done = view.history.slice(0, evalIdx);
  const current = !finished && (running || t > 0) ? view.history[evalIdx] : null;
  const percent = total === 0 ? 0 : Math.round((evalIdx / total) * 100);

  return (
    <div>
      <h2>③ 실행 · 진행 · {view.title}</h2>
      <CaseLinks />

      <p style={{ color: "#888", fontSize: 13 }}>
        ※ 이 케이스는 아직 서버 실행이 연결되지 않아서, 받아 둔 해석 기록을
        재생하는 시뮬레이션이에요.
      </p>

      <StepBar steps={STEPS} active={active} failed={false} />

      <div style={{ marginBottom: 4, fontSize: 14 }}>
        해석 {evalIdx} / {total}회 ({percent}%)
      </div>
      <ProgressBar percent={percent} />

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
            style={{
              ...btn,
              textDecoration: "none",
              color: "#2e7d32",
              borderColor: "#2e7d32",
            }}
          >
            결과 보기 →
          </Link>
        )}
      </div>

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
            {` → 값=${h.value.toFixed(1)} `}
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

function Run() {
  const { caseId } = useParams();
  // key를 주면 케이스를 바꿀 때 화면 상태가 새로 만들어져요
  if (RUNNABLE.includes(caseId)) return <RealRun key={caseId} caseId={caseId} />;
  return <SimRun key={caseId} />;
}

export default Run;