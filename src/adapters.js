// 화면에 쓰는 한글 이름
export const LABELS = {
  main_length: "주관 길이",
  main_inner_d: "주관 안지름",
  main_wall_thk: "주관 두께",
  nozzle_length: "노즐 길이",
  nozzle_inner_d: "노즐 안지름",
  nozzle_wall_thk: "노즐 두께",
  pad_outer_d: "패드 바깥지름",
  pad_thk: "패드 두께",
  leg_size_mm: "다리 굵기",
  tabletop_thk_mm: "상판 두께",
  pipe_wall_thk_mm: "파이프 두께",
  cyl_d_mm: "원기둥 지름",
  plate_length: "판 길이",
  plate_width: "판 폭",
  plate_thk: "판 두께",
  hole_d: "구멍 지름",
};

// 데모 모드: 서버 없이 저장해 둔 결과만 보여 줘요 (빌드할 때 VITE_DEMO=true 로 켜요)
export const DEMO = import.meta.env.VITE_DEMO === "true";

// 파이썬 서버 주소
export const API_BASE = "http://localhost:8000";

// 케이스별 데이터 주소 (json과 그림)
// 서버가 있으면: 마지막으로 실행한 결과, 없으면 처음에 저장해 둔 결과
// 데모 모드: public/demo 폴더의 파일
function files(id) {
  if (DEMO) {
    return { json: `/demo/${id}.json`, image: `/demo/${id}_stress.png` };
  }
  return {
    json: `${API_BASE}/api/cases/${id}/result`,
    image: `${API_BASE}/api/cases/${id}/image`,
  };
}

export const CASE_FILES = {
  pressure_vessel: files("pressure_vessel"),
  desk: files("desk"),
  flange: files("flange"),
  beam: files("beam"),
  tsb: files("tsb"),
  fatigue: files("fatigue"),
};

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => (out[k] = obj[k]));
  return out;
}

function stressCard(value, limit) {
  return {
    title: "최대응력",
    value: `${value.toFixed(1)} MPa`,
    sub: `허용 ${limit} MPa의 ${(value / limit).toFixed(1)}배`,
  };
}

// 실행할 때 입력한 값 (서버가 결과에 같이 넣어 줘요). 저장해 둔 기본 결과에는 없어요
function inputsOf(raw) {
  return (raw._meta && raw._meta.params) || {};
}

function adaptPressureVessel(raw) {
  const P = inputsOf(raw);
  const best = raw.best_result;
  const limit = P.stress_limit_MPa ?? 180;
  const weightLimit = P.weight_limit_N ?? 25000;
  const maxEval = P.max_eval ?? 80;
  return {
    title: "압력용기",
    limit,
    feasible: best.feasible,
    initial: raw.initial_design,
    best: raw.best_design,
    history: raw.history.map((h) => ({
      eval: h.eval,
      value: h.Smax_MPa,
      feasible: h.feasible,
      design: h.design,
      failed: Boolean(h.solve_failed),
    })),
    cards: [
      stressCard(best.Smax_MPa, limit),
      {
        title: "자중",
        value: `${best.self_weight_N.toFixed(0)} N`,
        sub: `허용 ${Number(weightLimit).toLocaleString()} N 이하`,
      },
      { title: "해석 횟수", value: `${raw.n_evaluations}회`, sub: `최대 ${maxEval}회 중` },
    ],
  };
}

