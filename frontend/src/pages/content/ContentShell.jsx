import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import "../challenges/challenges.css";
import "./content.css";

export default function ContentShell({ children }) {
  return (
    <div className="challenges-page content-page">
      <CustomCursor />
      <div className="ch-grid-bg" aria-hidden />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar showSidebarToggle={false} />
        <main className="ch-main">
          <div className="content-wrap">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
