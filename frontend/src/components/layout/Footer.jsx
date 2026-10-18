import GubiaCredit from "../GubiaCredit";
import "./Footer.css";

/** App-wide footer. The landing page keeps its own footer. */
export default function Footer() {
  return (
    <footer className="app-footer">
      <GubiaCredit />
    </footer>
  );
}