function adaptDesk(raw) {
  const P = inputsOf(raw);
  const history = raw.history || [];
  const best = raw.best; // 합격안이 없을 때 비어 있을 수 있어요
  const keys = ["leg_size_mm", "tabletop_thk_mm"];

  const ref = best || history[0];
  const limit = ref.stress_limit_MPa;
  // 합격안이 없으면 응력이 가장 낮았던 설계를 "최종"으로 보여줘요
  const shown = best
    ? best
    : history.reduce((a, b) => (b.Smax_MPa < a.Smax_MPa ? b : a), history[0]);

  return {
    title: "책상",
    limit,
    feasible: Boolean(shown.feasible),
    initial: pick(history[0], keys), // 처음 평가한 설계
    best: pick(shown, keys),
    history: history.map((h) => ({
      eval: h.eval,
      value: h.Smax_MPa,
      feasible: h.feasible,
      design: pick(h, keys),
    })),
    cards: [
      stressCard(shown.Smax_MPa, limit),
      {
        title: "부피",
        value: `${(shown.volume_mm3 / 1e6).toFixed(2)} L`,
        sub: best ? "작을수록 좋아요" : "합격안이 없어서 응력이 가장 낮은 설계예요",
      },
      {
        title: "해석 횟수",
        value: `${raw.n_evaluations ?? history.length}회`,
        sub: `최대 ${P.max_eval ?? 120}회 중`,
      },
    ],
  };
}

function adaptFlange(raw) {
  const history = raw.history || [];
  const best = raw.best; // 합격한 설계가 하나도 없으면 null
  const keys = ["pipe_wall_thk_mm"];

  const ref = best || history[0];
  const limit = ref.stress_limit_MPa;
  // 얇은 원통 공식으로 구한 이론 최소 두께: 압력 x 반지름 / 허용응력
  const theoryMin = (ref.pressure_MPa * (ref.pipe_inner_d_mm / 2)) / limit;

  // 합격안이 없으면 응력이 가장 낮았던 설계를 "최종"으로 보여줘요
  const shown = best
    ? best
    : history.reduce((a, b) => (b.Smax_MPa < a.Smax_MPa ? b : a), history[0]);

  return {
    title: "플랜지 파이프",
    limit,
    feasible: Boolean(best),
    initial: pick(history[0], keys), // 처음 평가한 설계
    best: pick(shown, keys),
    history: history.map((h) => ({
      eval: h.eval,
      value: h.Smax_MPa,
      feasible: h.feasible,
      design: pick(h, keys),
    })),
    cards: [
      stressCard(shown.Smax_MPa, limit),
      best
        ? {
            title: "최소 합격 두께",
            value: `${best.pipe_wall_thk_mm.toFixed(2)} mm`,
            sub: `이론 최소 약 ${theoryMin.toFixed(1)} mm`,
          }
        : {
            title: "합격 두께",
            value: "없음",
            sub: `이론 최소 약 ${theoryMin.toFixed(1)} mm (탐색 범위 밖일 수 있어요)`,
          },
      {
        title: "해석 횟수",
        value: `${raw.n_evaluations ?? history.length}회`,
        sub: "이분법 탐색",
      },
    ],
  };
}

// TSB 봉의 이론 최소 지름: 축 방향 인장 변위 δ = F L / (E A) 를 허용값 이하로 만드는 지름
function tsbTheoryMinD(P, limit) {
  const F = P.load_N ?? 100000;
  const E = P.E_MPa ?? 10000;
  const Ltot = P.L_total ?? 1000;
  const Lsq = P.L_sq ?? 500;
  const Asq = (P.sq_w ?? 100) * (P.sq_h ?? 100);
  const rest = limit - (F * Lsq) / (E * Asq); // 사각 구간이 쓰고 남은 허용 변위
  if (!(rest > 0)) return null;
  const A = (F * (Ltot - Lsq)) / (E * rest);
  return Math.sqrt((4 * A) / Math.PI);
}

