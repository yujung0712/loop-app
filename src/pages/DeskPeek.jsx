import { useEffect, useState } from "react";

function DeskPeek() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/data/desk.json")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) return <p>불러오는 중...</p>;

  const history = Array.isArray(data.history) ? data.history : [];

  return (
    <div>
      <h2>책상 파일 모양 확인</h2>
      <p>최상위 항목: {Object.keys(data).join(", ")}</p>

      <h3>best (또는 best_result)</h3>
      <pre>{JSON.stringify(data.best ?? data.best_result, null, 2)}</pre>

      <h3>history 첫 번째 항목</h3>
      <pre>{JSON.stringify(history[0], null, 2)}</pre>

      <h3>history 마지막 항목</h3>
      <pre>{JSON.stringify(history[history.length - 1], null, 2)}</pre>
    </div>
  );
}

export default DeskPeek;