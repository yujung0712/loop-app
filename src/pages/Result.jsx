import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import DesignCompare from "../components/DesignCompare";
import Checks from "../components/Checks";
import BeamResult from "../components/BeamResult";
import { API_BASE, CASE_FILES, adaptCase } from "../adapters";

function Card({ title, value, sub }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        minWidth: 180,
      }}
    >
      <div style={{ color: "#666", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: "bold" }}>{value}</div>
      <div style={{ color: "#888", fontSize: 13 }}>{sub}</div>
    </div>
  );
}

function Result() {
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get("run"); // 있으면 방금 돌린 해석 결과
  const [raw, setRaw] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setRaw(null);
    setError(false);
    const url = runId
      ? `${API_BASE}/api/runs/${runId}/result`
      : CASE_FILES[caseId]?.json;
    if (!url) return;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("load failed");
        return res.json();
      })
      .then((json) => setRaw(json))
      .catch(() => setError(true));
  }, [caseId, runId]);

  if (!CASE_FILES[caseId]) return <p>아직 준비되지 않은 케이스예요.</p>;
  if (error)
    return (
      <p>
        결과를 불러오지 못했어요. 서버가 켜져 있는지 확인하세요.
        {runId && " (서버를 다시 켰다면 해석을 다시 실행해야 해요.)"}
      </p>
    );
  if (!raw) return <p>불러오는 중...</p>;

  const imageUrl = runId
    ? `${API_BASE}/api/runs/${runId}/image`
    : CASE_FILES[caseId].image;

  // 외팔보는 반복 기록이 없는 검증 케이스라서 화면이 따로 있어요
  if (caseId === "beam") {
    return <BeamResult raw={raw} imageUrl={imageUrl} runId={runId} />;
  }

  const view = adaptCase(caseId, raw);
  const chartData = view.history.map((h) => ({
    eval: h.eval,
    value: Number(h.value.toFixed(2)),
    feasible: h.feasible,
  }));

  return (
    <div>
      <h2>④ 결과 · {view.title}</h2>
      {runId && (
        <p style={{ color: "#1565c0", fontSize: 14 }}>
          방금 실행한 해석 결과예요 ({runId})
        </p>
      )}

      {/* 상태 배너 */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          color: "white",
          background: view.feasible ? "#2e7d32" : "#c62828",
        }}
      >
        {view.feasible
          ? "✓ 합격한 설계를 찾았어요"
          : "✕ 합격한 설계를 찾지 못했어요. 모든 설계가 기준을 넘었어요"}
      </div>

      {/* 수치 카드 */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {view.cards.map((c) => (
          <Card key={c.title} title={c.title} value={c.value} sub={c.sub} />
        ))}
      </div>

      {/* 응력 그림 */}
      <h3 style={{ marginTop: 32 }}>응력 분포 (최종 설계)</h3>
      <img
        src={imageUrl}
        alt="최종 설계의 응력 분포"
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

      {/* 반복 기록 차트 */}
      <h3 style={{ marginTop: 32 }}>반복별 최대응력</h3>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="eval"
              label={{ value: "해석 번호", position: "insideBottom", offset: -4 }}
            />
            <YAxis label={{ value: "MPa", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <ReferenceLine
              y={view.limit}
              stroke="#2e7d32"
              strokeDasharray="6 4"
              label={{
                value: `허용 ${view.limit} MPa`,
                position: "right",
                fill: "#2e7d32",
              }}
            />
            <Bar dataKey="value">
              {chartData.map((d) => (
                <Cell key={d.eval} fill={d.feasible ? "#2e7d32" : "#c62828"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p style={{ color: "#666", fontSize: 13 }}>
        빨간 막대 = 불합격, 초록 막대 = 합격, 초록 점선 = 허용응력
      </p>

      <div style={{ marginTop: 32 }}>
        <DesignCompare initial={view.initial} best={view.best} />
      </div>

      <div style={{ marginTop: 32 }}>
        <Checks view={view} raw={raw} caseId={caseId} />
      </div>
    </div>
  );
}

export default Result;