function adaptTsb(raw) {
  const P = inputsOf(raw);
  const history = raw.history || [];
  const keys = ["cyl_d_mm"];
  // 합격한 지름이 없으면 코드가 마지막으로 시도한 값을 best에 넣어 줘요
  const shown = raw.best || history[history.length - 1];
  const limit = shown.U_limit_mm;
  const theory = tsbTheoryMinD(P, limit);

  return {
    title: "TSB 봉",
    // 결과 화면의 단위와 이름 (없으면 응력 기준으로 보여줘요)
    unit: "mm",
    metric: "끝단 변위",
    limitName: "허용 변위",
    imageTitle: "변위 분포 (최종 설계, 높이 방향)",
    digits: 3,
    limit,
    feasible: Boolean(shown.feasible),
    initial: pick(history[0], keys), // 처음 시도한 지름
    best: pick(shown, keys),
    history: history.map((h) => ({
      eval: h.iter,
      value: h.Uabs_mm,
      feasible: h.feasible,
      design: pick(h, keys),
    })),
    cards: [
      {
        title: "끝단 변위",
        value: `${shown.Uabs_mm.toFixed(3)} mm`,
        sub: `허용 ${limit} mm의 ${(shown.Uabs_mm / limit).toFixed(2)}배`,
      },
      shown.feasible
        ? {
            title: "최소 합격 지름",
            value: `${shown.cyl_d_mm.toFixed(2)} mm`,
            sub: theory ? `이론 최소 약 ${theory.toFixed(1)} mm` : "이론 계산 불가",
          }
        : {
            title: "합격 지름",
            value: "없음",
            sub: theory
              ? `이론 최소 약 ${theory.toFixed(1)} mm (탐색 범위 밖일 수 있어요)`
              : "탐색 범위를 넓혀 보세요",
          },
      {
        title: "해석 횟수",
        value: `${history.length}회`,
        sub: `이분법 (허용오차 ${P.tol_mm ?? 0.01} mm)`,
      },
    ],
  };
}

// 사이클 수를 읽기 좋게: 3400000 -> 3.40×10⁶
function fmtCycles(n) {
  if (!(n > 0)) return "0";
  const exp = Math.floor(Math.log10(n));
  const mant = n / Math.pow(10, exp);
  const sup = String(exp)
    .split("")
    .map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)] ?? c)
    .join("");
  return `${mant.toFixed(2)}×10${sup}`;
}

function adaptFatigue(raw) {
  const P = inputsOf(raw);
  const history = raw.history || [];
  const best = raw.best_result;
  const minLife = P.min_life_cycles ?? 1000000;
  const maxMass = P.max_mass_kg ?? 5;
  // 초록: 합격 / 주황: 수명은 충분한데 질량 초과 / 빨강: 수명 부족
  const statusOf = (h) => (h.feasible ? "ok" : h.life_ok ? "warn" : "bad");

  return {
    title: "구멍 뚫린 판 피로",
    unit: "사이클",
    metric: "수명",
    limitName: "필요 수명",
    imageTitle: "응력 분포 (최종 설계, 최대 변위일 때)",
    digits: 0,
    limit: minLife,
    feasible: Boolean(best.feasible),
    initial: raw.initial_design,
    best: raw.best_design,
    history: history.map((h) => ({
      eval: h.eval,
      value: h.top3_life_cycles,
      feasible: h.feasible,
      status: statusOf(h),
      design: h.design,
    })),
    legend:
      "초록 = 합격 · 주황 = 수명은 충분하지만 질량이 허용을 넘음 · 빨강 = 수명 부족 · 초록 점선 = 필요 수명",
    failDetail: `${history.length}번 해석한 설계가 전부 수명 또는 질량 기준을 만족하지 못했어요. 허용 질량을 늘리거나 설계 범위를 넓혀 보세요.`,
    tickFormatter: (v) => Number(v).toExponential(0).replace("e+", "e"),
    cards: [
      {
        title: "수명 (상위 3점 평균)",
        value: `${fmtCycles(best.top3_life_cycles)} 사이클`,
        sub: `필요 ${fmtCycles(minLife)} 이상 · ${(best.top3_life_cycles / minLife).toFixed(1)}배`,
      },
      {
        title: "질량",
        value: `${best.mass_kg.toFixed(2)} kg`,
        sub: `허용 ${maxMass} kg 이하`,
      },
      {
        title: "해석 횟수",
        value: `${raw.n_evaluations ?? history.length}회`,
        sub: `최대 ${P.max_eval ?? 80}회 중`,
      },
    ],
  };
}

const ADAPTERS = {
  pressure_vessel: adaptPressureVessel,
  desk: adaptDesk,
  flange: adaptFlange,
  tsb: adaptTsb,
  fatigue: adaptFatigue,
};

export function adaptCase(caseId, raw) {
  return ADAPTERS[caseId](raw);
}