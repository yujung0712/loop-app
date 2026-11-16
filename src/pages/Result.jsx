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
import { API_BASE, CASE_FILES, DEMO, adaptCase } from "../adapters";

// 막대 색: 초록 = 합격, 주황 = 일부만 부족, 빨강 = 불합격
const STATUS_COLOR = { ok: "#2e7d32", warn: "#ef6c00", bad: "#c62828" };

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

// 어느 결과인지 알려 주는 한 줄
function SourceNote({ runId, meta }) {
  if (DEMO) {
    return <p style={{ color: "#888", fontSize: 14 }}>데모 버전: 저장해 둔 해석 결과예요</p>;
  }
  if (runId) {
    return (
      <p style={{ color: "#1565c0", fontSize: 14 }}>
        방금 실행한 해석 결과예요 ({runId})
      </p>
    );
  }
  if (meta && meta.source === "last") {
    return (
      <p style={{ color: "#1565c0", fontSize: 14 }}>
        마지막으로 실행한 결과예요 ({meta.finished_at} · 실행 {meta.run_id})
      </p>
    );
  }
  return (
    <p style={{ color: "#888", fontSize: 14 }}>
      저장해 둔 기본 결과예요 (이 케이스는 아직 실행한 적이 없어요)
    </p>
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

  const meta = raw._meta;
  const imageUrl = runId
    ? `${API_BASE}/api/runs/${runId}/image`
    : CASE_FILES[caseId].image;

  // 외팔보는 반복 기록이 없는 검증 케이스라서 화면이 따로 있어요
  if (caseId === "beam") {
    return (
      <div>
        {!runId && <SourceNote runId={runId} meta={meta} />}
        <BeamResult raw={raw} imageUrl={imageUrl} runId={runId} />
      </div>
    );
  }

  const view = adaptCase(caseId, raw);

  // 케이스마다 다른 단위와 이름 (정해 주지 않으면 응력 기준이에요)
  const unit = view.unit || "MPa";
  const metric = view.metric || "최대응력";
  const limitName = view.limitName || "허용응력";
  const imageTitle = view.imageTitle || "응력 분포 (최종 설계)";
  const digits = view.digits ?? 2;

  // 풀리지 않은 설계는 막대를 그리지 않아요 (value가 null이면 막대가 없어요)
  const failedIds = view.history.filter((h) => h.failed).map((h) => h.eval);
  const chartData = view.history.map((h) => ({
    eval: h.eval,
    value: h.failed ? null : Number(h.value.toFixed(digits)),
    feasible: h.feasible,
    status: h.status || (h.feasible ? "ok" : "bad"),
  }));

  // 값 차이가 20배 넘게 크면 세로 축을 로그 눈금으로 바꿔요
  const nums = chartData.map((d) => d.value).filter((v) => v !== null && v > 0);
  const maxV = nums.length > 0 ? Math.max(...nums) : 1;
  const minV = Math.min(...(nums.length > 0 ? nums : [1]), view.limit);
  const useLog = nums.length > 0 && maxV / minV > 20;
  const yDomain = useLog ? [Math.pow(10, Math.floor(Math.log10(minV))), "auto"] : [0, "auto"];

  return (
    <div>
      <h2>④ 결과 · {view.title}</h2>
      <SourceNote runId={runId} meta={meta} />

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
          : "✕ 합격한 설계를 찾지 못했어요. 모든 설계가 기준을 만족하지 못했어요"}
      </div>

      {/* 수치 카드 */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {view.cards.map((c) => (
          <Card key={c.title} title={c.title} value={c.value} sub={c.sub} />
        ))}
      </div>

      {/* 해석 그림 */}
      <h3 style={{ marginTop: 32 }}>{imageTitle}</h3>
      <img
        src={imageUrl}
        alt={imageTitle}
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
      <h3 style={{ marginTop: 32 }}>반복별 {metric}</h3>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="eval"
              label={{ value: "해석 번호", position: "insideBottom", offset: -4 }}
            />
            <YAxis
              scale={useLog ? "log" : "linear"}
              domain={yDomain}
              allowDataOverflow
              tickFormatter={view.tickFormatter}
              label={{ value: unit, angle: -90, position: "insideLeft" }}
            />
            <Tooltip formatter={(v) => `${Number(v).toLocaleString()} ${unit}`} />
            <ReferenceLine
              y={view.limit}
              stroke="#2e7d32"
              strokeDasharray="6 4"
              label={{
                value: `${limitName} ${Number(view.limit).toLocaleString()} ${unit}`,
                position: "right",
                fill: "#2e7d32",
              }}
            />
            <Bar dataKey="value">
              {chartData.map((d) => (
                <Cell key={d.eval} fill={STATUS_COLOR[d.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p style={{ color: "#666", fontSize: 13 }}>
        {view.legend ||
          `빨간 막대 = 불합격, 초록 막대 = 합격, 초록 점선 = ${limitName}`}
      </p>
      {useLog && (
        <p style={{ color: "#666", fontSize: 13, marginTop: -8 }}>
          값 차이가 커서 세로 축은 로그 눈금이에요 (눈금 한 칸이 10배).
        </p>
      )}
      {failedIds.length > 0 && (
        <p style={{ color: "#ef6c00", fontSize: 13, marginTop: -8 }}>
          ! 해석 번호 {failedIds.join(", ")}번은 ANSYS가 풀지 못해서 막대를 그리지 않았어요.
        </p>
      )}

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