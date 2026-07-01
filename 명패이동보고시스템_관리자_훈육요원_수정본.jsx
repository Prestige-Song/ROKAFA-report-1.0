import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plane, Radio, CheckCircle2, Clock, Users, ShieldCheck, LogOut, ChevronRight, Eye, RotateCcw } from "lucide-react";

/* ---------------------------------------------------------
   토큰
   bg-deep #0B121C / panel #141E2B / line #223244
   accent  #2F6FA5 (공군 블루)  active #5EEAD4 (시안)
   text-primary #E7EEF5 / text-muted #7C8FA3
--------------------------------------------------------- */

const DEFAULT_STATUS = "정예관";
const DATA_KEY = "nameplate_data"; // { board: {...}, log: [...] } 를 한 키에 통합 (동시 쓰기 실패 방지)

const STATUS = [
  { id: "정예관", label: "정예관", color: "#8B7CD9", bg: "#8B7CD91A", isDefault: true },
  { id: "정기", label: "정기외출", color: "#5EEAD4", bg: "#5EEAD41A" },
  { id: "특별외출", label: "특별외출", color: "#5EC4EA", bg: "#5EC4EA1A" },
  { id: "특별외박", label: "특별외박", color: "#3A8FD1", bg: "#3A8FD11A" },
  { id: "청원휴가", label: "청원휴가", color: "#D97BC4", bg: "#D97BC41A" },
  { id: "파견", label: "파견", color: "#C97B3E", bg: "#C97B3E1A" },
  { id: "자발적잔류", label: "자발적 잔류", color: "#4CAF7D", bg: "#4CAF7D1A" },
  { id: "국외", label: "국외", color: "#E2574C", bg: "#E2574C1A" },
  { id: "단재관", label: "단재관", color: "#E8A33D", bg: "#E8A33D1A" },
  { id: "도서관", label: "도서관", color: "#2F6FA5", bg: "#2F6FA51A" },
];

const statusOf = (id) => STATUS.find((s) => s.id === id) || STATUS[0];
const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

