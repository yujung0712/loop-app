// 케이스별 입력 칸 정의
// kind: "range" = 최소~최대, "value" = 값 하나
export const SCHEMAS = {
  pressure_vessel: {
    title: "압력용기",
    sections: [
      {
        name: "설계 변수 (시작값)",
        note: "후보 목록은 problem.json 확인 후 채울 예정이에요.",
        fields: [
          { key: "main_wall_thk", label: "주관 두께", unit: "mm", kind: "value", value: 15 },
          { key: "nozzle_wall_thk", label: "노즐 두께", unit: "mm", kind: "value", value: 10 },
          { key: "pad_thk", label: "패드 두께", unit: "mm", kind: "value", value: 10 },
        ],
      },
      {
        name: "판정 기준",
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
      const t = (v.pressure_MPa * (v.main_inner_d / 2)) / v.main_wall_thk;
      if (!isFinite(t)) return null;
      return `주관 이론 응력(pR/t)은 약 ${t.toFixed(1)} MPa예요. (노즐 연결부 응력 집중은 빠진 값)`;
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
};