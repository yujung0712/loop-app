function Card({ title, value, sub }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        minWidth: 200,
      }}
    >
      <div style={{ color: "#666", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: "bold" }}>{value}</div>
      <div style={{ color: "#888", fontSize: 13 }}>{sub}</div>
    </div>
  );
}

const cell = { padding: 8, borderTop: "1px solid #eee" };

function BeamResult({ raw, imageUrl, runId }) {
  const g = raw.geometry_mm;
  const mat = raw.material_MPa;
  const load = raw.load;
  const mesh = raw.mesh;
  const fea = raw.result_mapdl;
  const th = raw.result_theory_EB;
  const err = raw.error;

  const uzErr = err.tip_UZ_avg_error_percent_vs_EB;
  const ok = uzErr < 1; // 앱이 임의로 정한 기준: 처짐 오차 1% 미만이면 검증 통과
  const stressDiff =
    ((fea.global_max_seqv_MPa - th.max_bending_stress_MPa) /
      th.max_bending_stress_MPa) *
    100;

  return (
    <div>
      <h2>④ 결과 · 외팔보 (검증)</h2>
      {runId && (
        <p style={{ color: "#1565c0", fontSize: 14 }}>
          방금 실행한 해석 결과예요 ({runId})
        </p>
      )}

      {/* 검증 배너 */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          color: "white",
          background: ok ? "#2e7d32" : "#ef6c00",
        }}
      >
        {ok
          ? `✓ 검증 통과: 끝단 처짐이 이론값과 ${uzErr.toFixed(2)}% 차이로 잘 맞아요`
          : `! 이론값과의 차이가 커요 (처짐 오차 ${uzErr.toFixed(2)}%). 메시 크기와 입력값을 확인하세요`}
      </div>

      {/* 수치 카드 */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card
          title="끝단 처짐"
          value={`${fea.load_face_UZ_avg_mm.toFixed(3)} mm`}
          sub={`이론 ${th.tip_UZ_mm.toFixed(3)} mm · 오차 ${uzErr.toFixed(2)}%`}
        />
        <Card
          title="최대 응력 (von Mises)"
          value={`${fea.global_max_seqv_MPa.toFixed(1)} MPa`}
          sub={`이론 굽힘응력 ${th.max_bending_stress_MPa.toFixed(1)} MPa`}
        />
        <Card
          title="고정단 반력"
          value={`${fea.fixed_reaction_FZ_sum_N.toFixed(1)} N`}
          sub={`가한 하중 ${Math.abs(load.F_tip_total_N)} N`}
        />
        <Card
          title="메시"
          value={`${mesh.mesh_nodes.toLocaleString()}개 노드`}
          sub={`요소 ${mesh.mesh_elems.toLocaleString()}개 · 계산 ${mesh.solve_time_s.toFixed(1)}초`}
        />
      </div>

      {/* 응력 그림 */}
      <h3 style={{ marginTop: 32 }}>응력 분포 (von Mises)</h3>
      <img
        src={imageUrl}
        alt="외팔보 응력 분포"
        style={{
          maxWidth: "100%",
          maxHeight: 420,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />

      {/* 해석 vs 이론 */}
      <h3 style={{ marginTop: 32 }}>해석 vs 이론 (오일러-베르누이 보 이론)</h3>
      <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 640 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#666", fontSize: 14 }}>
            <th style={{ padding: 8 }}>항목</th>
            <th style={{ padding: 8 }}>ANSYS 해석</th>
            <th style={{ padding: 8 }}>이론</th>
            <th style={{ padding: 8 }}>차이</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cell}>끝단 처짐 (mm)</td>
            <td style={cell}>{fea.load_face_UZ_avg_mm.toFixed(3)}</td>
            <td style={cell}>{th.tip_UZ_mm.toFixed(3)}</td>
            <td style={cell}>{uzErr.toFixed(2)}%</td>
          </tr>
          <tr>
            <td style={cell}>최대 응력 (MPa)</td>
            <td style={cell}>{fea.global_max_seqv_MPa.toFixed(2)}</td>
            <td style={cell}>{th.max_bending_stress_MPa.toFixed(2)}</td>
            <td style={cell}>{stressDiff.toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          background: "#fff4e5",
          borderLeft: "6px solid #ef6c00",
          borderRadius: 6,
          padding: 12,
          marginTop: 16,
          fontSize: 14,
        }}
      >
        <b>응력 비교할 때 알아둘 점</b>
        <div>
          해석의 최대 응력은 고정단 모서리에 몰리는 von Mises 응력이고, 이론값은
          단순 굽힘응력이에요. 종류가 달라서 완전히 같을 수 없어요. 처짐을 기준으로
          검증하는 게 정확해요.
        </div>
      </div>

      {/* 입력 조건 */}
      <h3 style={{ marginTop: 32 }}>입력 조건</h3>
      <div style={{ fontSize: 14, color: "#444" }}>
        길이 {g.beam_length} mm · 폭 {g.beam_width} mm · 높이 {g.beam_height} mm
        {"  ·  "}탄성계수 {mat.E.toLocaleString()} MPa · 포아송비 {mat.nu}
        {"  ·  "}하중 {load.F_tip_total_N} N
      </div>
    </div>
  );
}

export default BeamResult;