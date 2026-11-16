// 케이스별 입력 칸 정의
// kind: "range" = 최소~최대, "value" = 값 하나
// allowNegative: true 이면 마이너스 값도 입력할 수 있어요 (하중처럼 방향이 있는 값)
export const SCHEMAS = {
  pressure_vessel: {
    title: "압력용기",
    sections: [
      {
        name: "설계 변수 (탐색 범위)",
        note: "최소~최대를 같은 간격으로 4칸으로 나눈 값이 후보예요. 예: 12~21 mm → 12, 15, 18, 21 mm. 후보를 한 칸씩 바꿔 가며 가장 좋은 설계를 찾아요.",
        fields: [
          { key: "main_thk", label: "주관 두께", unit: "mm", kind: "range", min: 12, max: 21 },
          { key: "nozzle_thk", label: "노즐 두께", unit: "mm", kind: "range", min: 8, max: 14 },
          { key: "pad_thk", label: "패드 두께", unit: "mm", kind: "range", min: 6, max: 12 },
        ],
      },
      {
        name: "판정 기준",
        note: "최대 해석 횟수에 닿으면 이 코드는 결과 없이 끝나요. 20 이상으로 넉넉하게 두세요.",
        fields: [
          { key: "stress_limit_MPa", label: "허용응력", unit: "MPa", kind: "value", value: 180 },
          { key: "weight_limit_N", label: "자중 제한", unit: "N", kind: "value", value: 25000 },
          { key: "max_eval", label: "최대 해석 횟수", unit: "회", kind: "value", value: 80 },
        ],
      },
      {
        name: "형상 · 하중 (고정값)",
        fields: [
          { key: "main_length", label: "주관 길이", unit: "mm", kind: "value", value: 1500 },
          { key: "main_inner_d", label: "주관 안지름", unit: "mm", kind: "value", value: 500 },
          { key: "nozzle_length", label: "노즐 길이", unit: "mm", kind: "value", value: 400 },
          { key: "nozzle_inner_d", label: "노즐 안지름", unit: "mm", kind: "value", value: 150 },
          { key: "pad_outer_d", label: "패드 바깥지름", unit: "mm", kind: "value", value: 260 },
          { key: "pressure_MPa", label: "내압", unit: "MPa", kind: "value", value: 5 },
        ],
      },
    ],
    theory: (v) => {
      const r = v.main_inner_d / 2;
      const tMin = (v.pressure_MPa * r) / v.main_thk_min;
      const tMax = (v.pressure_MPa * r) / v.main_thk_max;
      if (!isFinite(tMin) || !isFinite(tMax)) return null;
      return `주관 이론 응력(pR/t)은 두께 ${v.main_thk_min} mm에서 약 ${tMin.toFixed(1)} MPa, ${v.main_thk_max} mm에서 약 ${tMax.toFixed(1)} MPa예요. (노즐 연결부 응력 집중은 빠진 값)`;
    },
  },

  desk: {
    title: "책상",
    sections: [
      {
        name: "설계 변수 (탐색 범위)",
        fields: [
          { key: "leg_size_mm", label: "다리 굵기", unit: "mm", kind: "range", min: 30, max: 70 },
          { key: "tabletop_thk_mm", label: "상판 두께", unit: "mm", kind: "range", min: 10, max: 40 },
        ],
      },
      {
        name: "판정 기준",
        fields: [
          { key: "stress_limit_MPa", label: "허용응력", unit: "MPa", kind: "value", value: 5 },
          { key: "max_eval", label: "최대 해석 횟수", unit: "회", kind: "value", value: 120 },
        ],
      },
      {
        name: "형상 · 하중 (고정값)",
        fields: [
          { key: "tabletop_length", label: "상판 길이", unit: "mm", kind: "value", value: 1200 },
          { key: "tabletop_width", label: "상판 폭", unit: "mm", kind: "value", value: 800 },
          { key: "desk_height", label: "책상 높이", unit: "mm", kind: "value", value: 800 },
          { key: "load_N", label: "상판 하중", unit: "N", kind: "value", value: 1000 },
          { key: "E_MPa", label: "탄성계수 (목재)", unit: "MPa", kind: "value", value: 10000 },
        ],
      },
    ],
    theory: null,
  },

  flange: {
    title: "플랜지 파이프",
    sections: [
      {
        name: "설계 변수 (탐색 범위)",
        fields: [
          { key: "pipe_thk", label: "파이프 두께", unit: "mm", kind: "range", min: 5, max: 15 },
        ],
      },
      {
        name: "판정 기준",
        fields: [
          { key: "stress_limit_MPa", label: "허용응력", unit: "MPa", kind: "value", value: 30 },
          { key: "tol_mm", label: "이분법 허용오차", unit: "mm", kind: "value", value: 0.5 },
        ],
      },
      {
        name: "형상 · 하중 (고정값)",
        fields: [
          { key: "length", label: "파이프 길이", unit: "mm", kind: "value", value: 540 },
          { key: "inner_d", label: "내경", unit: "mm", kind: "value", value: 90 },
          { key: "flange_outer_d", label: "플랜지 외경", unit: "mm", kind: "value", value: 150 },
          { key: "flange_thk", label: "플랜지 두께", unit: "mm", kind: "value", value: 20 },
          { key: "bolt_holes", label: "볼트 구멍 수", unit: "개", kind: "value", value: 8 },
          { key: "pressure_MPa", label: "내압", unit: "MPa", kind: "value", value: 5 },
        ],
      },
    ],
    theory: (v) => {
      const t = (v.pressure_MPa * (v.inner_d / 2)) / v.stress_limit_MPa;
      if (!isFinite(t)) return null;
      return `얇은 원통 공식(pR/σ)으로 계산한 최소 두께는 약 ${t.toFixed(1)} mm예요. 해석 결과와 비교할 기준값이에요.`;
    },
  },

  tsb: {
    title: "TSB 봉",
    sections: [
      {
        name: "설계 변수 (탐색 범위)",
        note: "아래쪽 사각 구간은 고정이고, 위쪽 원기둥 구간의 지름을 바꿔요. 이 범위 안에서 지름을 반씩 좁혀 가며 허용 변위를 만족하는 가장 가는 지름을 찾아요.",
        fields: [
          { key: "cyl_d", label: "원기둥 지름", unit: "mm", kind: "range", min: 40, max: 120 },
        ],
      },
      {
        name: "판정 기준",
        note: "허용오차는 작을수록 정확하지만 해석 횟수가 늘어요. 메시 때문에 값이 몇 % 흔들려서 0.5 mm 정도면 충분해요. (0.5 mm면 약 8번, 0.01 mm면 약 13번)",
        fields: [
          { key: "u_limit_mm", label: "허용 끝단 변위", unit: "mm", kind: "value", value: 2.5 },
          { key: "tol_mm", label: "이분법 허용오차", unit: "mm", kind: "value", value: 0.5 },
          { key: "max_iter", label: "최대 반복 횟수", unit: "회", kind: "value", value: 20 },
        ],
      },
      {
        name: "형상 · 하중 (고정값)",
        note: "바닥(아래 끝)이 고정이고, 위 끝면을 위로 잡아당기는 인장 하중이에요.",
        fields: [
          { key: "L_total", label: "전체 길이", unit: "mm", kind: "value", value: 1000 },
          { key: "L_sq", label: "사각 구간 길이", unit: "mm", kind: "value", value: 500 },
          { key: "sq_w", label: "사각 폭", unit: "mm", kind: "value", value: 100 },
          { key: "sq_h", label: "사각 높이", unit: "mm", kind: "value", value: 100 },
          { key: "load_N", label: "끝단 인장 하중", unit: "N", kind: "value", value: 100000 },
          { key: "E_MPa", label: "탄성계수", unit: "MPa", kind: "value", value: 10000 },
          { key: "lc_mm", label: "메시 크기", unit: "mm", kind: "value", value: 10 },
        ],
      },
    ],
    theory: (v) => {
      // 축 방향 인장 변위 δ = F L / (E A) 를 허용값 이하로 만드는 최소 지름
      const sqPart = (v.load_N * v.L_sq) / (v.E_MPa * v.sq_w * v.sq_h);
      const rest = v.u_limit_mm - sqPart; // 사각 구간이 쓰고 남은 허용 변위
      if (!isFinite(rest)) return null;
      if (rest <= 0) {
        return `사각 구간만으로도 변위가 약 ${sqPart.toFixed(2)} mm라서 허용 변위를 넘어요. 지름을 바꿔도 합격할 수 없어요.`;
      }
      const A = (v.load_N * (v.L_total - v.L_sq)) / (v.E_MPa * rest);
      const d = Math.sqrt((4 * A) / Math.PI);
      return `축 방향 인장 이론(δ = FL/EA)으로 계산한 최소 지름은 약 ${d.toFixed(1)} mm예요. 집중 절점력의 영향으로 해석 결과는 이보다 조금 커요(예: 약 60 mm).`;
    },
  },

  fatigue: {
    title: "구멍 뚫린 판 피로",
    sections: [
      {
        name: "설계 변수 (탐색 범위)",
        note: "최소~최대를 같은 간격으로 4칸으로 나눈 값이 후보예요. 예: 판 폭 100~160 mm → 100, 120, 140, 160 mm. 후보를 한 칸씩 바꿔 가며 필요 수명을 만족하는 가장 좋은 설계를 찾아요.",
        fields: [
          { key: "plate_width", label: "판 폭", unit: "mm", kind: "range", min: 100, max: 160 },
          { key: "plate_thk", label: "판 두께", unit: "mm", kind: "range", min: 8, max: 14 },
          { key: "hole_d", label: "구멍 지름", unit: "mm", kind: "range", min: 16, max: 28 },
        ],
      },
      {
        name: "판정 기준",
        note: "필요 수명은 사이클 수예요. 수명이 길수록 좋은 설계이고, 허용 질량을 넘으면 불합격이에요. 최대 해석 횟수에 닿으면 이 코드는 결과 없이 끝나니 20 이상으로 두세요.",
        fields: [
          { key: "min_life_cycles", label: "필요 수명", unit: "사이클", kind: "value", value: 1000000 },
          { key: "max_mass_kg", label: "허용 질량", unit: "kg", kind: "value", value: 5 },
          { key: "max_eval", label: "최대 해석 횟수", unit: "회", kind: "value", value: 80 },
        ],
      },
      {
        name: "형상 · 하중 · 재료 (고정값)",
        note: "왼쪽 끝이 고정이고, 오른쪽 끝을 변위로 반복해서 당겨요 (0 → 최대 변위 → 0). 메시 크기는 6 mm 이상이에요 (학생용 ANSYS의 노드 수 제한 때문이에요).",
        fields: [
          { key: "plate_length", label: "판 길이", unit: "mm", kind: "value", value: 300 },
          { key: "ux_max_mm", label: "최대 반복 변위", unit: "mm", kind: "value", value: 0.15 },
          { key: "E_MPa", label: "탄성계수", unit: "MPa", kind: "value", value: 200000 },
          { key: "Su_MPa", label: "인장강도", unit: "MPa", kind: "value", value: 600 },
          { key: "lc_global_mm", label: "전체 메시 크기", unit: "mm", kind: "value", value: 8 },
          { key: "lc_hole_mm", label: "구멍 주변 메시 크기", unit: "mm", kind: "value", value: 3 },
        ],
      },
    ],
    theory: null,
  },

  beam: {
    title: "외팔보",
    sections: [
      {
        name: "형상 (왼쪽 끝이 고정단)",
        fields: [
          { key: "length", label: "보 길이", unit: "mm", kind: "value", value: 1000 },
          { key: "width", label: "단면 폭", unit: "mm", kind: "value", value: 50 },
          { key: "height", label: "단면 높이", unit: "mm", kind: "value", value: 50 },
        ],
      },
      {
        name: "재료",
        fields: [
          { key: "E_MPa", label: "탄성계수 (강철)", unit: "MPa", kind: "value", value: 200000 },
          { key: "nu", label: "포아송비", unit: "", kind: "value", value: 0.3 },
        ],
      },
      {
        name: "하중 · 메시",
        note: "하중은 보 끝을 누르는 힘이에요. 아래로 누르면 마이너스(-) 값을 넣어요. 메시 크기는 7 mm 이상이에요 (학생용 ANSYS의 노드 수 제한 때문이에요).",
        fields: [
          { key: "load_N", label: "끝단 하중", unit: "N", kind: "value", value: -1000, allowNegative: true },
          { key: "lc_mm", label: "메시 크기", unit: "mm", kind: "value", value: 10 },
        ],
      },
    ],
    theory: (v) => {
      // 오일러-베르누이 보 이론: 처짐 = F L^3 / (3 E I), 최대 굽힘응력 = F L (h/2) / I
      const I = (v.width * Math.pow(v.height, 3)) / 12;
      const tip = (v.load_N * Math.pow(v.length, 3)) / (3 * v.E_MPa * I);
      const stress = (Math.abs(v.load_N) * v.length * (v.height / 2)) / I;
      if (!isFinite(tip) || !isFinite(stress)) return null;
      return `보 이론으로 계산하면 끝단 처짐은 약 ${tip.toFixed(3)} mm, 최대 굽힘응력은 약 ${stress.toFixed(1)} MPa예요. 해석 결과와 비교할 기준값이에요.`;
    },
  },
};