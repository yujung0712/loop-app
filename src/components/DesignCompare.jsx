// 파일 속 영어 키 이름 → 화면에 보여줄 한글 이름
import { LABELS } from "../adapters";

function DesignCompare({ initial, best }) {
  const keys = Object.keys(initial);
  const changed = keys.filter((k) => initial[k] !== best[k]);
  const fixed = keys.filter((k) => initial[k] === best[k]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>처음 → 최종 설계</h3>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#666", fontSize: 14 }}>
            <th style={{ padding: 8 }}>변수</th>
            <th style={{ padding: 8 }}>처음</th>
            <th style={{ padding: 8 }}>최종</th>
          </tr>
        </thead>
        <tbody>
          {changed.map((k) => (
            <tr key={k} style={{ borderTop: "1px solid #eee", fontWeight: "bold" }}>
              <td style={{ padding: 8 }}>{LABELS[k] || k}</td>
              <td style={{ padding: 8 }}>{initial[k]} mm</td>
              <td style={{ padding: 8, color: "#c62828" }}>{best[k]} mm</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ color: "#888", fontSize: 13, marginBottom: 0 }}>
        바뀌지 않은 값:{" "}
        {fixed.map((k) => `${LABELS[k] || k} ${initial[k]}mm`).join(" · ")}
      </p>
    </div>
  );
}

export default DesignCompare;