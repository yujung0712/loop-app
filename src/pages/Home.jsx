import { Link } from "react-router-dom";
import { CASES } from "../data/cases";

function CaseCard({ c }) {
  const body = (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        width: 260,
        opacity: c.ready ? 1 : 0.5,
        background: "white",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b style={{ fontSize: 18 }}>{c.name}</b>
        <span
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 10,
            background: c.kind === "검증" ? "#e3f2fd" : "#f3e5f5",
          }}
        >
          {c.kind}
        </span>
      </div>
      <div style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
        탐색 방식: {c.method}
      </div>
      <div style={{ color: "#666", fontSize: 14 }}>판정 기준: {c.criterion}</div>
      <div
        style={{
          marginTop: 12,
          fontSize: 13,
          color: c.ready ? "#2e7d32" : "#999",
        }}
      >
        {c.ready ? "결과 보기 →" : "준비 중"}
      </div>
    </div>
  );

  // 데이터가 있는 케이스만 눌러서 이동
  if (c.ready) {
    return (
      <Link to={"/result/" + c.id} style={{ textDecoration: "none" }}>
        {body}
      </Link>
    );
  }
  return body;
}

function Home() {
  return (
    <div>
      <h2>① 홈 · 케이스 선택</h2>
      <p style={{ color: "#666" }}>해석할 케이스를 고르세요.</p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {CASES.map((c) => (
          <CaseCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

export default Home;