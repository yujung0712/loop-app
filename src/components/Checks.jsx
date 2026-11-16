import { LABELS } from "../adapters";

const PRESSURE_MPA = 5; // 압력용기 내압 (파일에 없어서 일단 직접 적어 둠)

const COLORS = {
  error: { bg: "#fdecea", bar: "#c62828", icon: "✕" },
  warn: { bg: "#fff4e5", bar: "#ef6c00", icon: "!" },
  ok: { bg: "#e8f5e9", bar: "#2e7d32", icon: "✓" },
};

function Checks({ view, raw, caseId }) {
  const history = view.history;
  const items = [];

  // 점검 1: 합격한 설계가 하나라도 있는지
  if (history.every((h) => !h.feasible)) {
    items.push({
      level: "error",
      title: "합격한 설계가 하나도 없어요",
      detail:
        view.failDetail ||
        `${history.length}번 해석한 설계가 전부 ${view.limitName || "허용응력"}을(를) 넘었어요. 설계 범위나 해석 조건을 확인하세요.`,
    });
  }

  // 점검 2: 최종 설계가 탐색한 값 중 가장 큰 값/작은 값에 걸렸는지
  const edge = [];
  Object.keys(view.best).forEach((k) => {
    const vals = history.map((h) => h.design[k]);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    if (max === min) return;
    if (view.best[k] === max) edge.push(`${LABELS[k] || k}(가장 큰 값)`);
    else if (view.best[k] === min) edge.push(`${LABELS[k] || k}(가장 작은 값)`);
  });
  if (edge.length > 0) {
    items.push({
      level: "warn",
      title: "설계 범위의 끝에 닿았어요",
      detail: `${edge.join(", ")}. 탐색한 값 중 끝값이 최종안이에요. 범위를 더 넓혀야 진짜 최적값을 알 수 있어요.`,
    });
  }

  // 아래 두 점검은 압력용기 전용
  if (caseId === "pressure_vessel") {
    const best = raw.best_result;

    const [fx, fy] = best.pressure_resultant_force_vector_N;
    const side = Math.hypot(fx, fy);
    if (side > 1000) {
      items.push({
        level: "warn",
        title: "내압 합력이 한쪽으로 쏠려 있어요",
        detail: `옆 방향 합력이 약 ${side.toFixed(0)} N이에요. 대칭 구조에 안쪽 압력만 걸었다면 0에 가까워야 해서, 압력이 일부 면에 빠졌거나 방향이 틀렸을 수 있어요.`,
      });
    }

    const r = best.design.main_inner_d / 2;
    const t = best.design.main_wall_thk;
    const theory = (PRESSURE_MPA * r) / t;
    const ratio = best.Smax_MPa / theory;
    if (ratio > 3) {
      items.push({
        level: "warn",
        title: "이론값과 차이가 너무 커요",
        detail: `주관의 이론 응력(pR/t)은 약 ${theory.toFixed(1)} MPa인데 해석은 ${best.Smax_MPa.toFixed(1)} MPa로 ${ratio.toFixed(1)}배예요. 노즐 연결부 효과를 감안해도 큰 차이라서 모델을 확인해야 해요.`,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      level: "ok",
      title: "자동 점검에서 이상이 발견되지 않았어요",
      detail: "",
    });
  }

  return (
    <div>
      <h3>자동 점검</h3>
      {items.map((it) => (
        <div
          key={it.title}
          style={{
            background: COLORS[it.level].bg,
            borderLeft: `6px solid ${COLORS[it.level].bar}`,
            borderRadius: 6,
            padding: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: "bold", color: COLORS[it.level].bar }}>
            {COLORS[it.level].icon} {it.title}
          </div>
          {it.detail && (
            <div style={{ fontSize: 14, marginTop: 4 }}>{it.detail}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Checks;