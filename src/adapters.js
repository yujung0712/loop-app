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
};

// 케이스별 파일 위치
// 파이썬 서버 주소
const API_BASE = "http://localhost:8000";

// 케이스별 데이터 주소 (json은 서버에서, 그림은 아직 public 폴더에서)
// 케이스별 데이터 주소 (json과 그림 모두 서버에서)
export const CASE_FILES = {
  pressure_vessel: {
    json: `${API_BASE}/api/cases/pressure_vessel/result`,
    image: `${API_BASE}/api/cases/pressure_vessel/image`,
  },
  desk: {
    json: `${API_BASE}/api/cases/desk/result`,
    image: `${API_BASE}/api/cases/desk/image`, // 그림이 없으면 칸이 비어 있을 뿐 에러는 안 나요
  },
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

function adaptPressureVessel(raw) {
  const best = raw.best_result;
  const limit = 180; // 파일에 없어서 임시로 직접 적음
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
    })),
    cards: [
      stressCard(best.Smax_MPa, limit),
      {
        title: "자중",
        value: `${best.self_weight_N.toFixed(0)} N`,
        sub: "허용 25,000 N 이하",
      },
      { title: "해석 횟수", value: `${raw.n_evaluations}회`, sub: "최대 80회 중" },
    ],
  };
}

function adaptDesk(raw) {
  const best = raw.best;
  const keys = ["leg_size_mm", "tabletop_thk_mm"];
  const limit = best.stress_limit_MPa;
  return {
    title: "책상",
    limit,
    feasible: best.feasible,
    initial: pick(raw.history[0], keys), // 처음 평가한 설계
    best: pick(best, keys),
    history: raw.history.map((h) => ({
      eval: h.eval,
      value: h.Smax_MPa,
      feasible: h.feasible,
      design: pick(h, keys),
    })),
    cards: [
      stressCard(best.Smax_MPa, limit),
      {
        title: "부피",
        value: `${(best.volume_mm3 / 1e6).toFixed(2)} L`,
        sub: "작을수록 좋아요",
      },
      { title: "해석 횟수", value: `${raw.n_evaluations}회`, sub: "최대 120회 중" },
    ],
  };
}

const ADAPTERS = {
  pressure_vessel: adaptPressureVessel,
  desk: adaptDesk,
};

export function adaptCase(caseId, raw) {
  return ADAPTERS[caseId](raw);
}