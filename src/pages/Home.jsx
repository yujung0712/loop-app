import { Link } from "react-router-dom";
import { CASES } from "../data/cases";
import { DEMO } from "../adapters";

const linkStyle = {
  fontSize: 13,
  textDecoration: "none",
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #1565c0",
  color: "#1565c0",
  background: "white",
};

function CaseCard({ c }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        width: 260,
        opacity: c.ready ? 1 : 0.5,
        background: "white",
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

      {c.ready ? (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {!DEMO && (
            <Link
              to={"/input/" + c.id}
              style={{ ...linkStyle, background: "#1565c0", color: "white" }}
            >
              입력 · 실행
            </Link>
          )}
          <Link
            to={"/result/" + c.id}
            style={
              DEMO ? { ...linkStyle, background: "#1565c0", color: "white" } : linkStyle
            }
          >
            결과 보기
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 14, fontSize: 13, color: "#999" }}>준비 중</div>
      )}
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>해석할 케이스를 고르세요</h2>

      {DEMO && (
        <div
          style={{
            background: "#fff4e5",
            borderLeft: "6px solid #ef6c00",
            borderRadius: 6,
            padding: 12,
            marginBottom: 16,
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 720,
          }}
        >
          <b>데모 버전이에요.</b> 미리 해석해 둔 결과만 볼 수 있어요. 해석을 직접
          실행하는 기능은 ANSYS가 설치된 컴퓨터에서만 돼요.
        </div>
      )}

      <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>
        <b>검증</b>: 설계 하나를 한 번 해석해서 이론값과 맞는지 확인해요.
        <br />
        <b>최적화</b>: 설계를 바꿔 가며 여러 번 해석해서 조건을 만족하는 가장 좋은 설계를 찾아요.
        {!DEMO && (
          <>
            <br />
            <span style={{ color: "#888" }}>
              "결과 보기"는 마지막으로 실행한 결과를 보여 줘요. 아직 실행한 적이 없으면
              저장해 둔 기본 결과가 나와요.
            </span>
          </>
        )}
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {CASES.map((c) => (
          <CaseCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

export default Home;