function useInterval(callback, delay) {
  const ref = useRef(callback);
  useEffect(() => { ref.current = callback; }, [callback]);
  useEffect(() => {
    const id = setInterval(() => ref.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/* 저장 실패 시 짧게 재시도 (일시적 오류/경합 대비) */
async function setWithRetry(key, value, shared, retries = 2) {
  let lastErr = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await window.storage.set(key, value, shared);
      if (result) return result;
      lastErr = new Error("storage.set returned empty result");
    } catch (e) {
      lastErr = e;
    }
    if (i < retries) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  throw lastErr || new Error("storage.set failed");
}

async function getData() {
  try {
    const res = await window.storage.get(DATA_KEY, true);
    const parsed = res && res.value ? JSON.parse(res.value) : null;
    return parsed || { board: {}, log: [] };
  } catch (e) {
    return { board: {}, log: [] };
  }
}

export default function App() {
  const [identity, setIdentity] = useState(null);
  const [loadingIdentity, setLoadingIdentity] = useState(true);
  const [board, setBoard] = useState({});
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState("board");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  /* ---- identity 로드 ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("identity", false);
        if (res && res.value) setIdentity(JSON.parse(res.value));
      } catch (e) {}
      setLoadingIdentity(false);
    })();
  }, []);

  /* ---- 데이터 로드 (현황판 + 로그, 한 번에) ---- */
  const loadData = useCallback(async () => {
    const data = await getData();
    setBoard(data.board);
    setLog(data.log);
  }, []);

  useEffect(() => {
    (async () => { await loadData(); setReady(true); })();
  }, [loadData]);

  useInterval(loadData, 4000);

  /* ---- 최초 등록 시 기본 상태(정예관) 심기 ---- */
  useEffect(() => {
    if (!identity || identity.role !== "생도" || !ready) return;
    if (!board[identity.key]) {
      (async () => {
        try {
          const data = await getData();
          if (!data.board[identity.key]) {
            data.board[identity.key] = {
              name: identity.name, cohort: identity.cohort, company: identity.company, position: identity.position,
              status: DEFAULT_STATUS, updatedAt: Date.now(), updatedBy: "system",
            };
            await setWithRetry(DATA_KEY, JSON.stringify(data), true);
            setBoard(data.board);
            setLog(data.log);
          }
        } catch (e) { console.error("초기 등록 실패:", e); }
      })();
    }
  }, [identity, ready, board]);

  const registerIdentity = async (fields) => {
    await window.storage.set("identity", JSON.stringify(fields), false);
    setIdentity(fields);
  };

  const switchIdentity = async () => {
    try { await window.storage.delete("identity", false); } catch (e) {}
    setIdentity(null);
  };

  /* 신고 = 즉시 현황판 반영. 관리자는 로그를 보고 확인만 한다. */
  const submitReport = async (newStatus, reason) => {
    if (!window.storage) { showToast("저장소를 사용할 수 없습니다. 잠시 후 다시 시도해주세요."); return; }
    try {
      const data = await getData();
      const previousStatus = (data.board[identity.key] && data.board[identity.key].status) || DEFAULT_STATUS;

      data.board[identity.key] = {
        name: identity.name, cohort: identity.cohort, company: identity.company, position: identity.position,
        status: newStatus, updatedAt: Date.now(), updatedBy: identity.name,
      };
      data.log.unshift({
        id: `${identity.key}-${Date.now()}`,
        key: identity.key, name: identity.name, cohort: identity.cohort, company: identity.company,
        fromStatus: previousStatus, toStatus: newStatus, reason: reason || "",
        timestamp: Date.now(), ackBy: null, ackAt: null,
      });
      data.log = data.log.slice(0, 300);

      await setWithRetry(DATA_KEY, JSON.stringify(data), true);
      setBoard(data.board);
      setLog(data.log);
      showToast(`'${statusOf(newStatus).label}'(으)로 명패이동보고를 완료했습니다.`);
    } catch (e) {
      console.error("submitReport failed:", e);
      showToast(`보고 처리에 실패했습니다. (${e && e.message ? e.message : "알 수 없는 오류"})`);
    }
  };

  /* 관리자가 '확인' 버튼을 누르면 로그에 확인자/시각만 기록 (현황판에는 영향 없음) */
  const acknowledge = async (entryId) => {
    try {
      const data = await getData();
      data.log = data.log.map((r) => (r.id === entryId ? { ...r, ackBy: identity.name, ackAt: Date.now() } : r));
      await setWithRetry(DATA_KEY, JSON.stringify(data), true);
      setLog(data.log);
    } catch (e) {
      console.error("acknowledge failed:", e);
      showToast("확인 처리에 실패했습니다.");
    }
  };

  /* 관리자 전용: 전체 현황판 + 보고 이력을 처음 상태로 초기화 (되돌릴 수 없음) */
  const resetAll = async () => {
    try {
      const empty = { board: {}, log: [] };
      await setWithRetry(DATA_KEY, JSON.stringify(empty), true);
      setBoard({});
      setLog([]);
      setConfirmingReset(false);
      showToast("전체 현황판과 보고 이력이 초기화되었습니다.");
    } catch (e) {
      console.error("resetAll failed:", e);
      showToast(`초기화에 실패했습니다. (${e && e.message ? e.message : "알 수 없는 오류"})`);
    }
  };

  if (loadingIdentity) return <Shell><CenterNote text="불러오는 중..." /></Shell>;
  if (!identity) return <Shell><Onboarding onSubmit={registerIdentity} /></Shell>;

  const myStatus = (board[identity.key] && board[identity.key].status) || DEFAULT_STATUS;
  const myLastReport = log.find((r) => r.key === identity.key);
  const unackedCount = log.filter((r) => !r.ackBy).length;

  return (
    <Shell>
      <Header identity={identity} onSwitch={switchIdentity} unackedCount={unackedCount} />
      <Tabs tab={tab} setTab={setTab} identity={identity} unackedCount={unackedCount} />
      <div style={{ padding: "18px 20px 40px" }}>
        {!ready && <CenterNote text="현황판 불러오는 중..." />}
        {ready && tab === "board" && <BoardView board={board} />}
        {ready && tab === "mine" && identity.role === "생도" && (
          <MyReport myStatus={myStatus} myLastReport={myLastReport} onSubmit={submitReport} />
        )}
        {ready && tab === "log" && identity.role === "훈육요원" && (
          <LogView
            log={log}
            onAck={acknowledge}
            confirmingReset={confirmingReset}
            onRequestReset={() => setConfirmingReset(true)}
            onCancelReset={() => setConfirmingReset(false)}
            onConfirmReset={resetAll}
          />
        )}
      </div>
      {toast && <Toast text={toast} />}
    </Shell>
  );
}

/* ---------------- Shell / layout pieces ---------------- */

function Shell({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "#0B121C",
        color: "#E7EEF5",
        minHeight: "560px",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #223244",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .kaf-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.02em; }
        .kaf-mono { font-family: 'JetBrains Mono', monospace; }
        button { font-family: inherit; cursor: pointer; }
        input, select { font-family: inherit; }
        ::selection { background: #5EEAD440; }
      `}</style>
      {children}
    </div>
  );
}

function CenterNote({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "#7C8FA3" }}>
      {text}
    </div>
  );
}

function Toast({ text }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#141E2B",
        border: "1px solid #223244",
        color: "#E7EEF5",
        padding: "10px 18px",
        borderRadius: 10,
        fontSize: 13,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        zIndex: 50,
        maxWidth: "80%",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "#0B121C", border: "1px solid #223244",
  borderRadius: 8, padding: "10px 12px", color: "#E7EEF5", fontSize: 14, marginBottom: 12, outline: "none",
};
const labelStyle = { fontSize: 12, color: "#7C8FA3", display: "block", marginBottom: 6 };

function Onboarding({ onSubmit }) {
  const [role, setRole] = useState("생도");
  const [name, setName] = useState("");
  const [cohort, setCohort] = useState("");      // 기수
  const [company, setCompany] = useState("");    // 중대
  const [studentId, setStudentId] = useState(""); // 교번
  const [cadetPosition, setCadetPosition] = useState(""); // 생도 직책

  const [militaryId, setMilitaryId] = useState(""); // 군번
  const [staffPosition, setStaffPosition] = useState(""); // 훈육요원 직책
  const [rank, setRank] = useState(""); // 계급

  const isCadet = role === "생도";
  const valid = isCadet
    ? cohort.trim() && company.trim() && name.trim() && studentId.trim() && cadetPosition.trim()
    : militaryId.trim() && staffPosition.trim() && rank.trim() && name.trim();

  const handleSubmit = () => {
    if (!valid) return;
    if (isCadet) {
      onSubmit({
        role: "생도",
        name: name.trim(),
        cohort: cohort.trim(),
        company: company.trim(),
        studentId: studentId.trim(),
        position: cadetPosition.trim(),
        key: `cadet-${studentId.trim()}`,
      });
    } else {
      onSubmit({
        role: "훈육요원",
        name: name.trim(),
        militaryId: militaryId.trim(),
        position: staffPosition.trim(),
        rank: rank.trim(),
        key: `staff-${militaryId.trim()}`,
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 560, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, color: "#5EEAD4" }}>
        <Plane size={22} />
        <span className="kaf-display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", color: "#7C8FA3" }}>
          ROKAFA · REPORTING SYSTEM
        </span>
      </div>
      <h1 className="kaf-display" style={{ fontSize: 28, fontWeight: 700, margin: "6px 0 22px" }}>
        명패이동보고 시스템
      </h1>

      <div style={{ width: 340, background: "#141E2B", border: "1px solid #223244", borderRadius: 12, padding: 22 }}>
        <label style={labelStyle}>사용자 구분</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["생도", "훈육요원"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: role === r ? "1px solid #5EEAD4" : "1px solid #223244",
                background: role === r ? "#5EEAD41A" : "transparent",
                color: role === r ? "#5EEAD4" : "#7C8FA3",
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {isCadet ? (
          <>
            <label style={labelStyle}>기수</label>
            <input value={cohort} onChange={(e) => setCohort(e.target.value)} placeholder="예: 78" style={inputStyle} />
            <label style={labelStyle}>중대</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="예: 1" style={inputStyle} />
            <label style={labelStyle}>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 김공사" style={inputStyle} />
            <label style={labelStyle}>교번</label>
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="예: 7자리" style={inputStyle} />
            <label style={labelStyle}>직책</label>
            <input value={cadetPosition} onChange={(e) => setCadetPosition(e.target.value)} placeholder="예: 중대장생도 / 일반생도" style={{ ...inputStyle, marginBottom: 20 }} />
          </>
        ) : (
          <>
            <label style={labelStyle}>군번</label>
            <input value={militaryId} onChange={(e) => setMilitaryId(e.target.value)} placeholder="예: 군번" style={inputStyle} />
            <label style={labelStyle}>직책</label>
            <input value={staffPosition} onChange={(e) => setStaffPosition(e.target.value)} placeholder="예: 훈육관 / 당직훈육관" style={inputStyle} />
            <label style={labelStyle}>계급</label>
            <input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="예: 대위" style={inputStyle} />
            <label style={labelStyle}>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 김공사" style={{ ...inputStyle, marginBottom: 20 }} />
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={!valid}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
            background: valid ? "#2F6FA5" : "#22324480",
            color: "#fff", fontWeight: 600, fontSize: 14,
          }}
        >
          시작하기
        </button>
      </div>
      <p style={{ fontSize: 11, color: "#7C8FA3", marginTop: 14, textAlign: "center", maxWidth: 320 }}>
        입력한 정보는 이 기기에만 저장됩니다. 생도의 신고는 별도 승인 없이 즉시 현황판에 반영되며,
        관리자는 보고 내역을 확인만 합니다.
      </p>
    </div>
  );
}

function Header({ identity, onSwitch, unackedCount }) {
  const isCadet = identity.role === "생도";
  const mainLine = isCadet
    ? `${identity.cohort}.${identity.company}.${identity.name}.${identity.studentId}`
    : `${identity.rank || ""} ${identity.name}`.trim();
  const subLine = isCadet
    ? `${identity.position || "생도"}`
    : `${identity.position} · ${identity.militaryId || identity.hakbun || ""}`;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid #223244",
        background: "linear-gradient(180deg, #101a26 0%, #0B121C 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#2F6FA51A", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #2F6FA555" }}>
          <Plane size={17} color="#5EEAD4" />
        </div>
        <div>
          <div className="kaf-display" style={{ fontWeight: 700, fontSize: 17, lineHeight: 1 }}>명패이동보고</div>
          <div style={{ fontSize: 10.5, color: "#7C8FA3", marginTop: 3, letterSpacing: "0.06em" }}>공군사관학교 · REAL-TIME BOARD</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {identity.role === "훈육요원" && unackedCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#E8A33D1A", color: "#E8A33D", padding: "5px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            <Eye size={13} /> 미확인 {unackedCount}
          </div>
        )}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }} className={isCadet ? "kaf-mono" : ""}>{mainLine}</div>
          <div style={{ fontSize: 10, color: identity.role === "훈육요원" ? "#8B7CD9" : "#7C8FA3" }}>{subLine}</div>
        </div>
        <button
          onClick={onSwitch}
          title="계정 전환"
          style={{ background: "transparent", border: "1px solid #223244", borderRadius: 8, padding: 8, color: "#7C8FA3", display: "flex" }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

function Tabs({ tab, setTab, identity, unackedCount }) {
  const items = [{ id: "board", label: "전체 현황판", icon: Users }];
  if (identity.role === "생도") items.push({ id: "mine", label: "나의 신고", icon: Radio });
  if (identity.role === "훈육요원") items.push({ id: "log", label: `관리자 확인 (${unackedCount})`, icon: ShieldCheck });

  return (
    <div style={{ display: "flex", gap: 6, padding: "12px 20px 0" }}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "8px 8px 0 0",
              border: "1px solid #223244", borderBottom: active ? "1px solid #0B121C" : "1px solid #223244",
              background: active ? "#141E2B" : "transparent",
              color: active ? "#E7EEF5" : "#7C8FA3", fontSize: 13, fontWeight: 600, marginBottom: -1, zIndex: active ? 2 : 1,
            }}
          >
            <Icon size={13} /> {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Board ---------------- */

function BoardView({ board }) {
  const entries = Object.entries(board);
  const total = entries.length;
  if (total === 0) {
    return <CenterNote text="등록된 생도가 없습니다. 생도가 처음 접속하면 자동으로 '정예관'으로 등록됩니다." />;
  }
  return (
    <div>
      <div style={{ fontSize: 11, color: "#7C8FA3", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
        <span>전체 {total}명</span>
        <span className="kaf-mono">실시간 갱신 · 4s</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {STATUS.map((s) => {
          const members = entries.filter(([, v]) => v.status === s.id);
          return (
            <div key={s.id} style={{ background: "#141E2B", border: "1px solid #223244", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid #223244", background: s.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</span>
                </div>
                <span className="kaf-mono" style={{ fontSize: 11, color: s.color }}>{members.length}</span>
              </div>
              <div style={{ padding: 8, minHeight: 46, display: "flex", flexDirection: "column", gap: 6 }}>
                {members.length === 0 && <span style={{ fontSize: 11, color: "#7C8FA355", padding: "6px 4px" }}>없음</span>}
                {members
                  .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
                  .map(([key, v]) => (
                    <div
                      key={key}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "#0B121C", border: `1px solid ${s.color}33`, borderLeft: `3px solid ${s.color}`,
                        borderRadius: 6, padding: "7px 9px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500 }}>{v.name}</span>
                        <span style={{ fontSize: 9.5, color: "#7C8FA3" }}>{v.cohort} · {v.company}{v.position ? ` · ${v.position}` : ""}</span>
                      </div>
                      <span className="kaf-mono" style={{ fontSize: 9.5, color: "#7C8FA3" }}>{fmtTime(v.updatedAt)}</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- 생도: 나의 신고 (즉시 반영) ---------------- */

function MyReport({ myStatus, myLastReport, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const cur = statusOf(myStatus);

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: "#141E2B", border: "1px solid #223244", borderRadius: 10, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#7C8FA3", marginBottom: 8 }}>현재 상태</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 4, background: cur.color }} />
          <span className="kaf-display" style={{ fontSize: 20, fontWeight: 700 }}>{cur.label}</span>
        </div>
        {myLastReport && (
          <div style={{ fontSize: 11, color: "#7C8FA3", marginTop: 10 }} className="kaf-mono">
            최근 보고: {fmtTime(myLastReport.timestamp)}
            {myLastReport.ackBy ? ` · ${myLastReport.ackBy} 확인함` : " · 확인 대기"}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#7C8FA3", marginBottom: 10 }}>
        이동할 상태를 선택하면 즉시 현황판에 반영됩니다
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 8, marginBottom: 14 }}>
        {STATUS.filter((s) => s.id !== myStatus).map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8,
              border: selected === s.id ? `1px solid ${s.color}` : "1px solid #223244",
              background: selected === s.id ? s.bg : "#141E2B", color: "#E7EEF5", fontSize: 13, fontWeight: 500,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
      {selected && (
        <>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유 (선택)"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <button
            onClick={() => { onSubmit(selected, reason); setSelected(null); setReason(""); }}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8,
              border: "none", background: "#2F6FA5", color: "#fff", fontSize: 13, fontWeight: 600,
            }}
          >
            <Radio size={14} /> '{statusOf(selected).label}'로 명패이동보고 <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- 관리자: 보고 확인 (읽기 전용 + 확인 표시) ---------------- */

function LogView({ log, onAck, confirmingReset, onRequestReset, onCancelReset, onConfirmReset }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 620 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        {!confirmingReset ? (
          <button
            onClick={onRequestReset}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7,
              border: "1px solid #E2574C55", background: "transparent", color: "#E2574C", fontSize: 12, fontWeight: 600,
            }}
          >
            <RotateCcw size={13} /> 전체 초기화
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#E2574C0F", border: "1px solid #E2574C55", borderRadius: 8, padding: "8px 10px" }}>
            <span style={{ fontSize: 12, color: "#E2574C" }}>모든 생도의 현황판과 보고 이력이 삭제됩니다. 되돌릴 수 없습니다.</span>
            <button
              onClick={onConfirmReset}
              style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#E2574C", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}
            >
              초기화 확정
            </button>
            <button
              onClick={onCancelReset}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #223244", background: "transparent", color: "#7C8FA3", fontSize: 12, flexShrink: 0 }}
            >
              취소
            </button>
          </div>
        )}
      </div>
      {log.length === 0 && <CenterNote text="접수된 보고가 없습니다." />}
      {log.map((r) => {
        const from = statusOf(r.fromStatus);
        const to = statusOf(r.toStatus);
        return (
          <div
            key={r.id}
            style={{
              background: "#141E2B", border: `1px solid ${r.ackBy ? "#223244" : "#E8A33D55"}`,
              borderRadius: 10, padding: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 10.5, color: "#7C8FA3" }}>{r.cohort} · {r.company}</span>
                <span style={{ fontSize: 12, color: from.color }}>{from.label}</span>
                <ChevronRight size={12} color="#7C8FA3" />
                <span style={{ fontSize: 12, color: to.color, fontWeight: 600 }}>{to.label}</span>
              </div>
              <div style={{ fontSize: 10.5, color: "#7C8FA3" }} className="kaf-mono">
                {fmtTime(r.timestamp)}{r.reason ? ` · 사유: ${r.reason}` : ""}
              </div>
            </div>
            {r.ackBy ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#4CAF7D", fontSize: 11.5, flexShrink: 0 }}>
                <CheckCircle2 size={14} /> {r.ackBy} 확인
              </div>
            ) : (
              <button
                onClick={() => onAck(r.id)}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7,
                  border: "1px solid #5EEAD4", background: "#5EEAD41A", color: "#5EEAD4", fontSize: 12, fontWeight: 600,
                }}
              >
                <Eye size={13} /> 확인
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
