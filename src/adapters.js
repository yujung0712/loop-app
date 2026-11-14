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

const ADAPTERS = {
  pressure_vessel: adaptPressureVessel,
  desk: adaptDesk,
  flange: adaptFlange,
};

export function adaptCase(caseId, raw) {
  return ADAPTERS[caseId](raw);
}